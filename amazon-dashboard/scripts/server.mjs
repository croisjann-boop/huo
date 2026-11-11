import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProject } from './build.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const root = process.argv.includes('--dist') ? path.join(projectRoot, 'dist') : projectRoot;
if (!process.argv.includes('--dist')) await buildProject();
const portArg = process.argv.find(arg => arg.startsWith('--port='));
const port = Number(portArg?.slice(7) ?? process.env.PORT ?? 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('端口必须为 1–65535 的整数');
if (!existsSync(path.join(root, 'index.html'))) throw new Error('缺少 index.html；预览产物前请先执行 node scripts/build.mjs');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  const send = (status, text) => { response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end(request.method === 'HEAD' ? '' : text); };
  if (!['GET', 'HEAD'].includes(request.method)) { send(405, 'Method not allowed'); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const relative = path.relative(root, file);
    // 开发服务器只暴露页面及前端模块，不暴露项目文档、脚本和测试。
    if (relative.startsWith('..') || path.isAbsolute(relative) || !['index.html', 'src'].includes(relative.split(path.sep)[0]) || pathname.includes('\0')) {
      send(404, 'Not found'); return;
    }
    const info = await stat(file);
    if (!info.isFile()) { send(404, 'Not found'); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (request.method === 'HEAD') { response.end(); return; }
    const stream = createReadStream(file);
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  } catch (error) { send(error instanceof URIError ? 400 : 404, 'Not found'); }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `端口 ${port} 已被使用，请改用 node scripts/server.mjs --port=${port + 1}` : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`亚马逊销售经营看板\nLocal: http://127.0.0.1:${port}\n按 Ctrl+C 停止服务`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
