import { join } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

export function createTodoModel(folder) {
  const dataFile = join(folder, 'todos.json')

  async function readAll() {
    try {
      const raw = await readFile(dataFile, 'utf8')
      return JSON.parse(raw)
    } catch (err) {
      if (err.code === 'ENOENT') return []
      throw err
    }
  }

  async function writeAll(todos) {
    await mkdir(folder, { recursive: true })
    await writeFile(dataFile, JSON.stringify(todos, null, 2))
  }

  async function list() {
    return await readAll()
  }

  async function get(id) {
    const todos = await readAll()
    return todos.find((t) => t.id === id)
  }

  async function create({ title, notes }) {
    const todos = await readAll()
    const id = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1
    const todo = { id, title, notes, completed: false }
    todos.push(todo)
    await writeAll(todos)
    return todo
  }

  async function update(id, { title, notes, completed }) {
    const todos = await readAll()
    const i = todos.findIndex((t) => t.id === id)
    if (i === -1) return undefined
    if (title !== undefined) todos[i].title = title
    if (notes !== undefined) todos[i].notes = notes
    if (completed !== undefined) todos[i].completed = completed
    await writeAll(todos)
    return todos[i]
  }

  async function setCompleted(id, completed) {
    return await update(id, { completed })
  }

  async function remove(id) {
    const todos = await readAll()
    const i = todos.findIndex((t) => t.id === id)
    if (i === -1) return false
    todos.splice(i, 1)
    await writeAll(todos)
    return true
  }

  return { list, get, create, update, setCompleted, remove }
}
