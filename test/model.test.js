import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createTodoModel } from '../src/model.js'

async function makeModel(t) {
  const folder = await mkdtemp(join(tmpdir(), 'todo-model-test-'))
  t.after(() => rm(folder, { recursive: true, force: true }))
  return { folder, model: createTodoModel(folder) }
}

describe('todo model', () => {
  it('returns an empty list initially', async (t) => {
    const { model } = await makeModel(t)
    assert.deepEqual(await model.list(), [])
  })

  it('creates a todo with auto-incremented id and completed=false', async (t) => {
    const { model } = await makeModel(t)
    const t1 = await model.create({ title: 'a', notes: 'n1' })
    const t2 = await model.create({ title: 'b', notes: 'n2' })
    assert.deepEqual(t1, { id: 1, title: 'a', notes: 'n1', completed: false })
    assert.deepEqual(t2, { id: 2, title: 'b', notes: 'n2', completed: false })
  })

  it('persists todos across model instances', async (t) => {
    const { folder, model } = await makeModel(t)
    await model.create({ title: 'persisted', notes: '' })
    const fresh = createTodoModel(folder)
    const todos = await fresh.list()
    assert.equal(todos.length, 1)
    assert.equal(todos[0].title, 'persisted')
  })

  it('gets a specific todo by id', async (t) => {
    const { model } = await makeModel(t)
    const created = await model.create({ title: 'find me', notes: '' })
    const found = await model.get(created.id)
    assert.deepEqual(found, created)
  })

  it('returns undefined when getting a non-existent todo', async (t) => {
    const { model } = await makeModel(t)
    assert.equal(await model.get(999), undefined)
  })

  it('updates fields of a todo', async (t) => {
    const { model } = await makeModel(t)
    const todo = await model.create({ title: 'old', notes: 'old' })
    const updated = await model.update(todo.id, { title: 'new', completed: true })
    assert.deepEqual(updated, { id: todo.id, title: 'new', notes: 'old', completed: true })
    assert.deepEqual(await model.get(todo.id), updated)
  })

  it('returns undefined when updating a non-existent todo', async (t) => {
    const { model } = await makeModel(t)
    assert.equal(await model.update(999, { title: 'x' }), undefined)
  })

  it('setCompleted toggles the completed flag', async (t) => {
    const { model } = await makeModel(t)
    const todo = await model.create({ title: 't', notes: '' })
    const done = await model.setCompleted(todo.id, true)
    assert.equal(done.completed, true)
    const undone = await model.setCompleted(todo.id, false)
    assert.equal(undone.completed, false)
  })

  it('removes a todo and returns true', async (t) => {
    const { model } = await makeModel(t)
    const todo1 = await model.create({ title: 'first', notes: '' })
    const todo2 = await model.create({ title: 'second', notes: '' })
    assert.equal(await model.remove(todo1.id), true)
    const remaining = await model.list()
    assert.equal(remaining.length, 1)
    assert.deepEqual(remaining[0], todo2)
  })

  it('returns false when removing a non-existent todo', async (t) => {
    const { model } = await makeModel(t)
    assert.equal(await model.remove(999), false)
  })

  it('continues incrementing ids after a removal', async (t) => {
    const { model } = await makeModel(t)
    const t1 = await model.create({ title: 'a', notes: '' })
    await model.create({ title: 'b', notes: '' })
    await model.remove(t1.id)
    const t3 = await model.create({ title: 'c', notes: '' })
    assert.equal(t3.id, 3)
  })
})
