FROM denoland/deno:latest

WORKDIR /app

COPY src/backend .

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "server/backend.ts"]