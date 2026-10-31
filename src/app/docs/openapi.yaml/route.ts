import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Serves the OpenAPI spec from docs/openapi.yaml in the repo root.
 * Reading at request time keeps the served copy in sync — no duplicate.
 */
export async function GET() {
  try {
    const spec = await readFile(join(process.cwd(), 'docs', 'openapi.yaml'), 'utf8');
    return new NextResponse(spec, {
      headers: {
        'content-type': 'text/yaml; charset=utf-8',
        'cache-control': 'no-cache',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
  }
}
