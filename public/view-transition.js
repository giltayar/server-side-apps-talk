window.addEventListener("pagereveal", async (e) => {
  if (e.viewTransition) {
    const lastItem = document.querySelector(".todo-list li:last-child");
    const input = document.querySelector(".new-todo");

    // 1. Prepare for the transition: Move name to the list item
    input.style.viewTransitionName = "none";
    lastItem.style.viewTransitionName = "new-todo";

    // 2. Wait for the transition to finish
    await e.viewTransition.finished;

    // 3. Reset for the NEXT todo: Move name back to the input
    lastItem.style.viewTransitionName = "none";
    input.style.viewTransitionName = "new-todo";
  }
});
