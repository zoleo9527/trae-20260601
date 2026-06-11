const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const root = path.join(__dirname);
const backendDir = path.join(root, 'backend');
const frontendDir = path.join(root, 'frontend');

const log = (tag, msg) => console.log(`[\x1b[36m${tag}\x1b[0m] ${msg}`);

const killPort = (port) => new Promise(res => {
  const p = spawn('lsof', ['-ti:' + port]);
  let out = '';
  p.stdout.on('data', d => out += d);
  p.on('close', () => {
    const pids = out.trim().split(/\s+/).filter(Boolean);
    if (pids.length) spawn('kill', ['-9', ...pids]).on('close', () => setTimeout(res, 500));
    else res();
  });
});

const install = (cwd, tag) => new Promise((res, rej) => {
  if (fs.existsSync(path.join(cwd, 'node_modules'))) {
    log(tag, '依赖已就绪');
    return res();
  }
  log(tag, '首次安装依赖...');
  const p = spawn('npm', ['install'], { cwd, stdio: 'inherit' });
  p.on('close', (code) => code === 0 ? res() : rej());
});

const checkUrl = (url, tries = 20) => new Promise((res, rej) => {
  const t = setInterval(async () => {
    tries--;
    http.get(url, (r) => { clearInterval(t); res(true); }).on('error', () => {
      if (tries <= 0) { clearInterval(t); rej(); }
    });
  }, 800);
});

(async () => {
  log('SYS', '启动《奥特莱斯运营-品牌租约与扣点规则》');
  await killPort(3000);
  await killPort(5173);

  await install(backendDir, 'BE');
  await install(frontendDir, 'FE');

  const logFile = fs.openSync(path.join(root, 'backend-run.log'), 'w');
  const be = spawn('node', ['src/app.js'], { cwd: backendDir, stdio: ['ignore', logFile, logFile] });
  log('BE', `后端服务启动 PID=${be.pid} 端口=3000`);

  try {
    await checkUrl('http://localhost:3000/api/health');
    log('BE', '✅ 后端就绪');
  } catch (e) {
    log('BE', '❌ 后端启动失败');
    fs.closeSync(logFile);
    process.exit(1);
  }

  log('FE', '启动前端 Vite 端口=5173');
  const fe = spawn('npm', ['run', 'dev'], { cwd: frontendDir, stdio: 'inherit' });

  process.on('SIGINT', () => {
    log('SYS', '正在关闭...');
    be.kill(); fe.kill();
    fs.closeSync(logFile);
    setTimeout(() => process.exit(0), 500);
  });
})();
