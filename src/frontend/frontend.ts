// src/server/frontend.ts
import { Application } from "https://deno.land/x/oak/mod.ts";
import { send } from "https://deno.land/x/oak/send.ts";

const PORT = 3000;
const app = new Application();

app.use(async (ctx) => {
  await send(ctx, ctx.request.url.pathname, {
    root: `${Deno.cwd()}/`,
    index: "index.html",
  });
});

console.log(`🟢 Frontend running at http://localhost:${PORT}`);
await app.listen({ port: PORT });
