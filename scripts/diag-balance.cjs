// Find likely-unbalanced spots: for each file, strip strings/comments then
// walk braces/parens recording line numbers of still-open constructs at EOF.
const fs = require('fs');

const files = process.argv.slice(2);
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  // strip strings, template literals, comments (crude but sufficient here)
  s = s
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

  const lines = s.split('\n');
  const stack = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '{' || ch === '(' || ch === '[') stack.push({ ch, line: i + 1, col: j + 1 });
      else if (ch === '}' || ch === ')' || ch === ']') {
        const want = ch === '}' ? '{' : ch === ')' ? '(' : '[';
        const top = stack[stack.length - 1];
        if (top && top.ch === want) stack.pop();
        else console.log(`${f}:${i + 1}:${j + 1} unbalanced close '${ch}' (stack top: ${top ? top.ch + ' @' + top.line : 'empty'})`);
      }
    }
  }
  if (stack.length) {
    console.log(`${f}: ${stack.length} unclosed constructs:`);
    for (const t of stack.slice(-8)) console.log(`   '${t.ch}' opened at line ${t.line} col ${t.col}`);
  } else {
    console.log(`${f}: balanced`);
  }
}
