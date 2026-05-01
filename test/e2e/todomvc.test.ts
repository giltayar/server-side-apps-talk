import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTodoMvcPageModel } from './page-model/todomvc-page.model.js';

test.describe('TodoMVC E2E Tests', () => {
  let appProcess: ChildProcess;

  test.beforeAll(async () => {
    // Start the app before all tests
    appProcess = spawn('node', ['src/app.js'], {
      cwd: join(fileURLToPath(import.meta.url), '../../..'),
      stdio: 'ignore',
      env: { ...process.env, PORT: '3000', DATA_DIR: './data-test' }
    });

    // Wait until the server responds
    await waitForServer('http://127.0.0.1:3000/health');
  });

  test.afterAll(() => {
    // Cleanup the process
    appProcess.kill();
  });

  test.beforeEach(async ({ page, request }) => {
    // Clean up all todos before each test to ensure a clean slate
    await request.get('http://127.0.0.1:3000/delete-all');
    await page.goto('http://127.0.0.1:3000/');
  });

  test('should allow adding new todos', async ({ page }) => {
    const todoMvc = createTodoMvcPageModel(page);

    await todoMvc.newTodoInput().locator.fill('Buy groceries');
    await todoMvc.newTodoInput().locator.press('Enter');

    await expect(todoMvc.todoList().items).toHaveCount(1);
    await expect(todoMvc.todoList().item('Buy groceries').locator).toBeVisible();
    await expect(todoMvc.footer().todoCount().locator).toContainText('1 item left');
  });

  test('should allow marking a todo as completed', async ({ page }) => {
    const todoMvc = createTodoMvcPageModel(page);

    await todoMvc.newTodoInput().locator.fill('Cook dinner');
    await todoMvc.newTodoInput().locator.press('Enter');

    const item = todoMvc.todoList().item('Cook dinner');
    await item.toggleCheckbox().locator.check();

    await expect(item.locator).toHaveClass(/completed/);
    await expect(todoMvc.footer().todoCount().locator).toContainText('No items left');
  });

  test('should allow deleting a todo', async ({ page }) => {
    const todoMvc = createTodoMvcPageModel(page);

    await todoMvc.newTodoInput().locator.fill('Wash the car');
    await todoMvc.newTodoInput().locator.press('Enter');

    const item = todoMvc.todoList().item('Wash the car');
    await item.locator.hover();
    await item.destroyButton().locator.click();

    await expect(todoMvc.todoList().items).toHaveCount(0);
  });

  test('should filter todos', async ({ page }) => {
    const todoMvc = createTodoMvcPageModel(page);

    await todoMvc.newTodoInput().locator.fill('Active Task');
    await todoMvc.newTodoInput().locator.press('Enter');
    await todoMvc.newTodoInput().locator.fill('Completed Task');
    await todoMvc.newTodoInput().locator.press('Enter');

    const completedItem = todoMvc.todoList().item('Completed Task');
    await completedItem.toggleCheckbox().locator.check();

    // Check Active filter
    await todoMvc.footer().filters().activeLink().locator.click();
    await expect(todoMvc.todoList().items).toHaveCount(1);
    await expect(todoMvc.todoList().items.first()).toContainText('Active Task');

    // Check Completed filter
    await todoMvc.footer().filters().completedLink().locator.click();
    await expect(todoMvc.todoList().items).toHaveCount(1);
    await expect(todoMvc.todoList().items.first()).toContainText('Completed Task');

    // Check All filter
    await todoMvc.footer().filters().allLink().locator.click();
    await expect(todoMvc.todoList().items).toHaveCount(2);
  });

  test('should clear completed todos', async ({ page }) => {
    const todoMvc = createTodoMvcPageModel(page);

    await todoMvc.newTodoInput().locator.fill('Task 1');
    await todoMvc.newTodoInput().locator.press('Enter');
    await todoMvc.newTodoInput().locator.fill('Task 2');
    await todoMvc.newTodoInput().locator.press('Enter');

    await todoMvc.todoList().item('Task 1').toggleCheckbox().locator.check();

    await todoMvc.footer().clearCompletedButton().locator.click();

    await expect(todoMvc.todoList().items).toHaveCount(1);
    await expect(todoMvc.todoList().items.first()).toContainText('Task 2');
  });
});

async function waitForServer(url: string) {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      await new Promise(r => setTimeout(r, 250));
    }
  }
  throw new Error('App did not start in time');
}
