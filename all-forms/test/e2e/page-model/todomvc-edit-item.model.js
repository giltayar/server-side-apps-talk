export function createTodoMvcEditItemPageModel(page) {
  const root = page.locator('.edit-container')

  return {
    root,
    heading: (locator = page.locator('h1')) => ({locator}),
    titleInput: (locator = root.locator('#title')) => ({locator}),
    notesInput: (locator = root.locator('#notes')) => ({locator}),
    completedCheckbox: (locator = root.locator('#completed')) => ({locator}),
    saveButton: (locator = root.locator('button[type="submit"]')) => ({locator}),
    cancelLink: (locator = root.locator('a', {hasText: 'Cancel'})) => ({locator}),
  }
}
