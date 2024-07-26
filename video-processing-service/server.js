const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const app = express();
const storage = new Storage({ keyFilename: process.env.GOOGLE_CLOUD_KEY });
const bucket = storage.bucket('youtube-system-design');

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Not a video file!'), false);
    }
};

const upload = multer({ storage: multer.memoryStorage(), fileFilter });

app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
        },
    });

    blobStream.on('error', (err) => {
        res.status(500).send({ message: err.message });
    });

    blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        res.status(200).send({ message: 'File uploaded.', url: publicUrl });
    });

    blobStream.end(req.file.buffer);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
