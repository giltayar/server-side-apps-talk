import {test, expect} from '@playwright/test'
import {createTodoMvcPageModel} from './page-model/todomvc-page.model.js'
import {createTodoMvcEditItemPageModel} from './page-model/todomvc-edit-item.model.js'
import {setup} from './initialize/setup.js'

test.describe('TodoMVC Edit Item E2E Tests', () => {
  let appProcess

  test.beforeAll(async () => {
    appProcess = await setup(3001)
  })

  test.afterAll(() => {
    appProcess.kill()
  })

  test.beforeEach(async ({request}) => {
    await request.get('http://127.0.0.1:3001/delete-all')
  })

  test('should allow editing an item on the full page and show notes tooltip', async ({page}) => {
    const todoMvc = createTodoMvcPageModel(page)
    const editItemPage = createTodoMvcEditItemPageModel(page)

    await page.goto('http://127.0.0.1:3001/')

    await todoMvc.newTodoInput().locator.fill('Test edit item')
    await todoMvc.newTodoInput().locator.press('Enter')

    const item = todoMvc.todoList().items().item('Test edit item')
    await expect(item.titleLink().locator).toHaveAttribute('title', '')

    // Open the edit item dialog
    await item.titleLink().locator.click()

    // Assert the dialog is open
    await expect(editItemPage.dialog).toBeVisible()
    await expect(editItemPage.heading().locator).toHaveText('edit item')

    // Modify fields
    await editItemPage.titleInput().locator.fill('Edited item title')
    await editItemPage.notesInput().locator.fill('Hover tooltip note text')
    await editItemPage.completedCheckbox().locator.check()

    // Save changes
    await editItemPage.saveButton().locator.click()

    // Dialog should be closed
    await expect(editItemPage.dialog).not.toBeVisible()

    // Assert item has been updated
    const updatedItem = todoMvc.todoList().items().item('Edited item title')
    await expect(updatedItem.locator).toBeVisible()
    await expect(updatedItem.locator).toHaveClass(/completed/)
    await expect(updatedItem.titleLink().locator).toHaveAttribute(
      'title',
      'Hover tooltip note text',
    )
  })

  test('should show validation error when notes are too short', async ({page}) => {
    const todoMvc = createTodoMvcPageModel(page)
    const editItemPage = createTodoMvcEditItemPageModel(page)

    await page.goto('http://127.0.0.1:3001/')

    await todoMvc.newTodoInput().locator.fill('Test validation')
    await todoMvc.newTodoInput().locator.press('Enter')

    await todoMvc.todoList().items().item('Test validation').titleLink().locator.click()

    await expect(editItemPage.dialog).toBeVisible()

    // Enter notes shorter than 4 characters
    await editItemPage.notesInput().locator.fill('ab')
    await editItemPage.saveButton().locator.click()

    // Dialog should remain open with validation error
    await expect(editItemPage.dialog).toBeVisible()
    await expect(editItemPage.notesErrorMessage().locator).toHaveText(
      'Notes must be at least 4 characters long',
    )
  })

  test('should allow cancelling edits to an item', async ({page}) => {
    const todoMvc = createTodoMvcPageModel(page)
    const editItemPage = createTodoMvcEditItemPageModel(page)

    await page.goto('http://127.0.0.1:3001/')

    await todoMvc.newTodoInput().locator.fill('Test cancel edit')
    await todoMvc.newTodoInput().locator.press('Enter')

    await todoMvc.todoList().items().item('Test cancel edit').titleLink().locator.click()

    // Assert the dialog is open
    await expect(editItemPage.dialog).toBeVisible()

    // Modify fields
    await editItemPage.titleInput().locator.fill('Changed title')
    await editItemPage.notesInput().locator.fill('Some notes')
    await editItemPage.completedCheckbox().locator.check()

    // Cancel changes
    await editItemPage.cancelLink().locator.click()

    // Dialog should be closed
    await expect(editItemPage.dialog).not.toBeVisible()

    // Assert item has NOT been updated
    const originalItem = todoMvc.todoList().items().item('Test cancel edit')
    await expect(originalItem.locator).toBeVisible()
    await expect(originalItem.locator).not.toHaveClass(/completed/)
    await expect(originalItem.titleLink().locator).toHaveAttribute('title', '')
  })
})
