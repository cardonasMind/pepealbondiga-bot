// Skill library: cada skill es un archivo .md en skills/ con la estructura:
//
//   # nombreSkill
//
//   Descripcion en lenguaje natural.
//
//   **Tags:** tag1, tag2
//
//   ## Codigo
//
//   \`\`\`js
//   // codigo JavaScript que se ejecuta dentro del sandbox
//   return 'hecho'
//   \`\`\`
//
// Asi son legibles para humanos y para LLMs.

const fs = require('fs')
const path = require('path')

const SKILLS_DIR = path.join(__dirname, '..', 'skills')

function ensureDir() {
  if (fs.existsSync(SKILLS_DIR) === false) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true })
  }
}

// Extrae el primer bloque \`\`\`js ... \`\`\` del markdown
function extractCode(markdown) {
  const fence = '\`\`\`'
  const re = new RegExp(fence + 'js\\s*\\n([\\s\\S]*?)\\n' + fence, 'm')
  const match = markdown.match(re)
  if (match === null) return null
  return match[1]
}

// Extrae la primera linea no vacia despues del titulo como descripcion corta
function extractDescription(markdown) {
  const lines = markdown.split('\n')
  let inHeader = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length === 0) continue
    if (trimmed.startsWith('#')) { inHeader = true; continue }
    if (trimmed.startsWith('\`\`\`')) break
    if (trimmed.startsWith('**Tags')) continue
    if (trimmed.startsWith('##')) continue
    if (inHeader === true) {
      return trimmed.slice(0, 200)
    }
  }
  return ''
}

// Extrae los tags si existen
function extractTags(markdown) {
  const re = /\*\*Tags:\*\*\s*([^\n]+)/i
  const match = markdown.match(re)
  if (match === null) return []
  return match[1].split(',').map(t => t.trim()).filter(t => t.length > 0)
}

function listSkills() {
  ensureDir()
  const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.md'))
  return files.map(file => {
    const fullPath = path.join(SKILLS_DIR, file)
    const content = fs.readFileSync(fullPath, 'utf8')
    return {
      name: file.replace(/\.md$/, ''),
      description: extractDescription(content),
      tags: extractTags(content),
      sizeBytes: content.length,
      hasCode: extractCode(content) !== null,
      modifiedAt: fs.statSync(fullPath).mtime.toISOString()
    }
  })
}

function loadSkillCode(name) {
  ensureDir()
  const safe = name.replace(/[^a-zA-Z0-9_-]/g, '')
  const fullPath = path.join(SKILLS_DIR, safe + '.md')
  if (fs.existsSync(fullPath) === false) {
    throw new Error('Skill no encontrada: ' + safe)
  }
  const md = fs.readFileSync(fullPath, 'utf8')
  const code = extractCode(md)
  if (code === null) {
    throw new Error('Skill ' + safe + ' no tiene bloque de codigo \`\`\`js')
  }
  return code
}

function loadSkillFull(name) {
  ensureDir()
  const safe = name.replace(/[^a-zA-Z0-9_-]/g, '')
  const fullPath = path.join(SKILLS_DIR, safe + '.md')
  if (fs.existsSync(fullPath) === false) {
    throw new Error('Skill no encontrada: ' + safe)
  }
  const md = fs.readFileSync(fullPath, 'utf8')
  return {
    name: safe,
    markdown: md,
    code: extractCode(md),
    description: extractDescription(md),
    tags: extractTags(md)
  }
}

function saveSkill(name, code, description, tags) {
  ensureDir()
  const safe = name.replace(/[^a-zA-Z0-9_-]/g, '')
  if (safe.length === 0) throw new Error('Nombre invalido (solo letras, numeros, _ y -)')

  const desc = (description || 'Sin descripcion').replace(/\n/g, ' ').slice(0, 500)
  const tagList = Array.isArray(tags) ? tags : []
  const tagsLine = tagList.length > 0 ? '**Tags:** ' + tagList.join(', ') + '\n\n' : ''

  const md = '# ' + safe + '\n\n' +
             desc + '\n\n' +
             tagsLine +
             '_Guardada: ' + new Date().toISOString() + '_\n\n' +
             '## Codigo\n\n' +
             '\`\`\`js\n' + code + '\n\`\`\`\n'

  const fullPath = path.join(SKILLS_DIR, safe + '.md')
  fs.writeFileSync(fullPath, md)
  return { name: safe, path: fullPath, sizeBytes: md.length }
}

function deleteSkill(name) {
  const safe = name.replace(/[^a-zA-Z0-9_-]/g, '')
  const fullPath = path.join(SKILLS_DIR, safe + '.md')
  if (fs.existsSync(fullPath) === false) {
    throw new Error('Skill no existe: ' + safe)
  }
  if (safe.startsWith('_')) {
    throw new Error('No se pueden borrar skills de sistema (empiezan con _)')
  }
  fs.unlinkSync(fullPath)
  return { ok: true, name: safe }
}

module.exports = { listSkills, loadSkillCode, loadSkillFull, saveSkill, deleteSkill }
