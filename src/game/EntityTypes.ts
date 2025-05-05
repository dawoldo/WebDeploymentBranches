import { burstShot } from "./ProjectilePatterns.ts";

const WORLD_WIDTH = 700;
const WORLD_HEIGHT = 500;

export enum CollisionLayer {
    PLAYER = 1 << 0,    // Binary: 0001
    PROJECTILE = 1 << 1, // Binary: 0010
}
  
export interface Collidable {
    layer: CollisionLayer;
    collidesWith: CollisionLayer;
}

interface RenderedEntity {
    id: string,
    x: number,
    y: number,
    sprite: string,
    update(): void
}

export class Player implements Collidable, RenderedEntity {
    public layer: CollisionLayer = CollisionLayer.PLAYER;
    public collidesWith: CollisionLayer = CollisionLayer.PROJECTILE;

    constructor(
        public id: string,
        public x: number,
        public y: number,
        public sprite: string,
        public speed: number,
        public lastInput: number = Date.now(),
        public input: { up: boolean; down: boolean; left: boolean; right: boolean;} = { up: false, down: false, left: false, right: false },
        public ws?: WebSocket,
    ) {}

    public update(): void {
        if (this.input.up) this.y = Math.max(0, this.y - this.speed);
        if (this.input.down) this.y = Math.min(WORLD_HEIGHT - 10, this.y + this.speed);
        if (this.input.left) this.x = Math.max(0, this.x - this.speed);
        if (this.input.right) this.x = Math.min(WORLD_WIDTH - 10, this.x + this.speed);
    }
}

export class Enemy implements Collidable, RenderedEntity {
    private gameStateRef: { players: Map<string, Player>; projectiles: Map<string, Projectile> };
    public layer: CollisionLayer = CollisionLayer.PLAYER;
    public collidesWith: CollisionLayer = CollisionLayer.PROJECTILE;


    private targetPlayerId: string | null = null;
    private lastTargetChange: number = 0;
    private lastShotTime: number = 0;
    private readonly targetChangeCooldown: number = 3000; // 3 seconds
    private readonly shootCooldown: number = 2000; // 2 seconds between shots

    constructor(
        public id: string,
        public x: number,
        public y: number,
        public sprite: string,
        gameState: { players: Map<string, Player>; projectiles: Map<string, Projectile> }
    ) {
        this.gameStateRef = gameState;
        this.lastTargetChange = Date.now();
        this.changeTarget(); // Initialize with a target
    }

    private changeTarget(): void {
        const players = Array.from(this.gameStateRef.players.values())

        if (players.length > 0) {
            const randomPlayer = players[Math.floor(Math.random() * players.length)];
            this.targetPlayerId = randomPlayer.id;
            this.lastTargetChange = Date.now();
        } else {
            this.targetPlayerId = null;
        }
    }

    public update(): void {
        const now = Date.now();

        // Change target if cooldown has passed
        if (now - this.lastTargetChange >= this.targetChangeCooldown) {
            this.changeTarget();
        }

        // Shoot if we have a target and shoot cooldown has passed
        if (this.targetPlayerId && now - this.lastShotTime >= this.shootCooldown) {
            this.shootAtTarget();
            this.lastShotTime = now;
        }
    }

    private shootAtTarget(): void {
        const target = this.gameStateRef.players.get(this.targetPlayerId!);
        if (!target) return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const length = Math.hypot(dx, dy);

        if (length > 0) {
            burstShot(
                this.x,
                this.y,
                this.id,
                dx,
                dy,
                length,
                0.2, // spread (0.2 radians ≈ 11.5 degrees)
                1,   // projCount (3 projectiles total)
                this.gameStateRef
            );        
        }
    }
}  
  // Modify your Projectile class to implement Collidable
export class Projectile implements Collidable, RenderedEntity {
    public layer: CollisionLayer = CollisionLayer.PROJECTILE;
    public collidesWith: CollisionLayer = CollisionLayer.PLAYER;

    constructor(
        public id: string,
        public x: number,
        public y: number,
        public sprite: string,
        public dx: number,
        public dy: number,
        public speed: number,
        public ownerId: string,
        public createdAt: number = Date.now(),
    ) {}

    public update(): void {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;    
    }
}

export class HomingProjectile extends Projectile {
    public closestTargetId: string | null = null;
    private homingStrength: number = 0.1;
    private maxRotation: number = Math.PI / 40;
    private gameStateRef: { players: Map<string, Player> };
    private maxDist = 150;

    constructor(
        id: string,
        x: number,
        y: number,
        sprite: string,
        dx: number,
        dy: number,
        speed: number,
        ownerId: string,
        gameState: { players: Map<string, Player> },
    ) {
        super(id, x, y, sprite, dx, dy, speed, ownerId);
        this.gameStateRef = gameState;
        this.findClosestTarget();
    }

    public update() {
        this.updateHoming();
        super.update(); // Use parent class movement logic
    }

    private updateHoming() {
        // Find closest enemy player if we don't have a target
        this.findClosestTarget();

        // Gradually adjust direction toward target
        if (this.closestTargetId) {
            const target = this.gameStateRef.players.get(this.closestTargetId);
            if (target) {
                this.adjustDirection(target);
            }
        }
    }

    private findClosestTarget() {
        let closestDist = Infinity;
        
        for (const [id, player] of this.gameStateRef.players) {
            // Skip owner 
            if (id === this.ownerId) continue;

            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist < closestDist) {
                closestDist = dist;
                this.closestTargetId = id;
            }
        }
    }

    private adjustDirection(target: Player) {
        const targetDx = target.x - this.x;
        const targetDy = target.y - this.y;
        const targetDist = Math.hypot(targetDx, targetDy);
        
        if (targetDist > 0 && targetDist < this.maxDist) {
            const desiredDx = targetDx / targetDist;
            const desiredDy = targetDy / targetDist;
            
            const currentAngle = Math.atan2(this.dy, this.dx);
            const desiredAngle = Math.atan2(desiredDy, desiredDx);
            let angleDiff = desiredAngle - currentAngle;
            
            // Normalize angle to shortest rotation
            angleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;

            if (Math.abs(angleDiff) > Math.PI/1.5) {
                return; // Maintain current direction
            }
    
            
            const rotation = Math.sign(angleDiff) * Math.min(this.maxRotation, Math.abs(angleDiff) * this.homingStrength);
            
            this.dx = Math.cos(currentAngle + rotation);
            this.dy = Math.sin(currentAngle + rotation);
        }
    }
}  
