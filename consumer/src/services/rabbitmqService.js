const amqp = require('amqplib');
const logger = require('./logger');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const RABBITMQ_DEAD_LETTER_EXCHANGE = process.env.RABBITMQ_DEAD_LETTER_EXCHANGE || 'user-queue-dlx';
const RABBITMQ_DEAD_LETTER_QUEUE = process.env.RABBITMQ_DEAD_LETTER_QUEUE || 'user-queue-dlq';
let connection = null;
let channel = null;


async function connect() {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        connection.on('error', (err) => {
            logger.error(`Erro na conexão RabbitMQ: ${err.message}`);
        });
        connection.on('close', () => {
            logger.warn('Conexão RabbitMQ fechada. Tentando reconectar...');
            setTimeout(connect, 5000);
        });

        channel = await connection.createChannel();
        channel.on('error', (err) => {
            logger.error(`Erro no canal RabbitMQ: ${err.message}`);
        });
        channel.on('close', () => {
            logger.warn('Canal RabbitMQ fechado.');
        });

        // DLX E DLQ
        await channel.assertExchange(RABBITMQ_DEAD_LETTER_EXCHANGE, 'fanout', { durable: true });
        await channel.assertQueue(RABBITMQ_DEAD_LETTER_QUEUE, { durable: true });
        await channel.bindQueue(RABBITMQ_DEAD_LETTER_QUEUE, RABBITMQ_DEAD_LETTER_EXCHANGE, '');

        logger.info('Conectado e DLX E DLQ declarados no RabbitMQ');
    } catch (error) {
        logger.error(`Falha ao conectar ao RabbitMQ: ${error.message}`);
        throw error;
    }
}

async function publishMessage(queueName, message) {
    if (!channel) {
        throw new Error('Canal RabbitMQ não está aberto.');
    }
    await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': RABBITMQ_DEAD_LETTER_EXCHANGE // Indicando a DLX para mensagens mortas
        }
    });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
    logger.info(`Mensagem publicada na fila "${queueName}": ${JSON.stringify(message)}`);
}

async function consumeMessages(queueName, callback) {
    if (!channel) {
        throw new Error('Canal RabbitMQ não está aberto.');
    }
    await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': RABBITMQ_DEAD_LETTER_EXCHANGE // Indicanado a DLX para mensagens mortas
        }
    });
    channel.prefetch(1); // Processa uma mensagem por vez
    channel.consume(queueName, (msg) => callback(msg, channel), { noAck: false });
    logger.info(`Consumindo mensagens da fila "${queueName}"...`);
}

async function publishMessageWithHeaders(queueName, messagePayload, headers = {}) {
    if (!channel) {
        throw new Error('Canal RabbitMQ não está aberto.');
    }

    const options = {
        persistent: true,
        headers: headers // Incluindo os headers passados (e.g., x-retries)
    };

    await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': RABBITMQ_DEAD_LETTER_EXCHANGE
        }
    });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(messagePayload)), options);
    logger.info(`Mensagem republicada na fila "${queueName}" com headers: ${JSON.stringify(headers)}`);
}

async function close() {
    if (channel) {
        await channel.close();
        logger.info('Canal RabbitMQ fechado.');
    }
    if (connection) {
        await connection.close();
        logger.info('Conexão RabbitMQ fechada.');
    }
}

module.exports = {
    connect,
    publishMessage,
    consumeMessages,
    close,
    RABBITMQ_DEAD_LETTER_EXCHANGE,
    RABBITMQ_DEAD_LETTER_QUEUE,
    publishMessageWithHeaders
};