/**
 * Repair codemod v2 — line-based.
 *
 * Correct target shape:
 *     return (          <- 2-space indented component return
 *       <>              <- fragment open (4 spaces)
 *       ...roots...
 *       </>             <- fragment close (4 spaces)
 *     );
 *
 * v1 bugs it repairs:
 *  - stray "    <>" lines inserted after inner/deep `return (` lines
 *  - component `  return (` left unwrapped while `</>` was added at EOF
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

function tsErrorFiles() {
  let out = '';
  try {
    out = execSync('npx tsc --noEmit --jsx preserve', { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const files = new Set();
  for (const line of out.split('\n')) {
    const m = line.match(/^([^\n()]+?\.tsx)\(\d+,\d+\): error/);
    if (m) files.add(m[1].replace(/\//g, path.sep));
  }
  return [...files];
}

function patch(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const orig = raw.replace(/\r\n/g, '\n'); // normalize CRLF
  let lines = orig.split('\n');
  let changed = false;

  // A) delete stray "    <>" lines NOT directly after a 2-space "  return ("
  for (let i = 1; i < lines.length; i++) {
    if (/^ {4}<>$/.test(lines[i]) && !/^ {2}return \($/.test(lines[i - 1])) {
      lines.splice(i, 1);
      i--;
      changed = true;
    }
  }

  // B) wrap component returns: "  return (" not followed by "    <>" -> insert open
  for (let i = 0; i < lines.length - 1; i++) {
    if (/^ {2}return \($/.test(lines[i]) && !/^ {4}<>/.test(lines[i + 1])) {
      lines.splice(i + 1, 0, '    <>');
      changed = true;
      break; // only the first (component-level) return needs it
    }
  }

  // C) ensure "    </>" exists before the closing "  );" at EOF region
  //    find last "  );" line; if preceding non-empty line isn't "    </>", insert
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^ {2}\);$/.test(lines[i])) {
      const prev = lines[i - 1] ? lines[i - 1].trim() : '';
      if (prev !== '</>') {
        lines.splice(i, 0, '    </>');
        changed = true;
      }
      break;
    }
  }

  const out = lines.join('\n');
  if (out !== orig) {
    fs.writeFileSync(file, out);
    return 'patched';
  }
  return 'no-change';
}

let pass = 0;
while (pass < 4) {
  pass++;
  const files = tsErrorFiles();
  console.log(`pass ${pass}: ${files.length} files with errors`);
  if (files.length === 0) break;
  for (const f of files) {
    const abs = path.isAbsolute(f) ? f : path.join(ROOT, f);
    try {
      console.log('  ', patch(abs), f);
    } catch (e) {
      console.log('   ERR', f, e.message);
    }
  }
}
console.log('done');
