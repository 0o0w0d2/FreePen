const express = require('express');
const userRouter = express.Router();
require('dotenv').config();
const bcrypt = require('bcrypt');
const { isLogin, isNotLogin } = require('./middlewares');
const passport = require('passport');

const saltRound = parseInt(process.env.SALT);

// GET 회원가입 폼
userRouter.get('/register', isNotLogin, async (req, res, next) => {
    res.render('user/register.ejs');
});

// POST 회원가입
// username/password가 빈 칸인지 체크
// username/password 길이 체크
userRouter.post('/register', isNotLogin, async (req, res, next) => {
    const username = req.body.username;
    const password1 = req.body.password;
    const password2 = req.body.passwordCheck;

    try {
        const hashedPassword = await bcrypt.hash(password1, saltRound);

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
            res.redirect('/post/list/1');
        });
    })(req, res, next);
});

userRouter.get('/mypage', isLogin, async (req, res, next) => {
    const user = req.user;

    res.render('user/mypage.ejs', { user: user });
});

userRouter.get('/logout', isLogin, async (req, res, next) => {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

module.exports = userRouter;
