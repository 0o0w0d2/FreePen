const express = require('express');
const connectToMongoDB = require('../db');
const postRouter = express.Router();
const { ObjectId } = require('mongodb');
const { isLogin } = require('./middlewares');
const { isEmpty, checkLength } = require('./validateInput');
const { upload } = require('../utils/multer');

// postRouter.js 내에서 db에 접근할 수 있도록 전역 변수로 선언
let db;

connectToMongoDB
    .then((client) => {
        db = client.db('forum');
    })
    .catch((err) => {
        console.log(err);
    });

// GET ) post List ( pagination 추가 )
postRouter.get('/list', async (req, res, next) => {
    const page = req.query.page ? req.query.page : 1;
    const postCount = await db.collection('post').countDocuments();
    const maxPage = Math.ceil(postCount / 5);

    try {
        if (page < 1) {
            const error = new Error('찾을 수 없는 페이지입니다.');
            error.statusCode = 404;
            throw error;
        }

        // post가 없을 경우 제외하고 (page=1이 post가 없을 경우도 포함)
        if (page != 1 && page > maxPage) {
            const error = new Error('찾을 수 없는 페이지입니다.');
            error.statusCode = 404;
            throw error;
        }

        const postList = await db
            .collection('post')
            .find()
            .sort({ createdAt: -1 })
            .limit(5)
            .skip((page - 1) * 5)
            .toArray();

        res.render('post/list.ejs', {
            postList: postList,
            page: page,
            maxPage,
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

// GET ) post add 페이지
postRouter.get('/write', isLogin, async (req, res, next) => {
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
            // mongoDB는 입출력이 빠른게 장점이기 때문에
            // author를 통해서 author의 username을 알아낼 수 있지만,
            // mongodb의 장점을 살리기 위해서 비정규화 + 단순 게시판 CRUD에는 정확도가 중요하지 않음
            authorName: req.user.username,
            img,
        });
        const postId = post.insertedId.toString();

        res.redirect(`/post/detail/${postId}`);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

// GET ) post detail
postRouter.get('/detail/:postId', async (req, res, next) => {
    try {
        const postId = req.params.postId;

        const _id = new ObjectId(postId);
        const post = await db.collection('post').findOne({ _id: _id });

        // _id가 일치하는 post가 없을 때
        if (!post) {
            const error = new Error('찾을 수 없는 페이지입니다.');
            error.statusCode = 404;
            throw error;
        }

        const comments = await db
            .collection('comment')
            .find({ postId: new ObjectId(postId) })
            .toArray();

        res.render('post/detail.ejs', { post: post, comments: comments });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

// GET ) post-edit form
postRouter.get('/edit/:postId', isLogin, async (req, res, next) => {
    try {
        const postId = req.params.postId;
        const _id = new ObjectId(postId);

        const post = await db.collection('post').findOne({ _id });

        if (!post.author.equals(req.user._id)) {
            const error = new Error('수정할 권한이 없습니다.');
            error.statusCode = 403;
            throw error;
        }

        if (!post) {
            const error = new Error('찾을 수 없는 페이지입니다.');
            error.statusCode = 404;
            throw error;
        }

        res.render('post/edit.ejs', { post: post });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

// PUT ) post detail (method-override lib 사용)
postRouter.put('/detail/:postId', isLogin, async (req, res, next) => {
    try {
        const postId = req.params.postId;

        if (!ObjectId.isValid(postId)) {
            const error = new Error('찾을 수 없는 페이지입니다.');
            error.statusCode = 404;
            throw error;
        }

        const _id = new ObjectId(postId);
        const { title, content } = req.body;

        const post = await db.collection('post').findOne({ _id });

        if (!post.author.equals(req.user._id)) {
            const error = new Error('수정할 권한이 없습니다.');
            error.statusCode = 403;
            throw error;
        }

        if (!post) {
            const error = new Error('찾을 수 없는 페이지입니다.');
            error.statusCode = 404;
            throw error;
        }

        await db
            .collection('post')
            .updateOne({ _id }, { $set: { title, content } });

        res.redirect(`/post/detail/${postId}`);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

// Delete ) post detail
postRouter.delete('/detail/:postId', isLogin, async (req, res, next) => {
    try {
        const postId = req.params.postId;
        const _id = new ObjectId(postId);

        const post = await db.collection('post').findOne({ _id });

        if (!post.author.equals(req.user._id)) {
            const error = new Error('삭제할 권한이 없습니다.');
            error.statusCode = 403;
            throw error;
        }

        if (!post) {
            const error = new Error('찾을 수 없는 페이지입니다.');
            error.statusCode = 404;
            throw error;
        }

        await db.collection('post').deleteOne({ _id });

        res.status(204).json({ message: '삭제 완료' });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

// GET ) search ( pagination O / 이전 다음만 )
postRouter.get('/search', async (req, res, next) => {
    const search = req.query.value;
    const postCount = await db.collection('post').countDocuments();
    const maxPage = Math.ceil(postCount / 5);
    const page = req.query.page ? req.query.page : 1;
    let searchRule;

    try {
        if (page < 1) {
            const error = new Error('찾을 수 없는 페이지입니다.');
            error.statusCode = 404;
            throw error;
        }

        if (page == 1) {
            searchRule = [
                {
                    $search: {
                        index: 'content',
                        text: { query: search, path: ['content', 'title'] },
                    },
                },
                { $limit: 3 },
            ];
        } else {
            searchRule = [
                {
                    $search: {
                        index: 'content',
                        text: { query: search, path: ['content', 'title'] },
                    },
                },
                { $skip: (page - 1) * 3 },
                { $limit: 3 },
            ];
        }

        const postList = await db
            .collection('post')
            .aggregate(searchRule)
            .toArray();

        res.render('post/search.ejs', {
            postList: postList,
            search: search,
            page: page,
            maxPage,
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = postRouter;
