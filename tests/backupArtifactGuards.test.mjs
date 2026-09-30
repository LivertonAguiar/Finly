import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const backup = readFileSync(resolve(root, 'scripts', 'backup-vps.sh'), 'utf8');
const verify = readFileSync(resolve(root, 'scripts', 'verify-vps-backup.sh'), 'utf8');
const service = readFileSync(resolve(root, 'infra', 'systemd', 'finly-backup.service'), 'utf8');
const timer = readFileSync(resolve(root, 'infra', 'systemd', 'finly-backup.timer'), 'utf8');

assert.match(backup, /pg_dump[^\n]*--format=custom/, 'O banco deve ser salvo em formato custom verificável.');
assert.match(backup, /server\/data/, 'Os dados persistidos do serviço também precisam de backup.');
assert.match(backup, /sha256sum/, 'O backup deve publicar checksums de integridade.');
assert.match(backup, /chmod\s+600/, 'Artefatos com dados financeiros devem ser privados.');
assert.match(verify, /pg_restore[^\n]*--list/, 'A verificação deve validar a estrutura do dump.');
assert.match(verify, /createdb/, 'A verificação deve restaurar em um banco temporário.');
assert.match(verify, /dropdb/, 'O banco temporário deve ser removido após o teste.');
assert.match(service, /ProtectSystem=strict/, 'O serviço de backup deve usar isolamento do systemd.');
assert.match(timer, /OnCalendar=daily/, 'O backup deve ser executado diariamente.');
assert.doesNotMatch(`${backup}\n${verify}`, /PASSWORD\s*=|SERVICE_ROLE|JWT_SECRET/i, 'Scripts não devem conter credenciais.');

console.log('OK: backup diário, integridade e restauração temporária protegidos.');
