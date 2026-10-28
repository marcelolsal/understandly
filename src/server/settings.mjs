import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

export async function dataRoot() {
  let file = {};
  try { file = parseEnv(await readFile('.env', 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return resolve(process.env.UNDERSTANDLY_DATA_DIR ?? file.UNDERSTANDLY_DATA_DIR ?? '../work/understandly-data');
}
