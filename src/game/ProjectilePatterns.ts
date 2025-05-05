import { Player, CollisionLayer, Projectile } from "./EntityTypes.ts";

const PROJECTILE_SPEED = 10;

export function crossShot(ownerX: number, ownerY: number, ownerId: string , dx: number, dy: number, length: number, gameStateReference: { projectiles: Map<string, Projectile> }) {
    let projectileId = `proj-${Math.random().toString(36).substring(2, 9)}`;
    gameStateReference.projectiles.set(
      projectileId,
      new Projectile(
        projectileId,
        ownerX,
        ownerY,
        "tear",
        dx / length,
        dy / length,
        PROJECTILE_SPEED,
        ownerId,
        Date.now()
      )
    );
  
    projectileId = `proj-${Math.random().toString(36).substring(2, 9)}`
    gameStateReference.projectiles.set(
      projectileId,
      new Projectile(
        projectileId,
        ownerX,
        ownerY,
        "tear",
        -dy / length,
        dx / length,
        PROJECTILE_SPEED,
        ownerId,
        Date.now()
      )
    );
  
    projectileId = `proj-${Math.random().toString(36).substring(2, 9)}`
    gameStateReference.projectiles.set(
      projectileId,
      new Projectile(
        projectileId,
        ownerX,
        ownerY,
        "tear",
        dy / length,
        -dx / length,
        PROJECTILE_SPEED,
        ownerId,
        Date.now()
      )
    );
  
  
    projectileId = `proj-${Math.random().toString(36).substring(2, 9)}`
    gameStateReference.projectiles.set(
      projectileId,
      new Projectile(
        projectileId,
        ownerX,
        ownerY,
        "tear",
        -dx / length,
        -dy / length,
        PROJECTILE_SPEED,
        ownerId,
        Date.now()
      )
    );
  
  }
  // @param spread: écart en degrés (0.15 == 15 degrés)
export function burstShot(ownerX: number, ownerY: number, ownerId: string , dx: number, dy: number, length: number, spread: number, projCount: number, gameStateReference: { projectiles: Map<string, Projectile> }) {
  const baseAngle = Math.atan2(dy, dx);
    
  // Create projectiles in a loop (2*projCount + 1 total projectiles)
  for (let i = -projCount; i <= projCount; i++) {
      const projectileId = `proj-${Math.random().toString(36).substring(2, 9)}`;
      let angle = baseAngle;
      
      // Only apply spread to non-center projectiles
      if (i !== 0) {
          angle += i * spread;
      }
      
      gameStateReference.projectiles.set(
          projectileId,
          new Projectile(
              projectileId,
              ownerX,
              ownerY,
              "bullet",
              Math.cos(angle),
              Math.sin(angle),
              PROJECTILE_SPEED,
              ownerId,
              Date.now()));
  }
}