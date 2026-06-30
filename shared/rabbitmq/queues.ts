import amqp from 'amqplib';

export const sendMessageToEmailQueue = async (
  channel: amqp.Channel,
  queueName: string,
  senderId: string,
  receiverId: string,
  content: any
) => {
  const queueMessage = { senderId, receiverId, ...content };
  console.log(`Sending message to queue: ${queueName}`);
  console.log(`Queue message to be sent:`, queueMessage);
  await channel.assertQueue(queueName, { durable: true });
  await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(queueMessage)));
  console.log(`Message sent to queue ${queueName}:`, queueMessage);
  return queueName;
};

export const sendMessageToImageQueue = async (
  channel: amqp.Channel,
  queueName: string,
  imagePath: string,
  imageMetadata: any
) => {
  await channel.assertQueue(queueName, { durable: true });
  await channel.sendToQueue(queueName, Buffer.from(JSON.stringify({ imagePath, imageMetadata })));
};

export const consumeMessagesFromQueue = async (
  channel: amqp.Channel,
  queueName: string,
  onMessageReceived: (message: any) => any
) =>
  channel.consume(
    queueName,
    (message) => {
      if (message) {
        const Message = message.content.toString();
        console.log(`Received message:`, Message);
        try {
          onMessageReceived(Message);
          console.log('Acknowledging message...');
          channel.ack(message);
          console.log('Message acknowledged successfully...');
        } catch (error) {
          console.error(`Error processing message: ${(error as Error).message}`);
          channel.reject(message, true);
        }
      }
    },
    { noAck: false }
  );
