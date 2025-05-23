FROM denoland/deno:latest

WORKDIR /app

COPY src/backend/ .

RUN mkdir -p /app/src/backend/database && \
    touch /app/src/backend/database/database.db && \
    chmod 666 /app/src/backend/database/database.db

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "server/backend.ts"]