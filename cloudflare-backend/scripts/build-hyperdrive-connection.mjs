#!/usr/bin/env node
/**
 * Gera uma connection string Postgres segura para Hyperdrive
 * com encoding correto de credenciais (especialmente senha com ":" e "@").
 *
 * Uso:
 * node scripts/build-hyperdrive-connection.mjs ^
 *   --user cf_hyperdrive ^
 *   --password CfHyper2026Safe ^
 *   --host easypanel.soepinaobasta.com ^
 *   --port 5433 ^
 *   --database sendmessage
 */

function fail(message) {
  console.error(`\n[build-hyperdrive-connection] ${message}\n`)
  process.exit(1)
}

function getArg(name) {
  const key = `--${name}`
  const idx = process.argv.indexOf(key)
  if (idx === -1) return ''
  return process.argv[idx + 1] || ''
}

const user = getArg('user')
const password = getArg('password')
const host = getArg('host')
const database = getArg('database')
const portRaw = getArg('port') || '5432'
const sslmode = getArg('sslmode') || 'require'

if (!user) fail('Parametro obrigatorio ausente: --user')
if (!password) fail('Parametro obrigatorio ausente: --password')
if (!host) fail('Parametro obrigatorio ausente: --host')
if (!database) fail('Parametro obrigatorio ausente: --database')

const port = Number(portRaw)
if (!Number.isInteger(port) || port <= 0) {
  fail(`Porta invalida: "${portRaw}"`)
}

const encodedUser = encodeURIComponent(user)
const encodedPassword = encodeURIComponent(password)

const connectionString = `postgres://${encodedUser}:${encodedPassword}@${host}:${port}/${database}?sslmode=${encodeURIComponent(sslmode)}`

console.log('\nConnection string (Hyperdrive):\n')
console.log(connectionString)
console.log('\nObservacao: se a senha tiver ":" ou "@", ela ja foi codificada corretamente.\n')
