import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

export function startServer(directory, options = {}) {
  const root = path.resolve(directory);
  const port = Number(options.port || process.env.PORT || 4321);
  const host = options.host || '127.0.0.1';
  const quiet = options.quiet === true;
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    let pathname;
    try { pathname = decodeURIComponent(requestUrl.pathname); } catch { pathname = requestUrl.pathname; }
    let target = path.resolve(root, `.${pathname}`);
    if (!target.startsWith(root)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (existsSync(target) && statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!existsSync(target) && !path.extname(target)) target = path.join(target, 'index.html');
    if (!existsSync(target) || !statSync(target).isFile()) target = path.join(root, '404.html');
    if (!existsSync(target)) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    const status = target.endsWith(`${path.sep}404.html`) ? 404 : 200;
    response.writeHead(status, {
      'content-type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    createReadStream(target).pipe(response);
  });
  server.listen(port, host, () => {
    if (!quiet) console.log(`Shiori preview: http://${host}:${port}`);
  });
  return server;
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) {
  const directory = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
  startServer(directory);
}
