// gameLoop.ts - Game update logic and main loop

import { gameState, broadcastGameState } from './GameState.ts';
import { TICK_RATE, PLAYER_TIMEOUT, WORLD_WIDTH, WORLD_HEIGHT } from './config.ts';
import { CollisionSystem } from "../game/CollisionSystem.ts";

// Update the game state for a single tick
export function updateGame(): void {
  const now = Date.now();
  
  // Update players
  for (const [id, player] of gameState.players) {
    if (now - player.lastInput > PLAYER_TIMEOUT) {
      gameState.players.delete(id);
      continue;
    }
    player.update();
  }

  // Update enemies
  for (const [id, enemy] of gameState.enemies) {
    enemy.update();
  } 
  
  // Update projectiles
  for (const [id, projectile] of gameState.projectiles) {
    projectile.update();
    
    if (now - projectile.createdAt > 5000 || 
        projectile.x < 0 || projectile.x > WORLD_WIDTH ||
        projectile.y < 0 || projectile.y > WORLD_HEIGHT) {
      gameState.projectiles.delete(id);
    }
  }
  
  // Check for collisions
  const collisions = CollisionSystem.checkProjectilePlayerCollisions(
    gameState.projectiles,
    gameState.players
  );

  for (const collision of collisions) {
    const sprite = ["smiling", "uncarved", "spooky", "neutral"][Math.floor(Math.random() * 4)];
    gameState.projectiles.delete(collision.projectileId);
    let targetedPlayer = gameState.players.get(collision.playerId);
    if (!targetedPlayer) {
      continue;
    }
    else {
      targetedPlayer.sprite = sprite;
    }
  } 
  
  broadcastGameState();
}

// Start the game loop
export function startGameLoop(): void {
    setInterval(updateGame, 1000 / TICK_RATE);
  }