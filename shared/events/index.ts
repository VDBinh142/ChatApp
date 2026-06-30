import { PrismaClient } from '@prisma/client';
import EventEmitter from 'node:events';
import { EVENTS } from './type';

export const makeEvent = (database: PrismaClient): EventEmitter => {
  const event = new EventEmitter();

  const storeEvent = async (database: PrismaClient, type: string, data: any) => {
    try {
      await database.event.create({
        data: {
          type,
          content: JSON.stringify(data),
        },
      });

      console.log(`Event ${type} stored successfully into the database.`);
    } catch (error) {
      console.error(`Falied to store event ${type}:`, error);
    }
  };

  const registerEventListeners = (eventEmitter: EventEmitter, database: PrismaClient) => {
    Object.values(EVENTS).forEach((eventType) => {
      eventEmitter.on(eventType, async (eventData) => {
        await storeEvent(database, eventType, eventData);
      });
    });
  };

  registerEventListeners(event, database);

  return event;
};
