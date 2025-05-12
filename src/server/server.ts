import { Application, Context, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { handleWebSocketConnection } from './webSocketHandler.ts';
import { startGameLoop } from "./GameLoop.ts";
import { create, getNumericDate, verify, Header, Payload } from "https://deno.land/x/djwt/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";

export const PORT = Number(Deno.args[0] || 3000);
export const HOSTNAME = "0.0.0.0";
export const PUBLIC_ROOT = `${Deno.cwd()}/public`;

const router = new Router();

// Define the User interface
interface User {
  id: string;
  username: string;
  password: string;
}

const JWT_KEY = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-256" },
  true,
  ["sign", "verify"]
);

// Sample user data
let users: User[] = [
  { id: '0', username: 'admin', password: await hashPassword('admin') },
  { id: '1', username: 'LeZ', password: await hashPassword('LeZ') }
];

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
}

const GAME_PAGE = "/index.html";
const LOGIN_PAGE = "/authentification/login.html";

// Initialize the application

const app = new Application();

// Start the game loop
startGameLoop();

async function authenticate(ctx: Context, next: () => Promise<unknown>) {
  const path = ctx.request.url.pathname;

    if (path === LOGIN_PAGE || path == "/login" || path.endsWith(".js") || path.endsWith(".css")) {
    return next();
  }

  try {
    // Check for the login token
    const token = await ctx.cookies.get("login-info");

    if (!token) {
      // No token, redirect to login page
      console.log("No token");
      return ctx.response.redirect(LOGIN_PAGE);
    }

    // Verify the token
    try {
      // Ensure token is a string before verification
      if (typeof token === "string") {
        const payload = await verify(token, JWT_KEY);
        console.log("Token is valid");
        // Token is valid, proceed
        await next();
      } else {
        console.log("Token is not a string.");
        console.log(token);
        // Token is not a string, redirect to login
        ctx.response.redirect(LOGIN_PAGE);
      }
    } catch (e) {
      // Token is invalid or expired, redirect to login page
      console.log("Invalid or expired token, redirecting to login");
      ctx.response.redirect(LOGIN_PAGE);
    }
  } catch (error) {
    console.error("Authentication error:", error);
    ctx.response.redirect(LOGIN_PAGE);
  }
}

router.post("/login", async (ctx: Context) => {
  const { username, password } = await ctx.request.body().value;

  const user = users.find(u => u.username === username);

  if (user) {

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (passwordIsValid) {
      const payload: Payload = {
        username: user.username,
        exp: getNumericDate(60 * 60 * 24)
      };
  
      const header: Header = {
        alg: "HS256",
        typ: "JWT"
      };
  
      const token = await create(header, payload, JWT_KEY);
  
      ctx.cookies.set("login-info", token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24,
        path: "/",
        secure: false,
      });
  
      ctx.response.status = 200;
      ctx.response.type = "application/json";
      ctx.response.body = { redirectTo: GAME_PAGE };
  
    } else {
      ctx.response.status = 401;
      ctx.response.type = "application/json";
      ctx.response.body = { error: "Invalid credentials" };
    }
  } else {
    ctx.response.status = 401;
    ctx.response.type = "application/json";
    ctx.response.body = { error: "Invalid credentials" };
  }
});

app.use(authenticate)
app.use(router.routes());
app.use(router.allowedMethods());


// Request handling middleware
app.use(async (ctx) => {
  if (ctx.request.url.pathname === "/ws") {
    handleWebSocketConnection(ctx);
  } else {
    try {
      await ctx.send({ root: PUBLIC_ROOT, index: "index.html" });
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