// src/server/backend.ts
import { Application, Router, Context } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { handleWebSocketConnection } from "./webSocketHandler.ts";
import { startGameLoop } from "./GameLoop.ts";
import { create, getNumericDate, verify, Header, Payload } from "https://deno.land/x/djwt/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";

const PORT = 8000;
const JWT_KEY = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, true, ["sign", "verify"]);

interface User {
  id: string;
  username: string;
  password: string;
}

const users: User[] = [
  { id: '0', username: 'admin', password: await hashPassword('admin') },
  { id: '1', username: 'LeZ', password: await hashPassword('LeZ') }
];

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

const app = new Application();

app.use(oakCors({
  origin: "http://localhost:3000", // Allow requests from the frontend
  credentials: true               // Allow cookies to be sent across origins
}));

app.use(async (ctx, next) => {
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204; // No Content
    return;
  }
  await next();
});


const router = new Router();
startGameLoop();



async function authenticate(ctx: Context, next: () => Promise<unknown>) {
  const path = ctx.request.url.pathname;
  if (path === "/login") return next();

  const token = await ctx.cookies.get("login-info");
  if (!token) return ctx.response.status = 401;

  try {
    await verify(token, JWT_KEY);
    await next();
  } catch {
    ctx.response.status = 401;
  }
}

router.post("/login", async (ctx: Context) => {
  const body = await ctx.request.body.json();
  const { username, password } = body;

  const user = users.find(u => u.username === username);

  if (user && await bcrypt.compare(password, user.password)) {
    const payload: Payload = {
      username: user.username,
      exp: getNumericDate(60 * 60 * 24),
    };

    const token = await create({ alg: "HS256", typ: "JWT" }, payload, JWT_KEY);

    ctx.cookies.set("login-info", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    ctx.response.body = { redirectTo: "/" };
  } else {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid credentials" };
  }
});

app.use(authenticate);
app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (ctx) => {
  if (ctx.request.url.pathname === "/ws") {
    handleWebSocketConnection(ctx);
  }
});

console.log(`🟢 Backend running at http://localhost:${PORT}`);
await app.listen({ port: PORT });
