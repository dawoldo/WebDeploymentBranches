import { Player, Projectile, Enemy } from "../game/EntityTypes.ts";

// Game state
export const gameState = {
  players: new Map<string, Player>(),
  projectiles: new Map<string, Projectile>(),
  enemies: new Map<string, Enemy>(),
  lastUpdate: Date.now()
};

// Track all active connections
export const activeConnections = new Set<WebSocket>();

// Broadcast the current game state to all connected clients
export function broadcastGameState(): void {
  const state = {
    type: "gameState",
    players: Array.from(gameState.players.values()).map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      sprite: p.sprite
    })),
    enemies: Array.from(gameState.enemies.values()).map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      sprite: p.sprite
    })),
    projectiles: Array.from(gameState.projectiles.values()).map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      sprite: p.sprite
    })),
    timestamp: Date.now(),
  };
  
  const message = JSON.stringify(state);
  
  // Send to all active connections
  for (const ws of activeConnections) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (e) {
        console.error("Error sending to connection:", e);
        activeConnections.delete(ws);
      }
    }
  }
}