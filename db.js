const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const url = process.env.DB_URL;

const connectToMongoDB = new MongoClient(url).connect();

module.exports = connectToMongoDB;
