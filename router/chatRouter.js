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

// 내가 참여하고 있는 채팅방들 보기
chatRotuer.get('/list', isLogin, async (req, res, next) => {
    const user = req.user._id;
    const chatList = await db
        .collection('chatroom')
        .find({
            member: user,
        })
        .toArray();

    res.render('chat/chatList.ejs', { chatList: chatList });
});

// 채팅방 상세(더미) 확인하기 위한 라우터
chatRotuer.get('/chat', isLogin, async (req, res, next) => {
    res.render('chat/chat.ejs');
});

// document 채팅방 ( 채팅방 _id, 채팅방 이름 ( 없으면 반대되는 채팅 참여자 이름 ), 채팅 참여자 )
// postlist의 채팅하기 버튼을 누르면 채팅방을 생성
chatRotuer.post('/chatroom-add', isLogin, async (req, res, next) => {
    const user = req.user._id;
    const author = req.body.authorId;
    const member = [user, new ObjectId(author)];
    const myname = req.user.username;
    const yourname = req.body.authorName;
    const memberName = [myname, yourname];

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
});

// 채팅방 상세 가져오기
chatRotuer.get('/:roomId', isLogin, async (req, res, next) => {
    const chatroomId = req.params.roomId;

    const chatroom = await db
        .collection('chatroom')
        .findOne({ _id: new ObjectId(chatroomId) });

    res.render('chat/chat.ejs', { chatroom: chatroom });
});

// document 채팅 ( 채팅 _id, 채팅방 _id, 보낸 사람, 받는 사람 )

module.exports = chatRotuer;
