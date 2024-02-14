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

        const author = socket.request.session.passport.user.id;

        socket.on('room-join', async (data) => {
            console.log('room Id :', data);
            // 자신이 속해있는 room에만 들어갈 수 있도록
            socket.join(data);
        });

        socket.on('msg-client', async (data) => {
            console.log('클라이언트가 보낸 data', data);

            await db.collection('chat').insertOne({
                roomId: new ObjectId(data.room),
                msg: data.msg,
                author: new ObjectId(author),
                createdAt: new Date(),
            });

            io.to(data.room).emit('msg-server', {
                msg: data.msg,
                // 댓글 작성자를 보내야, 댓글 작성자를 비교할 수 있지 않나?
                author: author,
            });
        });
    });
};
