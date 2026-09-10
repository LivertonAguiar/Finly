import { build } from 'esbuild';

const entryPoint = process.argv[2];
if (!entryPoint) {
  throw new Error('Informe o arquivo de teste TypeScript.');
}

const result = await build({
  entryPoints: [entryPoint],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  logLevel: 'silent',
});

const source = result.outputFiles[0].text;
const dataUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
await import(dataUrl);
