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

    try {
        const chatList = await db
            .collection('chatroom')
            .find({
                member: user,
            })
            .toArray();

        // 최근 채팅 하나 가져오기
        let recentchat = [];
        for (let i = 0; i < chatList.length; i++) {
            const chat = await db
                .collection('chat')
                .findOne({ roomId: chatList[i]._id }, { sort: { _id: -1 } });

            recentchat.push(chat ? chat.msg : '');
        }

        console.log(recentchat);

        res.render('chat/chatList.ejs', { chatList: chatList, recentchat });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

// postlist의 채팅하기 버튼을 누르면 채팅방을 생성
chatRotuer.post('/chatroom-add', isLogin, async (req, res, next) => {
    const user = req.user._id;
    const author = req.body.authorId;
    const member = [user, new ObjectId(author)];

    // 멤버의 이름을 비정규화해서 user collection을 거치지 않고 ejs에서 바로 사용할 수 있도록 chatroom에 멤버의 이름 추가
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
        console.error(err);
        next(err);
    }
});

// 채팅방 상세 가져오기
chatRotuer.get('/:roomId', isLogin, async (req, res, next) => {
    const chatroomId = req.params.roomId;

    try {
        const chatroom = await db
            .collection('chatroom')
            .findOne({ _id: new ObjectId(chatroomId) });

        const chat = await db
            .collection('chat')
            .find({
                roomId: new ObjectId(chatroomId),
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
        console.error(err);
        next(err);
    }
});

module.exports = chatRotuer;
