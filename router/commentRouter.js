const express = require('express');
const commentRouter = express.Router();
const { ObjectId } = require('mongodb');
const { isLogin } = require('./middlewares');
const connectToMongoDB = require('../db');

let db;

connectToMongoDB
    .then((client) => {
        db = client.db('forum');
    })
    .catch((err) => {
        console.error(err);
    });

// % ajax % POST ) comment
commentRouter.post('/:postId', isLogin, async (req, res, next) => {
    const postId = req.params.postId;
    const content = req.body.comment;

    try {
        if (!req.user) {
            const error = new Error('댓글을 작성할 권한이 없습니다.');
            error.statusCode = 400;
            throw error;
        }
        const author = req.user._id;
        const authorName = req.user.username;

        await db.collection('comment').insertOne({
            postId: new ObjectId(postId),
            author,
            authorName,
            content,
            createdAt: new Date(),
        });

        res.status(201).send({ message: '댓글 작성 완료' });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

// % ajax % DELETE ) comment
commentRouter.delete('/:commentId', isLogin, async (req, res, next) => {
    const commentId = req.params.commentId;

    try {
        const user = req.user._id;
        const comment = await db
            .collection('comment')
            .findOne({ _id: new ObjectId(commentId) });

        if (!user.equals(comment.author)) {
            const error = new Error('댓글을 작성할 권한이 없습니다.');
            error.statusCode = 400;
            throw error;
        }

        await db
            .collection('comment')
            .deleteOne({ _id: new ObjectId(commentId) });

        res.status(204).json({ message: '삭제 완료' });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = commentRouter;
