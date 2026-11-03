import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * GET /openapi.yaml
 * Serves the machine-readable API spec from a stable URL so codegen
 * tools (openapi-generator, orval, openapi-typescript) and AI coding
 * agents can consume it. docs/openapi.yaml is the single source of truth.
 */
export async function GET() {
  const spec = await readFile(join(process.cwd(), 'docs', 'openapi.yaml'), 'utf8');
  return new Response(spec, {
    headers: {
      'Content-Type': 'application/yaml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
