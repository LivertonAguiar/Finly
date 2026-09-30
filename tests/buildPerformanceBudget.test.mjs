import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'dist', 'index.html'), 'utf8');
const entryMatch = html.match(/<script[^>]+type="module"[^>]+src="\/?assets\/([^"]+\.js)"/i)
  || html.match(/<script[^>]+src="\/?assets\/([^"]+\.js)"[^>]+type="module"/i);

assert.ok(entryMatch, 'O build deve publicar um script module de entrada em dist/index.html.');

const entryPath = resolve(root, 'dist', 'assets', entryMatch[1]);
const entrySource = readFileSync(entryPath);
const compressedBytes = gzipSync(entrySource, { level: 9 }).byteLength;
const maxEntryGzipBytes = 400 * 1024;

assert.ok(
  compressedBytes <= maxEntryGzipBytes,
  `O JavaScript inicial compactado deve ter no máximo 400 KiB; atual: ${(compressedBytes / 1024).toFixed(1)} KiB.`,
);

const sourceViewport = readFileSync(resolve(root, 'index.html'), 'utf8');
assert.doesNotMatch(
  sourceViewport,
  /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?/i,
  'A viewport não deve impedir zoom, requisito básico de acessibilidade móvel.',
);

console.log(`OK: entrada inicial ${(compressedBytes / 1024).toFixed(1)} KiB gzip e zoom móvel permitido.`);
