const fs = require('node:fs');
const path = require('node:path');
const publicDir = path.join(__dirname, 'public');
const dist = path.join(__dirname, 'dist');
const raw = process.env.SEO_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL);
let origin;
if (raw) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw Error('SEO_SITE_URL must be an HTTPS origin without a path, query or fragment.');
  }
  origin = url.origin;
} else if (process.env.VERCEL_ENV === 'production') {
  throw Error('Enable Vercel system environment variables or set SEO_SITE_URL to the production HTTPS origin.');
}
const verification = process.env.GOOGLE_SITE_VERIFICATION;
if (verification && !/^[A-Za-z0-9_-]+$/.test(verification)) throw Error('Use the Search Console verification token only.');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const meta = (type, name, value) => '<meta ' + type + '="' + name + '" content="' + escape(value) + '">';
const pages = { 'index.html': '/', 'editor.html': '/editor.html', 'save-file-guide.html': '/save-file-guide.html' };
fs.cpSync(publicDir, dist, { recursive: true });
for (const [file, route] of Object.entries(pages)) {
  const target = path.join(dist, file);
  const html = fs.readFileSync(target, 'utf8');
  if (html.split('<!-- site-seo -->').length !== 2) throw Error('Missing SEO marker: ' + file);
  const title = html.match(/<title>([^<]+)<\/title>/)[1].replaceAll('&amp;', '&');
  const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
  const tags = [];
  if (process.env.VERCEL_ENV === 'preview') tags.push(meta('name', 'robots', 'noindex'));
  if (origin) {
    const canonical = origin + route, image = origin + '/assets/share-preview.png';
    tags.push('<link rel="canonical" href="' + escape(canonical) + '">');
    for (const [name, value] of Object.entries({type:'website', site_name:'San Andreas Save Workshop', title, description, url:canonical, image, 'image:width':'1200', 'image:height':'630', 'image:alt':'GTA San Andreas Save Workshop with a verified 100% PC save'})) tags.push(meta('property', 'og:' + name, value));
    tags.push(meta('name', 'twitter:card', 'summary_large_image'));
    for (const [name, value] of Object.entries({title, description, image})) tags.push(meta('name', 'twitter:' + name, value));
    const author = { '@type':'Person', name:'Alex Saifo', url:'https://alex.saifo.se' };
    let schema;
    if (route === '/') schema = { '@type':'WebSite', name:'San Andreas Save Workshop', alternateName:'Save Workshop', url:canonical, inLanguage:'en' };
    if (route === '/editor.html') schema = { '@type':'WebApplication', name:'GTA San Andreas Save Editor', url:canonical, description, applicationCategory:'GameApplication', operatingSystem:'Any', browserRequirements:'Requires JavaScript; optional 3D preview requires WebGL', isAccessibleForFree:true, author, offers:{ '@type':'Offer', price:0, priceCurrency:'USD' } };
    if (route === '/save-file-guide.html') schema = { '@type':'Article', headline:'How to install a GTA San Andreas save on PC', url:canonical, mainEntityOfPage:canonical, description, inLanguage:'en', image, author };
    tags.push('<script type="application/ld+json">' + JSON.stringify({ '@context':'https://schema.org', ...schema }).replaceAll('<','\\u003c') + '</script>');
    if (route === '/' && verification) tags.push(meta('name', 'google-site-verification', verification));
  }
  fs.writeFileSync(target, html.replace('<!-- site-seo -->', tags.join('\n  ')));
}
const sitemap = path.join(dist, 'sitemap.xml');
const robots = path.join(dist, 'robots.txt');
if (origin) {
  const entries = Object.values(pages).map(route => '  <url><loc>' + escape(origin + route) + '</loc></url>').join('\n');
  fs.writeFileSync(sitemap, '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries + '\n</urlset>\n');
} else if (fs.existsSync(sitemap)) fs.unlinkSync(sitemap);
fs.writeFileSync(robots, 'User-agent: *\nAllow: /\n' + (origin ? 'Sitemap: ' + origin + '/sitemap.xml\n' : ''));
console.log(origin ? 'Built dist for ' + origin : 'Built dist for local use without a public domain.');
