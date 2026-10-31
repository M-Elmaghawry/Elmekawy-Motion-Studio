// Compatibility launcher: the old preview command now starts the working app.
// The design-only HTML remains a planning reference, not the running Studio.
const path = require('node:path');
const {spawn} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const child = spawn(process.execPath, [path.join(root, 'apps/server/src/index.ts')], {
  cwd: root, stdio: 'inherit', windowsHide: true,
});
child.on('exit', code => {process.exitCode = code ?? 0;});
process.on('SIGINT', () => child.kill());
process.on('SIGTERM', () => child.kill());
