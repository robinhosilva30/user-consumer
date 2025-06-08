const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/socialProfiles';

const UserSchema = new mongoose.Schema({
    uuid: { type: String, required: true, unique: true },
    name: { type: String, required: true},
    linkedin: String,
    github: String,
    timestamp: { type: Date, default: Date.now }
}, { strict: false });

module.exports = mongoose.model('User', UserSchema);