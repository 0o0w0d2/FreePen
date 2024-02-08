const express = require('express');
const app = express();
const connectToMongoDB = require('./db');
require('dotenv').config();
const postRouter = require('./router/postRouter');
const userRouter = require('./router/userRouter');
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');

app.use(methodOverride('_method'));

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const session = require('express-session');
const passport = require('passport');
const passportConfig = require('./passport');

// passport 설정
passportConfig();

const port = process.env.PORT;

app.use(passport.initialize());
app.use(
    session({
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 },
        store: MongoStore.create({
            mongoUrl: process.env.DB_URL,
            dbName: 'forum',
        }),
    }),
);
app.use(passport.session());

// 전역 middleware를 이용해 모든 템플릿에서 'user' 변수 사용할 수 있게 설정
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

// server.js 내에서 db에 접근할 수 있도록 전역 변수로 선언
let db;

connectToMongoDB
    .then((client) => {
        console.log('MongoDB connected.');
        db = client.db('forum');
        app.listen(port, () => {
            console.log(`Running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.use('/post', postRouter);

app.use('/user', userRouter);

// 모든 post 삭제
app.get('/delete/allpost', async (req, res) => {
    await db.collection('post').deleteMany();

    res.send('allpost 삭제 완료');
});

// 모든 댓글 삭제
app.get('/delete/allcomment', async (req, res) => {
    await db.collection('comment').deleteMany();

    res.send('allcomment 삭제 완료');
});

// error handler 추가
