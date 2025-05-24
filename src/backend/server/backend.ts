// src/server/backend.ts
import { Application, Context } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { handleWebSocketConnection } from "./webSocketHandler.ts";
import { startGameLoop } from "./GameLoop.ts";
import { errorHandler, corsMiddleware, authenticate } from "./middlewares.ts";
import router from "./routes.ts";

const PORT = 8000;
export const JWT_KEY = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, true, ["sign", "verify"]);

const app = new Application();

// Use middlewares
app.use(errorHandler);
app.use(oakCors({
  origin: "https://rotmp.cluster-ig3.igpolytech.fr:3000", // Allow requests from the frontend
  credentials: true,              // Allow cookies to be sent across origins
}));
app.use(corsMiddleware);

// Start game loop
startGameLoop();

// Use routes
app.use(authenticate);
app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (ctx) => {
  if (ctx.request.url.pathname === "/wss") {
    handleWebSocketConnection(ctx);
  }
});

console.log(`🟢 Backend running`);
await app.listen({ port: PORT });
