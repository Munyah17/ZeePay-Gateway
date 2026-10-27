/**
 * One-off codemod: convert <ConfirmDialog .../> JSX (deleted component) to
 * upstream <Modal open .../> equivalent, preserving state vars and handlers.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src', 'app');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name === 'page.tsx') out.push(p);
  }
  return out;
}

// Extract a JSX prop value text ("{expr}" contents or "string" literal)
function prop(props, name) {
  // expression form: name={...} — brace-balanced
  const m = props.match(new RegExp('\\b' + name + '=\\{'));
  if (m) {
    let i = m.index + m[0].length - 1; // at '{'
    let depth = 0;
    for (; i < props.length; i++) {
      if (props[i] === '{') depth++;
      else if (props[i] === '}') {
        depth--;
        if (depth === 0) {
          return { kind: 'expr', text: props.slice(m.index + m[0].length, i) };
        }
      }
    }
  }
  const s = props.match(new RegExp('\\b' + name + '="([^"]*)"'));
  if (s) return { kind: 'lit', text: s[1] };
  return null;
}

const toJsx = (p, fallback) => {
  if (!p) return fallback;
  return p.kind === 'expr' ? `{${p.text}}` : JSON.stringify(p.text);
};
const childrenOf = (p) => (p && p.kind === 'expr' ? `{${p.text}}` : (p ? p.text : ''));

let changed = 0;
for (const f of walk(ROOT)) {
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('<ConfirmDialog')) continue;
  c = c.replace(/<ConfirmDialog([\s\S]*?)\/>/g, (_m, props) => {
    const title = toJsx(prop(props, 'title'), `"Are you sure?"`);
    const message = childrenOf(prop(props, 'message'));
    const label = prop(props, 'confirmLabel');
    const labelTxt = label ? (label.kind === 'expr' ? `{${label.text}}` : label.text) : 'Confirm';
    const tone = (props.match(/\btone="(\w+)"/) || [null, 'danger'])[1];
    const onConfirm = prop(props, 'onConfirm');
    const onCancel = prop(props, 'onCancel');
    const cf = onConfirm ? `{${onConfirm.kind === 'expr' ? onConfirm.text : JSON.stringify(onConfirm.text)}}` : '() => {}';
    const cc = onCancel ? `{${onCancel.kind === 'expr' ? onCancel.text : JSON.stringify(onCancel.text)}}` : '() => {}';
    return (
      `<Modal open title={${title}} onClose=${cc} size="sm" ` +
      `footer={<><button className="btn btn-light btn-sm" onClick=${cc}>Cancel</button>` +
      `<button className="btn btn-${tone} btn-sm" onClick=${cf}>${labelTxt}</button></>}>` +
      `<p className="small mb-0">${message}</p></Modal>`
    );
  });
  // fix imports: ensure Modal present, drop ConfirmDialog remnants
  c = c.replace(/import \{ ConfirmDialog, ToastProvider, toast \} from '@\/components\/ui';/, "import { Modal, useToast } from '@/components/ui';");
  c = c.replace(/import \{ ([^}]*)\bConfirmDialog\b,? ?([^}]*) \} from '@\/components\/ui';/, (m, a, b) => `import { ${(a + b).trim()} } from '@/components/ui';`);
  fs.writeFileSync(f, c);
  changed++;
  console.log('converted:', path.relative(ROOT, f));
}
console.log(`done — ${changed} files`);
