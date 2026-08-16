const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'frontend', 'dist', 'browser');
const port = parseInt(process.env.PORT || '4200', 10);
const base = '/portfolio';
const apiHost = process.env.API_HOST || 'localhost';
const apiPort = parseInt(process.env.API_PORT || '3000', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain'
};

function proxy(req, res, targetPath) {
  const upstream = http.request(
    {
      host: apiHost,
      port: apiPort,
      method: req.method,
      path: targetPath,
      headers: { ...req.headers, host: `${apiHost}:${apiPort}` }
    },
    (upRes) => {
      res.writeHead(upRes.statusCode, upRes.headers);
      upRes.pipe(res);
    }
  );
  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('bad gateway');
  });
  req.pipe(upstream);
}

http
  .createServer((req, res) => {
    const raw = decodeURIComponent(req.url.split('?')[0]);

    if (raw.startsWith(`${base}/api`) || raw.startsWith(`${base}/uploads`)) {
      const targetPath = raw.slice(base.length);
      return proxy(req, res, targetPath);
    }

    let rel = raw;
    if (rel.startsWith(base)) rel = rel.slice(base.length) || '/';
    let filePath = path.normalize(path.join(root, rel));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      return res.end('forbidden');
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(root, 'index.html');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(port, () => console.log(`[serve-dist] sirviendo ${root} en http://localhost:${port}${base} (api -> ${apiHost}:${apiPort})`));
