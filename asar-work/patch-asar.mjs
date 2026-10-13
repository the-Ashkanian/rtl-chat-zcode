import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')

// ZCode install path — change only if ZCode is NOT in Program Files
const ASAR = process.env.ZCODE_ASAR || 'C:/Program Files/ZCode/resources/app.asar'

// Extension folder sits next to this package: rtl-chat-patch/extension
// Works no matter where you extract the zip (no hardcoded username).
const EXT = path.resolve(__dirname, '..', 'extension').replace(/\\/g, '/')

const BACKUP = path.join(__dirname, 'app.asar.bak')
const ORIG_JS = path.join(__dirname, 'index.js.orig')
const PATCHED_JS = path.join(__dirname, 'index.js.patched')

function readHeaderMeta(fd) {
  const b8 = Buffer.alloc(8)
  fs.readSync(fd, b8, 0, 8, 0)
  const headerBufLen = b8.readUInt32LE(4)
  const head = Buffer.alloc(headerBufLen)
  fs.readSync(fd, head, 0, headerBufLen, 8)
  const slen = head.readUInt32LE(4)
  const header = JSON.parse(head.subarray(8, 8 + slen).toString('utf8'))
  return { header, headerBufLen, dataStart: 8 + headerBufLen }
}

function findEntry(header, parts) {
  let cur = header
  for (const p of parts) cur = cur.files[p]
  return cur
}

const sha256 = b => crypto.createHash('sha256').update(b).digest('hex')

// Anchors are matched by shape, not exact name: every ZCode build renames
// the minified variables (Z -> j, as -> po, ...). Regex keeps the patch
// working after updates instead of throwing "anchor missing".
function findRemote(src) {
  const m = src.match(/([A-Za-z_$][\w$]*)\.commandLine\.appendSwitch\("remote-debugging-port","9229"\);/)
  return m ? { appVar: m[1], anchor: m[0] } : null
}

function findReady(src) {
  const m = src.match(/([A-Za-z_$][\w$]*)\.whenReady\(\)\.then\(async\(\)=>\{/)
  return m ? { appVar: m[1], anchor: m[0], index: m.index } : null
}

// The Electron module (defaultSession.loadExtension) is used right inside
// the whenReady callback, so its current name is read from there.
function findSessionVar(src, fromIndex) {
  const window = src.slice(fromIndex, fromIndex + 2000)
  const m = window.match(/([A-Za-z_$][\w$]*)\.defaultSession\./)
  return m ? m[1] : null
}

function freeNewlines(src, need) {
  const chars = [...src]
  let freed = 0
  for (let i = 0; i < chars.length && freed < need; i++) {
    if (chars[i] !== '\n') continue
    let p = i - 1
    while (p >= 0 && (chars[p] === ' ' || chars[p] === '\t' || chars[p] === '\r')) p--
    const prev = p >= 0 ? chars[p] : ''
    let n = i + 1
    while (n < chars.length && (chars[n] === ' ' || chars[n] === '\t' || chars[n] === '\r')) n++
    const next = n < chars.length ? chars[n] : ''
    const prevOk = prev === '' || prev === ';' || prev === '}' || prev === '{' || prev === ',' || prev === ':'
    if (prevOk && next !== '') {
      chars[i] = ''
      for (let j = i + 1; j < n; j++) {
        if (chars[j] === ' ' || chars[j] === '\t' || chars[j] === '\r') chars[j] = ''
        else break
      }
      freed++
    }
  }
  return { text: chars.join(''), freed }
}

function patchSource(src) {
  if (src.includes(EXT) && src.includes('load-extension')) {
    console.log('already patched')
    return src
  }
  const remote = findRemote(src)
  if (!remote) throw new Error('anchor remote missing')
  const ready = findReady(src)
  if (!ready) throw new Error('anchor whenReady missing')
  const sessVar = findSessionVar(src, ready.index)
  if (!sessVar) throw new Error('anchor session missing')
  console.log('app var:', remote.appVar, '| ready var:', ready.appVar, '| session var:', sessVar)
  const injectEarly =
    'try{' + remote.appVar + '.commandLine.appendSwitch("load-extension",' +
    JSON.stringify(EXT) + ')}catch(_rtlE){}'
  const injectReady =
    'try{' + sessVar + '.defaultSession.loadExtension(' +
    JSON.stringify(EXT) + ',{allowFileAccess:!0})}catch(_rtlE){}'
  let out = src.replace(remote.anchor, remote.anchor + injectEarly)
  out = out.replace(ready.anchor, ready.anchor + injectReady)
  return out
}

if (!fs.existsSync(ASAR)) {
  console.error('app.asar not found:', ASAR)
  console.error('If ZCode is elsewhere, set ZCODE_ASAR to the full path of app.asar')
  process.exit(1)
}
if (!fs.existsSync(path.join(EXT, 'manifest.json'))) {
  console.error('extension/manifest.json not found next to this package:', EXT)
  process.exit(1)
}

const fd = fs.openSync(ASAR, 'r')
const { header, headerBufLen, dataStart } = readHeaderMeta(fd)
const entry = findEntry(header, ['out', 'main', 'index.js'])
const size = entry.size
const offset = Number(entry.offset)
const fileAbs = dataStart + offset
const oldHash = entry.integrity?.hash
const original = Buffer.alloc(size)
fs.readSync(fd, original, 0, size, fileAbs)
fs.closeSync(fd)

console.log('ASAR', ASAR)
console.log('EXT ', EXT)
console.log('size', size, 'fileAbs', fileAbs, 'oldHash', String(oldHash).slice(0, 16))
const src = original.toString('utf8')
let patched = patchSource(src)
let buf = Buffer.from(patched, 'utf8')
console.log('after inject', buf.length, 'delta', buf.length - size)

if (buf.length > size) {
  const need = buf.length - size + 8
  const { text, freed } = freeNewlines(patched, need)
  buf = Buffer.from(text, 'utf8')
  console.log('freed newlines', freed, 'now', buf.length, 'delta', buf.length - size)
}

if (buf.length > size) throw new Error('still too long: ' + buf.length)
if (buf.length < size) {
  buf = Buffer.concat([buf, Buffer.alloc(size - buf.length, 0x20)])
}
const newHash = sha256(buf)
console.log('final', buf.length, 'newHash', newHash.slice(0, 16))

const txt = buf.toString('utf8')
console.log('has load-extension', txt.includes('load-extension'))
console.log('has loadExtension', txt.includes('loadExtension'))
console.log('has whenReady', txt.includes('.whenReady()'))
console.log('has appendSwitch remote', txt.includes('remote-debugging-port'))

fs.writeFileSync(ORIG_JS, original)
fs.writeFileSync(PATCHED_JS, buf)
console.log('wrote patched preview')

if (!APPLY) {
  console.log('DRY RUN — add --apply to write')
  process.exit(0)
}

if (!fs.existsSync(BACKUP)) {
  console.log('backup...')
  fs.copyFileSync(ASAR, BACKUP)
}

const wfd = fs.openSync(ASAR, 'r+')
try {
  fs.writeSync(wfd, buf, 0, buf.length, fileAbs)
  if (oldHash && newHash && oldHash.length === newHash.length) {
    const headerBuf = Buffer.alloc(headerBufLen)
    fs.readSync(wfd, headerBuf, 0, headerBufLen, 8)
    const hashBuf = Buffer.from(oldHash, 'ascii')
    const idx = headerBuf.indexOf(hashBuf)
    if (idx < 0) throw new Error('old hash not in header')
    headerBuf.write(newHash, idx, 'ascii')
    fs.writeSync(wfd, headerBuf, 0, headerBufLen, 8)
    console.log('integrity updated @', idx)
  } else {
    throw new Error('hash length mismatch or missing')
  }
} finally {
  fs.closeSync(wfd)
}

const vfd = fs.openSync(ASAR, 'r')
const rb = Buffer.alloc(size)
fs.readSync(vfd, rb, 0, size, fileAbs)
fs.closeSync(vfd)
console.log('readback', rb.equals(buf), sha256(rb).slice(0, 16))
console.log('APPLY DONE')
