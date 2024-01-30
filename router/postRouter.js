const express = require('express');
const postRouter = express.Router();
const { ObjectId } = require('mongodb');

postRouter.get('/list', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const postList = await db.collection('post').find().toArray();
        res.render('list.ejs', { postList: postList });
    } catch (err) {
        console.log(err);
        next(err);
    }
});

postRouter.get('/write', async (req, res) => {
    res.render('write.ejs');
});

postRouter.post('/', async (req, res) => {
    try {
        const { title, content } = req.body;
        const post = await db.collection('post').insertOne({
            title,
            content,
            createdAt: new Date(),
        });
        const postId = post.insertedId.toString();

        res.redirect(`/post/${postId}`);
    } catch (err) {
        res.send({ message: err });
    }
});

postRouter.get('/:postId', async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const _id = new ObjectId(postId);
        const post = await db.collection('post').findOne({ _id: _id });
        console.log(post);
        res.render('detail.ejs', { post: post });
    } catch (err) {
        console.log(err);
        res.send({ message: err });
    }
});

module.exports = postRouter;
