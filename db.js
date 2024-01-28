const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const url = process.env.DB_URI;

exports.connectToMongoDB = async () => {
    try {
        let db;
        const client = new MongoClient(url);
        await client.connect();
        db = client.db('forum');
        console.log('MongoDB connected');
    } catch (err) {
        console.log(err);
    }
};
