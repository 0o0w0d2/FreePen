const express = require('express');
const app = express();
const connectToMongoDB = require('./db');
require('dotenv').config();
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');

const { createServer } = require('http');
const { Server } = require('socket.io');

app.use(methodOverride('_method'));

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const session = require('express-session');
const passport = require('passport');
const passportConfig = require('./utils/passport');

// const socketChatConfig = require('./utils/socket-chat-handler');

// next()로 받은 에러 처리 위해 아래 ERROR HANDLER 추가

// passport 설정
passportConfig();

// socketChatConfig();

const port = process.env.PORT;

// session 설정 코드 ( 세션을 mongodb에 저장 )
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

// websocket 코드
const server = createServer(app); // HTTP 서버 생성
const io = new Server(server); // websocket 서버 생성

io.on('connection', (socket) => {
    console.log('websocket 연결됨');

    socket.on('room-join', async (data) => {
        console.log('room Id :', data);
        socket.join(data);
    });

    socket.on('msg', async (data) => {
        await db.collection('chat').insertOne({
            roomId: data.room,
            msg: data.msg,
            author: data.author,
            createdAt: new Date(),
        });

        io.to(data.room).emit('msg', {
            msg: data.msg,
            author: data.author,
        });
    });
});

// server.js 내에서 db에 접근할 수 있도록 전역 변수로 선언
let db;

connectToMongoDB
    .then((client) => {
        console.log('MongoDB connected.');
        db = client.db('forum');
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

// Router 연결
app.use('/post', require('./router/postRouter'));
app.use('/user', require('./router/userRouter'));
app.use('/comment', require('./router/commentRouter'));
app.use('/chat', require('./router/chatRouter'));
