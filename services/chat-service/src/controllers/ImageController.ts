import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { KnownErrors } from '../../../shared/errors';
import connectToRabbitMQ from '../../../shared/rabbitmq/rabbitmq';
import { sendMessageToImageQueue } from '../../../shared/rabbitmq/queues';
import { EVENTS } from '../../../shared/events/type';
import { PrismaClient } from '@prisma/client';

const upload = multer({ dest: 'uploads/' });
export const uploadImageMiddleware = upload.single('image');

export const uploadImage = (database: PrismaClient, event: EventEmitter): Handler => async (req: Request, res: Response) => {
  console.log('req.file:', req.file);
  try {
    const file = req.file;
    if (!file) {
      throw new KnownErrors('ERR_IMAGE_NOT_UPLOADED');
    }

    const imagePath = file.path;
    const imageName = file.originalname;
    console.log('Image path:', imagePath);
    const image = await sharp(imagePath);
    const metadata = await image.metadata();

    const imageMetadata = {
      width: metadata.width,
      height: metadata.height,
    };

    const imageRecord = await database.image.create({
      data: {
        userId: req.userId ?? '',
        imagePath: imagePath,
        imageName: imageName,
      },
    });
    console.log(`Image uploaded successfully with ID: ${imageRecord.id}`);

    try {
      const connection = await connectToRabbitMQ();
      const channel = await connection.createChannel();
      await sendMessageToImageQueue(channel, 'imageResizeQueue', imagePath, imageMetadata);
      await connection.close();
    } catch (error) {
      console.error('Failed to send to RabbitMQ:', error);
    }

    event.emit(EVENTS.IMAGE_UPLOADED, { imagePath, imageMetadata });
    res.json({ message: 'Image uploaded successfully' });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new KnownErrors('ERR_IMAGE_NOT_UPLOADED');
  }
};

export const getImage = (database: PrismaClient): Handler => async (req: Request, res: Response) => {
  const imageName = req.params.imageName;
  const image = await database.image.findFirst({
    where: {
      imageName: imageName,
    },
  });
  if (!image) {
    throw new KnownErrors('ERR_IMAGE_NOT_FOUND');
  }

  res.sendFile(image.imagePath);
};
