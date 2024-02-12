// 분리아직 X

const express = require('express');
const app = express();

const { createServer } = require('http');
const { Server } = require('socket.io');

const server = createServer(app); // HTTP 서버 생성
const io = new Server(server); // websocket 서버 생성

module.exports = () => {
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
};
