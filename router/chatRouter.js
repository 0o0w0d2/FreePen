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

// GET ) 내가 참여하고 있는 채팅방들
chatRotuer.get('/list', isLogin, async (req, res, next) => {
    const user = req.user._id;
    const chatList = await db
        .collection('chatroom')
        .find({
            member: user,
        })
        .toArray();

    let recentchat;
    for (let i = 0; i < chatList.length; i++) {
        console.log(chatList[i]._id);
        chat = await db
            .collection('chat')
            .find({ roomId: chatList[i]._id })
            .toArray();

        console.log('이거', chat);
    }

    res.render('chat/chatList.ejs', { chatList: chatList, recentchat });
});

// postlist의 채팅하기 버튼을 누르면 채팅방을 생성
chatRotuer.post('/chatroom-add', isLogin, async (req, res, next) => {
    const user = req.user._id;
    const author = req.body.authorId;
    const member = [user, new ObjectId(author)];
    const myname = req.user.username;
    const yourname = req.body.authorName;
    const memberName = [myname, yourname];

    try {
        // 채팅창이 이미 있으면 그 채팅창으로 연결하고, 채팅창이 없으면 채팅창 만들기
        // 인원이 1:1이 아닐 경우를 대비해서, 멤버의 수와 참여 멤버가 일치하는 경우의 채팅방을 찾아오도록 설정
        let chatroom = await db.collection('chatroom').findOne({
            $and: [
                { member: { $all: member } },
                { member: { $size: member.length } },
            ],
        });

        if (!chatroom) {
            const newChatroom = await db.collection('chatroom').insertOne({
                member,
                memberName,
                createdAt: new Date(),
            });

            chatroom = await db.collection('chatroom').findOne({
                _id: newChatroom.insertedId,
            });
        }

        res.send(chatroom._id);
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).send(err.message);
    }
});

// 채팅방 상세 가져오기
// 채팅방에 속해있는 유저만 접근할 수 있도록 추가
chatRotuer.get('/:roomId', isLogin, async (req, res, next) => {
    const chatroomId = req.params.roomId;

    try {
        const chatroom = await db
            .collection('chatroom')
            .findOne({ _id: new ObjectId(chatroomId) });

        const chat = await db
            .collection('chat')
            .find({
                roomId: chatroomId,
            })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        // ObjectId 형태로 includes 적용이 안되는 문제로 toString()를 이용해 변환
        const members = chatroom.member.map((i) => i.toString());

        if (!members.includes(req.user._id.toString())) {
            const error = new Error('채팅방 권한이 없습니다.');
            error.statusCode = 400;
            throw error;
        }

        res.render('chat/chat.ejs', {
            chatroom: chatroom,
            chat: chat.reverse(),
        });
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).send(err.message);
    }
});

// document 채팅 ( 채팅 _id, 채팅방 _id, 보낸 사람, 받는 사람 )

module.exports = chatRotuer;
