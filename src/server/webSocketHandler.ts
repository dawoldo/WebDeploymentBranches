// websocketHandler.ts - WebSocket connection handling

import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { gameState, activeConnections, broadcastGameState } from './GameState.ts';
import { Player } from "../game/EntityTypes.ts";
import { WORLD_WIDTH, WORLD_HEIGHT } from './config.ts';
import { burstShot, crossShot } from "../game/ProjectilePatterns.ts";

// Handle new WebSocket connections
export function handleWebSocketConnection(ctx: Context): void {
  if (!ctx.isUpgradable) {
    return;
  }

  const ws = ctx.upgrade();
  const playerId = `player-${Math.random().toString(36).substring(2, 9)}`;
  const sprite = ["smiling", "uncarved", "spooky", "neutral"][Math.floor(Math.random() * 4)];
  
  // Add to active connections
  activeConnections.add(ws);
  
  const player = new Player(playerId,
    Math.random() * (WORLD_WIDTH - 20) + 10,
    Math.random() * (WORLD_HEIGHT - 20) + 10,
    sprite,
    5,
    Date.now(),
    { up: false, down: false, left: false, right: false },
    ws);
        
  gameState.players.set(playerId, player);
  
  ws.onopen = () => {
    console.log(`Player ${playerId} connected`);
    
    // Send welcome message with current game state
    const welcomeMessage = JSON.stringify({
      type: "welcome",
      playerId,
      sprite,
      allPlayers: Array.from(gameState.players.values()).map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        sprite: p.sprite
      })),
      worldSize: { width: WORLD_WIDTH, height: WORLD_HEIGHT }
    });
    
    try {
      ws.send(welcomeMessage);
      // Broadcast to all clients that a new player has joined
      broadcastGameState();
    } catch (e) {
      console.error(`Error sending welcome to ${playerId}:`, e);
    }
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const player = gameState.players.get(playerId);
      
      if (!player) return;
      
      player.lastInput = Date.now();
      
      if (data.type === "input") {
        player.input.up = data.input.up || false;
        player.input.down = data.input.down || false;
        player.input.left = data.input.left || false;
        player.input.right = data.input.right || false;
      }
      
      if (data.type === "shoot") {
        const dx = data.targetX - player.x;
        const dy = data.targetY - player.y;
        const length = Math.hypot(dx, dy);
        
        if (length > 0) {
          burstShot(player.x, player.y, playerId, dx, dy, length, 0.15, 1, gameState);
        }
      }
    } catch (err) {
      console.warn("Invalid message from", playerId, ":", err);
    }
  };
  
  ws.onclose = () => {
    console.log(`Player ${playerId} disconnected`);
    gameState.players.delete(playerId);
    activeConnections.delete(ws);
    broadcastGameState();
  };
  
  ws.onerror = (err) => {
    console.error(`WebSocket error for ${playerId}:`, err);
    gameState.players.delete(playerId);
    activeConnections.delete(ws);
  };
}