import { Application } from "https://deno.land/x/oak/mod.ts";
import { send } from "https://deno.land/x/oak/send.ts";

const PORT = parseInt(Deno.env.get("PORT") || "3000");
const HOSTNAME = Deno.env.get("HOST") || "0.0.0.0";

const app = new Application();

app.use(async (ctx) => {
  try {
    await send(ctx, ctx.request.url.pathname, {
      root: `${Deno.cwd()}`,
      index: "index.html",
    });
  } catch (error) {
    console.error("Send error:", error);
    // Fallback to index.html for SPA routing
    try {
      await send(ctx, 
        "/index.html", {
        root: Deno.cwd(),
      });
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
      ctx.response.status = 500;
      ctx.response.body = "Internal Server Error";
    }
  }
  
});

console.log(`🟢 Frontend running on ${HOSTNAME}:${PORT}`);
await app.listen({ hostname: HOSTNAME, port: PORT });