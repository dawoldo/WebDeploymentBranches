import type { Player, Projectile, Collidable } from "./EntityTypes.ts";

export interface CollisionPair {
    projectileId: string;
    playerId: string;
}

export class CollisionSystem {
    /**
     * Checks collisions between projectiles and players
     * @param projectiles Map of Projectile objects
     * @param players Map of Player objects 
     * @returns Array of collision pairs
     */
    static checkProjectilePlayerCollisions( projectiles: Map<string, Projectile>, players: Map<string, Player>): CollisionPair[] {
        const collisions: CollisionPair[] = [];
    
        for (const [projectileId, projectile] of projectiles) {
            for (const [playerId, player] of players) {
                // Skip collision with owner
                if (projectile.ownerId === playerId) continue;

                // First check layer compatibility
                if (!this.shouldCollide(projectile, player)) continue;

            
                if (this.circleCollision(projectile.x, projectile.y, 3, player.x, player.y, 5)) {
                    collisions.push({ projectileId, playerId });
                    break; // Projectile can only hit one player
                }
            }
        }
  
        return collisions;
    }

    private static circleCollision( x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distanceSquared = dx * dx + dy * dy;
        
        // Calculate the squared sum of radii
        const radiusSum = r1 + r2;
        const radiusSumSquared = radiusSum * radiusSum;
        
        // Circles collide if the squared distance is less than or equal to the squared sum of radii
        return distanceSquared <= radiusSumSquared;
    }

    private static shouldCollide(a: Collidable, b: Collidable): boolean {
        return (a.layer & b.collidesWith) !== 0 && (b.layer & a.collidesWith) !== 0;
    }
}  