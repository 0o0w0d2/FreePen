const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();

const s3 = new S3Client({
    region: 'ap-northeast-2',
    credentials: {
        accessKeyId: process.env.ACCESSKEY,
        secretAccessKey: process.env.SECRETKEY,
    },
});

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.BUCKET,
        contentType(req, file, done) {
            done(null, file.mimetype);
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString());
        },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { upload };
