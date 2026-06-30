import connectToRabbitMQ from '../../../shared/rabbitmq/rabbitmq';
import { consumeMessagesFromQueue } from '../../../shared/rabbitmq/queues';
import { prisma } from '../services/prisma';
import { sendEmailNotification } from '../utils/emailSender';

/**
 * Email Worker
 * Consumes emails from RabbitMQ queue and sends them
 * Triggered by: friend requests, image uploads, offline messages
 */

export async function startEmailWorker() {
  try {
    const connection = await connectToRabbitMQ();
    const channel = await connection.createChannel();

    const queueName = 'emailQueue';
    await channel.assertQueue(queueName, { durable: true });

    console.log(`[Email Worker] Listening on ${queueName}...`);

    await consumeMessagesFromQueue(channel, queueName, async (message: string) => {
      try {
        const emailData = JSON.parse(message);
        console.log(`[Email Worker] Processing email:`, emailData);

        // Send the email
        const result = await sendEmailNotification(emailData);

        // Store in database for audit
        if (result.success) {
          await prisma.offlineMessages.create({
            data: {
              userId: emailData.receiverId,
              fromUserId: emailData.senderId,
              type: 'EMAIL_SENT',
              content: JSON.stringify(emailData),
              delivered: true,
              deliveredAt: new Date(),
            },
          }).catch(() => {}); // Ignore if table doesn't exist yet
        }
      } catch (error) {
        console.error('[Email Worker] Error processing email:', error);
        throw error; // Re-throw to trigger nack (retry)
      }
    });
  } catch (error) {
    console.error('[Email Worker] Failed to start:', error);
    throw error;
  }
}
