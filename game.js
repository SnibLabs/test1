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

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 42;
        this.height = 54; // taller for "Arnold" figure
        this.speed = 3.5;
        this.color = '#bbb';
        this.bullets = [];
        this.shootCooldown = 0;
        this.lives = 3;
        this.invincible = 0;
        this.score = 0;
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
    }

    render(ctx) {
        // Flicker if invincible
        if (this.invincible % 6 < 3) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // --- Arnold Schwarzenegger as The Terminator (T-800) stylized sprite ---
            // Body proportions (side view, right-facing)
            // Torso (black jacket)
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(18, 14);
            ctx.lineTo(28, 14);
            ctx.lineTo(36, 44);
            ctx.lineTo(10, 44);
            ctx.closePath();
            ctx.fillStyle = '#191a1b';
            ctx.shadowColor = '#222';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();

            // Arms (jacket sleeves)
            ctx.save();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            // Left arm (back, holding gun)
            ctx.beginPath();
            ctx.moveTo(17, 22);
            ctx.lineTo(8, 35);
            ctx.stroke();
            // Right arm (front)
            ctx.beginPath();
            ctx.moveTo(29, 22);
            ctx.lineTo(36, 32);
            ctx.stroke();
            ctx.restore();

            // Gun (shotgun - iconic)
            ctx.save();
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(6, 34);
            ctx.lineTo(-6, 38);
            ctx.stroke();
            ctx.restore();

            // Legs (black pants)
            ctx.save();
            ctx.strokeStyle = '#191a1b';
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            // Left leg
            ctx.beginPath();
            ctx.moveTo(17, 43);
            ctx.lineTo(14, 53);
            ctx.stroke();
            // Right leg
            ctx.beginPath();
            ctx.moveTo(29, 44);
            ctx.lineTo(29, 53);
            ctx.stroke();
            ctx.restore();

            // Boots
            ctx.save();
            ctx.fillStyle = '#333';
            ctx.fillRect(12, 51, 6, 4);
            ctx.fillRect(27, 51, 7, 4);
            ctx.restore();

            // Head (Arnold face, sunglasses)
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(23, 9, 8, 9, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#b38e6a'; // flesh tone
            ctx.shadowColor = '#333';
            ctx.shadowBlur = 4;
            ctx.fill();

            // Jawline
            ctx.beginPath();
            ctx.moveTo(16, 10);
            ctx.quadraticCurveTo(16, 18, 23, 18);
            ctx.quadraticCurveTo(30, 18, 30, 10);
            ctx.strokeStyle = '#a4754f';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.5;
            ctx.stroke();

            // Sunglasses
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#222';
            ctx.fillRect(16.5, 7, 6, 6); // left lens
            ctx.fillRect(23.5, 7, 7, 6); // right lens
            ctx.fillStyle = '#444';
            ctx.fillRect(22.5, 9, 3, 2); // bridge
            // Subtle red glow to right lens (robot eye)
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(28, 10, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#e11';
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();

            // Hair (dark, flat-top/brush style)
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(23, 4, 8, 4, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#231f1b';
            ctx.shadowBlur = 0;
            ctx.fill();
            ctx.restore();

            ctx.restore();

            // Chrome endoskeleton highlight (slight, under sunglasses)
            ctx.save();
            ctx.globalAlpha = 0.18;
            ctx.beginPath();
            ctx.arc(29, 13, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#bbb';
            ctx.fill();
            ctx.restore();

            ctx.restore();
        }

        // Draw bullets
        this.bullets.forEach(b => b.render(ctx));
    }
}

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
        this.height = 28;
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

        // --- T-3000 Terminator stylized sprite ---
        // Body
        ctx.save();
        ctx.fillStyle = '#999'; // Silver color for T-3000
        ctx.fillRect(10, 10, 18, 28); // Body
        ctx.fillStyle = '#444'; // Darker for details
        ctx.fillRect(10, 10, 18, 4); // Neck
        ctx.fillRect(10, 14, 4, 10); // Left arm
        ctx.fillRect(24, 14, 4, 10); // Right arm
        ctx.fillRect(10, 38, 4, 10); // Left leg
        ctx.fillRect(24, 38, 4, 10); // Right leg
        ctx.restore();

        // Red sensor eye
        ctx.save();
        ctx.fillStyle = '#e11'; // Red color for eye
        ctx.beginPath();
        ctx.arc(19, 10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Metallic highlight
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.arc(14, 10, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();

        // Underbody "mechanical" lines
        ctx.save();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, 26);
        ctx.lineTo(28, 26);
        ctx.stroke();
        ctx.restore();

        this.bullets.forEach(b => b.render(ctx));
        ctx.restore();
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
        this.bgScroll += 1.7;
        if (this.bgScroll > 64) this.bgScroll = 0;

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
        // Make enemy