// src/server/middlewares.ts
import { Context, Next } from "https://deno.land/x/oak/mod.ts";
import { verify } from "https://deno.land/x/djwt/mod.ts";
import { JWT_KEY } from "./backend.ts";

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    console.error("Unhandled error:", err);
    ctx.response.status = 500;
    ctx.response.body = { message: "Something went wrong" };
  }
}

export async function corsMiddleware(ctx: Context, next: Next) {
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204; // No Content
    return;
  }
  await next();
}

export async function authenticate(ctx: Context, next: Next) {
  const path = ctx.request.url.pathname;
  if (path === "/login" || path === "/register") return next();

  const token = await ctx.cookies.get("login-info");
  if (!token) {
    ctx.response.status = 401;
    return;
  }

  try {
    await verify(token, JWT_KEY);
    await next();
  } catch {
    ctx.response.status = 401;
  }
}
