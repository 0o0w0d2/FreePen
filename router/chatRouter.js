const express = require('express');
const chatRotuer = express.Router();
const { ObjectId } = require('mongodb');
const { isLogin } = require('./middlewares');
const connectToMongoDB = require('../db');

let db;

connectToMongoDB
    .then((client) => {
        db = client.db('forum');
    })
    .catch((err) => {
        console.log(err);
    });

chatRotuer.get('/list', async (req, res, next) => {
    res.render('chat/chatroom.ejs');
});

chatRotuer.get('/chat', async (req, res, next) => {
    res.render('chat/chat.ejs');
});

module.exports = chatRotuer;
