// Main GameManager Class and all game logic

const GAME_WIDTH = 640;
const GAME_HEIGHT = 400;

// Key code mappings for movement
const KEY_LEFT = 'ArrowLeft';
const KEY_RIGHT = 'ArrowRight';
const KEY_UP = 'ArrowUp';
const KEY_DOWN = 'ArrowDown';
const KEY_SHOOT1 = ' ';
const KEY_SHOOT2 = 'z';

// --- Sprite configuration for player ---
// Sprite sheet: https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/6f1edf47-be71-4c38-9203-26202e227b0a/library/Terminator_1753857454970.png
const PLAYER_SPRITE_URL = "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/6f1edf47-be71-4c38-9203-26202e227b0a/library/Terminator_1753857454970.png";
// Sprite sheet details (assume 4 frames horizontally, 1 row, frame size 42x54, background transparent)
const PLAYER_FRAME_WIDTH = 42;
const PLAYER_FRAME_HEIGHT = 54;
const PLAYER_ANIMATION_FRAMES = 4;
const PLAYER_ANIMATION_SPEED = 6; // frames per animation step

// Scale factor for rendering the player (adjust this to make the image smaller)
const PLAYER_SCALE = 0.7; // 70% size

// === BACKGROUND IMAGE URL ===
const BACKGROUND_IMAGE_URL = "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/6f1edf47-be71-4c38-9203-26202e227b0a/library/Term_1_1753857921658.png";
let backgroundImage = null;
let backgroundImageLoaded = false;
(function preloadBackgroundImage() {
    backgroundImage = new window.Image();
    backgroundImage.src = BACKGROUND_IMAGE_URL;
    backgroundImage.onload = () => { backgroundImageLoaded = true; };
})();

let playerSpriteImage = null;
let playerSpriteLoaded = false;
(function preloadPlayerSprite() {
    playerSpriteImage = new window.Image();
    playerSpriteImage.src = PLAYER_SPRITE_URL;
    playerSpriteImage.onload = () => { playerSpriteLoaded = true; };
})();

class Player {
    constructor(x, y) {
        // Use scaled width/height for positioning and collision
        this.width = PLAYER_FRAME_WIDTH * PLAYER_SCALE;
        this.height = PLAYER_FRAME_HEIGHT * PLAYER_SCALE;
        this.x = x;
        this.y = y;
        this.speed = 3.5;
        this.bullets = [];
        this.shootCooldown = 0;
        this.lives = 3;
        this.invincible = 0;
        this.score = 0;

        // Animation state
        this.animFrame = 0;
        this.animCounter = 0;
    }

    move(dx, dy) {
        this.x = clamp(this.x + dx, 0, GAME_WIDTH - this.width);
        this.y = clamp(this.y + dy, 0, GAME_HEIGHT - this.height);
    }

    shoot() {
        if (this.shootCooldown <= 0) {
            // Center bullet
            this.bullets.push(new Bullet(this.x + this.width, this.y + this.height / 2 - 3, 8, 0));
            this.shootCooldown = 10;
        }
    }

    update() {
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.invincible > 0) this.invincible--;
        // Update bullets
        this.bullets.forEach(b => b.update());
        this.bullets = this.bullets.filter(b => b.x < GAME_WIDTH + 20 && !b.dead);

        // Animate
        if (playerSpriteLoaded) {
            this.animCounter++;
            if (this.animCounter >= PLAYER_ANIMATION_SPEED) {
                this.animCounter = 0;
                this.animFrame = (this.animFrame + 1) % PLAYER_ANIMATION_FRAMES;
            }
        }
    }

    render(ctx) {
        // Flicker if invincible
        if (this.invincible % 6 < 3) {
            if (playerSpriteLoaded) {
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    playerSpriteImage,
                    this.animFrame * PLAYER_FRAME_WIDTH, 0,
                    PLAYER_FRAME_WIDTH, PLAYER_FRAME_HEIGHT,
                    this.x, this.y,
                    PLAYER_FRAME_WIDTH * PLAYER_SCALE, PLAYER_FRAME_HEIGHT * PLAYER_SCALE
                );
                ctx.restore();
            } else {
                // Fallback: simple placeholder if image not loaded yet
                ctx.save();
                ctx.fillStyle = "#bbb";
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.restore();
            }
        }

        // Draw bullets
        this.bullets.forEach(b => b.render(ctx));
    }
}

// (The rest of the file remains unchanged...)

class Bullet {
    constructor(x, y, speed, vy) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.speed = speed;
        this.vy = vy || 0;
        this.color = '#f33';
        this.dead = false;
    }

    update() {
        this.x += this.speed;
        this.y += this.vy;
        if (this.x > GAME_WIDTH + 16) this.dead = true;
    }

    render(ctx) {
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Laser trail
        ctx.save();
        ctx.strokeStyle = '#b12';
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        ctx.restore();
    }

    getRect() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}

class Enemy {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.width = 38;
        this.height = 52;
        this.speed = speed;
        this.color = '#6c6c6c';
        this.dead = false;
        this.shootTimer = getRandomInt(80, 200);
        this.bullets = [];
    }

    update() {
        this.x -= this.speed;
        // Enemy shooting
        if (this.shootTimer > 0) {
            this.shootTimer--;
        } else {
            this.bullets.push(new EnemyBullet(this.x, this.y + this.height / 2, -6));
            this.shootTimer = getRandomInt(100, 180);
        }
        // Remove if offscreen
        if (this.x < -this.width) this.dead = true;

        this.bullets.forEach(b => b.update());
        this.bullets = this.bullets.filter(b => b.x > -20 && !b.dead);
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // === T-3000 Endoskeleton (stylized, right-facing, metallic, blue-gray, menacing) ===

        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.ellipse(19, 49, 15, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
        ctx.restore();

        // LEGS
        ctx.save();
        ctx.strokeStyle = '#7fb6c7';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        // Left leg
        ctx.beginPath();
        ctx.moveTo(16, 38);
        ctx.lineTo(13, 50);
        ctx.stroke();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(22, 38);
        ctx.lineTo(25, 51);
        ctx.stroke();
        // Joints
        ctx.save();
        ctx.fillStyle = '#d2f4ff';
        ctx.beginPath();
        ctx.arc(13, 50, 2, 0, Math.PI * 2);
        ctx.arc(25, 51, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore();

        // FEET
        ctx.save();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(12, 53, 4, 2, 0, 0, Math.PI * 2);
        ctx.ellipse(25, 54, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // TORSO
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(14, 20);
        ctx.lineTo(25, 20);
        ctx.lineTo(28, 39);
        ctx.lineTo(11, 39);
        ctx.closePath();
        ctx.fillStyle = '#7fb6c7';
        ctx.shadowColor = '#9fd7ee';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.restore();

        // Spine (central line)
        ctx.save();
        ctx.strokeStyle = '#d2f4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(19.5, 21);
        ctx.lineTo(18.5, 39);
        ctx.stroke();
        ctx.restore();

        // ARMS
        ctx.save();
        ctx.strokeStyle = '#7fb6c7';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        // Left arm (back: holding gun)
        ctx.beginPath();
        ctx.moveTo(12, 23);
        ctx.lineTo(3, 33);
        ctx.stroke();
        // Right arm (front)
        ctx.beginPath();
        ctx.moveTo(27, 23);
        ctx.lineTo(36, 30);
        ctx.stroke();
        // Elbow joints
        ctx.save();
        ctx.fillStyle = '#d2f4ff';
        ctx.beginPath();
        ctx.arc(3, 33, 2, 0, Math.PI * 2);
        ctx.arc(36, 30, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore();

        // Forearm blade (T-3000 has morphing blade-arms)
        ctx.save();
        ctx.strokeStyle = '#aef6ff';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#5ffbff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(36, 30);
        ctx.lineTo(44, 23);
        ctx.stroke();
        ctx.restore();

        // CHEST glowing core
        ctx.save();
        ctx.beginPath();
        ctx.arc(19, 28, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00eaff';
        ctx.shadowColor = '#00eaff';
        ctx.shadowBlur = 16;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.restore();

        // HEAD
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(19, 12, 8, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#7fb6c7';
        ctx.shadowColor = '#aef6ff';
        ctx.shadowBlur = 7;
        ctx.globalAlpha = 0.96;
        ctx.fill();
        ctx.restore();

        // Face (angular jaw, stylized)
        ctx.save();
        ctx.strokeStyle = '#d2f4ff';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(14, 17);
        ctx.lineTo(18, 19);
        ctx.lineTo(24, 17);
        ctx.stroke();
        ctx.restore();

        // Eyes (red, robotic, T-3000 style)
        ctx.save();
        ctx.beginPath();
        ctx.arc(16.5, 13, 1.5, 0, Math.PI * 2);
        ctx.arc(21.5, 13, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#f33';
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 9;
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.restore();

        // Cheek/face highlight
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(24, 10, 2.1, 1.2, 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.12;
        ctx.fill();
        ctx.restore();

        // Extra: nanite "shimmer" overlay on chest (faint animated shimmer)
        ctx.save();
        ctx.beginPath();
        let shimmerY = 23 + Math.sin((performance.now() / 220) + this.x) * 4;
        ctx.ellipse(19, shimmerY, 7, 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.12;
        ctx.fill();
        ctx.restore();

        ctx.restore();

        this.bullets.forEach(b => b.render(ctx));
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class EnemyBullet {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.speed = speed;
        this.color = '#aef';
        this.dead = false;
    }

    update() {
        this.x += this.speed;
        if (this.x < -16) this.dead = true;
    }

    render(ctx) {
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Laser trail
        ctx.save();
        ctx.strokeStyle = '#bbe';
        ctx.globalAlpha = 0.32;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 12, this.y);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        ctx.restore();
    }

    getRect() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = getRandomInt(1, 3);
        this.color = color;
        this.dx = getRandomInt(-2, 2);
        this.dy = getRandomInt(-2, 2);
        this.life = getRandomInt(16, 28);
    }
    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.life--;
    }
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / 28);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class GameManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.state = 'menu'; // menu, playing, gameover
        this.player = new Player(60, GAME_HEIGHT / 2 - 18);
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.spawnTimer = 0;
        this.keys = {};
        this.frame = 0;
        this.highScore = 0;
        this.lastBgX = 0;
        this.bgScroll = 0;
        this.menuDiv = null;
        this.initInput();
        this.render(); // Start rendering immediately
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            // Space starts game from menu or game over
            if ((this.state === 'menu' || this.state === 'gameover') && (e.key === KEY_SHOOT1 || e.key === KEY_SHOOT2)) {
                this.startGame();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        // Mouse for menu button
        window.addEventListener('click', (e) => {
            if ((this.state === 'menu' || this.state === 'gameover') && this.menuDiv) {
                const rect = this.menuDiv.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    this.startGame();
                }
            }
        });
    }

    startGame() {
        this.state = 'playing';
        this.player = new Player(60, GAME_HEIGHT / 2 - 18);
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.spawnTimer = 0;
        this.frame = 0;
        this.bgScroll = 0;
        this.removeMenu();
    }

    showMenu() {
        this.removeMenu();
        const div = document.createElement('div');
        div.className = 'menu';
        div.innerHTML = `
            <div style="font-size:2.5rem;font-weight:bold;margin-bottom:12px;letter-spacing:2px;">
                <span style="color:#f00;font-family:monospace;text-shadow:0 0 12px #f00;">TERMINATOR</span><br>
                <span style="font-size:1.1rem;font-family:sans-serif;color:#bbb;text-shadow:0 0 8px #fff;">Arcade Infiltration</span>
            </div>
            <div style="font-size:1.1rem;margin-bottom:16px;">
                <span style="color:#aef;font-weight:bold;">Arrow keys</span> to move<br>
                <span style="color:#f33;font-weight:bold;">Space or Z</span> to fire<br>
                <br>
                <span style="font-size:1.3rem;color:#f00;text-shadow:0 0 8px #f00;">Press Space or click below</span>
            </div>
            <button>Initiate</button>
        `;
        document.body.appendChild(div);
        this.menuDiv = div;
    }

    showGameOver() {
        this.removeMenu();
        if (this.score > this.highScore) this.highScore = this.score;
        const div = document.createElement('div');
        div.className = 'menu';
        div.innerHTML = `
            <div style="font-size:2.2rem;font-weight:bold;margin-bottom:12px;color:#f00;text-shadow:0 0 10px #f00;">TERMINATED</div>
            <div style="font-size:1.1rem;margin-bottom:8px;">
                Score: <span style="color:#f33;font-weight:bold;">${this.score}</span><br>
                High Score: <span style="color:#aef;font-weight:bold;">${this.highScore}</span>
            </div>
            <div style="font-size:1.1rem;color:#f00;margin-bottom:10px;">Press Space or click below to retry</div>
            <button>Reboot</button>
        `;
        document.body.appendChild(div);
        this.menuDiv = div;
    }

    removeMenu() {
        if (this.menuDiv) {
            this.menuDiv.remove();
            this.menuDiv = null;
        }
    }

    update() {
        if (this.state !== 'playing') return;

        this.frame++;
        // this.bgScroll += 1.7;
        // if (this.bgScroll > 64) this.bgScroll = 0;

        // Player movement
        let dx = 0, dy = 0;
        if (this.keys[KEY_LEFT]) dx -= this.player.speed;
        if (this.keys[KEY_RIGHT]) dx += this.player.speed;
        if (this.keys[KEY_UP]) dy -= this.player.speed;
        if (this.keys[KEY_DOWN]) dy += this.player.speed;
        this.player.move(dx, dy);

        // Shooting
        if (this.keys[KEY_SHOOT1] || this.keys[KEY_SHOOT2]) {
            this.player.shoot();
        }

        this.player.update();

        // --- Difficulty progression adjustment ---
        // Make enemy speed and spawn rate increase more gradually

        // Difficulty factor increases slowly as score increases
        // For example, using sqrt to flatten early growth, capped at a reasonable max
        const difficulty = Math.min(Math.sqrt(this.score / 200), 2.5); // Max difficulty factor cap

        // Enemies
        if (this.spawnTimer <= 0) {
            const y = getRandomInt(24, GAME_HEIGHT - 60);
            // Base speed 2..4, add only a gently scaling difficulty
            const speed = getRandomInt(2, 4) + difficulty;
            this.enemies.push(new Enemy(GAME_WIDTH + 16, y, speed));

            // Spawn interval is longer at start, decreases with difficulty, but never below a minimum
            const baseMin = 48, baseMax = 90;
            const minSpawn = Math.max(baseMin - difficulty * 10, 22);
            const maxSpawn = Math.max(baseMax - difficulty * 20, 38);
            this.spawnTimer = getRandomInt(minSpawn, maxSpawn);
        } else {
            this.spawnTimer--;
        }

        this.enemies.forEach(enemy => enemy.update());
        this.enemies = this.enemies.filter(e => !e.dead);

        // Player bullets vs enemies
        for (let bullet of this.player.bullets) {
            for (let enemy of this.enemies) {
                if (!bullet.dead && !enemy.dead && this.checkCollision(bullet.getRect(), enemy.getRect())) {
                    bullet.dead = true;
                    enemy.dead = true;
                    this.score += 100;
                    // Particle burst (red/blue-steel/cyan)
                    for (let i = 0; i < 12; i++) {
                        this.particles.push(new Particle(
                            enemy.x + enemy.width/2, 
                            enemy.y + enemy.height/2, 
                            i%3===0 ? '#f33' : (i%2===0 ? '#aef6ff' : '#7fb6c7')
                        ));
                    }
                }
            }
        }

        // Enemy bullets vs player
        for (let enemy of this.enemies) {
            for (let bullet of enemy.bullets) {
                if (!bullet.dead && this.player.invincible === 0 && this.checkCollision(bullet.getRect(), {
                    x: this.player.x,
                    y: this.player.y,
                    width: this.player.width,
                    height: this.player.height
                })) {
                    bullet.dead = true;
                    this.player.lives -= 1;
                    this.player.invincible = 60;
                    for (let i = 0; i < 10; i++) {
                        this.particles.push(new Particle(this.player.x + this.player.width/2, this.player.y + this.player.height/2, i%2===0 ? '#aef' : '#bbb'));
                    }
                    if (this.player.lives <= 0) {
                        this.state = 'gameover';
                        setTimeout(() => this.showGameOver(), 600);
                    }
                }
            }
        }

        // Enemies vs player (collision)
        for (let enemy of this.enemies) {
            if (!enemy.dead && this.player.invincible === 0 && this.checkCollision(enemy.getRect(), {
                x: this.player.x,
                y: this.player.y,
                width: this.player.width,
                height: this.player.height
            })) {
                enemy.dead = true;
                this.player.lives -= 1;
                this.player.invincible = 60;
                for (let i = 0; i < 10; i++) {
                    this.particles.push(new Particle(this.player.x + this.player.width/2, this.player.y + this.player.height/2, i%2===0 ? '#aef' : '#bbb'));
                }
                if (this.player.lives <= 0) {
                    this.state = 'gameover';
                    setTimeout(() => this.showGameOver(), 600);
                }
            }
        }

        // Particles
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);
    }

    checkCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    render() {
        // Next frame
        requestAnimationFrame(() => this.render());

        // Always show menu if in menu/gameover state
        if (this.state === 'menu' && !this.menuDiv) this.showMenu();
        if (this.state === 'gameover' && !this.menuDiv) this.showGameOver();

        // Draw static background image (no scrolling, always at (0,0))
        this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.drawBackground();

        if (this.state !== 'playing') {
            // Draw faded overlay for menu/gameover
            this.ctx.save();
            this.ctx.globalAlpha = 0.4;
            this.ctx.fillStyle = "#000";
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            this.ctx.restore();
            return;
        }

        // Update game logic
        this.update();

        // Player, enemies, bullets
        this.player.render(this.ctx);
        this.enemies.forEach(e => e.render(this.ctx));
        this.particles.forEach(p => p.render(this.ctx));

        // HUD
        this.drawHUD();
    }

    drawBackground() {
        // === Draw static background image, no scrolling, no parallax ===
        if (backgroundImageLoaded) {
            // Always draw at 0,0, and tile if needed to fill canvas
            const imgWidth = backgroundImage.width;
            const imgHeight = backgroundImage.height;
            for (let x = 0; x < GAME_WIDTH; x += imgWidth) {
                for (let y = 0; y < GAME_HEIGHT; y += imgHeight) {
                    this.ctx.drawImage(backgroundImage, x, y, imgWidth, imgHeight);
                }
            }
        } else {
            // Fallback: use previous stylized background if image not loaded yet
            this.ctx.save();
            // Steel sky gradient
            let grad = this.ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
            grad.addColorStop(0, '#222325');
            grad.addColorStop(0.5, '#191a1b');
            grad.addColorStop(1, '#11090a');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            // Ruined city skyline silhouette (static, not parallax)
            for (let layer = 0; layer < 3; layer++) {
                const yBase = [GAME_HEIGHT - 80, GAME_HEIGHT - 54, GAME_HEIGHT - 32][layer];
                const color = ['#201e22', '#2c2428', '#3a2a30'][layer];
                this.ctx.save();
                this.ctx.globalAlpha = 0.22 + 0.13 * layer;
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                // Generate blocky buildings
                for (let x = 0; x <= GAME_WIDTH + 80; x += 40 + Math.random()*20) {
                    let h = 24 + Math.random() * (18 + layer*9);
                    this.ctx.rect(x, yBase - h, 24 + Math.random()*10, h);
                }
                this.ctx.fill();
                this.ctx.restore();
            }

            // Red scanner beam (static position)
            let scanY = GAME_HEIGHT - 100;
            this.ctx.save();
            this.ctx.globalAlpha = 0.15;
            this.ctx.fillStyle = '#f00';
            this.ctx.fillRect(0, scanY, GAME_WIDTH, 3);
            this.ctx.restore();

            // Distant glowing embers (static)
            for (let i = 0; i < 16; i++) {
                let px = ((i * 108) % (GAME_WIDTH + 32));
                let py = GAME_HEIGHT - 20 - (i * 13) % 68;
                this.ctx.beginPath();
                this.ctx.arc(px, py, (i % 6 === 0) ? 2 : 1, 0, Math.PI * 2);
                this.ctx.fillStyle = (i % 2 === 0) ? '#f33' : '#f99';
                this.ctx.globalAlpha = 0.28 + (i%2)*0.1;
                this.ctx.fill();
            }

            this.ctx.restore();
        }
    }

    drawHUD() {
        // Score
        this.ctx.save();
        this.ctx.font = 'bold 20px Segoe UI, Arial';
        this.ctx.fillStyle = '#f33';
        this.ctx.shadowColor = '#f00';
        this.ctx.shadowBlur = 6;
        this.ctx.fillText('Score: ' + this.score, 12, 26);

        // Lives - T-800 skulls
        for (let i = 0; i < this.player.lives; i++) {
            this.ctx.save();
            this.ctx.translate(16 + i * 34, 52);
            this.ctx.scale(0.46, 0.46);
            this.ctx.beginPath();
            this.ctx.ellipse(22, 18, 16, 15, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = '#bbb';
            this.ctx.shadowColor = '#aaa';
            this.ctx.shadowBlur = 4;
            this.ctx.fill();

            // Red eye
            this.ctx.beginPath();
            this.ctx.arc(31, 18, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = '#f00';
            this.ctx.shadowColor = '#f00';
            this.ctx.shadowBlur = 6;
            this.ctx.fill();

            // Jaw
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(35, 29);
            this.ctx.quadraticCurveTo(30, 36, 19, 33);
            this.ctx.lineTo(12, 29);
            this.ctx.strokeStyle = '#888';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 0;
            this.ctx.stroke();
            this.ctx.restore();

            this.ctx.restore();
        }
        this.ctx.restore();
    }
}

// ---- Initialize on DOMContentLoaded ----

function initGame() {
    const container = document.getElementById('gameContainer');
    const canvas = document.createElement('canvas');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Remove any stray menus from reloads
    document.querySelectorAll('.menu').forEach(e => e.remove());

    // Start game manager (menu will show immediately)
    window.arcadeShooter = new GameManager(canvas, ctx);
}

window.addEventListener('DOMContentLoaded', initGame);

// ---- Utility functions ----
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}