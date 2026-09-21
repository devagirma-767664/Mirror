const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (child.exitCode === null) child.kill();
  }
}

function start(args, cwd) {
  const child = spawn(process.execPath, args, { cwd, stdio: 'inherit' });
  children.push(child);
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code) => stop(code ?? 1));
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

const backendArgs = process.argv.includes('--watch') ? ['--watch', 'server.js'] : ['server.js'];
start(backendArgs, path.join(root, 'backend'));
start(['node_modules/vite/bin/vite.js', '--configLoader', 'runner', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], path.join(root, 'frontend'));

console.log('Mirror: http://127.0.0.1:5173 | API: http://127.0.0.1:5000');
