const express = require('express');
const app = express();
const connectToMongoDB = require('./db');
require('dotenv').config();
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');

const { ObjectId } = require('mongodb');

const { createServer } = require('http');
const server = createServer(app);
const { Server } = require('socket.io');

app.use(methodOverride('_method'));

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const session = require('express-session');
const passport = require('passport');
const passportConfig = require('./utils/passport');

const socketChatConfig = require('./utils/socket-chat-handler');

// next()로 받은 에러 처리 위해 아래 ERROR HANDLER 추가

// passport 설정
passportConfig();

const port = process.env.PORT;

// session 설정 코드 ( 세션을 mongodb에 저장 )
const sessionMiddleware = session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 },
    store: MongoStore.create({
        mongoUrl: process.env.DB_URL,
        dbName: 'forum',
    }),
});

app.use(passport.initialize());
app.use(sessionMiddleware);
app.use(passport.session());

// 전역 middleware를 이용해 모든 템플릿에서 'user' 변수 사용할 수 있게 설정
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

// session.request

// websocket 코드
const io = new Server(server); // websocket 서버 생성

socketChatConfig(io);

// mongodb 어댑터 추가를 위한 코드
const { createAdapter } = require('@socket.io/mongo-adapter');

// session을 socket.io에서 사용할 수 있도록 설정
// passport lib를 사용할 때, user의 정보를 알아낼 수 있음
io.engine.use(sessionMiddleware);

// server.js 내에서 db에 접근할 수 있도록 전역 변수로 선언
let db;

connectToMongoDB
    .then((client) => {
        console.log('MongoDB connected.');
        db = client.db('forum');

        // mongodb adapter가 원래 이렇게 자주 저장되나?? 계속 저장되서 일단 주석 처리
        // io.adapter(createAdapter(db.collection('socket.io-events')));

        // HTTP 서버를 express와 websocket이 공유
        server.listen(port, () => {
            console.log(`Running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });

// GET ) index page
app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/stream', (req, res) => {
    res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'cache-control': 'no-cache',
    });

    res.write('event: msg\n');
    res.write('data: 쪼쪼사랑행\n\n');
});

// Router 연결
app.use('/post', require('./router/postRouter'));
app.use('/user', require('./router/userRouter'));
app.use('/comment', require('./router/commentRouter'));
app.use('/chat', require('./router/chatRouter'));

// error handler
app.use((err, req, res, next) => {
    // uri의 param이 mongodb의 ObjectId(_id) 형태를 요구할 때, ObjectId가 아닐 경우 나타나는 error를 404로 추가 처리
    if (
        err.statusCode == 404 ||
        (err.message &&
            err.message.includes(
                'Argument passed in must be a string of 12 bytes or a string of 24 hex characters or an integer',
            ))
    ) {
        res.status(404).render('404error.ejs');
    }

    console.error(err);
    res.status(err.statusCode || 500).json({
        message: err.message,
        error: err,
    });
});

app.use((req, res, next) => {
    res.status(404).render('404error.ejs');
});
