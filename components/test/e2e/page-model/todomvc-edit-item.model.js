export function createTodoMvcEditItemPageModel(page) {
  const dialog = page.locator('dialog')
  const root = dialog.locator('.edit-container')

  return {
    dialog,
    root,
    heading: (locator = dialog.locator('h1')) => ({locator}),
    titleInput: (locator = root.locator('#title')) => ({locator}),
    notesInput: (locator = root.locator('#notes')) => ({locator}),
    notesErrorMessage: (locator = root.locator('.error')) => ({locator}),
    completedCheckbox: (locator = root.locator('#completed')) => ({locator}),
    saveButton: (locator = root.locator('button[type="submit"]')) => ({locator}),
    cancelLink: (locator = root.locator('a', {hasText: 'Cancel'})) => ({locator}),
  }
}
