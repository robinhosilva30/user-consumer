require('dotenv').config();

const rabbitmqService = require('./services/rabbitmqService');
const mongoService = require('./services/mongoService');
const dataEnrichmentService = require('./services/dataEnrichmentService');
const logger = require('./services/logger');

const RABBITMQ_QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME;
const MAX_RETRIES = 3;

async function initConsumer() {
    try {
        await mongoService.connect();
        await rabbitmqService.connect();

        logger.info(`Consumidor tentando escutar a fila: ${RABBITMQ_QUEUE_NAME}`);

        rabbitmqService.consumeMessages(RABBITMQ_QUEUE_NAME, async (msg, channel) => {
            if (msg === null) {
                logger.warn('Consumidor parado. Nenhuma mensagem recebida ou canal fechado.');
                return;
            }

            let data;
            const messageHeaders = msg.properties && msg.properties.headers ? msg.properties.headers : {};
            let currentRetries = messageHeaders['x-retries'] || 0;
            currentRetries++;

            try {
                data = JSON.parse(msg.content.toString());
                logger.info(`Mensagem recebida (tentativa ${currentRetries}): ${JSON.stringify(data)}`);

            } catch (parseError) {
                logger.error(`Erro ao parsear JSON da mensagem: ${parseError.message}. Mensagem: ${msg.content.toString()}`);
                channel.nack(msg, false, false); // Rejeita a mensagem e não a coloca de volta na fila
                return;
            }

            try {
                const enrichedData = await dataEnrichmentService.enrich(data);
                logger.info(`Dados enriquecidos: ${JSON.stringify(enrichedData)}`);

                await mongoService.saveData(enrichedData);
                logger.info('Dados persistidos no MongoDB com sucesso!');

                channel.ack(msg); // Confirma o processamento da mensagem
            } catch (processingError) {
                logger.error(`Erro ao processar ou persistir mensagem: ${processingError.message}. Tentativa ${currentRetries}. Dados: ${JSON.stringify(data)}`);
                
                if (currentRetries <= MAX_RETRIES) {
                    logger.warn(`Tentando reprocessar a mensagem (tentativa ${currentRetries} de ${MAX_RETRIES}). Publicando de volta na fila.`);
                    channel.ack(msg); // Confirma a mensagem para removê-la da fila original
                    await rabbitmqService.publishMessageWithHeaders(
                        RABBITMQ_QUEUE_NAME,
                        data, // payload original
                        { 'x-retries': currentRetries }, // Adiciona o header 'x-retries'
                    );
                } else {
                    logger.error(`Mensagem atingiu o número máximo de retries (${MAX_RETRIES}). Enviando para DLQ ou descartando.`);
                    channel.nack(msg, false, false); // Move para a DLQ se configurada ou descarta a mensagem
                }
            }
        });

        logger.info(`Consumidor escutando a fila: ${RABBITMQ_QUEUE_NAME}`);

    } catch (error) {
        logger.error(`Falha fatal ao iniciar o consumidor: ${error.message}`);
    }
}

module.exports = {
    initConsumer,
};