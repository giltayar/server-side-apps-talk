import {test, expect} from '@playwright/test'
import {spawn, type ChildProcess} from 'node:child_process'
import {tmpdir} from 'node:os'
import {setTimeout} from 'node:timers/promises'
import {createTodoMvcPageModel} from './page-model/todomvc-page.model.js'

test.describe('TodoMVC E2E Tests', () => {
  let appProcess: ChildProcess

  test.beforeAll(async () => {
    appProcess = spawnApp()

    await waitForServer()
  })

  test.afterAll(() => {
    appProcess.kill()
  })

  test.beforeEach(async ({request}) => {
    await request.get('http://127.0.0.1:3000/delete-all')
  })

  test('should allow adding new todos', async ({page}) => {
    const todoMvc = createTodoMvcPageModel(page)

    await page.goto('http://127.0.0.1:3000/')

    await todoMvc.newTodoInput().locator.fill('Buy groceries')
    await todoMvc.newTodoInput().locator.press('Enter')

    await expect(todoMvc.todoList().items().locator).toHaveCount(1)
    await expect(todoMvc.todoList().items().item('Buy groceries').locator).toBeVisible()
    await expect(todoMvc.footer().todoCount().locator).toContainText('1 item left')
  })

  test('should allow marking a todo as completed', async ({page}) => {
    const todoMvc = createTodoMvcPageModel(page)

    await page.goto('http://127.0.0.1:3000/')

    await todoMvc.newTodoInput().locator.fill('Cook dinner')
    await todoMvc.newTodoInput().locator.press('Enter')

    const item = todoMvc.todoList().items().item('Cook dinner')
    await item.toggleCheckbox().locator.check()

    await expect(item.locator).toHaveClass(/completed/)
    await expect(todoMvc.footer().todoCount().locator).toContainText('No items left')
  })

  test('should allow deleting a todo', async ({page}) => {
    const todoMvc = createTodoMvcPageModel(page)

    await page.goto('http://127.0.0.1:3000/')

    await todoMvc.newTodoInput().locator.fill('Wash the car')
    await todoMvc.newTodoInput().locator.press('Enter')

    const item = todoMvc.todoList().items().item('Wash the car')
    await item.locator.hover()
    await item.destroyButton().locator.click()

    await expect(todoMvc.todoList().items().locator).toHaveCount(0)
  })

  test('should filter todos', async ({page}) => {
    const todoMvc = createTodoMvcPageModel(page)

    await page.goto('http://127.0.0.1:3000/')

    await todoMvc.newTodoInput().locator.fill('Active Task')
    await todoMvc.newTodoInput().locator.press('Enter')
    await todoMvc.newTodoInput().locator.fill('Completed Task')
    await todoMvc.newTodoInput().locator.press('Enter')

    const completedItem = todoMvc.todoList().items().item('Completed Task')
    await completedItem.toggleCheckbox().locator.check()

    await todoMvc.footer().filters().activeLink().locator.click()
    await expect(todoMvc.todoList().items().locator).toHaveCount(1)
    await expect(todoMvc.todoList().items().locator.first()).toContainText('Active Task')

    await todoMvc.footer().filters().completedLink().locator.click()
    await expect(todoMvc.todoList().items().locator).toHaveCount(1)
    await expect(todoMvc.todoList().items().locator.first()).toContainText('Completed Task')

    await todoMvc.footer().filters().allLink().locator.click()
    await expect(todoMvc.todoList().items().locator).toHaveCount(2)
  })

  test('should clear completed todos', async ({page}) => {
    const todoMvc = createTodoMvcPageModel(page)

    await page.goto('http://127.0.0.1:3000/')

    await todoMvc.newTodoInput().locator.fill('Task 1')
    await todoMvc.newTodoInput().locator.press('Enter')
    await todoMvc.newTodoInput().locator.fill('Task 2')
    await todoMvc.newTodoInput().locator.press('Enter')

    await todoMvc.todoList().items().item('Task 1').toggleCheckbox().locator.check()

    await todoMvc.footer().clearCompletedButton().locator.click()

    await expect(todoMvc.todoList().items().locator).toHaveCount(1)
    await expect(todoMvc.todoList().items().locator.first()).toContainText('Task 2')
  })

  test('should show footer when there are no active todos anymore', async ({page}) => {
    const todoMvc = createTodoMvcPageModel(page)

    await page.goto('http://127.0.0.1:3000/')

    await todoMvc.newTodoInput().locator.fill('Task 1')
    await todoMvc.newTodoInput().locator.press('Enter')

    await expect(todoMvc.footer().locator).toBeVisible()

    await todoMvc.todoList().items().item('Task 1').toggleCheckbox().locator.check()

    await expect(todoMvc.footer().locator).toBeVisible()
  })
})

async function waitForServer() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:3000/health')
      if (res.ok) return
    } catch {
      await setTimeout(100)
    }
  }
  throw new Error('App did not start in time')
}

function spawnApp() {
  return spawn('node', ['src/app.js'], {
    cwd: new URL('../..', import.meta.url),
    env: {...process.env, PORT: '3000', DATA_DIR: tmpdir()},
  })
}
