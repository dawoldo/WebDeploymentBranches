// src/server/backend.ts
import { Application, Context } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { handleWebSocketConnection } from "./webSocketHandler.ts";
import { startGameLoop } from "./GameLoop.ts";
import { errorHandler, corsMiddleware, authenticate } from "./middlewares.ts";
import router from "./routes.ts";

const PORT = 8000;
export const JWT_KEY = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, true, ["sign", "verify"]);

const app = new Application({
  proxy: true, // Important for handling reverse proxy headers
});

app.use(async (ctx, next) => {
if (ctx.request.method === "OPTIONS") {
  ctx.response.status = 204;
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return;
}
await next();
});

// CORS Configuration - allow both HTTP and HTTPS
app.use(errorHandler);
app.use(oakCors({
  origin: [
    "http://rotmp.cluster-ig3.igpolytech.fr:3000",
    "https://rotmp.cluster-ig3.igpolytech.fr",
    "http://rotmp.cluster-ig3.igpolytech.fr:3000" // For local development
  ],
  credentials: true,
}));

//
// Start game loop
startGameLoop();

// Use routes
app.use(authenticate);
app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (ctx) => {
  if (ctx.request.url.pathname === "/ws") {
    handleWebSocketConnection(ctx);
  }
});

console.log(`🟢 Backend running`);
await app.listen({ port: PORT });
