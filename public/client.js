const CANVAS = document.getElementById("renderWindow");
const CONTEXT = CANVAS.getContext("2d");
CONTEXT.imageSmoothingEnabled = false;

// Game state - using gameState consistently
const gameState = {
  players: {},
  projectiles: {},
  enemies: {},
  myPlayerId: null,
  worldSize: { width: 700, height: 500 }
};

// Sprites
const SPRITESHEET = new Image();
SPRITESHEET.src = "/projet-web-sprites.png";

const SPRITE_DATA = {
  smiling: { x: 0, y: 10 },
  uncarved: { x: 10, y: 10 },
  spooky: { x: 0, y: 0 },
  neutral: { x: 10, y: 0 },
  brick: { x: 20, y: 0 },
  ladder: { x: 20, y: 0 },
  bullet: { x: 0, y: 20 },
  tear: { x: 10, y: 20 },
};

// Input state
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

// Setup WebSocket
//let ws = new WebSocket(`ws://${location.hostname}:3000/ws`);
let ws = new WebSocket(`ws://localhost:8000/ws`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === "welcome") {
    gameState.myPlayerId = data.playerId;
    gameState.worldSize = data.worldSize || { width: 700, height: 500 };
    
    // Initialize all players with their sprites
    if (data.allPlayers) {
      gameState.players = {};
      for (const player of data.allPlayers) {
        gameState.players[player.id] = {
          x: player.x,
          y: player.y,
          sprite: player.sprite || 'neutral' // Default sprite if not provided
        };
      }
    }
    
    // Set canvas size
    CANVAS.width = gameState.worldSize.width;
    CANVAS.height = gameState.worldSize.height;
    return;
  }
  
  if (data.type === "gameState") {
    // Update players with their sprites
    if (data.players) {
      for (const player of data.players) {
        if (!gameState.players[player.id]) {
          // New player - initialize with sprite
          gameState.players[player.id] = {
            x: player.x,
            y: player.y,
            sprite: player.sprite || 'neutral'
          };
        } else {
          // Existing player - update position and sprite
          gameState.players[player.id].x = player.x;
          gameState.players[player.id].y = player.y;
          if (player.sprite) {
            gameState.players[player.id].sprite = player.sprite;
          }
        }
      }
      
      // Remove disconnected players
      const currentPlayerIds = data.players.map(p => p.id);
      for (const playerId in gameState.players) {
        if (!currentPlayerIds.includes(playerId)) {
          delete gameState.players[playerId];
        }
      }
    }

    if (data.enemies) {
      for (const enemy of data.enemies) {
        if (!gameState.enemies[enemy.id]) {
          // New player - initialize with sprite
          gameState.enemies[enemy.id] = {
            x: enemy.x,
            y: enemy.y,
            sprite: enemy.sprite || 'ladder'
          };
        } else {
          // Existing player - update position and sprite
          gameState.enemies[enemy.id].x = enemy.x;
          gameState.enemies[enemy.id].y = enemy.y;
          if (enemy.sprite) {
            gameState.enemies[enemy.id].sprite = enemy.sprite;
          }
        }
      }
    }
    
    // Update projectiles
    if (data.projectiles) {
      gameState.projectiles = {};
      for (const projectile of data.projectiles) {
        gameState.projectiles[projectile.id] = {
          x: projectile.x,
          y: projectile.y,
          sprite: projectile.sprite || "brick" // Only store what's needed for rendering
        };
      }
    }    
  }
};

ws.onclose = (event) => {
  console.warn("WebSocket closed:", event);
  if (event.code === 1006 || event.code === 1005) {
    // Could indicate auth failure / unexpected disconnect
    alert("Session expired or not logged in. Redirecting to login...");
    window.location.href = "/authentification/login.html";
  } else {
    // Try reconnecting after delay
    setTimeout(connectWebSocket, 1000);
  }
};

// Input handling (unchanged)
document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowUp") keys.up = true;
  if (e.code === "ArrowDown") keys.down = true;
  if (e.code === "ArrowLeft") keys.left = true;
  if (e.code === "ArrowRight") keys.right = true;
  sendInput();
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowUp") keys.up = false;
  if (e.code === "ArrowDown") keys.down = false;
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowRight") keys.right = false;
  sendInput();
});

function sendInput() {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "input",
      input: keys,
    }));
  }
}

// Shooting (unchanged)
CANVAS.addEventListener("click", (e) => {
  if (!gameState.myPlayerId) return;
  
  const rect = CANVAS.getBoundingClientRect();
  const targetX = e.clientX - rect.left;
  const targetY = e.clientY - rect.top;
  
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "shoot",
      targetX,
      targetY,
    }));
  }
});

// Rendering (unchanged but uses gameState)
function render() {
  CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
  
  // Render players with their sprites
  for (const [id, player] of Object.entries(gameState.players)) {
    const sprite = SPRITE_DATA[player.sprite] || SPRITE_DATA.neutral;
    CONTEXT.drawImage(
      SPRITESHEET,
      sprite.x, sprite.y, 10, 10,
      player.x, player.y, 10, 10
    );
    
    // Draw player name
    CONTEXT.fillStyle = id === gameState.myPlayerId ? "#0f0" : "#fff";
    CONTEXT.font = "8px Arial";
    CONTEXT.fillText(id.substring(0, 6), player.x, player.y - 5);
  }

  for (const [id, enemy] of Object.entries(gameState.enemies)) {
    const sprite = SPRITE_DATA[enemy.sprite] || SPRITE_DATA.neutral;
    CONTEXT.drawImage(
      SPRITESHEET,
      sprite.x, sprite.y, 10, 10,
      enemy.x, enemy.y, 10, 10
    );
  }
  
  // Render projectiles
  for (const [id, projectile] of Object.entries(gameState.projectiles)) {
    const spriteInfo = SPRITE_DATA[projectile.sprite];
    CONTEXT.drawImage(
      SPRITESHEET,
      spriteInfo.x, spriteInfo.y, 10, 10,
      projectile.x, projectile.y, 10, 10
    );
  }
  
  requestAnimationFrame(render);
}

// Initialize
CANVAS.width = gameState.worldSize.width;
CANVAS.height = gameState.worldSize.height;
CANVAS.style.border = "5px solid black";

// Start game loop
render();