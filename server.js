const express = require('express');
const app = express();
const connectToMongoDB = require('./db');
require('dotenv').config();

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

const port = process.env.PORT;

let db;

const startServer = async () => {
    db = await connectToMongoDB();
    app.listen(port, () => {
        console.log(`Running on http://localhost:${port}`);
    });
};

startServer();

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/post/list', async (req, res) => {
    const postList = await db.collection('post').find().toArray();
    res.render('list.ejs', { postList: postList });
});

app.get('/post/write', async (req, res) => {
    res.render('write.ejs');
});

app.get('/post/:postId', async (req, res) => {
    const postId = req.params.postId;
    console.log(postId);
});
