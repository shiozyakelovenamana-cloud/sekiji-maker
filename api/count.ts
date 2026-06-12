import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'POST') {
    const count = await kv.incr('sekiji:generate_count');
    return res.json({ count });
  }

  if (req.method === 'GET') {
    const count = (await kv.get<number>('sekiji:generate_count')) ?? 0;
    return res.json({ count });
  }

  res.status(405).end();
}
