const express = require('express');
const {Storage} = require('@google-cloud/storage');
require('dotenv').config();

const app = express();
const storage = new Storage();
const bucketName = 'youtube-system-design';

app.get('/video/:filename', (req, res) => {
    const { filename } = req.params;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);
    
    // Check if file exists
    file.exists().then(data => {
        const exists = data[0];
        if (!exists) {
            return res.status(404).send('Video not found');
        }

        // Stream the video
        const stream = file.createReadStream();
        stream.on('error', error => res.status(500).send(error.message));
        stream.pipe(res);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
