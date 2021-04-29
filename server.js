const https = require('https');
const fs = require('fs');
const express = require('express');
const moment = require('moment');
const multer = require('multer');
const upload = multer();

const serverOptions = {
  key:  fs.readFileSync('ssl/cert.key'),
  cert: fs.readFileSync('ssl/cert.crt'),
};
const port = 8080;
const outdir = __dirname + '/files/';
console.log(outdir);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/photo-scanner', express.static('src'));
app.post('/upload', upload.array('files'), (req, res) => {
  req.files.forEach((file, i) => {
    const filepath = outdir + moment().format('YYYY-MM-DD-HH-mm-ss-') + i + '.jpg';
    fs.writeFileSync(filepath, file.buffer);
  });
  res.send('ok');
});
const server = https.createServer(serverOptions, app);
server.listen(port);
// app.listen(port);

