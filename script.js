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

class Heart {
    constructor(index, formationType, centerX, centerY) {
        this.index = index;
        this.delay = index * 40; // Stagger by 40ms for faster cascade
        this.startTime = null;
        this.phase = 'growing'; // 'growing', 'zooming', 'vanishing', 'done'
        this.centerX = centerX;
        this.centerY = centerY;

        // Animation properties
        this.x = centerX;
        this.y = centerY;
        this.scale = 0;
        this.rotation = 0;
        this.opacity = 0;

        // Store final formation position for smooth interpolation
        this.finalFormationX = centerX;
        this.finalFormationY = centerY;

        // Formation properties
        this.formationType = formationType;
        this.calculateFormationPosition(index, formationType);
    }

    calculateFormationPosition(index, type) {
        switch(type) {
            case 0: // Vertical stack - tighter spacing
                this.targetX = 0;
                this.targetY = index * 0.2 - 0.4; // Smaller spread
                break;
            case 1: // Scattered - tighter clustering
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.15 + Math.random() * 0.2; // Smaller radius
                this.targetX = Math.cos(angle) * radius;
                this.targetY = Math.sin(angle) * radius;
                break;
            case 2: // Spiral - tighter spiral
                const spiralAngle = index * (Math.PI * 2 / 5) * 1.5;
                const spiralRadius = index * 0.1; // Smaller spiral
                this.targetX = Math.cos(spiralAngle) * spiralRadius;
                this.targetY = Math.sin(spiralAngle) * spiralRadius;
                break;
        }
    }

    update(currentTime, scale) {
        if (!this.startTime) {
            this.startTime = currentTime + this.delay;
        }

        const elapsed = currentTime - this.startTime;
        if (elapsed < 0) return; // Not started yet due to delay

        // Phase timing - fast grow with immediate zoom transition
        const growPhaseEnd = 400; // 0.4 seconds
        const zoomPhaseEnd = 1900; // 1.5 seconds more (total 1.9s)
        const vanishPhaseEnd = 2900; // 1 second more (total 2.9s)

        if (elapsed < growPhaseEnd) {
            // Growing phase (0-0.4s): scale 0→1, opacity 0→1, move to formation
            this.phase = 'growing';
            const progress = elapsed / growPhaseEnd;
            const eased = this.easeOutCubic(progress);
            this.scale = eased;
            this.opacity = eased;
            this.x = this.centerX + this.targetX * scale * eased;
            this.y = this.centerY + this.targetY * scale * eased;
            this.rotation = eased * Math.PI * 0.12; // All hearts face same direction

            // Store final formation position at end of grow phase
            if (progress >= 0.99) {
                this.finalFormationX = this.x;
                this.finalFormationY = this.y;
            }
        } else if (elapsed < zoomPhaseEnd) {
            // Zooming phase: scale 1→8, move smoothly to center
            this.phase = 'zooming';
            const progress = (elapsed - growPhaseEnd) / (zoomPhaseEnd - growPhaseEnd);
            const eased = this.easeInOutCubic(progress);
            this.scale = 1 + eased * 7; // 1 to 8
            this.opacity = 1;
            // Smoothly interpolate from stored formation position to center
            const positionEase = this.easeInCubic(progress);
            this.x = this.finalFormationX + (this.centerX - this.finalFormationX) * positionEase;
            this.y = this.finalFormationY + (this.centerY - this.finalFormationY) * positionEase;
            this.rotation = Math.PI * 0.12 + eased * Math.PI * 0.25; // All hearts face same direction
        } else if (elapsed < vanishPhaseEnd) {
            // Vanishing phase: scale 8→10, opacity 1→0
            this.phase = 'vanishing';
            const progress = (elapsed - zoomPhaseEnd) / (vanishPhaseEnd - zoomPhaseEnd);
            this.scale = 8 + progress * 2; // 8 to 10
            this.opacity = 1 - progress;
            this.x = this.centerX;
            this.y = this.centerY;
            this.rotation = Math.PI * 0.37 + progress * Math.PI * 0.15; // All hearts face same direction
        } else {
            // Done
            this.phase = 'done';
            this.opacity = 0;
        }
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInCubic(t) {
        return t * t * t;
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

        // Heart animation properties
        this.hearts = [];
        this.isShowingHearts = false;
        this.hasShownAutoHearts = false;
        this.heartAnimationStartTime = null;

        // Long-press detection properties
        this.pressStartTime = null;
        this.pressStartX = null;
        this.pressStartY = null;
        this.longPressThreshold = 600; // milliseconds
        this.longPressTimer = null;

        this.petals = this.createRosePetalStructure();
        this.updatePetalCount();
        
        window.addEventListener('resize', () => this.resize());
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2.4;
        this.scale = Math.min(this.canvas.width, this.canvas.height) / 4.5;
    }
    
    createRosePetalStructure() {
        const petals = [];

        // Calculate total petals based on current year
        const currentYear = new Date().getFullYear();
        const totalPetals = currentYear - 1995;

        // Distribute petals across 4 layers using proportions from original design
        // Original: 8 outer (23.5%), 13 middle (38.2%), 8 inner (23.5%), 5 center (14.7%)
        const outerCount = Math.round(totalPetals * 0.235);
        const middleCount = Math.round(totalPetals * 0.382);
        const innerCount = Math.round(totalPetals * 0.235);
        const centerCount = totalPetals - outerCount - middleCount - innerCount; // Remainder

        // Outer layer
        for (let i = 0; i < outerCount; i++) {
            const angle = (i / outerCount) * Math.PI * 2;
            petals.push(new Petal(angle, 0.15, 1.2, 0, 0.9, 0.3));
        }

        // Middle layer
        for (let i = 0; i < middleCount; i++) {
            const angle = (i / middleCount) * Math.PI * 2 + 0.12;
            petals.push(new Petal(angle, 0.12, 0.95, 1, 0.75, 0.5));
        }

        // Inner layer
        for (let i = 0; i < innerCount; i++) {
            const angle = (i / innerCount) * Math.PI * 2 + 0.2;
            petals.push(new Petal(angle, 0.08, 0.7, 2, 0.6, 0.7));
        }

        // Center layer
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
        this.handlePressStart(x, y);
    }

    handleMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.handlePressEnd(x, y);
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.handlePressStart(x, y);
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        let x, y;
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        }
        this.handlePressEnd(x, y);
    }
    
    handleTap(x, y) {
        if (this.isShowingHearts) return;

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

    handlePressStart(x, y) {
        if (this.isShowingHearts) return;

        this.pressStartTime = Date.now();
        this.pressStartX = x;
        this.pressStartY = y;

        // Set timer for long press
        this.longPressTimer = setTimeout(() => {
            this.checkLongPress(x, y);
        }, this.longPressThreshold);
    }

    handlePressEnd(x, y) {
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        // If press was short enough, treat as tap
        if (this.pressStartTime && Date.now() - this.pressStartTime < this.longPressThreshold) {
            this.handleTap(this.pressStartX, this.pressStartY);
        }

        this.pressStartTime = null;
        this.pressStartX = null;
        this.pressStartY = null;
    }

    handlePressMove(x, y) {
        // Cancel long press if user moves too much
        if (this.pressStartX !== null && this.pressStartY !== null) {
            const dx = x - this.pressStartX;
            const dy = y - this.pressStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 20) {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            }
        }
    }

    checkLongPress(x, y) {
        // Check if press is on center
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const centerRadius = this.scale * 0.5;

        if (distance < centerRadius) {
            // Long press on center - trigger heart animation
            this.startHeartAnimation();
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
        if (this.isShowingHearts) return;

        this.petals.forEach(petal => {
            if (petal.isFalling) {
                petal.startBlooming();
            }
        });
        this.bloomPulse = 1;
        this.hasShownAutoHearts = false; // Reset to allow hearts to trigger again
        setTimeout(() => this.updatePetalCount(), 100);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = touch.clientX - rect.left;
            this.mouseY = touch.clientY - rect.top;
            this.handlePressMove(this.mouseX, this.mouseY);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.handlePressMove(this.mouseX, this.mouseY);
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

        // Light base fill - increased opacity to fill in the petal
        this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
        this.ctx.beginPath();
        this.ctx.moveTo(-width * 0.5, height * 0.1);
        this.ctx.lineTo(width * 0.5, height * 0.1);
        this.ctx.bezierCurveTo(width * 0.6, -height * 0.3, width * 0.4, -height * 0.8, width * 0.1, -height * (1 - curl * 0.3));
        this.ctx.quadraticCurveTo(0, -height * (1 - curl * 0.2), -width * 0.1, -height * (1 - curl * 0.3));
        this.ctx.bezierCurveTo(-width * 0.4, -height * 0.8, -width * 0.6, -height * 0.3, -width * 0.5, height * 0.1);
        this.ctx.fill();

        // Outline with slight sketch variation
        this.ctx.strokeStyle = this.darken(this.baseColor, 60);
        this.ctx.lineWidth = 1.5;
        this.ctx.lineCap = 'round';

        for (let i = 0; i < 2; i++) {
            this.ctx.globalAlpha = 0.5 + i * 0.3;
            this.ctx.beginPath();
            const offset = (Math.random() - 0.5) * 1.5;
            this.ctx.moveTo(-width * 0.5, height * 0.1);
            this.ctx.lineTo(width * 0.5, height * 0.1);
            this.ctx.bezierCurveTo(width * 0.6 + offset, -height * 0.3, width * 0.4 + offset, -height * 0.8, width * 0.1, -height * (1 - curl * 0.3));
            this.ctx.quadraticCurveTo(0, -height * (1 - curl * 0.2), -width * 0.1, -height * (1 - curl * 0.3));
            this.ctx.bezierCurveTo(-width * 0.4 + offset, -height * 0.8, -width * 0.6 + offset, -height * 0.3, -width * 0.5, height * 0.1);
            this.ctx.stroke();
        }

        // Classic pencil hatching at 45-degree angle with back-and-forth lines
        const hatchAngle = -Math.PI / 6; // ~30 degrees
        const hatchSpacing = 14; // Increased spacing for fewer lines
        const hatchLength = Math.max(width, height) * 1.4;

        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';

        // Create clipping region for the petal shape
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(-width * 0.5, height * 0.1);
        this.ctx.lineTo(width * 0.5, height * 0.1);
        this.ctx.bezierCurveTo(width * 0.6, -height * 0.3, width * 0.4, -height * 0.8, width * 0.1, -height * (1 - curl * 0.3));
        this.ctx.quadraticCurveTo(0, -height * (1 - curl * 0.2), -width * 0.1, -height * (1 - curl * 0.3));
        this.ctx.bezierCurveTo(-width * 0.4, -height * 0.8, -width * 0.6, -height * 0.3, -width * 0.5, height * 0.1);
        this.ctx.clip();

        // Back-and-forth hatching lines with fade
        for (let i = -hatchLength; i < hatchLength; i += hatchSpacing) {
            const startX = i;
            const startY = -hatchLength;
            const endX = i + hatchLength * Math.sin(hatchAngle);
            const endY = -hatchLength + hatchLength * Math.cos(hatchAngle);

            // Calculate distance from petal edge for fading effect
            const distFromCenter = Math.abs(i) / hatchLength;
            const fadeAlpha = 0.2 + (1 - distFromCenter) * 0.2;

            this.ctx.globalAlpha = fadeAlpha;
            this.ctx.strokeStyle = this.darken(this.baseColor, 50);

            // Draw back-and-forth line with slight waviness
            this.ctx.beginPath();
            const segments = 4; // Reduced segments for simpler lines
            for (let seg = 0; seg <= segments; seg++) {
                const t = seg / segments;
                const x = startX + (endX - startX) * t;
                const y = startY + (endY - startY) * t;

                // Add slight wave/variation to the line
                const waveOffset = Math.sin(t * Math.PI * 2) * 2;
                const xWithWave = x + Math.cos(hatchAngle) * waveOffset;
                const yWithWave = y + Math.sin(hatchAngle) * waveOffset;

                if (seg === 0) {
                    this.ctx.moveTo(xWithWave, yWithWave);
                } else {
                    this.ctx.lineTo(xWithWave, yWithWave);
                }
            }
            this.ctx.stroke();
        }

        this.ctx.restore();
        this.ctx.globalAlpha = 1;
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

    drawHeartShape(size) {
        // Draw a proper heart shape with rounded lobes
        const width = size;
        const height = size;

        this.ctx.beginPath();

        // Start at the bottom point of the heart
        this.ctx.moveTo(0, height * 0.35);

        // Left side - curve up and around the left lobe
        this.ctx.bezierCurveTo(
            -width * 0.25, height * 0.15,   // control point 1 - inside curve
            -width * 0.5, height * 0.05,    // control point 2 - outer curve
            -width * 0.35, -height * 0.15   // end point - outer top of left lobe
        );

        // Top of left lobe - big rounded curve
        this.ctx.bezierCurveTo(
            -width * 0.25, -height * 0.35,  // control point 1 - peak of lobe
            -width * 0.05, -height * 0.35,  // control point 2 - toward center
            0, -height * 0.2                // end point - center dip
        );

        // Top of right lobe - mirror the left
        this.ctx.bezierCurveTo(
            width * 0.05, -height * 0.35,   // control point 1 - toward right
            width * 0.25, -height * 0.35,   // control point 2 - peak of right lobe
            width * 0.35, -height * 0.15    // end point - outer top of right lobe
        );

        // Right side - curve down to bottom point
        this.ctx.bezierCurveTo(
            width * 0.5, height * 0.05,     // control point 1 - outer curve
            width * 0.25, height * 0.15,    // control point 2 - inside curve
            0, height * 0.35                // end point - bottom
        );

        this.ctx.closePath();
    }

    drawPencilHeart(size) {
        const rgb = this.hexToRgb(this.baseColor);

        // Very light base fill
        this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`;
        this.drawHeartShape(size);
        this.ctx.fill();

        // Outline with slight sketch variation
        this.ctx.strokeStyle = this.darken(this.baseColor, 60);
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';

        for (let i = 0; i < 2; i++) {
            this.ctx.globalAlpha = 0.5 + i * 0.3;
            this.ctx.save();
            const offset = (Math.random() - 0.5) * 2;
            this.ctx.translate(offset, offset);
            this.drawHeartShape(size);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Crosshatch shading with clipping
        const hatchAngle = -Math.PI / 6;
        const hatchSpacing = 14;
        const hatchLength = size * 1.4;

        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';

        // Create clipping region
        this.ctx.save();
        this.drawHeartShape(size);
        this.ctx.clip();

        // Draw hatching lines
        for (let i = -hatchLength; i < hatchLength; i += hatchSpacing) {
            const startX = i;
            const startY = -hatchLength;
            const endX = i + hatchLength * Math.sin(hatchAngle);
            const endY = -hatchLength + hatchLength * Math.cos(hatchAngle);

            const distFromCenter = Math.abs(i) / hatchLength;
            const fadeAlpha = 0.2 + (1 - distFromCenter) * 0.2;

            this.ctx.globalAlpha = fadeAlpha;
            this.ctx.strokeStyle = this.darken(this.baseColor, 50);

            this.ctx.beginPath();
            const segments = 4;
            for (let seg = 0; seg <= segments; seg++) {
                const t = seg / segments;
                const x = startX + (endX - startX) * t;
                const y = startY + (endY - startY) * t;
                const waveOffset = Math.sin(t * Math.PI * 2) * 2;
                const xWithWave = x + Math.cos(hatchAngle) * waveOffset;
                const yWithWave = y + Math.sin(hatchAngle) * waveOffset;

                if (seg === 0) {
                    this.ctx.moveTo(xWithWave, yWithWave);
                } else {
                    this.ctx.lineTo(xWithWave, yWithWave);
                }
            }
            this.ctx.stroke();
        }

        this.ctx.restore();
        this.ctx.globalAlpha = 1;
    }

    drawWatercolorHeart(size) {
        for (let layer = 0; layer < 6; layer++) {
            const spread = layer * 3;
            const alpha = layer === 0 ? 0.25 : (0.18 - layer * 0.02);
            this.ctx.globalAlpha = alpha;

            const gradient = this.ctx.createRadialGradient(0, -size * 0.2, 0, 0, -size * 0.2, size * 0.8);
            gradient.addColorStop(0, this.lighten(this.baseColor, 100));
            gradient.addColorStop(0.4, this.baseColor);
            gradient.addColorStop(0.85, this.darken(this.baseColor, 20));
            gradient.addColorStop(1, this.darken(this.baseColor, 40));
            this.ctx.fillStyle = gradient;

            this.ctx.save();
            this.ctx.scale(1 + spread * 0.01, 1 + spread * 0.01);
            this.drawHeartShape(size);
            this.ctx.fill();
            this.ctx.restore();
        }
        this.ctx.globalAlpha = 1;
    }

    drawOilHeart(size) {
        const gradient = this.ctx.createLinearGradient(-size * 0.5, size * 0.3, size * 0.5, -size * 0.5);
        gradient.addColorStop(0, this.darken(this.baseColor, 40));
        gradient.addColorStop(0.3, this.baseColor);
        gradient.addColorStop(0.7, this.lighten(this.baseColor, 40));
        gradient.addColorStop(1, this.lighten(this.baseColor, 60));
        this.ctx.fillStyle = gradient;

        this.drawHeartShape(size);
        this.ctx.fill();

        // Thick impasto highlights
        const savedAlpha = this.ctx.globalAlpha;
        this.ctx.strokeStyle = this.lighten(this.baseColor, 80);
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.globalAlpha = savedAlpha * 0.5;

        for (let i = 0; i < 4; i++) {
            const t = (i + 1) / 5;
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.2 * (1 - t), -size * t * 0.3);
            this.ctx.lineTo(size * 0.2 * (1 - t), -size * t * 0.3);
            this.ctx.stroke();
        }

        // Bold outline
        this.ctx.globalAlpha = savedAlpha;
        this.ctx.strokeStyle = this.darken(this.baseColor, 60);
        this.ctx.lineWidth = 3;
        this.drawHeartShape(size);
        this.ctx.stroke();
    }

    drawMarkerHeart(size) {
        // Solid fill
        this.ctx.fillStyle = this.baseColor;
        this.drawHeartShape(size);
        this.ctx.fill();

        // Bold black outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.drawHeartShape(size);
        this.ctx.stroke();

        // Simple highlight streak
        const savedAlpha = this.ctx.globalAlpha;
        this.ctx.strokeStyle = this.lighten(this.baseColor, 120);
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = savedAlpha * 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.15, -size * 0.25);
        this.ctx.lineTo(-size * 0.05, 0);
        this.ctx.stroke();
        this.ctx.globalAlpha = savedAlpha;
    }

    drawHeart(heart) {
        this.ctx.save();
        this.ctx.translate(heart.x, heart.y);
        this.ctx.rotate(heart.rotation);
        this.ctx.globalAlpha = heart.opacity;

        const size = this.scale * 0.8 * heart.scale;

        switch(this.style) {
            case 'pencil':
                this.drawPencilHeart(size);
                break;
            case 'watercolor':
                this.drawWatercolorHeart(size);
                break;
            case 'oil':
                this.drawOilHeart(size);
                break;
            case 'marker':
                this.drawMarkerHeart(size);
                break;
        }

        this.ctx.restore();
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

            // Only add highlight for oil style, not pencil
            if (this.style !== 'pencil') {
                this.ctx.strokeStyle = '#4a7c2c';
                this.ctx.lineWidth = stemWidth / 3;
                this.ctx.globalAlpha = 0.6;
                this.ctx.beginPath();
                this.ctx.moveTo(stemWidth / 4, stemHeight * 0.2);
                this.ctx.lineTo(stemWidth / 4, stemHeight * 0.8);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
        }
        
        this.drawLeaf(-this.scale * 0.6, stemHeight * 0.35, -0.5);
        this.drawLeaf(this.scale * 0.3, stemHeight * 0.65, 0.3);
        
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

    startHeartAnimation() {
        this.isShowingHearts = true;
        this.hearts = [];
        this.heartAnimationStartTime = Date.now();

        // Use vertical stack formation (type 0) for better heart visibility
        const formationType = 0;

        // Create 5 hearts with 40ms staggered timing for smooth, fast cascade
        for (let i = 0; i < 5; i++) {
            this.hearts.push(new Heart(i, formationType, this.centerX, this.centerY));
        }
    }

    updateHearts() {
        if (this.hearts.length === 0) return;

        const currentTime = Date.now();

        // Update all hearts
        this.hearts.forEach(heart => {
            heart.update(currentTime, this.scale);
        });

        // Check if all hearts are done
        const allDone = this.hearts.every(h => h.phase === 'done');
        if (allDone) {
            this.isShowingHearts = false;
            this.hearts = [];
            this.heartAnimationStartTime = null;
        }
    }

    drawCloud(x, y, size) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        // Cloud made of overlapping circles
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x - size * 0.7, y, size * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.7, y, size * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x - size * 0.3, y - size * 0.5, size * 0.6, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y - size * 0.5, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawBackground() {
        // Sky gradient - light blue at top, lighter at horizon
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.6, '#B0E0E6');
        skyGradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw clouds
        const time = Date.now() * 0.0001; // Slow drift
        this.drawCloud(this.canvas.width * 0.15 + Math.sin(time) * 20, this.canvas.height * 0.15, 40);
        this.drawCloud(this.canvas.width * 0.75 + Math.sin(time + 1) * 25, this.canvas.height * 0.2, 50);
        this.drawCloud(this.canvas.width * 0.45 + Math.sin(time + 2) * 15, this.canvas.height * 0.1, 35);
        this.drawCloud(this.canvas.width * 0.85 + Math.sin(time + 3) * 30, this.canvas.height * 0.25, 45);

        // Distant hills (background layer)
        this.ctx.fillStyle = '#7CB342';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height * 0.5);
        this.ctx.quadraticCurveTo(
            this.canvas.width * 0.3, this.canvas.height * 0.35,
            this.canvas.width * 0.6, this.canvas.height * 0.45
        );
        this.ctx.quadraticCurveTo(
            this.canvas.width * 0.8, this.canvas.height * 0.5,
            this.canvas.width, this.canvas.height * 0.48
        );
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.fill();

        // Main grassy hill (foreground)
        const grassGradient = this.ctx.createLinearGradient(0, this.canvas.height * 0.5, 0, this.canvas.height);
        grassGradient.addColorStop(0, '#8BC34A');
        grassGradient.addColorStop(1, '#689F38');
        this.ctx.fillStyle = grassGradient;

        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height * 0.6);
        this.ctx.quadraticCurveTo(
            this.canvas.width * 0.25, this.canvas.height * 0.5,
            this.canvas.width * 0.5, this.canvas.height * 0.55
        );
        this.ctx.quadraticCurveTo(
            this.canvas.width * 0.75, this.canvas.height * 0.6,
            this.canvas.width, this.canvas.height * 0.58
        );
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.fill();

        // Add some grass texture with simple lines
        this.ctx.strokeStyle = 'rgba(104, 159, 56, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = this.canvas.height * 0.6 + Math.random() * this.canvas.height * 0.4;
            const height = 10 + Math.random() * 15;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + (Math.random() - 0.5) * 5, y - height);
            this.ctx.stroke();
        }
    }

    animate() {
        // Draw scenic background with sky, clouds, and grassy hills
        this.drawBackground();

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

        // Check if all petals have fallen
        if (!this.isShowingHearts && !this.hasShownAutoHearts && this.growthProgress >= 1) {
            const allFallen = this.petals.every(p => p.isFalling);
            if (allFallen) {
                this.hasShownAutoHearts = true;
                this.startHeartAnimation();
            }
        }

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

        // Update and draw hearts if animation is active
        if (this.isShowingHearts) {
            this.updateHearts();
            this.hearts.forEach(heart => this.drawHeart(heart));
        }

        this.updateParticles();
        requestAnimationFrame(() => this.animate());
    }
    
    setStyle(style) {
        this.style = style;
        if (!this.isShowingHearts) {
            this.createBloomBurst(this.centerX, this.centerY);
        }
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
