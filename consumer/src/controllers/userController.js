const User = require('../models/User');

const getUser = async (req, res) => {
  try {
    const { uuid } = req.params;

    const user = await User.findOne({ uuid: uuid });

    if (!user) {
      return res.status(404).json({ message: 'Dados sociais do usuário não encontrado!' });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error('Erro ao buscar dados enriquecidos do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

module.exports = {
  getUser,
};