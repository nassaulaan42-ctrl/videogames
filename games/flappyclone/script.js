const gameContainer = document.getElementById('game-container');
const bird = document.getElementById('bird');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const startMessage = document.getElementById('start-message');
const gameOverScreen = document.getElementById('game-over');
const highScoreBoard = document.getElementById('high-score-board');
const highScoreList = document.getElementById('high-score-list');

// --- Game Constants ---
let CONTAINER_WIDTH = window.innerWidth;
let CONTAINER_HEIGHT = window.innerHeight;

const BIRD_WIDTH = 10; 
const BIRD_HEIGHT = 10; 
const PIPE_WIDTH = 70; 
const GAP_HEIGHT = 280; 
const PIPE_SPEED = 1.8; 
const GRAVITY = 0.5;
const FLAP_STRENGTH = -9;
const GROUND_HEIGHT = 50; 

// --- Game State Variables ---
let birdY = CONTAINER_HEIGHT / 2 - (bird.offsetHeight / 2); 
let velocity = 0;
let score = 0;
let isGameOver = false;
let isGameStarted = false;
let pipes = []; 
let lastPipeTime = 0;
const pipeSpawnRate = 2000; 
const MAX_HIGH_SCORES = 5; 

// --- Setup ---
bird.style.left = '100px';
bird.style.top = `${birdY}px`;
gameOverScreen.style.display = 'none';

// Load and display scores only if the game hasn't started
if (!isGameStarted) {
    loadHighScores();
}

window.addEventListener('resize', () => {
    CONTAINER_WIDTH = window.innerWidth;
    CONTAINER_HEIGHT = window.innerHeight;
});


// --- Scoreboard Functions ---

function getHighScores() {
    const scoresString = localStorage.getItem('habibiAttaHighScores');
    return scoresString ? JSON.parse(scoresString) : [];
}

function saveHighScore(newScore) {
    const scores = getHighScores();
    scores.push(newScore);
    
    scores.sort((a, b) => b - a);
    
    const topScores = scores.slice(0, MAX_HIGH_SCORES);
    
    localStorage.setItem('habibiAttaHighScores', JSON.stringify(topScores));
    return topScores;
}

function loadHighScores() {
    const topScores = getHighScores();
    highScoreList.innerHTML = '';
    
    if (topScores.length === 0) {
        highScoreList.innerHTML = '<li>No scores yet!</li>';
    } else {
        topScores.forEach((s, index) => {
            const li = document.createElement('li');
            li.textContent = `#${index + 1}: ${s}`;
            highScoreList.appendChild(li);
        });
    }
    
    // 🎯 FIX: Show the scoreboard only if the game hasn't started
    if (!isGameStarted) {
        highScoreBoard.style.display = 'block';
        startMessage.style.display = 'none'; // Ensure start message is hidden
    }
}

// 🎯 FIX: Dismiss function now enables the start message
window.dismissScoreboard = function() {
    highScoreBoard.style.display = 'none';
    startMessage.style.display = 'block';
}

// --- Game Logic Functions (No changes needed below here) ---

function flap() {
    if (isGameOver) return;
    if (!isGameStarted) {
        startGame();
        return;
    }
    velocity = FLAP_STRENGTH;
}

function checkCollision(element1, element2) {
    const birdRect = element1.getBoundingClientRect();
    const collisionRect = {
        left: birdRect.left + (birdRect.width / 2) - (BIRD_WIDTH / 2),
        right: birdRect.left + (birdRect.width / 2) + (BIRD_WIDTH / 2),
        top: birdRect.top + (birdRect.height / 2) - (BIRD_HEIGHT / 2),
        bottom: birdRect.top + (birdRect.height / 2) + (BIRD_HEIGHT / 2),
    };

    const rect2 = element2.getBoundingClientRect();

    return (
        collisionRect.left < rect2.right &&
        collisionRect.right > rect2.left &&
        collisionRect.top < rect2.bottom &&
        collisionRect.bottom > rect2.top
    );
}

function createPipe() {
    const minHeight = 80;
    const maxHeight = CONTAINER_HEIGHT - GROUND_HEIGHT - GAP_HEIGHT - minHeight;
    const topPipeHeight = Math.floor(Math.random() * maxHeight) + minHeight;
    const bottomPipeHeight = CONTAINER_HEIGHT - GROUND_HEIGHT - topPipeHeight - GAP_HEIGHT;

    const topPipe = document.createElement('div');
    topPipe.classList.add('pipe', 'pipe-top');
    topPipe.style.height = `${topPipeHeight}px`;
    topPipe.style.top = '0px';
    topPipe.style.right = '0px'; 
    gameContainer.appendChild(topPipe);

    const bottomPipe = document.createElement('div');
    bottomPipe.classList.add('pipe', 'pipe-bottom');
    bottomPipe.style.height = `${bottomPipeHeight}px`;
    bottomPipe.style.bottom = `${GROUND_HEIGHT}px`;
    bottomPipe.style.right = '0px'; 
    gameContainer.appendChild(bottomPipe);

    pipes.push({
        topElement: topPipe,
        bottomElement: bottomPipe,
        x: 0, 
        passed: false
    });
}

function updatePipes(deltaTime) {
    const distanceToMove = PIPE_SPEED * deltaTime * 0.06;

    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        
        pipe.x += distanceToMove;
        pipe.topElement.style.right = `${pipe.x}px`;
        pipe.bottomElement.style.right = `${pipe.x}px`;

        if (checkCollision(bird, pipe.topElement) || checkCollision(bird, pipe.bottomElement)) {
            endGame();
            return;
        }

        if (!pipe.passed && pipe.x > CONTAINER_WIDTH - 100 - PIPE_WIDTH) { 
            score++;
            scoreDisplay.textContent = score;
            pipe.passed = true;
        }

        if (pipe.x > CONTAINER_WIDTH + PIPE_WIDTH) {
            pipe.topElement.remove();
            pipe.bottomElement.remove();
            pipes.splice(i, 1);
            i--;
        }
    }
}

function gameLoop(currentTime) {
    if (isGameOver) return;

    if (!gameLoop.lastTime) gameLoop.lastTime = currentTime;
    const deltaTime = currentTime - gameLoop.lastTime;
    gameLoop.lastTime = currentTime;

    velocity += GRAVITY;
    birdY += velocity;

    bird.style.top = `${birdY}px`;
    
    const rotation = Math.min(20, Math.max(-20, velocity * 1.5));
    bird.style.transform = `rotate(${rotation}deg) translateZ(0)`;

    if (currentTime - lastPipeTime > pipeSpawnRate) {
        createPipe();
        lastPipeTime = currentTime;
    }

    updatePipes(deltaTime);

    const visualBirdBottom = bird.getBoundingClientRect().bottom;
    const visualBirdTop = bird.getBoundingClientRect().top;

    if (visualBirdBottom >= CONTAINER_HEIGHT - GROUND_HEIGHT || visualBirdTop < 0) {
        endGame();
        return;
    }

    requestAnimationFrame(gameLoop);
}

function startGame() {
    isGameStarted = true;
    startMessage.style.display = 'none';
    gameLoop(0);
}

function endGame() {
    isGameOver = true;
    
    saveHighScore(score);
    loadHighScores(); 

    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'block';
}

// --- Event Listener ---
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); 
        flap();
    }
});

gameContainer.addEventListener('click', flap);