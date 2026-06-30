#!/usr/bin/env node
// Usage: node scripts/bump-version.mjs <new-version>
// Updates version in package.json and src-tauri/tauri.conf.json

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Usage: node scripts/bump-version.mjs <new-version>');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error(`Invalid version format: "${newVersion}". Expected x.y.z (e.g. 0.2.0)`);
  process.exit(1);
}

const targets = [
  resolve('package.json'),
  resolve('src-tauri/tauri.conf.json'),
];

for (const path of targets) {
  let raw;
  try {
    raw = readFileSync(path, 'utf-8');
  } catch {
    console.warn(`Skipping (not found): ${path}`);
    continue;
  }

  const json = JSON.parse(raw);
  const oldVersion = json.version;
  json.version = newVersion;

  // Preserve trailing newline style
  const formatted = JSON.stringify(json, null, 2) + '\n';
  writeFileSync(path, formatted, 'utf-8');

  console.log(`Updated ${path}: ${oldVersion} -> ${newVersion}`);
}
