const express = require('express');
const app = express();
const connectToMongoDB = require('./db');
require('dotenv').config();
const postRouter = require('./router/postRouter');
const userRouter = require('./router/userRouter');
const methodOverride = require('method-override');

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

app.use(passport.initialize());
app.use(
    session({
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: false,
    }),
);
app.use(passport.session());

const port = process.env.PORT;

const startServer = async () => {
    const db = await connectToMongoDB();
    app.locals.db = db;
    app.listen(port, () => {
        console.log(`Running on http://localhost:${port}`);
    });
};

startServer();

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.use('/post', postRouter);

app.use('/user', userRouter);
