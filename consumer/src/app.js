// app.js
require('dotenv').config();

const express = require('express');
const mongoService = require('./services/mongoService');
const cors = require('cors');
const logger = require('./services/logger');
const userRoutes = require('./routes/userRoutes');
const { initConsumer } = require('./consumer');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialProfiles';

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
async function connectToMongo() {
    try {
        await mongoService.connect(MONGODB_URI);
        logger.info('Conectado ao MongoDB com sucesso!');
    } catch (err) {
        logger.error(`Erro ao conectar ao MongoDB: ${err.message}`);
        process.exit(1);
    }
}

// Carrega as rotas de usuário
app.use('/api', userRoutes);

app.get('/', (req, res) => {
    res.send('API de Enriquecimento de Dados de Usuário está online!');
});

async function startServer() {
    await connectToMongo();

    initConsumer();

    app.listen(PORT, () => {
        logger.info(`Servidor HTTP rodando na porta ${PORT}`);
    });
}

process.on('SIGINT', async () => {
    logger.info('Sinal SIGINT recebido. Iniciando desligamento gracioso...');
    await mongoService.close();
    logger.info('Conexão com MongoDB fechada.');
    process.exit(0);
});

startServer();