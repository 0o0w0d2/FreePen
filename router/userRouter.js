const express = require('express');
const userRouter = express.Router();
const connectToMongoDB = require('../db');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { isLogin, isNotLogin } = require('./middlewares');
const { ObjectId } = require('mongodb');

const { isEmpty, checkLength } = require('./validateInput');

const saltRound = parseInt(process.env.SALT);
require('dotenv').config();

let db;

connectToMongoDB
    .then((client) => {
        db = client.db('forum');
    })
    .catch((err) => {
        console.log(err);
    });

// GET 회원가입 폼
userRouter.get('/register', isNotLogin, async (req, res, next) => {
    res.render('user/register.ejs');
});

// POST 회원가입
userRouter.post('/register', isNotLogin, async (req, res, next) => {
    const username = req.body.username;
    const password1 = req.body.password;
    const password2 = req.body.passwordCheck;

    try {
        const hashedPassword = await bcrypt.hash(password1, saltRound);

        isEmpty('ID', username);
        isEmpty('password', password1);
        isEmpty('password Check', password2);

        checkLength('ID', username, 16, 4);
        checkLength('password', password1, undefined, 4);
        checkLength('password Check', password2, undefined, 4);

        if (password1 !== password2) {
            const error = new Error('비밀번호가 일치하지 않습니다.');
            error.statusCode = 401;
            throw error;
        }

        const user = await db.collection('user').findOne({ username });

        if (user) {
            const error = new Error('동일한 아이디가 이미 사용 중입니다.');
            error.statusCode = 409;
            throw error;
        }

        await db.collection('user').insertOne({
            username,
            password: hashedPassword,
        });

        res.redirect('/user/login');
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).send({ message: err.message });
    }
});

// GET 로그인 폼
userRouter.get('/login', isNotLogin, async (req, res, next) => {
    res.render('user/login.ejs');
});

// POST 로그인
// 만약 유저가 없으면 아이디가 없는거임
userRouter.post('/login', isNotLogin, async (req, res, next) => {
    const { username, password } = req.body;

    try {
        isEmpty('ID', username);
        isEmpty('password', password);

        passport.authenticate('local', (error, user, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json(error);
            }
            if (!user) {
                return res.status(401).json(info.message);
            }
            req.logIn(user, (err) => {
                if (err) return next(err);
                res.redirect('/post/list');
            });
        })(req, res, next);
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).send(err.message);
    }
});

userRouter.get('/mypage', isLogin, async (req, res, next) => {
    const user = req.user;

    res.render('user/mypage.ejs', { user: user });
});

userRouter.get('/logout', isLogin, async (req, res, next) => {
    req.logout((err) => {
        // req.session.destroy(() => { // 세션 파기 후에 콜백으로 쿠키 제거
        //     res.clearCookie('connect.sid'); // 세션 쿠키 제거
        //     res.redirect('/'); // 로그아웃 후 메인 페이지로 리디렉션
        // });
        if (err) return next(err);
        res.redirect('/');
    });
});

userRouter.get('/post/:userId', async (req, res, next) => {
    const userId = req.params.userId;

    try {
        const userpost = await db
            .collection('post')
            .find({ author: new ObjectId(userId) })
            .toArray();

        res.render('user/postlist.ejs', { postList: userpost });
    } catch (err) {
        console.log(err);
        res.status(500).send(err.message);
    }
});

module.exports = userRouter;
