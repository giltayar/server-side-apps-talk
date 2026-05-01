export function createTodoMvcPageModel(page) {
  const root = page.locator('.todoapp')

  return {
    root,
    newTodoInput: (locator = root.locator('.new-todo')) => ({locator}),
    toggleAll: (locator = root.locator('.toggle-all')) => ({locator}),
    todoList: (locator = root.locator('.todo-list')) => {
      const items = locator.locator('li')
      return {
        locator,
        items: () => ({
          locator: items,
          item: (title) => {
            const itemLocator = items.filter({hasText: title})
            return {
              locator: itemLocator,
              toggleCheckbox: (toggleLocator = itemLocator.locator('.toggle')) => ({
                locator: toggleLocator,
              }),
              label: (labelLocator = itemLocator.locator('label')) => ({locator: labelLocator}),
              titleLink: (linkLocator = itemLocator.locator('.title-link')) => ({
                locator: linkLocator,
              }),
              destroyButton: (btnLocator = itemLocator.locator('.destroy')) => ({
                locator: btnLocator,
              }),
              editInput: (editLocator = itemLocator.locator('.edit')) => ({locator: editLocator}),
            }
          },
        }),
      }
    },
    footer: (locator = root.locator('.footer')) => ({
      locator,
      todoCount: (countLocator = locator.locator('.todo-count')) => ({locator: countLocator}),
      filters: (filtersLocator = locator.locator('.filters')) => ({
        locator: filtersLocator,
        allLink: (linkLocator = filtersLocator.locator('a', {hasText: 'All'})) => ({
          locator: linkLocator,
        }),
        activeLink: (linkLocator = filtersLocator.locator('a', {hasText: 'Active'})) => ({
          locator: linkLocator,
        }),
        completedLink: (linkLocator = filtersLocator.locator('a', {hasText: 'Completed'})) => ({
          locator: linkLocator,
        }),
      }),
      clearCompletedButton: (btnLocator = locator.locator('.clear-completed')) => ({
        locator: btnLocator,
      }),
    }),
  }
}
