const { spawn } = require('node:child_process');
const puppeteer = require('puppeteer');

async function run() {
  process.env.CHROME_BIN = await puppeteer.executablePath();

  const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const ngArgs = ['run', 'test', '--', '--watch=false', '--browsers=ChromeHeadless'];

  const child = spawn(npmExecutable, ngArgs, {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });

  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });

  child.on('error', () => {
    process.exit(1);
  });
}

run().catch(() => process.exit(1));
