/**
 * Codemod: replace hand-rolled localStorage persistence with upstream
 * usePersistentState from '@/components/ui' (barrel re-export of
 * '@/lib/store/useCollection').
 *
 * Handles the uniform pattern:
 *   const [x, setX] = useState<T[]>([]);
 *   useEffect(() => { authCheck; try { const saved = localStorage.getItem('k');
 *     setX(saved ? JSON.parse(saved) : seed); } catch { setX(seed); } setLoading(false);
 *   }, [router]);
 *   const persist = (next) => { setX(next); localStorage.setItem(...) };
 *
 * Becomes:
 *   const [x, persist] = usePersistentState<T[]>('key', seed);
 */
const fs = require('fs');

const SPECS = [
  { file: 'src/app/dashboard/api-keys/page.tsx', state: 'keys', seed: 'seedKeys', key: 'api_keys', type: 'ApiKey[]' },
  { file: 'src/app/dashboard/invoices/page.tsx', state: 'invoices', seed: 'seedInvoices', key: 'invoices', type: 'Invoice[]' },
  { file: 'src/app/dashboard/links/page.tsx', state: 'links', seed: 'seedLinks', key: 'payment_links', type: 'PayLink[]' },
  { file: 'src/app/dashboard/webhooks/page.tsx', state: 'webhooks', seed: 'seedWebhooks', key: 'webhooks', type: 'Webhook[]' },
  { file: 'src/app/user/bills/page.tsx', state: 'billList', seed: 'seedBills', key: 'bills', type: 'Bill[]' },
  { file: 'src/app/user/cards/page.tsx', state: 'cards', seed: 'seedCards', key: 'user_cards', type: 'Card[]' },
];

for (const s of SPECS) {
  let c = fs.readFileSync(s.file, 'utf8');
  const orig = c;
  const setter = 'set' + s.state[0].toUpperCase() + s.state.slice(1);

  // 1. import
  if (!c.includes('usePersistentState')) {
    const uiImport = c.match(/import \{[^}]*\} from '@\/components\/ui';/);
    if (uiImport) {
      c = c.replace(uiImport[0], uiImport[0] + "\nimport { usePersistentState } from '@/components/ui';");
    } else {
      throw new Error('no ui import in ' + s.file);
    }
  }

  // 2. state decl -> usePersistentState (keep name 'persist' so call sites are untouched)
  c = c.replace(
    new RegExp('const \\[' + s.state + ', ' + setter + '\\] = useState<' + s.type + '>\\(\\[\\]\\);'),
    'const [' + s.state + ', persist] = usePersistentState<' + s.type + ">('" + s.key + "', " + s.seed + ');',
  );

  // 3. drop the load try/catch inside the auth effect
  c = c.replace(
    new RegExp(
      '\\s*try \\{\\s*const saved = localStorage\\.getItem\\(\'zeepay_' + s.key + "'\\);\\s*" +
        setter + '\\(saved \\? JSON\\.parse\\(saved\\) : ' + s.seed + '\\);\\s*\\} catch \\{\\s*' +
        setter + '\\(' + s.seed + '\\);\\s*\\}',
    ),
    '',
  );

  // 4. drop the persist helper definition
  c = c.replace(
    new RegExp('\\s*const persist = \\(next: ' + s.type + '\\) => \\{\\s*' + setter + '\\(next\\);\\s*try \\{ localStorage\\.setItem\\([^}]*\\}\\s*\\};'),
    '',
  );

  if (c === orig) {
    console.log('NO-CHANGE (verify manually):', s.file);
  } else {
    if (c.includes('localStorage.getItem(\'zeepay_' + s.key)) console.log('  !! leftover getItem in', s.file);
    fs.writeFileSync(s.file, c);
    console.log('migrated:', s.file);
  }
}
console.log('done');
