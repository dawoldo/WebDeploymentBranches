// src/server/routes.ts
import { Router, Context , Next} from "https://deno.land/x/oak/mod.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt/mod.ts";
import { DatabaseHandler } from "../database/DatabaseHandler.ts";
import { JWT_KEY } from "./backend.ts";
import { verify, Payload } from "https://deno.land/x/djwt/mod.ts";

const db = new DatabaseHandler();
const router = new Router();

router.post("/login", async (ctx: Context) => {
  const body = await ctx.request.body.json();
  const { username, password } = body;
  try {
    if (await db.verifyLogin(username, password)) {
      
      const permTier = db.getUserPermissions(username);

      const payload = {
        username: username,
        permissionTier: permTier,
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
  } catch (e) {
    console.error("Login error:", e);
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid username or password" };
  }
});

router.post("/users", (ctx: Context) => {
  try {
    const users = db.getAllUsers();
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = { users };
  } catch (error) {
    console.log(error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal Server Error" };
  }
});

router.post("/register", async (ctx: Context) => {
  const { username, password } = await ctx.request.body.json();

  try {
    await db.addUser(username as string, password as string);
    console.log("added user");
    ctx.response.status = 201;
    ctx.response.body = { message: "User registered successfully" };
  } catch (e) {
    ctx.response.status = 400;
    ctx.response.body = { error: e };
  }

  console.log(db.getAllUsers());
});

export async function getPermissionTier(ctx: Context, next: Next) {
  const token = await ctx.cookies.get("login-info");
  if (!token) {
    ctx.response.status = 401;
    return;
  }

  try {
    const payload = await verify(token, JWT_KEY) as Payload;
    const permissionTier = payload.permissionTier;
    ctx.state.permissionTier = permissionTier; // Store permission tier in context state
    await next();
  } catch {
    ctx.response.status = 401;
  }
}

export default router;
