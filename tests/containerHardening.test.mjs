import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const compose = readFileSync(resolve(root, 'docker-compose.yml'), 'utf8');
const dockerfile = readFileSync(resolve(root, 'Dockerfile'), 'utf8');
const deploy = readFileSync(resolve(root, 'scripts/deploy-vps.ps1'), 'utf8');

assert.doesNotMatch(
  compose,
  /ports:\s*\r?\n\s*-\s*["']?3000:3000/i,
  'O app deve ficar acessível somente pela rede interna do proxy, sem publicar a porta 3000.',
);
assert.match(compose, /healthcheck:/i, 'O contêiner precisa declarar healthcheck.');
assert.match(compose, /max-size:\s*["']?10m/i, 'Os logs Docker precisam de rotação por tamanho.');
assert.match(compose, /max-file:\s*["']?3/i, 'Os logs Docker precisam limitar a quantidade de arquivos.');
assert.match(compose, /mem_limit:/i, 'O serviço precisa de limite de memória.');
assert.match(compose, /cpus:/i, 'O serviço precisa de limite de CPU.');
assert.match(dockerfile, /^USER\s+node\s*$/im, 'O processo de produção não deve executar como root.');
assert.doesNotMatch(
  deploy,
  /ssh\.exe[^\r\n]+curl -fsS http:\/\/127\.0\.0\.1:3000/iu,
  'O deploy não pode depender de uma porta 3000 publicada no host.',
);
assert.match(
  deploy,
  /base64 -d \| docker exec -i finly-app node/iu,
  'A validação pós-deploy deve consultar a API de dentro do contêiner isolado.',
);

console.log('OK: contêiner sem porta pública, com saúde, limites, rotação e usuário não-root.');
