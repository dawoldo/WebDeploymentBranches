// src/server/routes.ts
import { Router, Context, Next } from "https://deno.land/x/oak/mod.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt/mod.ts";
import { DatabaseHandler } from "../database/DatabaseHandler.ts";
import { JWT_KEY } from "./backend.ts";
import { verify, Payload } from "https://deno.land/x/djwt/mod.ts";

const db = new DatabaseHandler();
const router = new Router();

router.post("/login", async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const { username, password } = body;

    if (await db.verifyLogin(username, password)) {
      const permTier = db.getUserPermissions(username);
      const payload = {
        username: username,
        permissionTier: permTier,
        exp: getNumericDate(60 * 60 * 24), // 24 hours
      };

      const token = await create({ alg: "HS256", typ: "JWT" }, payload, JWT_KEY);
      
      // Set cookie with proper CORS settings
      ctx.cookies.set("login-info", token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 1000, // 24 hours in milliseconds
        path: "/",
        sameSite: "lax", // Important for CORS
      });

      ctx.response.status = 200;
      ctx.response.body = { 
        success: true,
        message: "Login successful",
        redirectTo: "/" 
      };
    } else {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid credentials" };
    }
  } catch (e) {
    console.error("Login error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

router.post("/register", async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    const { username, password } = body;

    // Basic validation
    if (!username || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Username and password are required" };
      return;
    }

    await db.addUser(username as string, password as string);
    console.log("User registered:", username);
    
    ctx.response.status = 201;
    ctx.response.body = { 
      success: true,
      message: "User registered successfully" 
    };
  } catch (e) {
    console.error("Registration error:", e);
    ctx.response.status = 400;
    ctx.response.body = { 
      error: e.message || "Registration failed" 
    };
  }
});

router.post("/users", async (ctx: Context) => {
  try {
    const users = db.getAllUsers();
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = { users };
  } catch (error) {
    console.error("Get users error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal Server Error" };
  }
});

// Logout endpoint
router.post("/logout", async (ctx: Context) => {
  ctx.cookies.delete("login-info");
  ctx.response.body = { 
    success: true,
    message: "Logged out successfully" 
  };
});

export async function getPermissionTier(ctx: Context, next: Next) {
  const token = await ctx.cookies.get("login-info");
  if (!token) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Authentication required" };
    return;
  }

  try {
    const payload = await verify(token, JWT_KEY) as Payload;
    const permissionTier = payload.permissionTier;
    ctx.state.permissionTier = permissionTier; // Store permission tier in context state
    await next();
  } catch (error) {
    console.error("Permission verification error:", error);
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid token" };
  }
}

export default router;