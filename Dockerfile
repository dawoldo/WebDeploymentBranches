FROM denoland/deno:latest

WORKDIR /app

# Copy all source files
COPY src/frontend/ .
COPY public/ .

EXPOSE 3000

CMD ["deno", "run", "--allow-net", "--allow-read", "frontend.ts"]