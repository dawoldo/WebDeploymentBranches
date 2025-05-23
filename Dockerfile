FROM denoland/deno:latest

WORKDIR /app

COPY src/backend/ .

EXPOSE 8000

CMD ["run", "--allow-net", "--allow-read", "--allow-env", "server/backend.ts"]