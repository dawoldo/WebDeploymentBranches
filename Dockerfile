FROM denoland/deno:latest

WORKDIR /app

# Copy frontend files
COPY src/frontend/ .

EXPOSE 3000
    
CMD ["run", "--allow-net", "--allow-read", "--allow-env", "frontend.ts"]  # Simplified path