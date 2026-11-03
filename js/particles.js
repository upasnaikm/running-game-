/**
 * NEON PULSE: CYBER RUNNER 3D
 * Particle Engine & Special FX
 */

class ParticleEngine {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.speedLines = null;
        this.speedLinesActive = false;

        this._initSpeedLines();
    }

    _initSpeedLines() {
        const count = 120;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 6); // 2 vertices per line
        const colors = new Float32Array(count * 6);

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 3 + Math.random() * 8;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius + 1.5;
            const z = -10 - Math.random() * 40;
            const length = 4 + Math.random() * 8;

            // Start of line
            positions[i * 6] = x;
            positions[i * 6 + 1] = y;
            positions[i * 6 + 2] = z;

            // End of line
            positions[i * 6 + 3] = x;
            positions[i * 6 + 4] = y;
            positions[i * 6 + 5] = z - length;

            // Cyan / white color
            const c = Math.random() > 0.4 ? new THREE.Color(0x00f3ff) : new THREE.Color(0xffffff);
            colors[i * 6] = c.r;
            colors[i * 6 + 1] = c.g;
            colors[i * 6 + 2] = c.b;
            colors[i * 6 + 3] = c.r;
            colors[i * 6 + 4] = c.g;
            colors[i * 6 + 5] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        this.speedLines = new THREE.LineSegments(geometry, material);
        this.speedLines.frustumCulled = false;
        this.scene.add(this.speedLines);
    }

    setSpeedBoostVisuals(active, playerPos) {
        this.speedLinesActive = active;
        if (this.speedLines) {
            this.speedLines.material.opacity = active ? 0.85 : 0;
            if (active && playerPos) {
                this.speedLines.position.set(playerPos.x, playerPos.y, playerPos.z);
            }
        }
    }

    // Spawn gold coin collection burst
    spawnCoinBurst(pos) {
        const count = 16;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            const p = this._createParticleMesh(
                0.12 + Math.random() * 0.08,
                Math.random() > 0.3 ? 0xffd700 : 0xffffff
            );

            p.position.set(
                pos.x + (Math.random() - 0.5) * 0.4,
                pos.y + (Math.random() - 0.5) * 0.4,
                pos.z + (Math.random() - 0.5) * 0.4
            );

            this.particles.push({
                mesh: p,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed + 2.5,
                vz: (Math.random() - 0.5) * speed,
                gravity: -12,
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.8,
                scale: 1.0
            });
            this.scene.add(p);
        }
    }

    // Spawn jump dust ring
    spawnJumpDust(pos) {
        const count = 12;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 2.5 + Math.random() * 1.5;
            const p = this._createParticleMesh(0.12, 0x00f3ff);

            p.position.set(pos.x, 0.1, pos.z);

            this.particles.push({
                mesh: p,
                vx: Math.cos(angle) * speed,
                vy: 0.5 + Math.random() * 1.5,
                vz: Math.sin(angle) * speed,
                gravity: -2,
                life: 0.35,
                maxLife: 0.35,
                scale: 1.0
            });
            this.scene.add(p);
        }
    }

    // Sparks when sliding on track
    spawnSlideSparks(pos) {
        const count = 3;
        for (let i = 0; i < count; i++) {
            const p = this._createParticleMesh(0.08, 0xffaa00);
            p.position.set(
                pos.x + (Math.random() - 0.5) * 0.4,
                0.1,
                pos.z + 0.3
            );

            this.particles.push({
                mesh: p,
                vx: (Math.random() - 0.5) * 2.5,
                vy: 1.5 + Math.random() * 2.5,
                vz: 6 + Math.random() * 4, // Fly backwards
                gravity: -10,
                life: 0.25,
                maxLife: 0.25,
                scale: 1.0
            });
            this.scene.add(p);
        }
    }

    // Jetpack thruster trail during running & jumping
    spawnJetpackTrail(pos, isSuper = false) {
        const colors = isSuper ? [0x00f3ff, 0xff00ff] : [0x00f3ff, 0x00aaff];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const p = this._createParticleMesh(isSuper ? 0.16 : 0.1, color);

        p.position.set(
            pos.x + (Math.random() - 0.5) * 0.3,
            pos.y,
            pos.z + 0.4
        );

        this.particles.push({
            mesh: p,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -0.8 + (Math.random() - 0.5) * 0.5,
            vz: 4 + Math.random() * 2,
            gravity: 0,
            life: 0.25,
            maxLife: 0.25,
            scale: 1.0
        });
        this.scene.add(p);
    }

    // Dramatic crash / obstacle destroy explosion
    spawnExplosion(pos, color = 0xff0055) {
        const count = 30;
        for (let i = 0; i < count; i++) {
            const p = this._createParticleMesh(0.15 + Math.random() * 0.15, color);
            p.position.set(pos.x, pos.y, pos.z);

            const speed = 4 + Math.random() * 8;
            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI;

            this.particles.push({
                mesh: p,
                vx: Math.cos(theta) * Math.cos(phi) * speed,
                vy: Math.sin(phi) * speed + 3,
                vz: Math.sin(theta) * Math.cos(phi) * speed,
                gravity: -15,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 1.0,
                scale: 1.0
            });
            this.scene.add(p);
        }
    }

    _createParticleMesh(size, colorHex) {
        const geom = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 1.0
        });
        return new THREE.Mesh(geom, mat);
    }

    update(delta, playerPos) {
        // Update active speed lines
        if (this.speedLinesActive && this.speedLines && playerPos) {
            this.speedLines.position.set(playerPos.x, playerPos.y, playerPos.z);
            const positions = this.speedLines.geometry.attributes.position.array;
            const count = positions.length / 6;
            for (let i = 0; i < count; i++) {
                // Animate lines forward
                positions[i * 6 + 2] += 40 * delta;
                positions[i * 6 + 5] += 40 * delta;
                if (positions[i * 6 + 2] > 5) {
                    positions[i * 6 + 2] = -40;
                    positions[i * 6 + 5] = -46;
                }
            }
            this.speedLines.geometry.attributes.position.needsUpdate = true;
        }

        // Update loose particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            p.vy += p.gravity * delta;
            p.mesh.position.x += p.vx * delta;
            p.mesh.position.y += p.vy * delta;
            p.mesh.position.z += p.vz * delta;

            // Fade & shrink
            const lifeRatio = p.life / p.maxLife;
            p.mesh.material.opacity = Math.max(0, lifeRatio);
            const scale = Math.max(0.01, lifeRatio);
            p.mesh.scale.set(scale, scale, scale);
        }
    }

    clear() {
        for (const p of this.particles) {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        }
        this.particles = [];
        this.setSpeedBoostVisuals(false);
    }
}
