const express = require('express');
const userRouter = express.Router();
require('dotenv').config();
const bcrypt = require('bcrypt');
const saltRound = parseInt(process.env.SALT);

// GET 회원가입 폼
userRouter.get('/register', async (req, res) => {
    res.render('user/register.ejs');
});

// POST 회원가입
// password1 == password2 체크
// username이 동일한게 있는지 체크
userRouter.post('/register', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const hashedPassword = await bcrypt.hash(password, saltRound);

    await db.collection('user').insertOne({
        username,
        password: hashedPassword,
    });

    res.redirect('/user/login');
});

// GET 로그인 폼
userRouter.get('/login', async (req, res) => {
    res.render('user/login.ejs');
});

// POST 로그인
// 만약 유저가 없으면 아이디가 없는거임
userRouter.post('/login', async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const user = await db.collection('user').findOne({ username });

        if (!user) {
            const error = new Error('해당 유저를 찾을 수 없습니다.');
            error.statusCode = 400;
            throw error;
        }

        const pwCheck = await bcrypt.compare(password, user.password);

        if (!pwCheck) {
            const error = new Error('비밀번호가 일치하지 않습니다.');
            error.statusCode = 400;
            throw error;
        }

        res.redirect('/post/list/1');
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).send({ message: err.message });
    }
});

module.exports = userRouter;
