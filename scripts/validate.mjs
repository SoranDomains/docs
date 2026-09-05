import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import { parse } from 'yaml';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, dirname, extname } from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', '.mintlify']);
async function walk(path) {
  const found = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const p = resolve(path, entry.name);
    if (entry.isDirectory()) found.push(...await walk(p));
    else found.push(p);
  }
  return found;
}
const files = await walk(root);
const pages = files.filter(p => p.endsWith('.mdx'));
const fail = [];
const contents = new Map();
const slug = s => s.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
const anchors = new Map();
for (const p of pages) {
  const source = await readFile(p, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(source);
  if (!match) { fail.push(`${relative(root,p)}: missing frontmatter`); continue; }
  const meta = parse(match[1]);
  if (!meta?.title || !meta?.description) fail.push(`${relative(root,p)}: title/description required`);
  const body = source.slice(match[0].length);
  contents.set(p, body);
  try { await compile(body, { remarkPlugins: [remarkGfm] }); }
  catch (e) { fail.push(`${relative(root,p)}: ${e.message}`); }
  const used = new Map();
  const ids = new Set();
  for (const [, text] of body.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const base = slug(text), count = used.get(base) ?? 0;
    used.set(base,count+1); ids.add(count ? `${base}-${count}` : base);
  }
  anchors.set(p,ids);
}
let checkedLinks = 0;
for (const [p, body] of contents) {
  const noCode = body.replace(/```[\s\S]*?```/g, '');
  const links = [...noCode.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g), ...noCode.matchAll(/href="([^"]+)"/g)];
  for (const [,target] of links) {
    if (/^(https?:|mailto:|tel:)/.test(target)) continue;
    const [path, fragment] = target.split('#');
    const clean = path.split('?')[0];
    let dest = clean ? resolve(clean.startsWith('/') ? root : dirname(p), clean.replace(/^\//,'')) : p;
    if (clean === '/') dest=resolve(root,'index.mdx');
    else if (clean && !extname(dest)) dest += '.mdx';
    try { await stat(dest); } catch { fail.push(`${relative(root,p)}: missing link ${target}`); continue; }
    if (fragment && anchors.has(dest) && !anchors.get(dest).has(decodeURIComponent(fragment))) fail.push(`${relative(root,p)}: missing anchor ${target}`);
    checkedLinks++;
  }
}
const config = JSON.parse(await readFile(resolve(root,'docs.json'),'utf8'));
function navigationPages(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(navigationPages);
  if (value && typeof value === 'object') return Object.entries(value).filter(([key])=>['groups','pages','tabs','anchors','dropdowns'].includes(key)).flatMap(([,v])=>navigationPages(v));
  return [];
}
const nav = navigationPages(config.navigation);
for (const name of nav) if (!contents.has(resolve(root,`${name}.mdx`))) fail.push(`docs.json: missing navigation page ${name}`);
for (const page of pages) if (!nav.includes(relative(root,page).replace(/\.mdx$/,''))) fail.push(`docs.json: unlisted page ${relative(root,page)}`);
const deployment=JSON.parse(await readFile(resolve(root,'reference/deployments/testnet.json'),'utf8'));
if (deployment.status !== 'deployed' || deployment.network !== 'testnet') fail.push('deployment manifest: unexpected release status');
for(const [role,c] of Object.entries(deployment.contracts)) {
  if(!/^C[A-D][A-Z2-7]{54}$/.test(c.id) || !/^[a-f0-9]{64}$/.test(c.wasmHash) || !/^[a-f0-9]{64}$/.test(c.deploymentTransaction) || !Number.isInteger(c.deploymentLedger)) fail.push(`deployment manifest: invalid ${role}`);
  if (!contents.get(resolve(root,'reference/release-status.mdx'))?.includes(c.id)) fail.push(`deployment manifest: ${role} missing in address table`);
}
if(fail.length) { console.error(fail.join('\n')); process.exitCode=1; }
else console.log(`Validated ${pages.length} MDX pages, ${checkedLinks} internal links, navigation and deployment manifest.`);
