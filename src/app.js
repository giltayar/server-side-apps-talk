import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyFormbody from '@fastify/formbody'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = Fastify({ logger: true })

await app.register(fastifyFormbody)
await app.register(fastifyStatic, {
  root: join(__dirname, 'public'),
})

app.get('/health', async () => ({}))

const port = Number(process.env.PORT ?? 3000)
await app.listen({ port, host: '0.0.0.0' })
