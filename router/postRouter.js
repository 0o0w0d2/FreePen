const express = require('express');
const postRouter = express.Router();
const { ObjectId } = require('mongodb');

// 나중에 에러 next()로 넘겨서 처리하기 (middleware 따로 만들어서)

// GET ) post list 페이지
postRouter.get('/list', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const postList = await db.collection('post').find().toArray();

        res.render('list.ejs', { postList: postList });
    } catch (err) {
        console.log(err);
        res.send({ message: err.message });
    }
});

// GET ) post add 페이지
postRouter.get('/write', async (req, res) => {
    res.render('write.ejs');
});

// validation 라이브러리를 설치할까?
// POST ) post
postRouter.post('/', async (req, res) => {
    try {
        const { title, content } = req.body;

        if (title == '') {
            const error = new Error('제목이 빈 칸입니다.');
            error.statusCode = 400;
            throw error;
        }

        if (title.length >= 100) {
            const error = new Error('제목이 빈 칸입니다.');
            error.statusCode = 400;
            throw error;
        }

        const post = await db.collection('post').insertOne({
            title,
            content,
            createdAt: new Date(),
        });
        const postId = post.insertedId.toString();

        res.redirect(`/post/${postId}`);
    } catch (err) {
        res.status(err.statusCode || 500).send({ message: err.message });
    }
});

// GET ) post 상세 페이지
postRouter.get('/:postId', async (req, res, next) => {
    const postId = req.params.postId;
    console.log('postId', postId);

    try {
        if (!ObjectId.isValid(postId)) {
            const error = new Error('올바르지 않은 postId입니다.');
            error.statusCode = 404;
            throw error;
        }

        const _id = new ObjectId(postId);
        const post = await db.collection('post').findOne({ _id: _id });

        if (!post) {
            const error = new Error('글을 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        res.render('detail.ejs', { post: post });
    } catch (err) {
        console.log(err);

        res.status(err.statusCode || 500).send({ message: err.message });
    }
});

// GET ) post edit form
postRouter.get('/:postId/edit', async (req, res) => {
    const postId = req.params.postId;
    const _id = new ObjectId(postId);

    const post = await db.collection('post').findOne({ _id });
    res.render('edit.ejs', { post: post });
});

// PUT인데 post로 처리 ) post 수정
postRouter.post('/:postId', async (req, res) => {
    const postId = req.params.postId;

    try {
        const _id = new ObjectId(postId);
        console.log(req.body);
        const { title, content } = req.body;

        await db
            .collection('post')
            .updateOne({ _id }, { $set: { title, content } });

        res.redirect(`/post/${postId}`);
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).send({ message: err.message });
    }
});

postRouter.post('/:postId/delete', async (req, res) => {
    const postId = req.params.postId;
    const _id = new ObjectId(postId);

    await db.collection('post').deleteOne({ _id });

    res.redirect('/post/list');
});

module.exports = postRouter;
