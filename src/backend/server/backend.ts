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


// Special handling for Let's Encrypt challenges
// Use middlewares
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith('/.well-known/acme-challenge/')) {
    ctx.response.headers.set('Strict-Transport-Security', 'max-age=0');
    ctx.response.status = 404; // Or serve the actual challenge if you can
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


app.use(oakCors({
  origin: "https://rotmp.cluster-ig3.igpolytech.fr:3000", // Allow requests from the frontend
  credentials: true,              // Allow cookies to be sent across origins
}));
app.use(corsMiddleware);

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
