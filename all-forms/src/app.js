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

const todos = createTodoModel(process.env.DATA_DIR ?? join(__dirname, '..', '.data'))

app.get('/', async (req, reply) => {
  const query = /**@type {{filter?: string}} */ (req.query)
  const filter = query.filter || 'all'
  const {items, totalCount, completedCount} = await todos.list(filter)

  reply.type('text/html; charset=utf-8')

  return renderTodoMvc(items, {totalCount, completedCount, filter})
})

app.post('/new', async (req, reply) => {
  const body = /**@type {{title?: string}} */ (req.body)
  const title = (body.title ?? '').trim()

  if (title) {
    await todos.create({title, notes: ''})
  }
  reply.redirect('/', 303)
})

app.post('/delete/:id', async (req, reply) => {
  const params = /**@type {{id: string}} */ (req.params)
  const id = Number(params.id)

  await todos.remove(id)

  reply.redirect('/', 303)
})

app.post('/toggle/:id', async (req, reply) => {
  const params = /**@type {{id: string}} */ (req.params)
  const id = Number(params.id)

  const todo = await todos.get(id)

  if (todo) {
    await todos.setCompleted(id, !todo.completed)
  }
  reply.redirect('/', 303)
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
    reply.status(404).send('Not Found')
    return
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

  reply.redirect('/', 303)
})

app.post('/clear-completed', async (_, reply) => {
  await todos.clearCompleted()

  reply.redirect('/', 303)
})

app.get('/health', async () => ({}))

const port = Number(process.env.PORT ?? 3000)
await app.listen({port, host: '127.0.0.1'})
