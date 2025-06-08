const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/users/enriched/:uuid', userController.getUser);

module.exports = router;