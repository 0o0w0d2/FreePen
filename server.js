const express = require('express');
const app = express();
const { connectToMongoDB } = require('./db');
require('dotenv').config();

app.use(express.static(__dirname + '/public'));

const port = process.env.PORT;

const startServer = async () => {
    await connectToMongoDB();
    app.listen(port, () => {
        console.log(`running on http://localhost:${port}`);
    });
};

startServer();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
