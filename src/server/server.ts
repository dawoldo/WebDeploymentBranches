import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { handleWebSocketConnection } from './webSocketHandler.ts';
import { startGameLoop } from "./GameLoop.ts";

export const PORT = Number(Deno.args[0] || 3000);
export const HOSTNAME = "0.0.0.0";
export const ROOT = `${Deno.cwd()}/public`;

// Initialize the application

const app = new Application();

// Start the game loop
startGameLoop();

// Request handling middleware
app.use(async (ctx) => {
  if (ctx.request.url.pathname === "/ws") {
    handleWebSocketConnection(ctx);
  } else {
    try {
      await ctx.send({ root: ROOT, index: "index.html" });
    } catch {
      ctx.response.status = 404;
      ctx.response.body = "404 File not found";
    }
  }
});

// Start the server
const options = { port: PORT, hostname: "0.0.0.0" };
console.log(`Game server running on port ${options.port}`);
await app.listen(options);