const mongoose = require('mongoose');
const logger = require('./logger');
const User = require('../models/User');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/socialProfiles';

async function connect() {
    try {
        await mongoose.connect(MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        logger.info('Conectado ao MongoDB via Mongoose');
    } catch (error) {
        logger.error(`Falha ao conectar ao MongoDB: ${error.message}`);
        throw error;
    }
}

async function saveData(data) {
    try {
        const query = { uuid: data.uuid };
        
        const upsertedUser = await User.findOneAndUpdate(
            query,
            { $set: data },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        logger.info(`Dados do usuário salvos/atualizados no MongoDB: ${JSON.stringify(upsertedUser)}`);
        return upsertedUser;

    } catch (error) {
        logger.error(`Erro ao salvar/atualizar dados no MongoDB: ${error.message}. Dados: ${JSON.stringify(data)}`);
        throw error;
    }
}


async function close() {
    await mongoose.disconnect();
    logger.info('Desconectado do MongoDB');
}

module.exports = {
    connect,
    saveData,
    close,
};