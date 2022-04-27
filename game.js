"use strict";

// Adquirindo o elemento canvas e seu contexto
const canvas = document.getElementById("game");
const c = canvas.getContext("2d");

// Configurando as dimensões com um aspect-ratio 16:9
canvas.width = 1024;
canvas.height = 576;

const gravity = 0.45;

const menu = document.querySelector(".shop");
const gold = document.querySelector(".gold");

const cards = document.querySelectorAll(".card");
const dmgPrice = document.querySelector(".dmg-price");
const cdrPrice = document.querySelector(".cdr-price");
const vlcPrice = document.querySelector(".vlc-price");
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
    c.fillStyle = "white";
    c.fillRect(
      this.position.x,
      this.position.y,
      this.size.width,
      this.size.height
    );
  }

  // Responsavel por todas as alterações de posição do player
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.position.y + this.size.height + this.velocity.y >= canvas.height) {
      this.velocity.y = 0;
      this.isOnGround = true;
    } else {
      this.velocity.y += gravity;
      this.isOnGround = false;
    }
  }
}
const randomColor = function () {
  const randomR = Math.trunc(Math.random() * 255) + 1;
  const randomG = Math.trunc(Math.random() * 255) + 1;
  const randomB = Math.trunc(Math.random() * 255) + 1;

  return `rgb(${randomR}, ${randomG}, ${randomB})`;
};
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
  { width: 50, height: 150 },
  { isOnGround: false },
  10,
  300,
  600,
  0.5,
  0
);
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
const projectiles = [];

const createProjectile = function (e) {
  const angle = Math.atan2(
    e.clientY - player.position.y,
    e.clientX - player.position.x + player.size.width / 2
  );
  console.log(angle, Math.cos(angle), Math.sin(angle));
  projectiles.push(
    new Projectile(
      {
        x: player.position.x + player.size.width / 2,
        y: player.position.y,
      },
      {
        x: Math.cos(angle) * 9 * player.projectileVelocity,
        y: Math.sin(angle) * 16 * player.projectileVelocity,
      },
      7
    )
  );
};

canvas.addEventListener(
  "click",
  throttle(createProjectile, player.cooldown),
  true
);
const enemies = [];
let spawnSpeed = 2000;
let radius = 0;
let enemyHealth = 30;
let enemyDamage = 8;

setInterval(() => {
  const x = Math.trunc(Math.random() * canvas.width);
  const y = -100;
  // prettier-ignore
  const angle = Math.atan2(
    (player.position.y + (player.size.height / 2)) - y,
    (player.position.x + (player.size.width / 2)) - x,
  );
  radius = Math.trunc(Math.random() * 40) + 20;
  enemyDamage *= 1.01;
  enemyHealth *= 1.01;
  spawnSpeed *= 0.99;
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
}, spawnSpeed);

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

document.addEventListener("keydown", function (e) {
  switch (e.key) {
    case "d":
      keyPressed.d.pressed = true;
      lastKeyPressed = "d";
      return;
    case "a":
      keyPressed.a.pressed = true;
      lastKeyPressed = "a";
      return;
    case "w":
      if (player.isOnGround) {
        player.velocity.y = -10;
        return;
      }
  }
});

document.addEventListener("keyup", function (e) {
  switch (e.key) {
    case "d":
      keyPressed.d.pressed = false;
      return;
    case "a":
      keyPressed.a.pressed = false;
      return;
  }
});
const detectCollision = function (enemy, index) {
  if (
    enemy.position.x + enemy.radius * 2 < 0 ||
    enemy.position.x + enemy.radius * 2 > canvas.width ||
    enemy.position.y - enemy.radius * 2 > canvas.height
  ) {
    setTimeout(() => {
      enemies.splice(index, 1);
    }, 0);
  }
};
const particles = [];
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
        player.gold += 30;
        player.health += 10;
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
const health = document.querySelector(".health");
health.style.width = `${player.health}px`;
const detectCollisionWithPlayer = function (enemy, index) {
  if (
    enemy.position.y >= player.position.y &&
    enemy.position.x >= player.position.x &&
    enemy.position.x < player.position.x + player.size.width
  ) {
    enemies.splice(index, 1);
    player.health -= enemy.damage;
    health.style.width = `${player.health}px`;
  }
  if (player.health <= 0) {
    window.cancelAnimationFrame(raf);
  }
};

let raf;
const background = new Image();
background.src =
  "https://img.wallpapersafari.com/desktop/1024/576/36/19/KODTtH.jpg";
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
}
animate();
let close = true;
let damagePrice = 100;
let cooldownPrice = 100;
let velocityPrice = 100;

window.addEventListener("keydown", function (e) {
  if (e.key === "b") {
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
      close = !close;
    } else {
      animate();
      close = !close;
    }
  }
});
