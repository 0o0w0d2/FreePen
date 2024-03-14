const express = require('express');
const app = express();

const { createServer } = require('http');
const { Server } = require('socket.io');

const { ObjectId } = require('mongodb');

const connectToMongoDB = require('../db');

let db;

connectToMongoDB
    .then((client) => {
        db = client.db('forum');
    })
    .catch((err) => {
        console.log(err);
    });

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('websocket 연결됨');

        // room join code
        socket.on('room-join', async (data) => {
            try {
                console.log('연결된 roomId :', data);

                // passport를 이용해 user의 _id 값을 알아냄
                const author = socket.request.session.passport.user.id;

                // roomId에 맞는 chatroom을 찾고 현재 접속 중인 사용자가 chatroom의 member일 경우에만 접근을 허용하도록 설정
                const chatroom = await db
                    .collection('chatroom')
                    .findOne({ _id: new ObjectId(data) });

                let roomCheck = false;

                for (let i = 0; i < chatroom.member.length; i++) {
                    if (chatroom.member[i].equals(new ObjectId(author))) {
                        roomCheck = true;
                    }
                }

                if (!roomCheck) {
                    throw new Error('채팅방에 접근할 수 없습니다.');
                }

                socket.join(data);
            } catch (err) {
                console.log(err);
            }
        });

        // msg(client) => db 저장
        socket.on('msg-client', async (data) => {
            try {
                console.log('클라이언트가 보낸 data', data);

                const author = socket.request.session.passport.user.id;

                await db.collection('chat').insertOne({
                    roomId: new ObjectId(data.room),
                    msg: data.msg,
                    author: new ObjectId(author),
                    createdAt: new Date(),
                });

                // db에 저장된 msg를 server => client 전달
                io.to(data.room).emit('msg-server', {
                    msg: data.msg,
                    author: author,
                });
            } catch (err) {
                console.log(err);
            }
        });
    });
};
