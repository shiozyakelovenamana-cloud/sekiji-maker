import { Redis } from '@upstash/redis';

const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: Request): Promise<Response> {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (req.method === 'POST') {
    const count = await kv.incr('sekiji:generate_count');
    return new Response(JSON.stringify({ count }), { headers });
  }

  if (req.method === 'GET') {
    const count = (await kv.get<number>('sekiji:generate_count')) ?? 0;
    return new Response(JSON.stringify({ count }), { headers });
  }

  return new Response('Method Not Allowed', { status: 405 });
}

export const config = { runtime: 'edge' };
