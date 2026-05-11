import vhtml from 'vhtml'
import htm from 'htm'

const html = htm.bind(vhtml)

export function renderTodoMvc(visibleTodos, {totalCount, completedCount, filter}) {
  const remaining = totalCount - completedCount
  const hasCompleted = completedCount > 0
  const hasTodos = totalCount > 0

  const body = html`
    <body>
      <section class="todoapp">
        <header class="header">
          <h1>todos</h1>
          <${NewTodo} filter=${filter} />
        </header>
        <div id="todo-list-container">
          ${hasTodos
            ? html`
                <section class="main">
                  <${TodoList} todos=${visibleTodos} filter=${filter} />
                </section>
                <footer class="footer">
                  <span class="todo-count">
                    <strong>${remaining ? remaining : 'No'}</strong> ${remaining === 1
                      ? 'item '
                      : 'items '}
                    left
                  </span>
                  <${Filters} filter=${filter} />
                  ${hasCompleted
                    ? html`<form
                        style="display: inline;"
                        action="/clear-completed"
                        method="POST"
                        hx-post="/clear-completed"
                        hx-target="#todo-list-container"
                        hx-select="#todo-list-container"
                        hx-push-url="true"
                      >
                        <input type="hidden" name="filter" value=${filter} />
                        <button class="clear-completed">Clear completed</button>
                      </form>`
                    : ''}
                </footer>
              `
            : ''}
        </div>
      </section>
      <footer class="info">
        <p>
          <a
            href="/delete-all"
            style="font-size: 0.8em; color: inherit; text-decoration: underline; cursor: pointer;"
            >remove all</a
          >
        </p>
        <p>Double-click to edit a todo</p>
        <p>Created by <a href="http://todomvc.com">you</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
      </footer>
      <div id="modal-container" hx-swap-oob="true"></div>
    </body>
  `

  const head = html`
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        name="htmx-config"
        content='{"defaultSwapStyle":"outerHTML", "disableInheritance":true}'
      />
      <title>TodoMVC</title>
      <link rel="stylesheet" href="/todomvc.css" />
      <script src=${`/dist/htmx.min.js`}></script>
    </head>
  `

  return `<!doctype html><html lang="en">${head}${body}</html>`
}

function NewTodo({filter}) {
  return html`<form
    id="new-todo-form"
    action="/new"
    method="POST"
    hx-post="/new"
    hx-target="#todo-list-container"
    hx-select="#todo-list-container"
    hx-push-url="true"
    hx-on:htmx:after-request="if(event.detail.successful) { document.querySelector('#new-todo').value = ''; document.querySelector('#new-todo').focus(); }"
  >
    <input id="new-todo-filter" type="hidden" name="filter" value=${filter} hx-swap-oob="true" />
    <input
      class="new-todo"
      name="title"
      placeholder="What needs to be done?"
      id="new-todo"
      autofocus
    />
  </form>`
}

function TodoList({todos, filter}) {
  return html` <ul class="todo-list">
    ${todos.map((t) => html`<${TodoItem} todo=${t} filter=${filter} />`)}
  </ul>`
}

function TodoItem({todo, filter}) {
  return html`
    <li class=${todo.completed ? 'completed' : ''} id="todo-${todo.id}">
      <div class="view">
        <form
          style="display: inline;"
          action="/toggle/${todo.id}"
          method="POST"
          hx-post="/toggle/${todo.id}"
          hx-target="#todo-list-container"
          hx-select="#todo-list-container"
          hx-push-url="true"
        >
          <input type="hidden" name="filter" value=${filter} />
          <input
            class="toggle"
            type="checkbox"
            onchange="this.closest('form').requestSubmit()"
            ...${todo.completed ? {checked: true} : {}}
          />

          <label
            ><a
              class="title-link"
              hx-get="/item/${todo.id}"
              hx-target="#modal-container"
              hx-swap="innerHTML"
              hx-push-url="false"
              title=${todo.notes ?? ''}
            >
              ${todo.title}
            </a></label
          >
        </form>
        <form
          style="display:inline"
          action="/delete/${todo.id}"
          method="POST"
          hx-post="/delete/${todo.id}"
          hx-target="#todo-list-container"
          hx-select="#todo-list-container"
          hx-push-url="true"
        >
          <input type="hidden" name="filter" value=${filter} />
          <button class="destroy" type="submit"></button>
        </form>
      </div>
    </li>
  `
}

function Filters({filter}) {
  return html`
    <ul class="filters">
      <li>
        <a
          class=${!filter ? 'selected' : ''}
          hx-get="?"
          hx-target="#todo-list-container"
          hx-select="#todo-list-container"
          hx-push-url="true"
          >All</a
        >
      </li>
      <li>
        <a
          class=${filter === 'active' ? 'selected' : ''}
          hx-get="?filter=active"
          hx-target="#todo-list-container"
          hx-select="#todo-list-container"
          hx-push-url="true"
          >Active</a
        >
      </li>
      <li>
        <a
          class=${filter === 'completed' ? 'selected' : ''}
          hx-get="?filter=completed"
          hx-target="#todo-list-container"
          hx-select="#todo-list-container"
          hx-push-url="true"
          >Completed</a
        >
      </li>
    </ul>
  `
}
