class Petal {
    constructor(angle, radius, size, layer, baseWidth, curl) {
        this.angle = angle;
        this.baseAngle = angle;
        this.radius = radius;
        this.baseRadius = radius;
        this.size = size;
        this.layer = layer;
        this.baseWidth = baseWidth;
        this.curl = curl;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.015 + Math.random() * 0.01;
        this.twist = (Math.random() > 0.5 ? 1 : -1) * 0.1;
        
        this.isFalling = false;
        this.fallProgress = 0;
        this.fallX = 0;
        this.fallY = 0;
        this.fallVx = 0;
        this.fallVy = 0;
        this.fallRotation = 0;
        this.fallRotationSpeed = 0;
        this.opacity = 1;
        
        this.isBlooming = false;
        this.bloomProgress = 0;
    }
    
    startFalling(centerX, centerY, scale) {
        this.isFalling = true;
        this.fallProgress = 0;
        
        const currentX = centerX + Math.cos(this.angle) * this.radius * scale;
        const currentY = centerY - Math.sin(this.angle) * this.radius * scale;
        
        this.fallX = currentX;
        this.fallY = currentY;
        this.fallVx = (Math.random() - 0.5) * 4;
        this.fallVy = -2 - Math.random() * 3;
        this.fallRotation = this.angle;
        this.fallRotationSpeed = (Math.random() - 0.5) * 0.3;
        this.opacity = 1;
    }
    
    updateFalling() {
        if (!this.isFalling) return;
        
        this.fallProgress += 0.01;
        this.fallX += this.fallVx;
        this.fallY += this.fallVy;
        this.fallVy += 0.2;
        this.fallVx *= 0.99;
        this.fallRotation += this.fallRotationSpeed;
        
        const maxY = window.innerHeight - 180;
        if (this.fallY > maxY) {
            this.fallY = maxY;
            this.fallVy = 0;
            this.fallVx *= 0.85;
            this.fallRotationSpeed = 0;
        }
        
        if (this.fallProgress > 2.0) {
            this.opacity = Math.max(0.85, 1 - (this.fallProgress - 2.0) * 0.05);
        }
    }
    
    startBlooming() {
        this.isBlooming = true;
        this.isFalling = false;
        this.bloomProgress = 0;
        this.opacity = 0;
    }
    
    updateBlooming() {
        if (!this.isBlooming) return;
        
        this.bloomProgress += 0.03;
        this.opacity = Math.min(1, this.bloomProgress);
        
        if (this.bloomProgress >= 1) {
            this.isBlooming = false;
            this.bloomProgress = 0;
        }
    }
    
    isActive() {
        return !this.isFalling && !this.isBlooming;
    }
}

class Rose {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        
        this.style = 'watercolor';
        this.baseColor = '#dc143c';
        this.growthProgress = 0;
        this.targetGrowth = 1;
        this.particles = [];
        this.mouseX = this.centerX;
        this.mouseY = this.centerY;
        this.lastTapTime = 0;
        this.bloomPulse = 0;
        
        this.petals = this.createRosePetalStructure();
        this.updatePetalCount();
        
        window.addEventListener('resize', () => this.resize());
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2.2;
        this.scale = Math.min(this.canvas.width, this.canvas.height) / 4.5;
    }
    
    createRosePetalStructure() {
        const petals = [];
        
        const outerCount = 8;
        for (let i = 0; i < outerCount; i++) {
            const angle = (i / outerCount) * Math.PI * 2;
            petals.push(new Petal(angle, 0.15, 1.2, 0, 0.9, 0.3));
        }
        
        const middleCount = 13;
        for (let i = 0; i < middleCount; i++) {
            const angle = (i / middleCount) * Math.PI * 2 + 0.12;
            petals.push(new Petal(angle, 0.12, 0.95, 1, 0.75, 0.5));
        }
        
        const innerCount = 8;
        for (let i = 0; i < innerCount; i++) {
            const angle = (i / innerCount) * Math.PI * 2 + 0.2;
            petals.push(new Petal(angle, 0.08, 0.7, 2, 0.6, 0.7));
        }
        
        const centerCount = 5;
        for (let i = 0; i < centerCount; i++) {
            const angle = (i / centerCount) * Math.PI * 2;
            petals.push(new Petal(angle, 0.05, 0.5, 3, 0.5, 0.9));
        }
        
        return petals;
    }
    
    updatePetalCount() {
        const activePetals = this.petals.filter(p => p.isActive() || p.isBlooming).length;
        const counter = document.getElementById('petalCount');
        if (counter) {
            counter.textContent = activePetals;
            counter.style.transform = 'scale(1.3)';
            setTimeout(() => {
                counter.style.transition = 'transform 0.3s ease';
                counter.style.transform = 'scale(1)';
            }, 100);
        }
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.handleTap(x, y);
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.handleTap(x, y);
        }
    }
    
    handleTap(x, y) {
        const now = Date.now();
        const isDoubleTap = now - this.lastTapTime < 300;
        this.lastTapTime = now;
        
        if (isDoubleTap) {
            this.rebloomAll();
            this.createBloomBurst(this.centerX, this.centerY);
            return;
        }
        
        const tappedPetal = this.findPetalAtPoint(x, y);
        if (tappedPetal && tappedPetal.isActive()) {
            tappedPetal.startFalling(this.centerX, this.centerY, this.scale * this.growthProgress);
            this.createParticles(x, y, 8);
            this.updatePetalCount();
        } else {
            this.createParticles(x, y, 5);
        }
    }
    
    findPetalAtPoint(x, y) {
        for (let i = this.petals.length - 1; i >= 0; i--) {
            const petal = this.petals[i];
            if (!petal.isActive()) continue;
            
            const wobbleOffset = Math.sin(petal.wobble) * 0.03;
            const currentRadius = petal.radius + wobbleOffset;
            
            const petalX = this.centerX + Math.cos(petal.angle) * currentRadius * this.scale * this.growthProgress;
            const petalY = this.centerY - Math.sin(petal.angle) * currentRadius * this.scale * this.growthProgress;
            
            const dx = x - petalX;
            const dy = y - petalY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const hitRadius = petal.size * this.scale * 0.6;
            
            if (distance < hitRadius) {
                return petal;
            }
        }
        return null;
    }
    
    rebloomAll() {
        this.petals.forEach(petal => {
            if (petal.isFalling) {
                petal.startBlooming();
            }
        });
        this.bloomPulse = 1;
        setTimeout(() => this.updatePetalCount(), 100);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = touch.clientX - rect.left;
            this.mouseY = touch.clientY - rect.top;
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }
    
    createParticles(x, y, count = 1) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3 - 1,
                life: 1,
                size: Math.random() * 5 + 2,
                color: this.baseColor,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }
    
    createBloomBurst(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const speed = 5 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: Math.random() * 8 + 4,
                color: this.baseColor,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 220, g: 20, b: 60 };
    }
    
    darken(hex, amount) {
        const rgb = this.hexToRgb(hex);
        const r = Math.max(0, rgb.r - amount);
        const g = Math.max(0, rgb.g - amount);
        const b = Math.max(0, rgb.b - amount);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    lighten(hex, amount) {
        const rgb = this.hexToRgb(hex);
        const r = Math.min(255, rgb.r + amount);
        const g = Math.min(255, rgb.g + amount);
        const b = Math.min(255, rgb.b + amount);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    drawRosePetal(x, y, size, angle, petal, style, opacity = 1) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        this.ctx.globalAlpha = opacity;
        
        const width = size * this.scale * petal.baseWidth;
        const height = size * this.scale * 1.3;
        
        switch(style) {
            case 'pencil':
                this.drawPencilRosePetal(width, height, petal.curl);
                break;
            case 'watercolor':
                this.drawWatercolorRosePetal(width, height, petal.curl);
                break;
            case 'oil':
                this.drawOilRosePetal(width, height, petal.curl);
                break;
            case 'marker':
                this.drawMarkerRosePetal(width, height, petal.curl);
                break;
        }
        
        this.ctx.restore();
    }
    
    drawPencilRosePetal(width, height, curl) {
        const rgb = this.hexToRgb(this.baseColor);
        this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-width * 0.5, height * 0.1);
        this.ctx.lineTo(width * 0.5, height * 0.1);
        this.ctx.bezierCurveTo(width * 0.6, -height * 0.3, width * 0.4, -height * 0.8, width * 0.1, -height * (1 - curl * 0.3));
        this.ctx.quadraticCurveTo(0, -height * (1 - curl * 0.2), -width * 0.1, -height * (1 - curl * 0.3));
        this.ctx.bezierCurveTo(-width * 0.4, -height * 0.8, -width * 0.6, -height * 0.3, -width * 0.5, height * 0.1);
        this.ctx.fill();
        
        this.ctx.strokeStyle = this.darken(this.baseColor, 60);
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < 2; i++) {
            this.ctx.beginPath();
            const offset = (Math.random() - 0.5) * 1;
            this.ctx.moveTo(-width * 0.5, height * 0.1);
            this.ctx.lineTo(width * 0.5, height * 0.1);
            this.ctx.bezierCurveTo(width * 0.6 + offset, -height * 0.3, width * 0.4 + offset, -height * 0.8, width * 0.1, -height * (1 - curl * 0.3));
            this.ctx.quadraticCurveTo(0, -height * (1 - curl * 0.2), -width * 0.1, -height * (1 - curl * 0.3));
            this.ctx.bezierCurveTo(-width * 0.4 + offset, -height * 0.8, -width * 0.6 + offset, -height * 0.3, -width * 0.5, height * 0.1);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha *= 0.4;
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 12; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(-width * 0.4 + i * (width * 0.8 / 12), height * 0.1);
            this.ctx.lineTo(-width * 0.4 + i * (width * 0.8 / 12) + width * 0.2, -height * 0.8);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha *= 0.8;
        for (let i = 0; i < 8; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(-width * 0.3 * (1 - i / 8), height * 0.1 - height * (i / 8));
            this.ctx.lineTo(width * 0.3 * (1 - i / 8), height * 0.1 - height * (i / 8));
            this.ctx.stroke();
        }
    }
    
    drawWatercolorRosePetal(width, height, curl) {
        for (let layer = 0; layer < 6; layer++) {
            const spread = layer * 3;
            const alpha = layer === 0 ? 0.25 : (0.18 - layer * 0.02) * this.ctx.globalAlpha;
            this.ctx.globalAlpha = alpha;
            
            const gradient = this.ctx.createRadialGradient(0, -height * 0.4, 0, 0, -height * 0.4, height * 1.2);
            gradient.addColorStop(0, this.lighten(this.baseColor, 100));
            gradient.addColorStop(0.4, this.baseColor);
            gradient.addColorStop(0.85, this.darken(this.baseColor, 20));
            gradient.addColorStop(1, this.darken(this.baseColor, 40));
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            this.ctx.moveTo(-width * 0.5 - spread, height * 0.1);
            this.ctx.lineTo(width * 0.5 + spread, height * 0.1);
            this.ctx.bezierCurveTo(width * 0.7 + spread, -height * 0.2, width * 0.5 + spread, -height * 0.7, width * 0.15, -height * (1 - curl * 0.3));
            this.ctx.quadraticCurveTo(0, -height * (1 - curl * 0.15), -width * 0.15, -height * (1 - curl * 0.3));
            this.ctx.bezierCurveTo(-width * 0.5 - spread, -height * 0.7, -width * 0.7 - spread, -height * 0.2, -width * 0.5 - spread, height * 0.1);
            this.ctx.fill();
        }
    }
    
    drawOilRosePetal(width, height, curl) {
        const gradient = this.ctx.createLinearGradient(-width * 0.5, height * 0.1, width * 0.5, -height);
        gradient.addColorStop(0, this.darken(this.baseColor, 40));
        gradient.addColorStop(0.3, this.baseColor);
        gradient.addColorStop(0.7, this.lighten(this.baseColor, 40));
        gradient.addColorStop(1, this.lighten(this.baseColor, 60));
        this.ctx.fillStyle = gradient;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-width * 0.5, height * 0.1);
        this.ctx.lineTo(width * 0.5, height * 0.1);
        this.ctx.bezierCurveTo(width * 0.7, -height * 0.2, width * 0.5, -height * 0.7, width * 0.15, -height * (1 - curl * 0.3));
        this.ctx.quadraticCurveTo(0, -height * (1 - curl * 0.15), -width * 0.15, -height * (1 - curl * 0.3));
        this.ctx.bezierCurveTo(-width * 0.5, -height * 0.7, -width * 0.7, -height * 0.2, -width * 0.5, height * 0.1);
        this.ctx.fill();
        
        const savedAlpha = this.ctx.globalAlpha;
        this.ctx.strokeStyle = this.lighten(this.baseColor, 80);
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.globalAlpha = savedAlpha * 0.5;
        
        for (let i = 0; i < 4; i++) {
            const t = (i + 1) / 5;
            this.ctx.beginPath();
            this.ctx.moveTo(-width * 0.3 * (1 - t), -height * t * 0.7);
            this.ctx.lineTo(width * 0.3 * (1 - t), -height * t * 0.7);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = savedAlpha;
        this.ctx.strokeStyle = this.darken(this.baseColor, 60);
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-width * 0.5, height * 0.1);
        this.ctx.lineTo(width * 0.5, height * 0.1);
        this.ctx.bezierCurveTo(width * 0.7, -height * 0.2, width * 0.5, -height * 0.7, 0, -height * (1 - curl * 0.2));
        this.ctx.bezierCurveTo(-width * 0.5, -height * 0.7, -width * 0.7, -height * 0.2, -width * 0.5, height * 0.1);
        this.ctx.stroke();
    }
    
    drawMarkerRosePetal(width, height, curl) {
        this.ctx.fillStyle = this.baseColor;
        this.ctx.beginPath();
        this.ctx.moveTo(-width * 0.5, height * 0.1);
        this.ctx.lineTo(width * 0.5, height * 0.1);
        this.ctx.bezierCurveTo(width * 0.7, -height * 0.2, width * 0.5, -height * 0.7, width * 0.15, -height * (1 - curl * 0.3));
        this.ctx.quadraticCurveTo(0, -height * (1 - curl * 0.15), -width * 0.15, -height * (1 - curl * 0.3));
        this.ctx.bezierCurveTo(-width * 0.5, -height * 0.7, -width * 0.7, -height * 0.2, -width * 0.5, height * 0.1);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(-width * 0.5, height * 0.1);
        this.ctx.lineTo(width * 0.5, height * 0.1);
        this.ctx.bezierCurveTo(width * 0.7, -height * 0.2, width * 0.5, -height * 0.7, 0, -height * (1 - curl * 0.2));
        this.ctx.bezierCurveTo(-width * 0.5, -height * 0.7, -width * 0.7, -height * 0.2, -width * 0.5, height * 0.1);
        this.ctx.stroke();
        
        const savedAlpha = this.ctx.globalAlpha;
        this.ctx.strokeStyle = this.lighten(this.baseColor, 120);
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = savedAlpha * 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(-width * 0.2, -height * 0.7);
        this.ctx.lineTo(-width * 0.1, -height * 0.3);
        this.ctx.stroke();
        this.ctx.globalAlpha = savedAlpha;
    }
    
    drawStem() {
        const stemHeight = this.scale * 2.8;
        const stemWidth = this.scale * 0.15;
        
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        
        if (this.style === 'watercolor') {
            for (let i = 0; i < 3; i++) {
                this.ctx.globalAlpha = 0.2;
                this.ctx.strokeStyle = `rgba(34, 139, 34, ${0.8 - i * 0.2})`;
                this.ctx.lineWidth = stemWidth + i * 3;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.quadraticCurveTo(-stemWidth * 2, stemHeight / 2, 0, stemHeight);
                this.ctx.stroke();
            }
            this.ctx.globalAlpha = 1;
        } else if (this.style === 'marker') {
            this.ctx.fillStyle = '#228B22';
            this.ctx.beginPath();
            this.ctx.moveTo(-stemWidth/2, 0);
            this.ctx.quadraticCurveTo(-stemWidth * 2, stemHeight / 2, -stemWidth/2, stemHeight);
            this.ctx.lineTo(stemWidth/2, stemHeight);
            this.ctx.quadraticCurveTo(-stemWidth, stemHeight / 2, stemWidth/2, 0);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(-stemWidth/2, 0);
            this.ctx.quadraticCurveTo(-stemWidth * 2, stemHeight / 2, -stemWidth/2, stemHeight);
            this.ctx.moveTo(stemWidth/2, 0);
            this.ctx.quadraticCurveTo(-stemWidth, stemHeight / 2, stemWidth/2, stemHeight);
            this.ctx.stroke();
        } else {
            this.ctx.strokeStyle = '#2d5016';
            this.ctx.lineWidth = stemWidth;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(-stemWidth * 2, stemHeight / 2, 0, stemHeight);
            this.ctx.stroke();
            
            this.ctx.strokeStyle = '#4a7c2c';
            this.ctx.lineWidth = stemWidth / 3;
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.moveTo(stemWidth / 4, stemHeight * 0.2);
            this.ctx.lineTo(stemWidth / 4, stemHeight * 0.8);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        this.drawLeaf(-this.scale * 0.9, stemHeight * 0.35, -0.5);
        this.drawLeaf(this.scale * 0.7, stemHeight * 0.65, 0.3);
        
        this.ctx.restore();
    }
    
    drawLeaf(x, y, angle) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        const size = this.scale * 0.45;
        
        if (this.style === 'marker') {
            this.ctx.fillStyle = '#228B22';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, size / 2, size, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, size / 2, size, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        } else {
            this.ctx.fillStyle = '#2d5016';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, size / 2, size, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#4a7c2c';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -size);
            this.ctx.lineTo(0, size);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    updateParticles() {
        this.particles = this.particles.filter(p => p.life > 0);
        
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.vx *= 0.98;
            p.life -= 0.015;
            p.rotation += p.rotationSpeed;
            
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.globalAlpha = p.life * 0.8;
            
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    animate() {
        const bgGradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, Math.max(this.canvas.width, this.canvas.height)
        );
        bgGradient.addColorStop(0, '#1a1a2e');
        bgGradient.addColorStop(0.5, '#16213e');
        bgGradient.addColorStop(1, '#0f3460');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.growthProgress < this.targetGrowth) {
            this.growthProgress += 0.01;
        }
        
        if (this.bloomPulse > 0) {
            this.bloomPulse -= 0.02;
        }
        
        this.ctx.globalAlpha = this.growthProgress;
        this.drawStem();
        this.ctx.globalAlpha = 1;
        
        this.petals.forEach(petal => {
            petal.wobble += petal.wobbleSpeed;
            
            if (petal.isFalling) {
                petal.updateFalling();
                this.ctx.save();
                this.ctx.globalAlpha = petal.opacity;
                this.drawRosePetal(petal.fallX, petal.fallY, petal.size, petal.fallRotation, petal, this.style, petal.opacity);
                this.ctx.restore();
            } else if (petal.isBlooming) {
                petal.updateBlooming();
                const wobbleOffset = Math.sin(petal.wobble) * 0.03;
                const currentRadius = petal.radius + wobbleOffset;
                const x = this.centerX + Math.cos(petal.angle) * currentRadius * this.scale * this.growthProgress;
                const y = this.centerY - Math.sin(petal.angle) * currentRadius * this.scale * this.growthProgress;
                const petalAngle = petal.angle;
                this.drawRosePetal(x, y, petal.size * this.growthProgress, petalAngle, petal, this.style, petal.opacity);
            } else {
                const wobbleOffset = Math.sin(petal.wobble) * 0.03;
                const currentRadius = petal.radius + wobbleOffset;
                const pulseEffect = this.bloomPulse * 0.15;
                const x = this.centerX + Math.cos(petal.angle) * currentRadius * this.scale * this.growthProgress * (1 + pulseEffect);
                const y = this.centerY - Math.sin(petal.angle) * currentRadius * this.scale * this.growthProgress * (1 + pulseEffect);
                const petalAngle = petal.angle;
                const petalSize = petal.size * this.growthProgress * (1 + pulseEffect);
                const opacity = Math.max(0, 1 - petal.layer * 0.05) * this.growthProgress;
                this.drawRosePetal(x, y, petalSize, petalAngle, petal, this.style, opacity);
            }
        });
        
        this.ctx.globalAlpha = 1;
        
        const centerSize = this.scale * 0.3 * this.growthProgress * (1 + this.bloomPulse * 0.3);
        const centerGradient = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, centerSize);
        centerGradient.addColorStop(0, '#ffd700');
        centerGradient.addColorStop(0.5, '#ffed4e');
        centerGradient.addColorStop(1, '#f4a460');
        this.ctx.fillStyle = centerGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, centerSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (this.style === 'marker' || this.style === 'pencil') {
            this.ctx.strokeStyle = this.style === 'marker' ? '#000' : this.darken(this.baseColor, 80);
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, centerSize, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const x = this.centerX + Math.cos(angle) * centerSize * 0.6;
            const y = this.centerY + Math.sin(angle) * centerSize * 0.6;
            this.ctx.fillStyle = '#d4a04c';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.updateParticles();
        requestAnimationFrame(() => this.animate());
    }
    
    setStyle(style) {
        this.style = style;
        this.createBloomBurst(this.centerX, this.centerY);
    }
    
    setColor(color) {
        this.baseColor = color;
    }
}

const canvas = document.getElementById('roseCanvas');
const rose = new Rose(canvas);

document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        rose.setStyle(btn.dataset.style);
    });
});

const colorPicker = document.getElementById('colorPicker');
colorPicker.addEventListener('input', (e) => {
    rose.setColor(e.target.value);
});

document.querySelectorAll('.color-preset').forEach(btn => {
    btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        rose.setColor(color);
        colorPicker.value = color;
    });
});
