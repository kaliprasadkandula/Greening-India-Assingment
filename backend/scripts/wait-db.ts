import net from 'net';

const DB_HOST = process.env.DB_HOST || 'db';
const DB_PORT = Number(process.env.DB_PORT) || 5432;
const MAX_RETRIES = 30;
const INTERVAL_MS = 2000;

function tryConnect(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.connect(DB_PORT, DB_HOST);
  });
}

async function waitForDb() {
  console.log(`Waiting for database at ${DB_HOST}:${DB_PORT}...`);
  for (let i = 1; i <= MAX_RETRIES; i++) {
    if (await tryConnect()) {
      console.log('Database is ready.');
      process.exit(0);
    }
    console.log(`Attempt ${i}/${MAX_RETRIES} failed, retrying in ${INTERVAL_MS / 1000}s...`);
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  console.error('Database did not become ready in time.');
  process.exit(1);
}

waitForDb();
