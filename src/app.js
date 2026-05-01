import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyFormbody from "@fastify/formbody";
import { createTodoModel } from "./model.js";
import { renderTodoMvc } from "./views/todomvc.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({
  logger: { formatters: { level: (label) => ({ level: label }) } },
});

await app.register(fastifyFormbody);
await app.register(fastifyStatic, {
  root: join(__dirname, "..", "public"),
});

const todos = createTodoModel(
  process.env.DATA_DIR ?? join(__dirname, "..", "data"),
);

app.get("/health", async () => ({}));

app.get("/", async (req, reply) => {
  const filter = req.query.filter || "all";
  const allTodos = await todos.list("all");
  const visibleTodos = await todos.list(filter);

  reply.type("text/html; charset=utf-8");

  return renderTodoMvc(allTodos, visibleTodos, { filter });
});

app.post("/new", async (req, reply) => {
  const title = (req.body?.title ?? "").trim();
  if (title) {
    await todos.create({ title, notes: "" });
  }
  reply.redirect("/", 303);
});

app.post("/delete/:id", async (req, reply) => {
  await todos.remove(Number(req.params.id));
  reply.redirect("/", 303);
});

app.post("/toggle/:id", async (req, reply) => {
  const id = Number(req.params.id);
  const todo = await todos.get(id);
  if (todo) {
    await todos.setCompleted(id, !todo.completed);
  }
  reply.redirect("/", 303);
});

app.get("/delete-all", async (req, reply) => {
  await todos.removeAll();
  reply.redirect("/", 303);
});

app.post("/clear-completed", async (req, reply) => {
  await todos.clearCompleted();
  reply.redirect("/", 303);
});

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
