import vhtml from "vhtml";
import htm from "htm";

const html = htm.bind(vhtml);

export function renderTodoMvc(allTodos, visibleTodos, { viewTransitionName, filter = "all" } = {}) {
  const nextViewTransitionName = crypto.randomUUID();
  const remaining = allTodos.filter((t) => !t.completed).length;
  const hasTodos = allTodos.length > 0;
  const hasCompleted = allTodos.some((t) => t.completed);

  const body = html`
    <body>
      <section class="todoapp">
        <header class="header">
          <h1>todos</h1>
          <form method="POST" action="/new">
            <input
              class="new-todo"
              name="title"
              placeholder="What needs to be done?"
              autofocus
              style="view-transition-name: new-todo"
            />
          </form>
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
                  ${visibleTodos.map(
                    (t, i, l) => html`
                      <li class=${t.completed ? "completed" : ""}>
                        <div class="view">
                          <form method="POST" action="/toggle/${t.id}" style="display: inline;">
                            <input
                              class="toggle"
                              type="checkbox"
                              onchange="this.form.submit()"
                              ...${t.completed ? { checked: true } : {}}
                            />
                            <label>${t.title}</label>
                          </form>
                          <form
                            method="POST"
                            action="/delete/${t.id}"
                            style="display:inline"
                          >
                            <button class="destroy"></button>
                          </form>
                        </div>
                        <input
                          class="edit"
                          value=${t.title}
                          style=${i === l.length - 1
                            ? "view-transition-name: new-todo"
                            : ""}
                        />
                      </li>
                    `,
                  )}
                </ul>
              </section>
              <footer class="footer">
                <span class="todo-count">
                  <strong>${remaining}</strong> ${remaining === 1
                    ? "item "
                    : "items "}
                  left
                </span>
                <ul class="filters">
                  <li><a class=${filter === "all" ? "selected" : ""} href="?filter=all">All</a></li>
                  <li><a class=${filter === "active" ? "selected" : ""} href="?filter=active">Active</a></li>
                  <li><a class=${filter === "completed" ? "selected" : ""} href="?filter=completed">Completed</a></li>
                </ul>
                ${hasCompleted
                  ? html`<form method="POST" action="/clear-completed" style="margin: 0; padding: 0; display: inline;">
                           <button class="clear-completed">
                             Clear completed
                           </button>
                         </form>`
                  : ""}
              </footer>
            `
          : ""}
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
      <script
        dangerouslySetInnerHTML=${{
          __html:
            "//history.replaceState(null, '', location.pathname + location.hash);",
        }}
      ></script>
    </body>
  `;

  const head = html`
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>TodoMVC</title>
      <link rel="stylesheet" href="/todomvc-app.css" />
    </head>
  `;

  return `<!doctype html><html lang="en">${head}${body}</html>`;
}
