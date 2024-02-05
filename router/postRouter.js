const express = require('express');
const connectToMongoDB = require('../db');
const postRouter = express.Router();
const { ObjectId } = require('mongodb');
const { isLogin } = require('./middlewares');
const { isEmpty, checkLength } = require('./validateInput');
const { upload } = require('./multer');

// 나중에 에러 next()로 넘겨서 처리하기 (middleware 따로 만들어서)

// postRouter.js 내에서 db에 접근할 수 있도록 전역 변수로 선언
let db;

connectToMongoDB
    .then((client) => {
        db = client.db('forum');
    })
    .catch((err) => {
        console.log(err);
    });

postRouter.get('/list/:page', async (req, res) => {
    try {
        const page = req.params.page;
        const postCount = await db.collection('post').countDocuments();
        const maxPage = Math.ceil(postCount / 5);

        if (page != parseInt(page) || page <= 0) {
            const error = new Error('찾을 수 없는 페이지입니다.');
            error.statusCode = 404;
            throw error;
        }

        if (postCount == 0) {
            return res.render('post/list.ejs', {
                postList: [],
                page: 1,
                maxPage: 1,
            });
        }

        if (page > maxPage) {
            const error = new Error('찾을 수 없는 페이지입니다.');
            error.statusCode = 404;
            throw error;
        }

        const postList = await db
            .collection('post')
            .find()
            .limit(5)
            .skip((page - 1) * 5)
            .toArray();

        res.render('post/list.ejs', {
            postList: postList,
            page: page,
            maxPage: maxPage,
        });
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).send({ message: err.message });
    }
});

// GET ) post add 페이지
postRouter.get('/write', isLogin, async (req, res) => {
    res.render('post/write.ejs');
});

// validation 라이브러리를 설치할까?
// POST ) post
postRouter.post('/', isLogin, upload.single('img1'), async (req, res, next) => {
    try {
        const { title, content } = req.body;
        isEmpty('title', title);
        checkLength('title', title, 100);

        const img = req.file ? req.file.location : '';

        const post = await db.collection('post').insertOne({
            title,
            content,
            createdAt: new Date(),
            author: req.user._id,
            img,
        });
        const postId = post.insertedId.toString();

        res.redirect(`/post/${postId}`);
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).send({ message: err.message });
    }
});

// GET ) post 상세 페이지
postRouter.get('/:postId', async (req, res, next) => {
    try {
        const postId = req.params.postId;

        // postId의 타입이 objectId가 아닐 때
        if (!ObjectId.isValid(postId)) {
            const error = new Error('올바르지 않은 postId입니다.');
            error.statusCode = 404;
            throw error;
        }

        const _id = new ObjectId(postId);
        const post = await db.collection('post').findOne({ _id: _id });

        // _id가 일치하는 post가 없을 때
        if (!post) {
            const error = new Error('글을 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        res.render('post/detail.ejs', { post: post });
    } catch (err) {
        console.log(err);

        res.status(err.statusCode || 500).send({ message: err.message });
    }
});

// GET ) post-edit form
postRouter.get('/edit/:postId', isLogin, async (req, res) => {
    try {
        const postId = req.params.postId;
        const _id = new ObjectId(postId);

        const post = await db.collection('post').findOne({ _id });

        if (!post.author.equals(req.user._id)) {
            const error = new Error('수정할 권한이 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        if (!post) {
            const error = new Error('글을 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        res.render('post/edit.ejs', { post: post });
    } catch (err) {
        console.log(err);

        res.status(err.statusCode || 500).send(err.message);
    }
});

// PUT ) post 수정 (method-override lib 사용)
postRouter.put('/:postId', isLogin, async (req, res) => {
    try {
        const postId = req.params.postId;

        if (!ObjectId.isValid(postId)) {
            const error = new Error('올바르지 않은 postId입니다.');
            error.statusCode = 404;
            throw error;
        }

        const _id = new ObjectId(postId);
        const { title, content } = req.body;

        checkLength('title', title, 100);

        const post = await db.collection('post').findOne({ _id });

        if (!post.author.equals(req.user._id)) {
            const error = new Error('수정할 권한이 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        if (!post) {
            const error = new Error('글을 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        await db
            .collection('post')
            .updateOne({ _id }, { $set: { title, content } });

        res.redirect(`/post/${postId}`);
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).send({ message: err.message });
    }
});

// post -> delete 로 메소드 바꾼 후에 uri 변경하기
postRouter.delete('/:postId', isLogin, async (req, res) => {
    try {
        const postId = req.params.postId;
        const _id = new ObjectId(postId);

        const post = await db.collection('post').findOne({ _id });

        if (!post.author.equals(req.user._id)) {
            const error = new Error('삭제할 권한이 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        if (!post) {
            const error = new Error('글을 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        await db.collection('post').deleteOne({ _id });

        res.status(204).send({ message: '삭제 완료' });
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).send({ message: err.message });
    }
});

module.exports = postRouter;
