let canvas;
let ctx;
let particles = [];
let stardusts = [];

let config = {
    stardustColor: '#ffffff',
    stardustCount: 70,
    maxParticles: 250,
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
            if (particles.length < config.maxParticles) {
                particles.push(new Particle(e.data.x, e.data.y));
            }
            break;
        case 'pointerMove':
            if (e.data.points) {
                e.data.points.forEach(point => {
                    if (particles.length < config.maxParticles) {
                        particles.push(new Particle(point.x, point.y));
                    }
                });
            }
            break;
        case 'pointerEnd':
            break;
    }
};