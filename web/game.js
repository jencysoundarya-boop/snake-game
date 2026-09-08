// game.js - Core Web Engine for SNAKE // NEON HUNT

// --- CONFIGURATION ---
const TILE_SIZE = 20;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const COLS = CANVAS_WIDTH / TILE_SIZE;
const ROWS = CANVAS_HEIGHT / TILE_SIZE;

const BASE_SPEED = 120; // ms per tick

const COLORS = {
    bg: '#050508',
    snakeHead: '#00ffff',
    snakeBody: '#0088ff',
    foodNormal: '#39ff14',
    foodRare: '#ff00ff',
    foodGold: '#ffff00',
    foodSpeed: '#00ffff',
    foodSlow: '#ff2828',
    grid: 'rgba(0, 255, 255, 0.05)',
    particles: ['#00ffff', '#ff00ff', '#39ff14', '#ffff00']
};

const FOOD_TYPES = {
    NORMAL: { color: COLORS.foodNormal, points: 10, prob: 70 },
    RARE: { color: COLORS.foodRare, points: 25, prob: 15 },
    GOLD: { color: COLORS.foodGold, points: 50, prob: 5 },
    SPEED: { color: COLORS.foodSpeed, points: 15, prob: 5, effect: 'speed' },
    SLOW: { color: COLORS.foodSlow, points: 15, prob: 5, effect: 'slow' }
};

// --- STATE MANAGEMENT ---
let canvas, ctx;
let lastTime = 0;
let accumulator = 0;
let currentTickRate = BASE_SPEED;
let isPlaying = false;
let isPaused = false;
let reqAnimationId = null;

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let snakeGrow = 0;
let effectTimer = null;

let foods = [];
let particles = [];
let obstacles = []; // for obstacle mode

let score = 0;
let level = 1;
let combo = 1;
let comboTimeout = null;
let mode = 'CLASSIC';

let screenShake = 0;
let gameStartTime = 0;
let modeTimeRemaining = 180; // 3 mins for Time Attack

// --- SETTINGS & HIGH SCORES ---
let highScores = JSON.parse(localStorage.getItem('snakeHighScores')) || [];
let achievements = JSON.parse(localStorage.getItem('snakeAchievements')) || [];
let settings = JSON.parse(localStorage.getItem('snakeSettings')) || {
    particles: true, shake: true, speed: 'NORMAL'
};

// --- INITIALIZATION ---
window.onload = () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Setup resolutions
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Bind UI
    bindEvents();
    loadLeaderboard();
    
    // Show landing
    switchScreen('screen-landing');
};

function resizeCanvas() {
    // Keep aspect ratio but fit screen
    const container = document.querySelector('.canvas-container');
    const maxWidth = Math.min(800, window.innerWidth * 0.95);
    const maxHeight = Math.min(600, window.innerHeight * 0.6);
    
    const scale = Math.min(maxWidth / CANVAS_WIDTH, maxHeight / CANVAS_HEIGHT);
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.width = `${CANVAS_WIDTH * scale}px`;
    canvas.style.height = `${CANVAS_HEIGHT * scale}px`;

    // Show mobile controls if touch device or small screen
    if (window.innerWidth <= 768 || 'ontouchstart' in window) {
        document.querySelector('.mobile-controls').style.display = 'flex';
    } else {
        document.querySelector('.mobile-controls').style.display = 'none';
    }
}

// --- UI NAVIGATION ---
function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById(id);
    target.classList.remove('hidden');
    // small delay for transition
    setTimeout(() => target.classList.add('active'), 50);
    audio.playClick();
}

function bindEvents() {
    // Landing
    document.getElementById('btn-play-now').onclick = () => switchScreen('screen-mode-select');
    document.getElementById('btn-leaderboard').onclick = () => switchScreen('screen-leaderboard');
    document.getElementById('btn-how-to').onclick = () => switchScreen('screen-how-to');
    document.getElementById('btn-settings').onclick = () => switchScreen('screen-settings');
    
    // Back buttons
    document.getElementById('btn-back-from-modes').onclick = () => switchScreen('screen-landing');
    document.getElementById('btn-back-from-lb').onclick = () => switchScreen('screen-landing');
    document.getElementById('btn-back-from-howto').onclick = () => switchScreen('screen-landing');
    document.getElementById('btn-back-from-settings').onclick = () => switchScreen('screen-landing');
    
    // Mode select
    document.querySelectorAll('.mode-card').forEach(card => {
        card.onclick = () => {
            mode = card.dataset.mode;
            startGame();
        };
        card.onmouseenter = () => audio.playHover();
    });
    
    // Game Over
    document.getElementById('btn-play-again').onclick = () => startGame();
    document.getElementById('btn-go-menu').onclick = () => {
        isPlaying = false;
        switchScreen('screen-landing');
    };
    
    // Pause
    document.getElementById('btn-resume').onclick = togglePause;
    document.getElementById('btn-restart').onclick = () => startGame();
    document.getElementById('btn-quit').onclick = () => {
        isPlaying = false;
        isPaused = false;
        switchScreen('screen-landing');
    };
    
    // Name Entry
    document.getElementById('btn-submit-score').onclick = submitHighScore;
    
    // Settings toggles
    setupToggles();
    
    // Keyboard
    window.addEventListener('keydown', handleKeyDown);
    
    // Mobile D-Pad
    document.getElementById('btn-up').ontouchstart = (e) => { e.preventDefault(); setDirection(0, -1); };
    document.getElementById('btn-down').ontouchstart = (e) => { e.preventDefault(); setDirection(0, 1); };
    document.getElementById('btn-left').ontouchstart = (e) => { e.preventDefault(); setDirection(-1, 0); };
    document.getElementById('btn-right').ontouchstart = (e) => { e.preventDefault(); setDirection(1, 0); };
    document.getElementById('btn-pause-mobile').onclick = togglePause;
    
    // Mouse fallback for mobile controls testing on desktop
    document.getElementById('btn-up').onmousedown = (e) => { e.preventDefault(); setDirection(0, -1); };
    document.getElementById('btn-down').onmousedown = (e) => { e.preventDefault(); setDirection(0, 1); };
    document.getElementById('btn-left').onmousedown = (e) => { e.preventDefault(); setDirection(-1, 0); };
    document.getElementById('btn-right').onmousedown = (e) => { e.preventDefault(); setDirection(1, 0); };
}

// --- GAME LOGIC ---
function startGame() {
    audio.init();
    switchScreen('screen-game');
    document.getElementById('overlay-gameover').classList.add('hidden');
    document.getElementById('overlay-pause').classList.add('hidden');
    document.getElementById('name-entry-container').classList.add('hidden');
    document.getElementById('new-record-msg').classList.add('hidden');
    
    // Init state
    snake = [
        {x: 10, y: 15},
        {x: 9, y: 15},
        {x: 8, y: 15}
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    level = 1;
    combo = 1;
    snakeGrow = 0;
    foods = [];
    particles = [];
    obstacles = [];
    isPaused = false;
    isPlaying = true;
    gameStartTime = Date.now();
    
    if (mode === 'TIME_ATTACK') {
        modeTimeRemaining = 180;
        document.getElementById('hud-time-container').style.display = 'flex';
    } else {
        document.getElementById('hud-time-container').style.display = 'none';
    }
    
    // Base speed modifier from settings
    let speedMod = 1.0;
    if (settings.speed === 'SLOW') speedMod = 1.5;
    if (settings.speed === 'FAST') speedMod = 0.7;
    currentTickRate = BASE_SPEED * speedMod;
    
    if (mode === 'OBSTACLE') generateObstacles();
    
    updateHUD();
    spawnFood();
    
    if (reqAnimationId) cancelAnimationFrame(reqAnimationId);
    lastTime = performance.now();
    accumulator = 0;
    reqAnimationId = requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
    if (!isPlaying) return;
    
    if (e.key === 'Escape' || e.key === ' ') {
        togglePause();
        e.preventDefault();
        return;
    }
    
    if (isPaused) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            setDirection(0, -1); e.preventDefault(); break;
        case 'ArrowDown':
        case 's':
        case 'S':
            setDirection(0, 1); e.preventDefault(); break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            setDirection(-1, 0); e.preventDefault(); break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            setDirection(1, 0); e.preventDefault(); break;
    }
}

function setDirection(dx, dy) {
    // Prevent 180 turn
    if (direction.x !== 0 && dx === -direction.x) return;
    if (direction.y !== 0 && dy === -direction.y) return;
    nextDirection = {x: dx, y: dy};
}

function togglePause() {
    if (!isPlaying) return;
    isPaused = !isPaused;
    audio.playClick();
    const overlay = document.getElementById('overlay-pause');
    if (isPaused) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
        lastTime = performance.now(); // Reset time to prevent huge jump
        requestAnimationFrame(gameLoop);
    }
}

function generateObstacles() {
    // Procedural generation of some walls
    for(let i=0; i<15; i++) {
        let ox = Math.floor(Math.random() * (COLS - 4)) + 2;
        let oy = Math.floor(Math.random() * (ROWS - 4)) + 2;
        // Don't spawn on snake
        if(Math.abs(ox - 10) > 3 || Math.abs(oy - 15) > 3) {
            obstacles.push({x: ox, y: oy});
            // sometimes make a line
            if(Math.random() > 0.5) {
                obstacles.push({x: ox+1, y: oy});
                obstacles.push({x: ox+2, y: oy});
            } else {
                obstacles.push({x: ox, y: oy+1});
                obstacles.push({x: ox, y: oy+2});
            }
        }
    }
}

function spawnFood(forceType = null) {
    let x, y;
    let valid = false;
    while (!valid) {
        x = Math.floor(Math.random() * COLS);
        y = Math.floor(Math.random() * ROWS);
        valid = true;
        // Check snake
        for (let s of snake) {
            if (s.x === x && s.y === y) valid = false;
        }
        // Check obstacles
        for (let o of obstacles) {
            if (o.x === x && o.y === y) valid = false;
        }
        // Check existing food
        for (let f of foods) {
            if (f.x === x && f.y === y) valid = false;
        }
    }
    
    let type = forceType;
    if (!type) {
        const rand = Math.random() * 100;
        let cum = 0;
        for (let t in FOOD_TYPES) {
            cum += FOOD_TYPES[t].prob;
            if (rand <= cum) { type = t; break; }
        }
        if (!type) type = 'NORMAL';
    }
    
    let duration = (type === 'GOLD' || type === 'SPEED' || type === 'SLOW') ? Date.now() + 8000 : null;
    foods.push({ x, y, type, expires: duration, spawnAnim: 0 });
}

function updateFood() {
    const now = Date.now();
    let originalCount = foods.length;
    foods = foods.filter(f => !f.expires || f.expires > now);
    
    // Ensure at least one normal food
    if (!foods.some(f => f.type === 'NORMAL')) {
        spawnFood('NORMAL');
    }
}

// --- ENGINE LOOP ---
function gameLoop(time) {
    if (!isPlaying || isPaused) return;
    
    let deltaTime = time - lastTime;
    lastTime = time;
    accumulator += deltaTime;
    
    // Time Attack logic
    if (mode === 'TIME_ATTACK') {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        modeTimeRemaining = 180 - elapsed;
        if (modeTimeRemaining <= 0) {
            modeTimeRemaining = 0;
            gameOver();
            return;
        }
        document.getElementById('hud-time').innerText = 
            `${String(Math.floor(modeTimeRemaining/60)).padStart(2,'0')}:${String(modeTimeRemaining%60).padStart(2,'0')}`;
    }
    
    // Survival Mode logic
    if (mode === 'SURVIVAL') {
        // Decrease tick rate continuously
        currentTickRate = Math.max(30, BASE_SPEED - (Date.now() - gameStartTime)/1000);
    }
    
    // Fixed timestep update for logic
    while (accumulator >= currentTickRate) {
        update();
        accumulator -= currentTickRate;
    }
    
    // Variable timestep for rendering (particles, animations)
    updateParticles(deltaTime);
    draw();
    
    reqAnimationId = requestAnimationFrame(gameLoop);
}

function update() {
    direction = nextDirection;
    
    // Move Head
    let head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // Screen Wrap vs Wall Collision
    if (mode === 'ENDLESS') {
        if (head.x < 0) head.x = COLS - 1;
        if (head.x >= COLS) head.x = 0;
        if (head.y < 0) head.y = ROWS - 1;
        if (head.y >= ROWS) head.y = 0;
    } else {
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            gameOver();
            return;
        }
    }
    
    // Self Collision
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }
    
    // Obstacle Collision
    for (let i = 0; i < obstacles.length; i++) {
        if (obstacles[i].x === head.x && obstacles[i].y === head.y) {
            gameOver();
            return;
        }
    }
    
    snake.unshift(head);
    
    // Eat Food
    let ate = false;
    for (let i = 0; i < foods.length; i++) {
        if (foods[i].x === head.x && foods[i].y === head.y) {
            eatFood(foods[i]);
            foods.splice(i, 1);
            ate = true;
            break;
        }
    }
    
    if (ate) {
        snakeGrow++;
        checkAchievements();
    }
    
    if (snakeGrow > 0) {
        snakeGrow--;
    } else {
        snake.pop();
    }
    
    updateFood();
}

function eatFood(food) {
    const fData = FOOD_TYPES[food.type];
    
    score += fData.points * combo;
    combo++;
    
    if (comboTimeout) clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
        combo = 1;
        updateHUD();
    }, 3000);
    
    // Level Up
    let newLevel = Math.floor(score / 250) + 1;
    if (newLevel > level) {
        level = newLevel;
        audio.playLevelUp();
        if (mode !== 'SURVIVAL') {
            currentTickRate = Math.max(40, BASE_SPEED - (level * 5));
        }
    }
    
    audio.playEatSpecial(food.type);
    
    // Apply Effects
    if (fData.effect === 'speed') {
        currentTickRate = 40;
        if(effectTimer) clearTimeout(effectTimer);
        effectTimer = setTimeout(() => { currentTickRate = Math.max(40, BASE_SPEED - (level * 5)); }, 5000);
    } else if (fData.effect === 'slow') {
        currentTickRate = 200;
        if(effectTimer) clearTimeout(effectTimer);
        effectTimer = setTimeout(() => { currentTickRate = Math.max(40, BASE_SPEED - (level * 5)); }, 5000);
    }
    
    createParticles(food.x * TILE_SIZE + TILE_SIZE/2, food.y * TILE_SIZE + TILE_SIZE/2, fData.color, 10);
    if(settings.shake) triggerShake(2);
    
    updateHUD();
}

function gameOver() {
    isPlaying = false;
    audio.playCollision();
    if(settings.shake) triggerShake(5);
    createParticles(snake[0].x * TILE_SIZE + TILE_SIZE/2, snake[0].y * TILE_SIZE + TILE_SIZE/2, COLORS.snakeHead, 30);
    
    // Draw one last frame to show death
    draw(); 
    
    const overlay = document.getElementById('overlay-gameover');
    document.getElementById('go-score').innerText = score.toString().padStart(6, '0');
    document.getElementById('go-level').innerText = level.toString().padStart(2, '0');
    
    let best = 0;
    if (highScores.length > 0) best = highScores[0].score;
    document.getElementById('go-best').innerText = best.toString().padStart(6, '0');
    
    if (score > best && score > 0) {
        document.getElementById('new-record-msg').classList.remove('hidden');
        document.getElementById('name-entry-container').classList.remove('hidden');
    } else {
        document.getElementById('name-entry-container').classList.add('hidden');
    }
    
    overlay.classList.remove('hidden');
}

// --- VISUALS ---
function draw() {
    // Clear with slight trailing effect for neon blur
    ctx.fillStyle = 'rgba(5, 5, 8, 0.3)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= CANVAS_WIDTH; x += TILE_SIZE) {
        ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT);
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += TILE_SIZE) {
        ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y);
    }
    ctx.stroke();
    
    // Draw Obstacles
    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
    ctx.shadowBlur = 0;
    for (let o of obstacles) {
        ctx.fillRect(o.x * TILE_SIZE, o.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#555';
        ctx.strokeRect(o.x * TILE_SIZE, o.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    
    // Draw Food
    const now = Date.now();
    for (let f of foods) {
        const fData = FOOD_TYPES[f.type];
        
        // Pulse animation
        let sizeMod = 1;
        if (f.expires) {
            let timeLeft = f.expires - now;
            if (timeLeft < 2000 && Math.floor(now / 200) % 2 === 0) continue; // Blink
            sizeMod = 1 + 0.2 * Math.sin(now / 100);
        } else {
            sizeMod = 1 + 0.1 * Math.sin(now / 200);
        }
        
        f.spawnAnim = Math.min(1, (f.spawnAnim || 0) + 0.05);
        let s = (TILE_SIZE / 2) * sizeMod * f.spawnAnim;
        
        ctx.fillStyle = fData.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = fData.color;
        ctx.beginPath();
        if (f.type === 'GOLD' || f.type === 'RARE') {
            // Draw diamond
            let cx = f.x * TILE_SIZE + TILE_SIZE/2;
            let cy = f.y * TILE_SIZE + TILE_SIZE/2;
            ctx.moveTo(cx, cy - s);
            ctx.lineTo(cx + s, cy);
            ctx.lineTo(cx, cy + s);
            ctx.lineTo(cx - s, cy);
        } else {
            // Draw circle
            ctx.arc(f.x * TILE_SIZE + TILE_SIZE/2, f.y * TILE_SIZE + TILE_SIZE/2, s, 0, Math.PI * 2);
        }
        ctx.fill();
    }
    
    // Draw Snake
    for (let i = snake.length - 1; i >= 0; i--) {
        let segment = snake[i];
        let isHead = (i === 0);
        
        let color = isHead ? COLORS.snakeHead : COLORS.snakeBody;
        
        // Gradient fade for tail
        if (!isHead) {
            let ratio = 1 - (i / snake.length);
            ctx.globalAlpha = 0.5 + 0.5 * ratio;
        } else {
            ctx.globalAlpha = 1;
        }
        
        ctx.fillStyle = color;
        ctx.shadowBlur = isHead ? 20 : 10;
        ctx.shadowColor = color;
        
        // Slightly smaller rects for segment separation look
        let p = isHead ? 0 : 2;
        ctx.fillRect(segment.x * TILE_SIZE + p, segment.y * TILE_SIZE + p, TILE_SIZE - p*2, TILE_SIZE - p*2);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
    // Draw Particles
    for (let p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function updateHUD() {
    document.getElementById('hud-score').innerText = score.toString().padStart(6, '0');
    document.getElementById('hud-level').innerText = level.toString().padStart(2, '0');
    
    const comboEl = document.getElementById('hud-combo');
    comboEl.innerText = `x${combo}`;
    if (combo > 1) {
        comboEl.style.transform = 'scale(1.3)';
        setTimeout(() => comboEl.style.transform = 'scale(1)', 100);
    }
    
    let best = 0;
    if (highScores.length > 0) best = highScores[0].score;
    document.getElementById('hud-best').innerText = Math.max(best, score).toString().padStart(6, '0');
}

// --- PARTICLES ---
function createParticles(x, y, color, count) {
    if (!settings.particles) return;
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            size: Math.random() * 3 + 1,
            color: color
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * (dt/16);
        p.y += p.vy * (dt/16);
        p.life -= 0.02 * (dt/16);
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// --- SHAKE ---
function triggerShake(intensity) {
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.classList.remove('shake');
    void canvasContainer.offsetWidth; // trigger reflow
    canvasContainer.classList.add('shake');
}

// --- HIGHSCORES & ACHIEVEMENTS ---
function submitHighScore() {
    const nameInput = document.getElementById('player-name-input');
    let name = nameInput.value.trim().toUpperCase() || 'ANONYMOUS';
    
    highScores.push({
        name: name,
        score: score,
        level: level,
        mode: mode,
        date: new Date().toLocaleDateString()
    });
    
    // Sort descending
    highScores.sort((a, b) => b.score - a.score);
    // Keep top 10
    highScores = highScores.slice(0, 10);
    
    localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
    
    document.getElementById('name-entry-container').classList.add('hidden');
    loadLeaderboard();
}

function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    
    if (highScores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">NO DATA FOUND</td></tr>';
        return;
    }
    
    highScores.forEach((s, i) => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${(i+1).toString().padStart(2, '0')}</td>
            <td>${s.name}</td>
            <td>${s.score.toString().padStart(6, '0')}</td>
            <td>${s.level}</td>
            <td>${s.mode}</td>
        `;
        tbody.appendChild(tr);
    });
}

const ACH_DEFS = {
    FIRST_BITE: { title: "FIRST BITE", desc: "Eat your first piece of data." },
    CENTURY: { title: "CENTURY", desc: "Score 100 points." },
    LONG_BOY: { title: "LONG BOY", desc: "Reach 50 segments." },
    NEON_MASTER: { title: "NEON MASTER", desc: "Reach Level 10." }
};

function checkAchievements() {
    if (!achievements.includes('FIRST_BITE') && score > 0) unlockAchievement('FIRST_BITE');
    if (!achievements.includes('CENTURY') && score >= 100) unlockAchievement('CENTURY');
    if (!achievements.includes('LONG_BOY') && snake.length >= 50) unlockAchievement('LONG_BOY');
    if (!achievements.includes('NEON_MASTER') && level >= 10) unlockAchievement('NEON_MASTER');
}

function unlockAchievement(id) {
    achievements.push(id);
    localStorage.setItem('snakeAchievements', JSON.stringify(achievements));
    
    const popup = document.getElementById('achievement-popup');
    document.getElementById('ach-name').innerText = ACH_DEFS[id].title;
    
    popup.classList.add('show');
    audio.playLevelUp(); // reuse sound
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 4000);
}

// --- SETTINGS UI ---
function setupToggles() {
    const sSound = document.getElementById('toggle-sound');
    const sMusic = document.getElementById('toggle-music');
    const sPart = document.getElementById('toggle-particles');
    const sShake = document.getElementById('toggle-shake');
    const sSpeed = document.getElementById('select-speed');
    
    const updateUI = () => {
        sSound.innerText = settings.sound !== false ? 'ON' : 'OFF';
        sSound.className = 'toggle-btn ' + (settings.sound !== false ? '' : 'off');
        
        sMusic.innerText = settings.music !== false ? 'ON' : 'OFF';
        sMusic.className = 'toggle-btn ' + (settings.music !== false ? '' : 'off');
        
        sPart.innerText = settings.particles !== false ? 'ON' : 'OFF';
        sPart.className = 'toggle-btn ' + (settings.particles !== false ? '' : 'off');
        
        sShake.innerText = settings.shake !== false ? 'ON' : 'OFF';
        sShake.className = 'toggle-btn ' + (settings.shake !== false ? '' : 'off');
        
        sSpeed.value = settings.speed || 'NORMAL';
    };
    
    updateUI();
    
    sSound.onclick = () => { settings.sound = settings.sound === false; audio.soundEnabled = settings.sound; saveSettings(); updateUI(); audio.playClick(); };
    sMusic.onclick = () => { settings.music = settings.music === false; audio.musicEnabled = settings.music; saveSettings(); updateUI(); audio.playClick(); };
    sPart.onclick = () => { settings.particles = settings.particles === false; saveSettings(); updateUI(); audio.playClick(); };
    sShake.onclick = () => { settings.shake = settings.shake === false; saveSettings(); updateUI(); audio.playClick(); };
    sSpeed.onchange = (e) => { settings.speed = e.target.value; saveSettings(); audio.playClick(); };
}

function saveSettings() {
    localStorage.setItem('snakeSettings', JSON.stringify(settings));
}
