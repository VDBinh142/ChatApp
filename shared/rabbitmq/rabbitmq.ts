import amqp from 'amqplib';

const connectToRabbitMQ = async () => {
  console.log('Attempting to connect to RabbitMQ...');
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || 'amqp://localhost'
    );
    console.log('Connected to RabbitMQ');
    return connection;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    console.log('Please ensure that the RabbitMQ server is running and accessible.');
    throw error;
  }
};

export default connectToRabbitMQ;
