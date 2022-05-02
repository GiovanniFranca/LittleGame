"use strict";

// Adquirindo o elemento canvas e seu contexto
const canvas = document.getElementById("game");
const c = canvas.getContext("2d");

// Configurando as dimensões com um aspect-ratio 16:9
canvas.width = 1024;
canvas.height = 576;

const sprite = new Image();
sprite.src = "sprite.png";

let raf;
const background = new Image();
background.src = "https://wallpaperaccess.com/full/869.jpg";

const gravity = 0.45;

const menu = document.querySelector(".shop");
const gold = document.querySelector(".gold");

const cards = document.querySelectorAll(".card");
const dmgPrice = document.querySelector(".dmg-price");
const cdrPrice = document.querySelector(".cdr-price");
const vlcPrice = document.querySelector(".vlc-price");

let flipped = true;
let gameover = false;
let spawnSpeed = 2000;
let radius;
let enemyHealth;
let enemyDamage;

let close;
let damagePrice;
let cooldownPrice;
let velocityPrice;

const spriteSize = 32;
let frameX = 0;
let frameY = 0;
let gameFrame = 0;
let size = 4;
const staggerFrames = 7;

const health = document.querySelector(".health");

const keyPressed = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  w: {
    pressed: false,
  },
};
let lastKeyPressed;

const particles = [];
const projectiles = [];
const enemies = [];

/////////////////////////////////////////
// FUNCTIONS
const drawSprite = function () {
  c.drawImage(
    sprite,
    0,
    0,
    32,
    32,
    player.position.x,
    player.position.y,
    32,
    32
  );
};

const randomColor = function () {
  const randomR = Math.trunc(Math.random() * 255) + 1;
  const randomG = Math.trunc(Math.random() * 255) + 1;
  const randomB = Math.trunc(Math.random() * 255) + 1;

  return `rgb(${randomR}, ${randomG}, ${randomB})`;
};

const detectCollisionWithPlayer = function (enemy, index) {
  if (
    enemy.position.y + enemy.radius - player.size.height >= player.position.y &&
    enemy.position.x + enemy.radius - player.size.height >= player.position.x &&
    enemy.position.x - enemy.radius - player.size.height <
      player.position.x + player.size.width / 2
  ) {
    enemies.splice(index, 1);
    player.health -= enemy.damage;
    health.style.width = `${player.health}px`;
  }
  if (player.health <= 0) {
    enemies.length = 0;
    gameover = true;
    window.cancelAnimationFrame(raf);
    window.addEventListener("keydown", (e) => {
      if (e.key === "r" && gameover) init();
    });
  }
};

const detectCollision = function (enemy, index) {
  if (
    enemy.position.x + enemy.radius < 0 ||
    enemy.position.x + enemy.radius > canvas.width ||
    enemy.position.y - enemy.radius * 2 > canvas.height
  ) {
    setTimeout(() => {
      enemies.splice(index, 1);
    }, 0);
  }
};

const detectProjectileCollision = function (projectile, enemy, index, indexP) {
  const distance = Math.hypot(
    projectile.position.x - enemy.position.x,
    projectile.position.y - enemy.position.y
  );
  if (distance - projectile.radius - enemy.radius < 1) {
    enemy.health -= player.damage;
    setTimeout(() => {
      projectiles.splice(indexP, 1);
    }, 0);
    if (enemy.health <= 0) {
      setTimeout(() => {
        enemies.splice(index, 1);
        player.gold += 20;
        player.health += 5;
        health.style.width = `${player.health}px`;
        gold.textContent = `${player.gold}G`;

        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              { x: projectile.position.x, y: projectile.position.y },
              Math.random() * 4,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 8),
                y: (Math.random() - 0.5) * (Math.random() * 8),
              }
            )
          );
        }
      }, 0);
    }
  }
};
const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function () {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

// Inicia e configura todas as propriedades relativa ao player
class Player {
  // prettier-ignore
  constructor(position, velocity, size, isOnGround, damage, health, cooldown, projectileVelocity, gold) {
    this.position = position;
    this.velocity = velocity;
    this.size = size;
    this.isOnGround = isOnGround;
    this.damage = damage;
    this.health = health;
    this.cooldown = cooldown;
    this.projectileVelocity = projectileVelocity;
    this.gold = gold
  }
  // Responsavel por re-desenhar o player a cada frame
  draw() {
    c.drawImage(
      sprite,
      spriteSize * frameX,
      frameY * spriteSize + 1,
      spriteSize,
      spriteSize,
      player.position.x,
      player.position.y,
      spriteSize * 2,
      spriteSize * 2
    );
    if (gameFrame % staggerFrames === 0) {
      if (frameX < size) frameX++;
      else frameX = 0;
    }
    gameFrame++;
  }

  // Responsavel por todas as alterações de posição do player
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (
      this.position.y + this.size.height + this.velocity.y >=
      canvas.height - 32
    ) {
      this.velocity.y = 0;
      this.isOnGround = true;
    } else {
      this.velocity.y += gravity;
      this.isOnGround = false;
    }
  }
}

class Enemy {
  constructor(position, velocity, radius, health, damage, color) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.health = health;
    this.damage = damage;
    this.color = randomColor();
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.color;
    c.fill();
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Particle {
  constructor(position, radius, color, velocity) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.alpha = 1;
  }

  draw() {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.alpha -= 0.01;
  }
}

class Projectile {
  constructor(position, velocity, radius) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = "white";
    c.fill();
  }
  update(p, index) {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (
      this.position.x - this.radius < 0 ||
      this.position.x - this.radius > canvas.width ||
      this.position.y - this.radius < 0 ||
      this.position.y - this.radius > canvas.height
    ) {
      projectiles.splice(index, 1);
    }
  }
}

const player = new Player(
  { x: 100, y: 100 },
  { x: 0, y: 2 },
  { width: 32, height: 32 },
  { isOnGround: false },
  10,
  300,
  600,
  0.5,
  0
);

const createProjectile = function (e) {
  const angle = Math.atan2(
    e.clientY - player.position.y,
    e.clientX - player.position.x - player.size.width * 5.6
  );
  console.log(e.clientX - player.position.x);
  projectiles.push(
    new Projectile(
      {
        x: player.position.x + 32,
        y: player.position.y + 32,
      },
      {
        x: Math.cos(angle) * 5 * player.projectileVelocity,
        y: Math.sin(angle) * 5 * player.projectileVelocity,
      },
      4
    )
  );
};

const spawnEnemies = () => {
  const x = Math.trunc(Math.random() * canvas.width);
  const y = -100;
  // prettier-ignore
  const angle = Math.atan2(
    (player.position.y + (player.size.height / 2)) - y,
    (player.position.x + (player.size.width / 2)) - x,
  );
  radius = Math.trunc(Math.random() * 40) + 20;
  enemyDamage *= 1.01;
  enemyHealth *= 1.02;
  spawnSpeed *= 0.999;
  enemies.push(
    new Enemy(
      { x: x, y: y },
      { x: Math.cos(angle) * 4, y: Math.sin(angle) * 4 },
      radius,
      enemyHealth,
      enemyDamage
    )
  );
  setInterval(() => {
    enemies.forEach((e) => {
      const angle = Math.atan2(
        player.position.y + player.size.height / 2 - e.position.y,
        player.position.x + player.size.width / 2 - e.position.x
      );

      e.velocity.y = Math.sin(angle) * 4;
      e.velocity.x = Math.cos(angle) * 4;
    });
  }, 800);
};

function animate() {
  raf = window.requestAnimationFrame(animate);
  c.drawImage(background, 0, 0, canvas.width, canvas.height);

  player.velocity.x = 0;
  if (keyPressed.d.pressed && lastKeyPressed === "d") {
    player.velocity.x = 5;
  } else if (keyPressed.a.pressed && lastKeyPressed === "a") {
    player.velocity.x = -5;
  }
  if (player.position.x < 0) {
    player.velocity.x = 1;
  }
  if (player.position.x + player.size.width > canvas.width) {
    player.velocity.x = -1;
  }

  player.update();
  projectiles.forEach((p, index) => p.update(p, index));
  enemies.forEach((enemy, index) => {
    enemy.update();
    projectiles.forEach((projectile, indexP) => {
      detectProjectileCollision(projectile, enemy, index, indexP);
    });
    detectCollision(enemy, index);
    detectCollisionWithPlayer(enemy, index);
  });
  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });

  // Sprite
}

let spawn = setInterval(spawnEnemies, spawnSpeed);
if (!gameover) {
  window.addEventListener("keydown", function (e) {
    if (e.key === (gameover ? "" : "b")) {
      menu.classList.toggle("hidden");
      menu.addEventListener("click", function (e) {
        if (e.target.closest(".card").classList.contains("damage")) {
          if (+player.gold >= damagePrice) {
            player.damage += 8;
            player.gold -= damagePrice;
            damagePrice += 50;
            gold.textContent = player.gold;
            dmgPrice.textContent = damagePrice;
          }
        }
        if (e.target.closest(".card").classList.contains("cooldown")) {
          if (+player.gold >= cooldownPrice) {
            player.cooldown -= 60;
            player.gold -= cooldownPrice;
            gold.textContent = player.gold;
            cooldownPrice += 50;
            cdrPrice.textContent = cooldownPrice;
          }
        }
        if (e.target.closest(".card").classList.contains("velocity")) {
          if (+player.gold >= velocityPrice) {
            player.projectileVelocity += 0.1;
            player.gold -= velocityPrice;
            gold.textContent = player.gold;
            velocityPrice += 50;
            vlcPrice.textContent = velocityPrice;
          }
        }
      });
      if (close) {
        this.window.cancelAnimationFrame(raf);
        this.clearInterval(spawn);
        close = !close;
      } else {
        animate();
        close = !close;
        spawn = setInterval(spawnEnemies, spawnSpeed);
      }
    }
  });
  document.addEventListener("keydown", function (e) {
    switch (e.key) {
      case "d":
        keyPressed.d.pressed = true;
        lastKeyPressed = "d";
        frameY = 2;
        size = 7;
        return;
      case "a":
        keyPressed.a.pressed = true;
        frameY = 4;
        size = 7;
        lastKeyPressed = "a";
        return;
      case "w":
        if (player.isOnGround) {
          player.velocity.y = -10;
          if (keyPressed.d.pressed || lastKeyPressed === "d") {
            frameY = 3;
            size = 10;
          } else if (keyPressed.a.pressed || lastKeyPressed === "a") {
            frameY = 5;
            size = 10;
          }
          return;
        }
    }
  });

  document.addEventListener("keyup", function (e) {
    switch (e.key) {
      case "d":
        keyPressed.d.pressed = false;
        frameY = 0;
        size = 4;
        frameX = 0;
        return;
      case "a":
        keyPressed.a.pressed = false;
        frameY = 0;
        size = 4;
        frameX = 0;
        return;
      case "w":
        setTimeout(() => {
          if (keyPressed.d.pressed) {
            frameY = 0;
            size = 4;
            frameX = 0;
          } else if (keyPressed.a.pressed) {
            frameY = 4;
            size = 4;
            frameX = 0;
          }
        }, 500);
        return;
    }
  });
  canvas.addEventListener(
    "click",
    throttle(createProjectile, player.cooldown),
    true
  );
}
const init = function () {
  gameover = false;

  particles.length = 0;
  projectiles.length = 0;
  enemies.length = 0;

  keyPressed.a.pressed = false;
  keyPressed.d.pressed = false;
  keyPressed.w.pressed = false;

  spawnSpeed = 2000;
  enemyHealth = 30;
  enemyDamage = 8;
  close = true;

  damagePrice = 100;
  cooldownPrice = 100;
  velocityPrice = 100;
  vlcPrice.textContent = velocityPrice;
  dmgPrice.textContent = velocityPrice;
  cdrPrice.textContent = velocityPrice;

  player.position.x = 100;
  player.position.y = 100;
  player.velocity.x = 0;
  player.velocity.y = 2;
  player.size.width = 32;
  player.size.height = 32;
  player.damage = 10;
  player.health = 200;
  player.cooldown = 600;
  player.projectileVelocity = 0.5;
  player.gold = 0;
  health.style.width = `${player.health}px`;
  gold.textContent = player.gold;

  animate();
};
const listner = function () {
  init();
  document.querySelector(".overlay").style.display = "none";
  window.removeEventListener("keydown", listner, false);
};

const start = window.addEventListener("keydown", listner);
