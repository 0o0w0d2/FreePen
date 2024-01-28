const express = require('express');
const postRouter = express.Router();

postRouter.get('/list', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const postList = await db.collection('post').find().toArray();
        res.render('list.ejs', { postList: postList });
    } catch (err) {
        console.log(err);
        next(err);
    }
});

postRouter.get('/write', async (req, res) => {
    res.render('write.ejs');
});

// app.get('/post/:postId', async (req, res) => {
//     const postId = req.params.postId;
//     console.log(postId);
// });

module.exports = postRouter;
