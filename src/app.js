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
  const list = await todos.list();

  reply.type("text/html; charset=utf-8");

  return renderTodoMvc(list);
});

app.post("/new", async (req, reply) => {
  const title = (req.body?.title ?? "").trim();
  if (title) {
    await todos.create({ title, notes: "" });
  }
  reply.redirect("/", 303);
});

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
