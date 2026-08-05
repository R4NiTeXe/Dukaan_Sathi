import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setServers } from 'node:dns';
import mongoose from 'mongoose';
import 'dotenv/config';

setServers(['8.8.8.8', '1.1.1.1']);

export const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const spawnServer = async ({ rateLimitMax = 10000, env = {} } = {}) => {
  const port = 20000 + Math.floor(Math.random() * 30000);
  const dbName = `ai-billing-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: BACKEND_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      DB_NAME: dbName,
      RATE_LIMIT_MAX: String(rateLimitMax),
      NODE_ENV: 'test',
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(new Error(`Server did not start in time.\nstdout: ${output}\nstderr: ${stderr}`)),
      45000
    );
    child.stdout.on('data', () => {
      if (output.includes('Server is running')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Server exited early (code ${code}):\n${stderr}`));
    });
  });

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    dbName,
    stop: () => child.kill('SIGTERM'),
  };
};

export const dropTestDb = async (dbName) => {
  if (!process.env.MONGODB_URI) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName,
    serverSelectionTimeoutMS: 15000,
  });
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
};

export const request = async (baseUrl, method, path, { token, body, headers = {} } = {}) => {
  const res = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // body is not JSON (e.g. error pages)
  }
  return { status: res.status, json };
};

export const registerUser = async (baseUrl, email = 'test@user.com') => {
  return request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Test Owner',
      shopName: 'Test Shop',
      shopType: 'grocery',
      email,
      password: 'secret123',
    },
  });
};
