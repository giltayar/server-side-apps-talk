import {test, expect} from '@playwright/test'
import {setup} from './initialize/setup.js'
import {createTodoMvcPageModel} from './page-model/todomvc-page.model.js'
import {waitForHtmx} from './htmx/wait-for-htmx-settled.js'

test.describe('TodoMVC E2E Tests', () => {
  let appProcess

  test.beforeAll(async () => {
    appProcess = await setup(3000)
  })

  test.afterAll(() => {
    appProcess.kill()
  })

  test.beforeEach(async ({page}) => {
    await page.goto('http://127.0.0.1:3000/delete-all')
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
    await waitForHtmx(page, () => todoMvc.newTodoInput().locator.press('Enter'))
    await todoMvc.newTodoInput().locator.fill('Completed Task')
    await waitForHtmx(page, () => todoMvc.newTodoInput().locator.press('Enter'))

    const completedItem = todoMvc.todoList().items().item('Completed Task')
    await waitForHtmx(page, () => completedItem.toggleCheckbox().locator.check())

    await waitForHtmx(page, () => todoMvc.footer().filters().activeLink().locator.click())
    await expect(todoMvc.todoList().items().locator).toHaveCount(1)
    await expect(todoMvc.todoList().items().locator.first()).toContainText('Active Task')

    await waitForHtmx(page, () => todoMvc.footer().filters().completedLink().locator.click())
    await expect(todoMvc.todoList().items().locator).toHaveCount(1)
    await expect(todoMvc.todoList().items().locator.first()).toContainText('Completed Task')

    await waitForHtmx(page, () => todoMvc.footer().filters().allLink().locator.click())
    await expect(todoMvc.todoList().items().locator).toHaveCount(2)
  })

  test('should clear completed todos', async ({page}) => {
    const todoMvc = createTodoMvcPageModel(page)

    await page.goto('http://127.0.0.1:3000/')

    await todoMvc.newTodoInput().locator.fill('Task 1')
    await waitForHtmx(page, () => todoMvc.newTodoInput().locator.press('Enter'))
    await todoMvc.newTodoInput().locator.fill('Task 2')
    await waitForHtmx(page, () => todoMvc.newTodoInput().locator.press('Enter'))

    await waitForHtmx(page, () =>
      todoMvc.todoList().items().item('Task 1').toggleCheckbox().locator.check(),
    )

    await waitForHtmx(page, () => todoMvc.footer().clearCompletedButton().locator.click())

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

  test('should preserve filter state when toggling, adding, or deleting todos', async ({page}) => {
    const todoMvc = createTodoMvcPageModel(page)

    await page.goto('http://127.0.0.1:3000/')

    // Add initial todos
    await todoMvc.newTodoInput().locator.fill('Task 1')
    await waitForHtmx(page, () => todoMvc.newTodoInput().locator.press('Enter'))
    await todoMvc.newTodoInput().locator.fill('Task 2')
    await waitForHtmx(page, () => todoMvc.newTodoInput().locator.press('Enter'))

    // Apply active filter
    await waitForHtmx(page, () => todoMvc.footer().filters().activeLink().locator.click())
    await expect(todoMvc.todoList().items().locator).toHaveCount(2)

    // Append and keep filter (add)
    await todoMvc.newTodoInput().locator.fill('Task 3')
    await waitForHtmx(page, () => todoMvc.newTodoInput().locator.press('Enter'))
    await expect(todoMvc.todoList().items().locator).toHaveCount(3)
    await expect(todoMvc.footer().filters().activeLink().locator).toHaveClass('selected')

    // Toggle and keep filter (toggle)
    await waitForHtmx(page, () =>
      todoMvc.todoList().items().item('Task 1').toggleCheckbox().locator.check(),
    )
    await expect(todoMvc.todoList().items().locator).toHaveCount(2)
    await expect(todoMvc.footer().filters().activeLink().locator).toHaveClass('selected')

    // Apply completed filter
    await waitForHtmx(page, () => todoMvc.footer().filters().completedLink().locator.click())
    await expect(todoMvc.todoList().items().locator).toHaveCount(1)

    // Delete and keep filter (delete)
    await todoMvc.todoList().items().item('Task 1').locator.hover()
    await waitForHtmx(page, () =>
      todoMvc.todoList().items().item('Task 1').destroyButton().locator.click(),
    )
    await expect(todoMvc.todoList().items().locator).toHaveCount(0)
    await expect(todoMvc.footer().filters().completedLink().locator).toHaveClass('selected')
  })
})
