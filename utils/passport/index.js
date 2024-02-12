// passport.serialize/deserialize
const passport = require('passport');
const local = require('./localStrategy');
const { ObjectId } = require('mongodb');

const connectToMongoDB = require('../../db');

let db;

connectToMongoDB
    .then((client) => {
        db = client.db('forum');
    })
    .catch((err) => {
        console.log(err);
    });

module.exports = () => {
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

    local();
};
