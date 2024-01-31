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

        // 제목이 빈 칸일 때
        if (title == '') {
            const error = new Error('제목이 빈 칸입니다.');
            error.statusCode = 400;
            throw error;
        }

        // 제목이 100자 이상일 때 => 나중에 mongoose 사용으로 넘어가면 좋을듯(type이나 글자 수 제약이 가능하니까)
        if (title.length >= 100) {
            const error = new Error('제목은 100자를 넘을 수 없습니다.');
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

        res.render('detail.ejs', { post: post });
    } catch (err) {
        console.log(err);

        res.status(err.statusCode || 500).send({ message: err.message });
    }
});

// GET ) post-edit form
postRouter.get('/edit/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const _id = new ObjectId(postId);

        const post = await db.collection('post').findOne({ _id });

        if (!post) {
            const error = new Error('글을 찾을 수 없습니다.');
            error.statusCode = 404;
            throw error;
        }

        res.render('edit.ejs', { post: post });
    } catch (err) {
        console.log(err);

        res.status(err.statusCode || 500).send(err.message);
    }
});

// PUT ) post 수정 (method-override lib 사용)
postRouter.put('/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;

        if (!ObjectId.isValid(postId)) {
            const error = new Error('올바르지 않은 postId입니다.');
            error.statusCode = 404;
            throw error;
        }

        const _id = new ObjectId(postId);
        const { title, content } = req.body;

        const post = await db.collection('post').findOne({ _id });

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
postRouter.delete('/:postId', async (req, res) => {
    const postId = req.params.postId;
    const _id = new ObjectId(postId);

    await db.collection('post').deleteOne({ _id });

    res.status(204).send({ message: '삭제 완료' });
});

module.exports = postRouter;
