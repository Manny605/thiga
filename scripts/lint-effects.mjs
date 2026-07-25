// Signale les useEffect à corps concis : la flèche renvoie la valeur de
// l'expression, que React prend pour une fonction de nettoyage.
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const files = []
;(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    statSync(p).isDirectory() ? walk(p) : /\.jsx?$/.test(p) && files.push(p)
  }
})('./src')

let bad = 0
for (const f of files) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    const code = line.replace(/^\s*(\/\/|\*|\/\*).*$/, '')   // ignore les commentaires
    if (/use(Effect|LayoutEffect)\(\s*\(\s*\)\s*=>\s*[^{\s]/.test(code)) {
      bad++
      console.log(`${f}:${i + 1}  corps concis → ${code.trim().slice(0, 80)}`)
    }
  })
}
console.log(bad === 0
  ? `${files.length} fichiers analysés — aucun effet à corps concis.`
  : `${bad} effet(s) à corriger.`)
