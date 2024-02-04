const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const url = process.env.DB_URL;

const connectToMongoDB = async () => {
    try {
        const client = new MongoClient(url);
        await client.connect();
        db = client.db('forum');
        console.log('MongoDB connected');
        return db;
    } catch (err) {
        console.log(err);
    }
};

module.exports = connectToMongoDB;
