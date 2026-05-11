import vhtml from 'vhtml'
import htm from 'htm'

const html = htm.bind(vhtml)

export function renderItem(todo, errors) {
  return html`
    <div>
      <dialog>
        <section class="todoapp">
          <header class="header">
            <h1>edit item</h1>
          </header>
          <div class="edit-container">
            <form
              class="edit-form"
              hx-post="/item/${todo.id}"
              hx-target="#todo-list-container"
              hx-select="#todo-list-container"
            >
              <label for="title">Title</label>
              <input type="text" id="title" name="title" value="${todo.title}" />

              <label for="notes">Notes</label>
              <input type="text" id="notes" name="notes" value="${todo.notes || ''}" />
              ${errors?.notes ? html`<div class="error">${errors.notes}</div>` : ''}

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
      </dialog>
      <script>
        document.currentScript.previousElementSibling.showModal()
      </script>
    </div>
  `
}
