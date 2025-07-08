let canvas;
let ctx;
let particles = [];
let stardusts = [];
let pathQueue = [];

let config = {
    stardustColor: '#ffffff',
    stardustCount: 70,
    maxParticles: 250,
};

const pointer = {
    isTracking: false,
};

const emitter = {
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    lerpAmount: 0.22,
    particleDensity: 2,
};

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3.5 + 1.5;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        const colors = ['#a0e7fa', '#f7a8b8', '#ffffff', '#ff6b9d'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.life = Math.random() * 0.8 + 0.5;
        this.decay = 0.015;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        if (this.size > 0.2) this.size -= 0.08;
    }
    draw(context) {
        if (this.life <= 0 || this.size <= 0.2) return false;
        context.globalAlpha = this.life;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
        return true;
    }
}

class Stardust {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = (Math.random() * 0.5 + 0.2) * (Math.random() < 0.5 ? 1 : -1);
        this.opacity = Math.random() * 0.5 + 0.2;
    }
    update() {
        this.y += this.speedY;
        if (this.y > canvas.height) { this.y = 0; this.x = Math.random() * canvas.width; }
        else if (this.y < 0) { this.y = canvas.height; this.x = Math.random() * canvas.width; }
    }
    draw(context) {
        context.globalAlpha = this.opacity;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = config.stardustColor;
        context.fill();
    }
}

function initStardust() {
    stardusts = [];
    for (let i = 0; i < config.stardustCount; i++) {
        stardusts.push(new Stardust());
    }
}

function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    stardusts.forEach(star => {
        star.update();
        star.draw(ctx);
    });
    
    if (pathQueue.length > 0) {
        const target = pathQueue[0];
        const dx = target.x - emitter.x;
        const dy = target.y - emitter.y;
        
        emitter.prevX = emitter.x;
        emitter.prevY = emitter.y;

        if (Math.hypot(dx, dy) < 0.1) {
            emitter.x = target.x;
            emitter.y = target.y;
            pathQueue.shift();
        } else {
            emitter.x += dx * emitter.lerpAmount;
            emitter.y += dy * emitter.lerpAmount;
        }

        const moveDist = Math.hypot(emitter.x - emitter.prevX, emitter.y - emitter.prevY);
        if (moveDist > 1) {
             const steps = Math.max(1, Math.floor(moveDist / emitter.particleDensity));
             for (let i = 0; i < steps; i++) {
                 if (particles.length >= config.maxParticles) break;
                 const t = i / steps;
                 const x = emitter.prevX + (emitter.x - emitter.prevX) * t;
                 const y = emitter.prevY + (emitter.y - emitter.prevY) * t;
                 particles.push(new Particle(x, y));
             }
        }
    } else if (!pointer.isTracking) {
        // Queue is empty and pointer is up, do nothing.
    } else {
        // Queue is empty but pointer is still down, means it's stationary.
        // We can add a subtle breathing effect here if desired, but for now, do nothing.
    }
    
    particles = particles.filter(p => {
        p.update();
        return p.draw(ctx);
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
}

self.onmessage = (e) => {
    switch (e.data.type) {
        case 'init':
            canvas = e.data.canvas;
            ctx = canvas.getContext('2d');
            canvas.width = e.data.width;
            canvas.height = e.data.height;
            config.stardustColor = e.data.stardustColor;
            initStardust();
            animate();
            break;
        case 'resize':
            canvas.width = e.data.width;
            canvas.height = e.data.height;
            initStardust();
            break;
        case 'themeChange':
            config.stardustColor = e.data.stardustColor;
            break;
        case 'start':
            pointer.isTracking = true;
            pathQueue = [{ x: e.data.x, y: e.data.y }];
            emitter.x = e.data.x;
            emitter.y = e.data.y;
            break;
        case 'move':
            if (pointer.isTracking) {
                pathQueue.push({ x: e.data.x, y: e.data.y });
            }
            break;
        case 'end':
            pointer.isTracking = false;
            break;
    }
};