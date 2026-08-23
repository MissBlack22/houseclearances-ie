// Tiny static server for local preview of the built site (clean URLs, folder/index.html).
const http = require('http');
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');
const PORT = 8055;
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(SITE, urlPath);
  if (urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
  else if (!path.extname(filePath)) filePath = path.join(filePath, 'index.html');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(SITE, '404.html'), (err2, data2) => {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(err2 ? 'Not found' : data2);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Serving houseclearances-ie/site on http://localhost:${PORT}`));
