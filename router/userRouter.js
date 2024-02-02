const express = require('express');
const userRouter = express.Router();
require('dotenv').config();
const bcrypt = require('bcrypt');
const saltRound = parseInt(process.env.SALT);
const { ObjectId } = require('mongodb');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');

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

// passport.authenticate('local')() => 아래 코드 수행
// passReqToCallback을 이용해 id/pw 외 다른 것도 검증 가능
passport.use(
    new LocalStrategy(async (username, pw, cb) => {
        try {
            let user = await db
                .collection('user')
                .findOne({ username: username });
            if (user) {
                const result = await bcrypt.compare(pw, user.password);

                if (result) {
                    cb(null, user);
                } else {
                    cb(null, false, {
                        message: '비밀번호가 일치하지 않습니다.',
                    });
                }
            } else {
                cb(null, false, { message: '해당 ID를 찾을 수 없습니다.' });
            }
        } catch (err) {
            console.log(err);
            cb(err);
        }
    }),
);

// session 만들어주는 코드
passport.serializeUser((user, done) => {
    process.nextTick(() => {
        done(null, { id: user._id, username: user.username });
    });
});

// 유저가 보낸 쿠키 분석
passport.deserializeUser(async (user, done) => {
    const result = await db
        .collection('user')
        .findOne({ _id: new ObjectId(user.id) });
    delete result.password;
    process.nextTick(() => {
        done(null, result);
    });
});

// POST 로그인
// 만약 유저가 없으면 아이디가 없는거임
userRouter.post('/login', async (req, res, next) => {
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

module.exports = userRouter;
