const { spawn } = require('child_process');
const path = require('path');

const frontendDir = path.join(__dirname, '../frontend');
const backendDir = path.join(__dirname, '../backend');

console.log('Iniciando frontend e backend...\n');

const frontend = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
});

const backend = spawn('npm', ['run', 'start:dev'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});

frontend.on('error', (error) => {
  console.error('Erro ao iniciar frontend:', error);
  process.exit(1);
});

backend.on('error', (error) => {
  console.error('Erro ao iniciar backend:', error);
  process.exit(1);
});

frontend.on('exit', (code) => {
  console.log(`Frontend encerrado com código ${code}`);
  backend.kill();
  process.exit(code);
});

backend.on('exit', (code) => {
  console.log(`Backend encerrado com código ${code}`);
  frontend.kill();
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\nEncerrando processos...');
  frontend.kill();
  backend.kill();
  process.exit(0);
});
