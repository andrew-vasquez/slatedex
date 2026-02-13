import { Hono } from 'hono'

const app = new Hono()

const PORT = process.env.PORT || 3001;

app.get('/', (c) => {
  console.log(`Hello Hono! on port ${PORT}`)
  return c.text(`Hello Hono! on port ${PORT}`)
})

export default {
  port: PORT,
  fetch: app.fetch,
}
