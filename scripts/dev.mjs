import { watch } from 'node:fs';
import path from 'node:path';
import { buildSite, PROJECT_ROOT } from './build.mjs';
import { startServer } from './serve.mjs';

let building = false;
let pending = false;
let timer;

async function rebuild(reason = 'initial') {
  if (building) {
    pending = true;
    return;
  }
  building = true;
  try {
    await buildSite({ quiet: reason !== 'initial' });
    if (reason !== 'initial') console.log(`↻ Rebuilt: ${reason}`);
  } catch (error) {
    console.error(`✗ Rebuild failed: ${error.message}`);
  } finally {
    building = false;
    if (pending) {
      pending = false;
      rebuild('queued change');
    }
  }
}

await rebuild();
startServer(path.join(PROJECT_ROOT, 'dist'), { port: process.env.PORT || 4321, host: '127.0.0.1' });

const watched = ['content', 'config', 'src', 'public'].map((name) => path.join(PROJECT_ROOT, name));
for (const directory of watched) {
  watch(directory, { recursive: true }, (_event, filename) => {
    clearTimeout(timer);
    timer = setTimeout(() => rebuild(filename || directory), 120);
  });
}
console.log('Watching content/, config/, src/, and public/ for changes.');
