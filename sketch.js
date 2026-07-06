let player;
let dinosaurs = [];
let blackHoles = [];
let particles = [];
let dmgEffects = [];
let endScreenParticles = []; // 專門給結算動畫用的粒子系統

let killCount = 0;
const targetKills = 10;
let gameState = "PLAY"; // PLAY, WIN, LOSE
let shakeTimer = 0;     // 畫面搖晃計時器

function setup() {
  createCanvas(800, 600);
  player = new Shooter();
  for (let i = 0; i < 4; i++) {
    dinosaurs.push(new Dinosaur());
  }
}

function draw() {
  // 處理畫面震動（受傷或失敗時）
  if (shakeTimer > 0) {
    translate(random(-6, 6), random(-6, 6));
    shakeTimer--;
  }

  if (gameState === "PLAY") {
    drawPrairie();

    // 1. 黑洞更新
    for (let i = blackHoles.length - 1; i >= 0; i--) {
      blackHoles[i].update();
      blackHoles[i].display();
      if (blackHoles[i].isDead()) {
        triggerExplosion(blackHoles[i].x, blackHoles[i].y);
        blackHoles.splice(i, 1);
      }
    }

    // 2. 恐龍更新
    for (let i = dinosaurs.length - 1; i >= 0; i--) {
      let d = dinosaurs[i];
      if (d.isBeingDevoured) {
        let bh = d.targetBlackHole;
        if (bh) {
          d.x = lerp(d.x, bh.x, 0.2);
          d.y = lerp(d.y, bh.y, 0.2);
          d.size *= 0.85; 
        }
        if (d.size < 2) {
          dinosaurs.splice(i, 1);
          killCount++;
          if (killCount >= targetKills) gameState = "WIN";
          else dinosaurs.push(new Dinosaur()); 
        }
      } else {
        d.seek(player.x, player.y);
        d.update();
        if (d.checkAttack(player)) {
          dmgEffects.push(new DamageShockwave(player.x, player.y));
          shakeTimer = 10; // 被打時畫面搖晃
          if (player.hp <= 0) {
            gameState = "LOSE";
            shakeTimer = 30; // 失敗時劇烈搖晃
          }
        }
      }
      d.display();
    }

    // 3. 玩家更新
    player.update();
    player.display();

    // 4. 遊戲中粒子更新
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].display();
      if (particles[i].isDead()) particles.splice(i, 1);
    }
    for (let i = dmgEffects.length - 1; i >= 0; i--) {
      dmgEffects[i].update();
      dmgEffects[i].display();
      if (dmgEffects[i].isDead()) dmgEffects.splice(i, 1);
    }

    drawUI();
  } else {
    // 進入炫酷結算動畫狀態
    drawAdvancedEndScreen();
  }
}

function mousePressed() {
  if (gameState === "PLAY") {
    for (let i = dinosaurs.length - 1; i >= 0; i--) {
      let d = dinosaurs[i];
      if (!d.isBeingDevoured && dist(mouseX, mouseY, d.x, d.y) < d.size * 2.5) {
        let bh = new BlackHole(d.x + random(-10, 10), d.y - 10);
        blackHoles.push(bh);
        d.isBeingDevoured = true;
        d.targetBlackHole = bh;
        break;
      }
    }
  }
}

function triggerExplosion(x, y) {
  for (let i = 0; i < 50; i++) {
    particles.push(new ExplodeParticle(x, y));
  }
}

function drawPrairie() {
  background(135, 206, 235); 
  fill(40, 150, 60); 
  rect(0, 250, width, height - 250);
}

function drawUI() {
  fill(0, 180); rect(15, 15, 200, 25, 5);
  fill(255); textSize(14);
  text(`KILLS: ${killCount} / ${targetKills}`, 25, 32);
  fill(255, 215, 0); rect(120, 22, map(killCount, 0, targetKills, 0, 80), 10);

  fill(0, 180); rect(15, 45, 200, 25, 5);
  fill(255); text(`HP: ${player.hp} / 15`, 25, 62);
  fill(220, 40, 40); rect(120, 52, map(player.hp, 0, 15, 0, 80), 10);
}

// ==========================================
// --- 炫酷結算動畫系統 ---
// ==========================================
function drawAdvancedEndScreen() {
  background(15); // 深黑色高質感背景

  // 每影格隨機生成結算特效粒子
  if (gameState === "WIN") {
    // 勝利：兩側不斷噴發動態慶祝煙火
    if (frameCount % 3 === 0) {
      endScreenParticles.push(new EndParticle(random(50, 150), height, color(255, random(100, 255), 0), "UP"));
      endScreenParticles.push(new EndParticle(random(width-150, width-50), height, color(0, 255, random(100, 255)), "UP"));
    }
  } else if (gameState === "LOSE") {
    // 失敗：畫面上方落下毀滅性灰燼
    if (frameCount % 2 === 0) {
      endScreenParticles.push(new EndParticle(random(width), 0, color(random(150, 255), 0, 0), "DOWN"));
    }
  }

  // 更新與繪製結算粒子
  for (let i = endScreenParticles.length - 1; i >= 0; i--) {
    endScreenParticles[i].update();
    endScreenParticles[i].display();
    if (endScreenParticles[i].isDead()) endScreenParticles.splice(i, 1);
  }

  // 繪製前景與文字
  textAlign(CENTER);
  noStroke();

  if (gameState === "WIN") {
    // 霓虹文字發光感
    fill(255, 215, 0, 50); textSize(44); text("VICTORY!", width / 2 + sin(frameCount*0.1)*2, 122);
    fill(255, 255, 200); textSize(42); text("VICTORY!", width / 2, 120);
    
    // 炫酷舞台聚光燈
    fill(255, 255, 255, 15);
    triangle(width/2, 0, width/2 - 120, height, width/2 + 120, height);

    // 火柴人
    stroke(255); strokeWeight(5); noFill();
    let cx = width / 2; let cy = height - 160;
    ellipse(cx, cy - 80, 30); 
    line(cx, cy - 65, cx, cy - 10); 
    // 動態揮手
    let waveL = sin(frameCount * 0.15) * 15;
    let waveR = cos(frameCount * 0.15) * 15;
    line(cx, cy - 50, cx - 30, cy - 70 + waveL); 
    line(cx, cy - 50, cx + 30, cy - 70 + waveR); 
    line(cx, cy - 10, cx - 20, cy + 40); line(cx, cy - 10, cx + 20, cy + 40); 
    
    // 懸浮動態皇冠 + 能量光圈
    let crownY = cy - 105 + sin(frameCount * 0.08) * 6;
    fill(255, 255, 0, 40); ellipse(cx, crownY + 10, 50, 15); // 光暈
    fill(255, 215, 0); noStroke();
    beginShape();
    vertex(cx - 20, crownY); vertex(cx - 25, crownY - 20);
    vertex(cx - 10, crownY - 11); vertex(cx, crownY - 28);
    vertex(cx + 10, crownY - 11); vertex(cx + 25, crownY - 20);
    vertex(cx + 20, crownY);
    endShape(CLOSE);

  } else if (gameState === "LOSE") {
    // 失敗文字動態放大與血紅閃爍
    let sizePulse = map(sin(frameCount * 0.1), -1, 1, 40, 46);
    fill(random(150, 255), 0, 0);
    textSize(sizePulse);
    text("GAME OVER", width / 2, height / 2);
    
    // 繪製地面的毀滅裂痕線條
    stroke(100, 0, 0); strokeWeight(3);
    for(let i=0; i<5; i++) {
       line(width/2 - 100 + i*40, height/2 + 50, width/2 - 80 + i*40 + random(-10,10), height/2 + 90);
    }
  }
}

// 專用結算畫面炫酷粒子類別
class EndParticle {
  constructor(x, y, col, dir) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.dir = dir;
    this.alpha = 255;
    this.size = random(4, 10);
    
    if (this.dir === "UP") {
      this.vx = random(-3, 3);
      this.vy = random(-8, -14); // 向上衝
    } else {
      this.vx = random(-1, 1);
      this.vy = random(2, 6);   // 向下落
    }
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.dir === "UP") this.vy += 0.2; // 受重力影響下墜變成煙火
    this.alpha -= 4;
  }
  display() {
    push();
    noFill();
    stroke(red(this.col), green(this.col), blue(this.col), this.alpha);
    strokeWeight(2);
    // 繪製發光十字星或是方塊
    translate(this.x, this.y);
    rotate(frameCount * 0.05);
    line(-this.size, 0, this.size, 0);
    line(0, -this.size, 0, this.size);
    pop();
  }
  isDead() { return this.alpha <= 0 || this.y > height + 20; }
}

// ==========================================
// --- 原有基礎類別（保留並維持優化內容） ---
// ==========================================
class Shooter {
  constructor() { this.x = width / 2; this.y = height / 2; this.hp = 15; }
  update() { this.x = lerp(this.x, mouseX, 0.2); this.y = lerp(this.y, mouseY, 0.2); }
  display() {
    push(); translate(this.x, this.y); stroke(0); strokeWeight(4); fill(50, 80, 150);
    ellipse(0, -20, 20, 20); line(0, -10, 0, 15); 
    let angle = atan2(mouseY - this.y, mouseX - this.x); rotate(angle);
    stroke(50); line(0, -5, 25, -5); strokeWeight(5); stroke(0); rect(20, -8, 10, 5); pop();
  }
}

class Dinosaur {
  constructor() {
    this.x = random(width); this.y = random(280, height - 50); this.size = 25;
    this.speed = random(0.8, 1.6); this.vx = 0; this.vy = 0;
    this.isBeingDevoured = false; this.targetBlackHole = null; this.attackCooldown = 0;
  }
  seek(tx, ty) { let angle = atan2(ty - this.y, tx - this.x); this.vx = cos(angle) * this.speed; this.vy = sin(angle) * this.speed; }
  update() { this.x += this.vx; this.y += this.vy; if (this.attackCooldown > 0) this.attackCooldown--; }
  display() {
    push(); translate(this.x, this.y); if (this.vx < 0) scale(-1, 1); fill(30, 100, 50); noStroke();
    ellipse(0, 0, this.size * 1.6, this.size); triangle(-this.size * 0.7, 0, -this.size * 1.8, 5, -this.size * 0.7, 10); 
    push(); translate(this.size * 0.6, -this.size * 0.4); rotate(-QUARTER_PI); ellipse(0, 0, this.size * 0.8, this.size * 1.2); pop();
    fill(20, 70, 40); triangle(-10, -this.size*0.5, -5, -this.size*0.8, 0, -this.size*0.5); triangle(0, -this.size*0.5, 5, -this.size*0.8, 10, -this.size*0.5);
    stroke(30, 100, 50); strokeWeight(4); line(-5, 10, -8, 22); line(15, 10, 12, 22); pop();
  }
  checkAttack(target) {
    if (this.attackCooldown <= 0 && dist(this.x, this.y, target.x, target.y) < 40) {
      target.hp -= floor(random(1, 4)); this.attackCooldown = 60; return true;
    }
    return false;
  }
}

class BlackHole {
  constructor(x, y) { this.x = x; this.y = y; this.radius = 40; this.life = 15; this.angle = 0; }
  update() { this.life--; this.angle += 0.3; }
  display() {
    push(); translate(this.x, this.y); rotate(this.angle); stroke(138, 43, 226, 150); strokeWeight(2);
    for (let i = 0; i < 8; i++) { rotate(TWO_PI / 8); line(this.radius * 2, 0, this.radius * 0.5, 0); }
    noStroke(); fill(0); ellipse(0, 0, this.radius, this.radius); fill(75, 0, 130, 100); ellipse(0, 0, this.radius * 1.3, this.radius * 1.3); pop();
  }
  isDead() { return this.life <= 0; }
}

class ExplodeParticle {
  constructor(x, y) {
    this.x = x; this.y = y; let angle = random(TWO_PI); let speed = random(4, 12);
    this.vx = cos(angle) * speed; this.vy = sin(angle) * speed; this.alpha = 255; this.size = random(8, 16);
    this.col = random([color(255, 0, 128), color(0, 255, 128), color(0, 128, 255)]);
  }
  update() { this.x += this.vx; this.y += this.vy; this.vx *= 0.95; this.vy *= 0.95; this.alpha -= 8; }
  display() {
    push(); noStroke(); fill(red(this.col), green(this.col), blue(this.col), this.alpha);
    rectMode(CENTER); translate(this.x, this.y); rotate(frameCount * 0.2); rect(0, 0, this.size, this.size); pop();
  }
  isDead() { return this.alpha <= 0; }
}

class DamageShockwave {
  constructor(x, y) { this.x = x; this.y = y; this.r = 10; this.alpha = 255; }
  update() { this.r += 4; this.alpha -= 10; }
  display() { push(); noFill(); stroke(255, 0, 0, this.alpha); strokeWeight(6); ellipse(this.x, this.y, this.r, this.r); pop(); }
  isDead() { return this.alpha <= 0; }
}