const express = require('express');
const app = express();
const connectToMongoDB = require('./db');
require('dotenv').config();
const postRouter = require('./router/postRouter');

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

const port = process.env.PORT;

const startServer = async () => {
    const db = await connectToMongoDB();
    app.locals.db = db;
    app.listen(port, () => {
        console.log(`Running on http://localhost:${port}`);
    });
};

startServer();

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.use('/post', postRouter);
