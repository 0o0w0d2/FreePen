const express = require('express');
const app = express();
const connectToMongoDB = require('./db');
require('dotenv').config();

app.use(express.static(__dirname + '/public'));

const port = process.env.PORT;

let db;

const startServer = async () => {
    db = await connectToMongoDB();
    app.listen(port, () => {
        console.log(`running on http://localhost:${port}`);
    });
};

startServer();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/list', async (req, res) => {
    const postList = await db.collection('post').find().toArray();
    console.log(postList);
    res.send();
});
