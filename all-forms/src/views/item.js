import vhtml from 'vhtml'
import htm from 'htm'

const html = htm.bind(vhtml)

export function renderItem(todo) {
  const head = html`
    <head>
      <meta charset="utf-8" />
      <title>Edit Todo</title>
      <link rel="stylesheet" href="/todomvc.css" />
      <style></style>
    </head>
  `

  const body = html`
    <body>
      <section class="todoapp">
        <header class="header">
          <h1>edit item</h1>
        </header>
        <div class="edit-container">
          <form class="edit-form" action="/item/${todo.id}" method="post">
            <label for="title">Title</label>
            <input type="text" id="title" name="title" value="${todo.title}" autofocus />

            <label for="notes">Notes</label>
            <input type="text" id="notes" name="notes" value="${todo.notes || ''}" />

            <label for="completed">
              <input
                type="checkbox"
                id="completed"
                name="completed"
                value="true"
                ...${todo.completed ? {checked: true} : {}}
              />
              Completed
            </label>

            <div class="buttons">
              <button type="submit">Save</button>
              <a
                href="/"
                style="margin-left: 20px; font-size: 20px; text-decoration: none; color: #777;"
                >Cancel</a
              >
            </div>
          </form>
        </div>
      </section>
    </body>
  `

  return `<!doctype html><html lang="en">${head}${body}</html>`
}
