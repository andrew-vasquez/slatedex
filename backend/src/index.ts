import { Hono } from 'hono'
import { auth } from './lib/auth';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
const app = new Hono();

const PORT = process.env.PORT || 3001;

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get('/', (c) => {
  console.log(`Hello Hono! on port ${PORT}`)
  return c.text(`Hello Hono! on port ${PORT}`)
})

serve(app);

export default {
  port: PORT,
  fetch: app.fetch,
}
