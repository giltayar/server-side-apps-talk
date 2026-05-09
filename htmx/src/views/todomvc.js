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
          <form
            id="new-todo-form"
            action="/new"
            method="POST"
            hx-post="/new"
            hx-target="#todo-list-container"
            hx-select="#todo-list-container"
            hx-push-url="true"
            hx-on:htmx:after-request="if(event.detail.successful) { document.querySelector('#new-todo').value = ''; document.querySelector('#new-todo').focus(); }"
          >
            <input
              id="new-todo-filter"
              type="hidden"
              name="filter"
              value=${filter}
              hx-swap-oob="true"
            />
            <input
              class="new-todo"
              name="title"
              placeholder="What needs to be done?"
              id="new-todo"
              autofocus
            />
          </form>
        </header>
        <div id="todo-list-container">
          ${hasTodos
            ? html`
                <section class="main">
                  <ul class="todo-list">
                    ${visibleTodos.map(
                      (t) => html`
                        <li class=${t.completed ? 'completed' : ''} id="todo-${t.id}">
                          <div class="view">
                            <form
                              style="display: inline;"
                              action="/toggle/${t.id}"
                              method="POST"
                              hx-post="/toggle/${t.id}"
                              hx-target="#todo-list-container"
                              hx-select="#todo-list-container"
                              hx-push-url="true"
                            >
                              <input type="hidden" name="filter" value=${filter} />
                              <input
                                class="toggle"
                                type="checkbox"
                                onchange="this.closest('form').requestSubmit()"
                                ...${t.completed ? {checked: true} : {}}
                              />

                              <label
                                ><a
                                  class="title-link"
                                  hx-get="/item/${t.id}"
                                  hx-target="#modal-container"
                                  hx-swap="innerHTML"
                                  hx-push-url="false"
                                  title=${t.notes ?? ''}
                                >
                                  ${t.title}
                                </a></label
                              >
                            </form>
                            <form
                              style="display:inline"
                              action="/delete/${t.id}"
                              method="POST"
                              hx-post="/delete/${t.id}"
                              hx-target="#todo-list-container"
                              hx-select="#todo-list-container"
                              hx-push-url="true"
                            >
                              <input type="hidden" name="filter" value=${filter} />
                              <button
                                class="destroy"
                                hx-post="/delete/${t.id}"
                                hx-target="#todo-list-container"
                                hx-select="#todo-list-container"
                                hx-push-url="true"
                              ></button>
                            </form>
                          </div>
                        </li>
                      `,
                    )}
                  </ul>
                </section>
                <footer class="footer">
                  <span class="todo-count">
                    <strong>${remaining ? remaining : 'No'}</strong> ${remaining === 1
                      ? 'item '
                      : 'items '}
                    left
                  </span>
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
      <meta name="htmx-config" content='{"defaultSwapStyle":"outerHTML", "disableInheritance":true}' />
      <title>TodoMVC</title>
      <link rel="stylesheet" href="/todomvc.css" />
      <script src=${`/dist/htmx.min.js`}></script>
    </head>
  `

  return `<!doctype html><html lang="en">${head}${body}</html>`
}
