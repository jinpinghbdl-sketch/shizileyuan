// 变形积木识字乐园 — 本地开发服务器
// 运行方式: node server.js
// 访问地址: http://localhost:3456/
const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 3456;
const mime = {
  'html': 'text/html;charset=utf-8',
  'json': 'application/json',
  'css': 'text/css',
  'js': 'application/javascript'
};
const srv = http.createServer((req, res) => {
  let urlPath = req.url === '/' ? 'index.html' : req.url.split('?')[0];
  let fp = path.join(__dirname, urlPath);
  let ext = path.extname(fp).slice(1) || 'html';
  try {
    const d = fs.readFileSync(fp);
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'text/plain',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(d);
  } catch(e) {
    res.writeHead(404);
    res.end('Not found: ' + urlPath);
  }
});
srv.listen(port, () => console.log('Server running at http://localhost:' + port));
process.on('uncaughtException', (err) => console.error('Error:', err.message));
