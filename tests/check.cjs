const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const web = path.join(root, 'public');
const read = name => fs.readFileSync(path.join(web, name), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json')));
assert.equal(config.framework, null);
assert.equal(config.outputDirectory, 'dist');
assert.equal(config.installCommand, '');
assert.equal(config.buildCommand, 'node build.cjs');

const save = fs.readFileSync(path.join(web, 'downloads/GTASAsf1.b'));
assert.equal(crypto.createHash('sha256').update(save).digest('hex'), '698b6a265339c7ad0d5bca6952d1e1c47eb10697fc01b23616291a4b76e30f1e');
const context = vm.createContext({Uint8Array, DataView});
vm.runInContext(read('assets/data.js') + '\n' + read('assets/engine.js') +
  '\nthis.Engine = SaveFile; this.data = SAVE_DATA;', context);
const file = new context.Engine(save);
assert.equal(file.text(0, 4, 100), 'End Of The Line');
assert.ok(file.checksumValid && file.standardScript);
assert.equal(file.read(16, 0, 'f32'), 187);
assert.equal(file.read(16, 4, 'f32'), 187);
assert.deepEqual(Buffer.from(file.export()), save);

const publicFiles = fs.readdirSync(web, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile()).map(entry => path.relative(web, path.join(entry.parentPath ?? entry.path, entry.name)).replaceAll('\\', '/'));
assert.deepEqual(publicFiles.filter(name => /\.(b|img|dff|txd|dat)$/i.test(name)), ['downloads/GTASAsf1.b']);
assert.ok(!publicFiles.some(name => /(^|\/)assets\.js$/.test(name)));
for (const name of ['index.html','editor.html','save-file-guide.html']) {
  const html = read(name);
  assert.match(html, /href="https:\/\/alex\.saifo\.se"/);
  assert.match(html, /href="downloads\/GTASAsf1\.b" download="GTASAsf1\.b"/);
  assert.doesNotMatch(html, /CJ_ASSET_PACK\s*=|\{\{[A-Z_]+\}\}/);
  for (const [, href] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (/^(?:#|https?:)/.test(href)) continue;
    assert.ok(fs.existsSync(path.join(web, href.split(/[?#]/)[0])), name + ': missing ' + href);
  }
}
console.log('PASS deploy paths, author link, exact 100% save bytes, checksum, and package contents.');

async function checkWardrobe() {
  const pack = fs.readFileSync(path.join(web, 'assets/cj-wardrobe.pack'));
  const handlers = {};
  let requests = 0, navigation;
  const browser = vm.createContext({
    window: {}, save: file, navigate: page => { navigation = page; },
    document: {querySelector: id => ({addEventListener: (_, handler) => { handlers[id] = handler; }})},
    location: {search:''}, URLSearchParams, Response, DecompressionStream,
    fetch: async (url, options) => {
      assert.equal(url, 'assets/cj-wardrobe.pack');
      assert.equal(options, undefined);
      return ++requests === 1 ? new Response(null, {status:503}) : new Response(pack);
    },
  });
  vm.runInContext(read('assets/web-editor.js'), browser);
  assert.equal(requests, 0, 'Wardrobe pack should not load on startup');
  handlers['#open-wardrobe']();
  assert.equal(navigation, 'appearance');
  const load = browser.window.loadCJAssets;
  await assert.rejects(load(), /could not load/);
  const pending = load();
  assert.equal(load(), pending);
  const assets = await pending;
  for (const name of Object.values(context.data.modelNames)) assert.ok(assets.models[name]?.normal, 'Missing model ' + name);
  for (const name of Object.values(context.data.textureNames)) assert.ok(assets.textures[name], 'Missing texture ' + name);
  assert.ok(assets.rules.some(([rule]) => rule === 'SETC'));
  assert.equal(requests, 2);
  assert.match(read('editor.html'), /id="open-wardrobe"/);
  assert.doesNotMatch(read('editor.html'), /wardrobe-import|game-archive/);
  console.log('PASS built-in CJ models and clothes load on demand, recover after a fetch failure, and need no game-file picker.');
}
checkWardrobe().catch(error => { console.error(error); process.exitCode = 1; });
