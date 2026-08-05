import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { spawnServer, dropTestDb, request, BACKEND_DIR } from './helpers/server.mjs';

let server;
let baseUrl;

before(async () => {
  server = await spawnServer();
  baseUrl = server.baseUrl;
});

after(async () => {
  server.stop();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await dropTestDb(server.dbName);
});

test('health reports error when the configured model cannot generate', async () => {
  const badServer = await spawnServer({
    env: { GEMINI_MODEL: 'gemini-1.5-flash' },
  });
  try {
    const r = await request(badServer.baseUrl, 'GET', '/api/v1/assistant/health');
    assert.equal(r.status, 200);
    assert.equal(r.json.data.isUp, false);
    assert.equal(r.json.data.model, 'gemini-1.5-flash');
    assert.ok(!Number.isNaN(Date.parse(r.json.data.checkedAt)));

    const h = await request(badServer.baseUrl, 'GET', '/health');
    assert.equal(h.json.services.gemini.status, 'error');
  } finally {
    badServer.stop();
  }
});

test('GET /health returns status, version, services and db state', async () => {
  const r = await request(baseUrl, 'GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.json.status, 'ok');
  assert.equal(r.json.database, 'connected');
  assert.equal(r.json.version, '1.0.0');
  assert.ok(r.json.nodeVersion.startsWith('v'));
  assert.ok(r.json.uptime > 0);
  assert.ok(['ok', 'error'].includes(r.json.services.gemini.status));
  assert.ok(typeof r.json.services.gemini.model === 'string');
  assert.ok(!Number.isNaN(Date.parse(r.json.services.gemini.checkedAt)));
  assert.ok(['ok', 'error'].includes(r.json.services.cloudinary));
  assert.ok(r.json.memory.rss > 0);
});

test('legacy /api/* routes return 404, /api/v1/* requires auth', async () => {
  const legacy = await request(baseUrl, 'GET', '/api/bills');
  assert.equal(legacy.status, 404);

  const v1 = await request(baseUrl, 'GET', '/api/v1/bills');
  assert.equal(v1.status, 401);
});

test('unknown route returns 404 with JSON body', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/does-not-exist');
  assert.equal(r.status, 404);
  assert.equal(r.json.success, false);
});

test('validateEnv throws listing all missing vars when none are set', async () => {
  const cleaned = { ...process.env };
  for (const key of [
    'MONGODB_URI',
    'JWT_SECRET',
    'GEMINI_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ]) {
    delete cleaned[key];
  }
  const result = await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['-e', "import('./src/config/index.js').then((m) => m.default.validateEnv())"],
      { cwd: BACKEND_DIR, env: cleaned }
    );
    let stderr = '';
    child.stderr.on('data', (d) => {
      stderr += d;
    });
    child.on('exit', (code) => resolve({ code, stderr }));
  });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Missing required environment variable/);
  assert.match(result.stderr, /MONGODB_URI/);
  assert.match(result.stderr, /GEMINI_API_KEY/);
});

test('validateEnv rejects short JWT_SECRET', async () => {
  const cleaned = { ...process.env, JWT_SECRET: 'short' };
  const result = await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ['-e', "import('./src/config/index.js').then((m) => m.default.validateEnv())"],
      { cwd: BACKEND_DIR, env: cleaned }
    );
    let stderr = '';
    child.stderr.on('data', (d) => {
      stderr += d;
    });
    child.on('exit', (code) => resolve({ code, stderr }));
  });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /JWT_SECRET must be at least 16 characters/);
});

test('env validation passes when all required vars are present', async () => {
  const result = await new Promise((resolve) => {
    execFile(
      process.execPath,
      [
        '-e',
        "import('./src/config/index.js').then((m) => { m.default.validateEnv(); process.exit(0); })",
      ],
      { cwd: BACKEND_DIR, env: process.env },
      (error) => resolve(error?.code ?? 0)
    );
  });
  assert.equal(result, 0);
});
