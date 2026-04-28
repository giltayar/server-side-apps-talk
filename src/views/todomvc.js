import vhtml from 'vhtml'
import htm from 'htm'

const html = htm.bind(vhtml)

export function renderTodoMvc(todos) {
  const remaining = todos.filter((t) => !t.completed).length
  const hasTodos = todos.length > 0
  const hasCompleted = todos.some((t) => t.completed)

  const body = html`
    <body>
      <section class="todoapp">
        <header class="header">
          <h1>todos</h1>
          <input class="new-todo" placeholder="What needs to be done?" autofocus />
        </header>
        ${hasTodos
          ? html`
              <section class="main">
                <input
                  id="toggle-all"
                  class="toggle-all"
                  type="checkbox"
                  ...${remaining === 0 ? { checked: true } : {}}
                />
                <label for="toggle-all">Mark all as complete</label>
                <ul class="todo-list">
                  ${todos.map(
                    (t) => html`
                      <li class=${t.completed ? 'completed' : ''}>
                        <div class="view">
                          <input
                            class="toggle"
                            type="checkbox"
                            ...${t.completed ? { checked: true } : {}}
                          />
                          <label>${t.title}</label>
                          <button class="destroy"></button>
                        </div>
                        <input class="edit" value=${t.title} />
                      </li>
                    `,
                  )}
                </ul>
              </section>
              <footer class="footer">
                <span class="todo-count">
                  <strong>${remaining}</strong> ${remaining === 1 ? 'item' : 'items'} left
                </span>
                <ul class="filters">
                  <li><a class="selected" href="#/">All</a></li>
                  <li><a href="#/active">Active</a></li>
                  <li><a href="#/completed">Completed</a></li>
                </ul>
                ${hasCompleted ? html`<button class="clear-completed">Clear completed</button>` : ''}
              </footer>
            `
          : ''}
      </section>
      <footer class="info">
        <p>Double-click to edit a todo</p>
        <p>Created by <a href="http://todomvc.com">you</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
      </footer>
    </body>
  `

  const head = html`
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>TodoMVC</title>
      <link rel="stylesheet" href="/todomvc-base.css" />
      <link rel="stylesheet" href="/todomvc-app.css" />
    </head>
  `

  return `<!doctype html><html lang="en">${head}${body}</html>`
}
