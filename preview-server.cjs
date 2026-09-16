const http = require('http');
const fs = require('fs');
const path = require('path');

const host = '127.0.0.1';
const port = 8000;
const root = __dirname;
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

http.createServer((request, response) => {
  const url = new URL(request.url, `http://${host}`);
  const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const requestedPath = path.resolve(root, `.${pathname}`);

  if (!requestedPath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.stat(requestedPath, (statError, stats) => {
    const filePath = !statError && stats.isDirectory()
      ? path.join(requestedPath, 'index.html')
      : requestedPath;

    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      response.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      });
      response.end(data);
    });
  });
}).listen(port, host, () => {
  console.log(`Inkkstudio disponible en http://${host}:${port}`);
});
