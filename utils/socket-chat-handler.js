// 분리아직 X

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

const server = createServer(app); // HTTP 서버 생성
const io = new Server(server); // websocket 서버 생성

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('websocket 연결됨');

        socket.on('room-join', async (data) => {
            try {
                console.log('room Id :', data);

                const author = socket.request.session.passport.user.id;

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
