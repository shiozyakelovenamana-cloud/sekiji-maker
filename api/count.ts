import { Redis } from '@upstash/redis';

const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET(): Promise<Response> {
  const count = (await kv.get<number>('sekiji:generate_count')) ?? 0;
  return new Response(JSON.stringify({ count }), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

export async function POST(): Promise<Response> {
  const count = await kv.incr('sekiji:generate_count');
  return new Response(JSON.stringify({ count }), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}
