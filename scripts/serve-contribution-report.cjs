const http = require('http');
const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'docs', '보고서', 'Kanto_페이지별_팀원_기여도.html');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(file).pipe(res);
}).listen(43117, '127.0.0.1');
