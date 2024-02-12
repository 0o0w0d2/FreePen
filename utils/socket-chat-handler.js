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
            console.log('room Id :', data);
            socket.join(data);
        });

        socket.on('msg', async (data) => {
            console.log('클라이언트가 보낸 data', data);
            await db.collection('chat').insertOne({
                roomId: new ObjectId(data.room),
                msg: data.msg,
                author: new ObjectId(data.author),
                createdAt: new Date(),
            });

            io.to(data.room).emit('msg', {
                msg: data.msg,
                author: data.author,
            });
        });
    });
};
