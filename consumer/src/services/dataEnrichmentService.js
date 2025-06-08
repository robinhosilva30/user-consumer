const logger = require('./logger');

async function enrich(originalData) {
    logger.info('Enriquecendo dados...');

    const socialProfiles = generateSocialProfiles(originalData.name);
    const enrichedData = {...originalData, ...socialProfiles}
    
    logger.info(`Dados enriquecidos com sucesso.`);
    return enrichedData;
}

function generateSocialProfiles (name) {
    name = name.replace(/[^a-zA-Z]/g, "").toLowerCase();
    return {
        linkedin: 'linkedin.com/in/' + name,
        github: 'github.com/' + name
    }
}

module.exports = {
    enrich
};