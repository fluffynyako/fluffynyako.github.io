let canvas;
let ctx;
let particles = [];
let stardusts = [];
let pathQueue = [];

let config = {
    stardustColor: '#ffffff',
    stardustCount: 70,
};

const pointer = {
    x: 0,
    y: 0,
    isTracking: false,
};

const emitter = {
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    lerpAmount: 0.2,
    particleDensity: 3,
};

class Particle {
    constructor(x, y, isSpark) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = isSpark ? Math.random() * 3 + 1.5 : Math.random() * 1.5;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed;
        this.life = isSpark ? Math.random() * 0.4 + 0.2 : Math.random() * 0.8 + 0.5;
        this.decay = isSpark ? 0.04 : 0.015;
        this.size = isSpark ? Math.random() * 2 + 1 : Math.random() * 3.5 + 1;
        const colors = isSpark ? ['#ffffff', '#ff6b9d'] : ['#a0e7fa', '#f7a8b8'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
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

    if (pointer.isTracking && pathQueue.length === 0) {
        pathQueue.push({ x: pointer.x, y: pointer.y });
    }

    if (pathQueue.length > 0) {
        const target = pathQueue[0];
        const dx = target.x - emitter.x;
        const dy = target.y - emitter.y;
        
        emitter.prevX = emitter.x;
        emitter.prevY = emitter.y;

        if (Math.hypot(dx, dy) < 1) {
            emitter.x = target.x;
            emitter.y = target.y;
            pathQueue.shift();
        } else {
            emitter.x += dx * emitter.lerpAmount;
            emitter.y += dy * emitter.lerpAmount;
        }

        const moveDist = Math.hypot(emitter.x - emitter.prevX, emitter.y - emitter.prevY);
        const steps = Math.max(1, Math.floor(moveDist / emitter.particleDensity));
        for (let i = 0; i < steps; i++) {
            if (particles.length >= 250) break;
            const t = i / steps;
            const x = emitter.prevX + (emitter.x - emitter.prevX) * t;
            const y = emitter.prevY + (emitter.y - emitter.prevY) * t;
            particles.push(new Particle(x, y, false));
        }
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
        case 'pointerStart':
            pointer.isTracking = true;
            pointer.x = e.data.x;
            pointer.y = e.data.y;
            pathQueue = [{ x: e.data.x, y: e.data.y }];
            emitter.x = e.data.x;
            emitter.y = e.data.y;
            break;
        case 'pointerMove':
            if (pointer.isTracking) {
                pointer.x = e.data.x;
                pointer.y = e.data.y;
                pathQueue.push({ x: e.data.x, y: e.data.y });
                if (particles.length < 250) {
                     for (let i = 0; i < 2; i++) {
                        particles.push(new Particle(e.data.x, e.data.y, true));
                     }
                }
            }
            break;
        case 'pointerEnd':
            pointer.isTracking = false;
            break;
    }
};