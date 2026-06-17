import { type NextRequest, NextResponse } from 'next/server';

// Remove Next.js body size cap on this catch-all proxy route
export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL ?? 'http://localhost:3001/api';

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join('/');
  const search = req.nextUrl.search;
  const url = `${API_URL}/${targetPath}${search}`;

  let body: string | undefined;
  const method = req.method;
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      // Use arrayBuffer to avoid Next.js body-size cap on req.text()
      const buf = await req.arrayBuffer();
      body = Buffer.from(buf).toString('utf8');
    } catch {
      body = undefined;
    }
  }

  const headers: Record<string, string> = {};
  if (process.env.API_KEY) {
    headers['X-API-Key'] = process.env.API_KEY;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const upstream = await fetch(url, {
    method,
    headers,
    body,
    redirect: 'manual',
  });

  const responseHeaders: Record<string, string> = {
    'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
  };

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204, headers: responseHeaders });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
