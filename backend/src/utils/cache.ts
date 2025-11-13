import { createClient } from '@vercel/kv';

export const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Example usage:
// await kv.set('my-key', 'my-value');
// const value = await kv.get('my-key');
// console.log(value);
