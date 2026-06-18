/**
 * Genera los iconos PWA de CalmaTEA usando Canvas API de Node.js
 * Ejecutar: node scripts/generate-icons.mjs
 */

import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Fondo degradado azul-calma
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#6BA3BE')
  grad.addColorStop(1, '#3A6D8E')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.22)
  ctx.fill()

  // Olas estilizadas
  const waveY = size * 0.62
  const waveH = size * 0.08
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
  ctx.beginPath()
  ctx.moveTo(0, waveY)
  for (let x = 0; x <= size; x += size / 4) {
    ctx.quadraticCurveTo(x + size / 8, waveY - waveH, x + size / 4, waveY)
  }
  ctx.lineTo(size, size)
  ctx.lineTo(0, size)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.beginPath()
  ctx.moveTo(0, waveY + size * 0.06)
  for (let x = 0; x <= size; x += size / 4) {
    ctx.quadraticCurveTo(x + size / 8, waveY + size * 0.06 - waveH * 0.8, x + size / 4, waveY + size * 0.06)
  }
  ctx.lineTo(size, size)
  ctx.lineTo(0, size)
  ctx.closePath()
  ctx.fill()

  // Emoji de ola (texto)
  const emojiSize = size * 0.45
  ctx.font = `${emojiSize}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🌊', size / 2, size * 0.42)

  // Texto "CalmaTEA" (solo en iconos grandes)
  if (size >= 192) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = `bold ${size * 0.11}px "Arial", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('CalmaTEA', size / 2, size * 0.82)
  }

  return canvas.toBuffer('image/png')
}

for (const size of [192, 512]) {
  const buf = generateIcon(size)
  const outPath = join(outDir, `icon-${size}.png`)
  writeFileSync(outPath, buf)
  console.log(`✓ Generado: icon-${size}.png`)
}

console.log('✅ Iconos PWA listos en public/icons/')
