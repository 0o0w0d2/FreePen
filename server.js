const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

app.use(express.static(__dirname + '/public'));

const port = process.env.PORT;
const url = process.env.DB_URI;

let db;

const connectToMongoDB = async () => {
    try {
        const client = new MongoClient(url);
        await client.connect();
        db = client.db('forum');
        console.log('MongoDB connected');
    } catch (err) {
        console.log(err);
    }
};

connectToMongoDB();

app.listen(port, () => {
    console.log(`running on http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
