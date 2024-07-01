const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// 로컬 인증서 및 키 파일 경로
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname + '\\local-https-key', 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname+ '\\local-https-key', 'localhost.pem')),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});
