const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

let playerImage = new Image();
playerImage.src = "assets/player.png";

const scoreSE = new Audio("assets/score.wav");
const gameOverSE = new Audio("assets/gameover.wav");
const gameStartSE = new Audio("assets/gamestart.wav");
const newHighScoreSE = new Audio("assets/newhighscore.wav");

const playerWidth = 120;
const playerHeight = 108;
const playerY = 492;

const enemyCount = 3;
const enemies = [];

let score = 0;
let highScore = Number(localStorage.getItem("highScore") || 0);
let enemySpeed = 5;

let gameStarted = false;
let gameOver = false;
let newHighScoreSoundPlayed = false;
let newHighScore = false;
let mouseX = W / 2;

function resetEnemy(i) {
  const e = enemies[i];
  e.x = Math.random() * 750;
  e.y = -Math.random() * 300;
  e.vx = 0;
  e.vy = enemySpeed;

  // 2体目は弱い自機狙い、3体目は強いホーミング
  if (i === 1 || i === 2) {
    const dx = mouseX - e.x;
    const dy = 550 - e.y;
    const distance = Math.hypot(dx, dy) || 1;

    e.vx = dx / distance * enemySpeed;
    e.vy = dy / distance * enemySpeed;
  }
}

function resetGame() {
  score = 0;
  enemySpeed = 5;
  gameOver = false;
  newHighScore = false;
  newHighScoreSoundPlayed = false;

  for (let i = 0; i < enemyCount; i++) {
    resetEnemy(i);
  }
}

for (let i = 0; i < enemyCount; i++) {
  enemies.push({x: 0, y: 0, vx: 0, vy: enemySpeed});
}
resetGame();

function playSE(sound) {
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

canvas.addEventListener("pointermove",(e)=>{
	const rect=canvas.getBoundingClientRect();
	mouseX=(e.clientX-rect.left)*W/rect.width;
	mouseY=(e.clientY-rect.top)*H/rect.height;
});

canvas.addEventListener("pointerdown",(e)=>{
	const rect=canvas.getBoundingClientRect();
	mouseX=(e.clientX-rect.left)*W/rect.width;
	mouseY=(e.clientY-rect.top)*H/rect.height;

	if(!gameStarted){
		if(mouseX>=250&&mouseX<=550&&mouseY>=445&&mouseY<=515){
			gameStarted=true;
			resetGame();
			playSE(gameStartSE);
		}
	}else if(gameOver){
		if(mouseX>=250&&mouseX<=550&&mouseY>=435&&mouseY<=505){
			resetGame();
		}
	}
});

let mouseY = 480;
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) * W / rect.width;
  mouseY = (e.clientY - rect.top) * H / rect.height;
});

document.addEventListener("keydown", (e) => {
  if ((e.key === "r" || e.key === "R") && gameOver) {
    resetGame();
  }

  if (e.code === "Space" && !gameStarted) {
    gameStarted = true;
    resetGame();
    playSE(gameStartSE);
  }
});

function drawText(text, x, y, size, align = "center", color = "#fff") {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Hiragino Sans", "Yu Gothic", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function drawStartScreen(){
	ctx.fillStyle="#141414";
	ctx.fillRect(0,0,W,H);

	const mobile=window.matchMedia("(max-width:600px)").matches;
	const titleSize=mobile?48:60;
	const textSize=mobile?22:24;

	drawText("避けろ！",W/2,130,titleSize);
	drawText("ヘーベルハウス君！",W/2,200,titleSize);

	drawText("敵に当たらないように避けよう！",W/2,270,textSize);
	drawText("敵を1個避けると 10 POINT！",W/2,320,textSize);
	drawText("スコアが増えるほど敵が速くなる！",W/2,370,textSize);

	const over=mouseX>250&&mouseX<550&&mouseY>445&&mouseY<515;
	ctx.fillStyle=over?"#969696":"#646464";
	ctx.fillRect(250,445,300,70);

	drawText("START",W/2,490,mobile?34:30);
}

function drawGameOverScreen(){
	ctx.fillStyle="#141414";
	ctx.fillRect(0,0,W,H);

	const mobile=window.matchMedia("(max-width:600px)").matches;

	drawText("GAME OVER",W/2,220,mobile?52:60);
	drawText(`SCORE：${score}`,W/2,290,mobile?32:30);
	drawText(`HIGH SCORE：${highScore}`,W/2,330,mobile?32:30);

	if(newHighScore){
		drawText("ハイスコア更新！",W/2,380,mobile?32:30,"center","#FFD700");
	}

	const over=mouseX>=250&&mouseX<=550&&mouseY>=435&&mouseY<=505;
	ctx.fillStyle=over?"#969696":"#646464";
	ctx.fillRect(250,435,300,70);

	drawText("もう一度遊ぶ",W/2,479,mobile?30:28);
	drawText(mobile?"タップしてリトライ":"Rキーでもリトライできます",W/2,540,mobile?22:18,"center","#AAAAAA");
}

function updateGame() {
  const playerX = Math.max(0, Math.min(mouseX - playerWidth / 2, W - playerWidth));

  enemySpeed = 5 + Math.floor(score / 10) * 0.05;

  for (let i = 0; i < enemyCount; i++) {
    const e = enemies[i];

    // 3体目だけ強いホーミング
    if (i === 2) {
      const dx = mouseX - e.x;
      const dy = playerY + playerHeight / 2 - e.y;
      const distance = Math.hypot(dx, dy) || 1;

      e.vx += (dx / distance) * 0.10;
      e.vy += (dy / distance) * 0.10;

      const speed = Math.hypot(e.vx, e.vy) || 1;
      if (speed > enemySpeed) {
        e.vx = e.vx / speed * enemySpeed;
        e.vy = e.vy / speed * enemySpeed;
      }
    }

    e.x += e.vx;
    e.y += e.vy;

    if (e.y > H) {
      score += 10;
      playSE(scoreSE);

      if (score > highScore) {
        highScore = score;
        newHighScore = true;
        localStorage.setItem("highScore", highScore);

        if (!newHighScoreSoundPlayed) {
          playSE(newHighScoreSE);
          newHighScoreSoundPlayed = true;
        }
      }

      resetEnemy(i);
    }

    // 簡易当たり判定
    if (
      e.x > playerX &&
      e.x < playerX + playerWidth &&
      e.y > playerY &&
      e.y < playerY + playerHeight
    ) {
      gameOver = true;
      playSE(gameOverSE);
    }
  }
}

function drawGame() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);

  const playerX = Math.max(0, Math.min(mouseX - playerWidth / 2, W - playerWidth));

  if (playerImage.complete && playerImage.naturalWidth > 0) {
    ctx.drawImage(playerImage, playerX, playerY, playerWidth, playerHeight);
  }

  drawText(`SCORE：${score}`, 20, 35, 25, "left", "#141414");
  drawText(`HIGH SCORE：${highScore}`, 20, 65, 25, "left", "#141414");

  ctx.fillStyle = "#fff";
  for (const e of enemies) {
    ctx.beginPath();
    ctx.arc(e.x, e.y, 20, 0, Math.PI * 2);
    
    // 球の中
    ctx.fillStyle = "#fff";
    ctx.fill();

    // 球の縁
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function loop() {
  if (!gameStarted) {
    drawStartScreen();
  } else if (gameOver) {
    drawGameOverScreen();
  } else {
    updateGame();
    drawGame();
  }

  requestAnimationFrame(loop);
}

loop();
