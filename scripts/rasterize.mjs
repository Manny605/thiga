// Rastérise le logo en icônes PNG (favicon + icônes app/PWA).
// Source : assets/logo.jpg (avec fond blanc) → sortie dans public/
// (servie par Vite à la racine du site). Usage : npm run rasterize
import sharp from 'sharp'
import { mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'assets', 'logo.jpg')
const outDir = path.join(root, 'public')

const TARGETS = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-48.png', size: 48 },
  { name: 'apple-touch-icon-180.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
]

try {
  await access(src)
} catch {
  console.error(`✗ Source introuvable : ${path.relative(root, src)}`)
  process.exit(1)
}

await mkdir(outDir, { recursive: true })

for (const { name, size } of TARGETS) {
  await sharp(src)
    // Conserve le ratio et complète en carré sur fond blanc.
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .flatten({ background: '#FFFFFF' })
    .png()
    .toFile(path.join(outDir, name))
  console.log(`✓ ${name} (${size}×${size})`)
}

console.log(`\n${TARGETS.length} icônes générées dans ${path.relative(root, outDir)}/`)
