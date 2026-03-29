import fs from 'node:fs'
import path from 'node:path'

function fail(message) {
  console.error(`\n[deploy:verify] ${message}\n`)
  process.exit(1)
}

const cwd = process.cwd()
const wranglerPath = path.join(cwd, 'wrangler.toml')

if (!fs.existsSync(wranglerPath)) {
  fail(`Arquivo nao encontrado: ${wranglerPath}`)
}

const content = fs.readFileSync(wranglerPath, 'utf8')

if (/YOUR_HYPERDRIVE_ID/.test(content)) {
  fail('Configure [[hyperdrive]].id com o UUID real (o placeholder YOUR_HYPERDRIVE_ID ainda esta no arquivo).')
}

const hyperdriveIdMatch = content.match(/\[\[hyperdrive\]\][\s\S]*?\bid\s*=\s*"([^"]+)"/m)
if (!hyperdriveIdMatch || !hyperdriveIdMatch[1]) {
  fail('Nao foi encontrado [[hyperdrive]].id em wrangler.toml.')
}

const hyperdriveId = hyperdriveIdMatch[1].trim()
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
if (!uuidRegex.test(hyperdriveId)) {
  fail(`Hyperdrive ID invalido: "${hyperdriveId}". Informe um UUID valido.`)
}

const workerNameMatch = content.match(/^\s*name\s*=\s*"([^"]+)"/m)
if (!workerNameMatch?.[1]) {
  fail('Defina o nome do worker em wrangler.toml (name = "...").')
}

console.log(`[deploy:verify] OK - worker=${workerNameMatch[1]}, hyperdrive=${hyperdriveId}`)
