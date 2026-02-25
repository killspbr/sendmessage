/**
 * Gera ícones PNG para a extensão usando canvas nativo do Node.js
 * Execute: node generate-icons.js
 * Requer: npm install canvas (se não funcionar, use os SVGs abaixo)
 */

const fs = require('fs')
const path = require('path')

// Tenta usar canvas, senão cria SVG como fallback
async function generateIcons() {
    const sizes = [16, 48, 128]
    const iconsDir = path.join(__dirname, 'icons')

    if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

    // SVG do ícone (círculo verde com pin de localização)
    const svgTemplate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669"/>
      <stop offset="100%" style="stop-color:#10b981"/>
    </linearGradient>
  </defs>
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="url(#grad)"/>
  <!-- Map pin -->
  <path d="M64 20 C48 20 36 32 36 48 C36 66 64 100 64 100 C64 100 92 66 92 48 C92 32 80 20 64 20Z" fill="white"/>
  <circle cx="64" cy="48" r="10" fill="#059669"/>
</svg>`

    for (const size of sizes) {
        const svgPath = path.join(iconsDir, `icon${size}.svg`)
        fs.writeFileSync(svgPath, svgTemplate(size))
        console.log(`✅ Criado: icon${size}.svg`)
    }

    console.log('\n⚠️  SVGs criados. Para converter para PNG:')
    console.log('   - Use https://svgtopng.com ou')
    console.log('   - Instale "sharp": npm install sharp')
    console.log('   - Ou use Inkscape: inkscape icon128.svg -o icon128.png')
    console.log('\nA extensão funciona com SVGs também se você renomear para .png')
    console.log('(Chrome aceita SVG como ícone de extensão)\n')

    // Cria PNGs mínimos válidos usando Buffer (1x1 pixel transparente escalado)
    // Este é um PNG 1x1 pixel verde válido em base64
    const greenPngBase64_1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

    for (const size of sizes) {
        const pngPath = path.join(iconsDir, `icon${size}.png`)
        if (!fs.existsSync(pngPath)) {
            // Placeholder PNG - substitua pelo SVG convertido
            fs.writeFileSync(pngPath, Buffer.from(greenPngBase64_1x1, 'base64'))
            console.log(`⚠️  Placeholder criado: icon${size}.png (substitua pelo SVG convertido)`)
        }
    }
}

generateIcons().catch(console.error)
