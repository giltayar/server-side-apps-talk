import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyFormbody from '@fastify/formbody'
import {createTodoModel} from './model.js'
import {renderTodoMvc} from './views/todomvc.js'
import {renderItem} from './views/item.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = Fastify({
  logger: {formatters: {level: (label) => ({level: label})}},
})

await app.register(fastifyFormbody)
await app.register(fastifyStatic, {
  root: join(__dirname, '..', 'public'),
})
await app.register(fastifyStatic, {
  root: join(__dirname, '..', 'dist'),
  prefix: '/dist/',
  decorateReply: false,
})

const todos = createTodoModel(process.env.DATA_DIR ?? join(__dirname, '..', '.data'))

app.get('/', async (req, reply) => {
  const query = /**@type {{filter?: string}} */ (req.query)
  const filter = query.filter
  const {items, totalCount, completedCount} = await todos.list(filter)

  reply.type('text/html; charset=utf-8')

  return renderTodoMvc(items, {totalCount, completedCount, filter})
})

app.post('/new', async (req, reply) => {
  const body = /**@type {{title?: string, filter?: string}} */ (req.body)
  const title = (body.title ?? '').trim()
  const query = body.filter ? `?filter=${body.filter}` : ''

  if (title) {
    await todos.create({title, notes: ''})
  }
  reply.redirect(`/${query}`, 303)
})

app.post('/delete/:id', async (req, reply) => {
  const body = /**@type {{filter?: string}} */ (req.body)
  const params = /**@type {{id: string}} */ (req.params)
  const id = Number(params.id)
  const query = body.filter ? `?filter=${body.filter}` : ''

  await todos.remove(id)

  reply.redirect(`/${query}`, 303)
})

app.post('/toggle/:id', async (req, reply) => {
  const body = /**@type {{filter?: string}} */ (req.body)
  const params = /**@type {{id: string}} */ (req.params)
  const id = Number(params.id)
  const query = body.filter ? `?filter=${body.filter}` : ''

  const todo = await todos.get(id)

  if (todo) {
    await todos.setCompleted(id, !todo.completed)
  }
  reply.redirect(`/${query}`, 303)
})

app.post('/clear-completed', async (req, reply) => {
  const body = /**@type {{filter?: string}} */ (req.body)
  await todos.clearCompleted()
  const query = body.filter ? `?filter=${body.filter}` : ''

  reply.redirect(`/${query}`, 303)
})

app.get('/delete-all', async (_, reply) => {
  await todos.removeAll()

  reply.redirect('/', 303)
})

app.get('/item/:id', async (req, reply) => {
  const params = /**@type {{id: string}} */ (req.params)
  const id = Number(params.id)
  const todo = await todos.get(id)

  if (!todo) {
    return reply.status(404).send('Not Found')
  }

  reply.type('text/html; charset=utf-8')
  return renderItem(todo)
})

app.post('/item/:id', async (req, reply) => {
  const params = /**@type {{id: string}} */ (req.params)
  const id = Number(params.id)
  const body = /**@type {{title?: string, notes?: string, completed?: string}} */ (req.body)
  const title = (body.title ?? '').trim()
  const notes = (body.notes ?? '').trim()
  const completed = body.completed === 'true'

  if (title) {
    await todos.update(id, {title, notes, completed})
  }

  return reply.redirect('/', 303)
})

app.get('/health', async () => ({}))

const port = Number(process.env.PORT ?? 3000)
await app.listen({port, host: '0.0.0.0'})
