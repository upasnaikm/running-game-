/**
 * NEON PULSE: CYBER RUNNER 3D
 * Collectibles & Distinct 3D Power-Ups System
 * Unique Models, Unique Animations, Distinct Visual Effects & World-Themed Coins
 */

class CollectibleManager {
    constructor(scene, particles, initialWorld = 'jungle') {
        this.scene = scene;
        this.particles = particles;
        this.currentWorld = initialWorld;

        this.coins = [];
        this.powerups = [];
        this.lanePositions = [-2.8, 0, 2.8];

        this.nextCoinZ = -30;
        this.nextPowerupZ = -80;

        // Shared coin geometry
        this.coinGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.09, 12);
        this.coinGeom.rotateX(Math.PI / 2);

        this._initMaterials();
    }

    _initMaterials() {
        this.coinMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xcc9900,
            emissiveIntensity: 0.7,
            roughness: 0.25,
            metalness: 0.85
        });

        // Magnet: Red & Chrome
        this.magnetRedMat = new THREE.MeshStandardMaterial({
            color: 0xd90429,
            roughness: 0.3,
            metalness: 0.8
        });
        this.magnetSilverMat = new THREE.MeshStandardMaterial({
            color: 0x00f3ff,
            emissive: 0x00c4e6,
            emissiveIntensity: 1.0,
            metalness: 0.9
        });

        // Shield: Emerald Crystal
        this.shieldMat = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            emissive: 0x00cc66,
            emissiveIntensity: 0.9,
            roughness: 0.15,
            metalness: 0.8
        });

        // Rocket Boost: Orange/Magenta Thruster
        this.rocketBodyMat = new THREE.MeshStandardMaterial({
            color: 0xff0077,
            emissive: 0xcc0055,
            emissiveIntensity: 0.8,
            metalness: 0.7
        });
        this.rocketFinMat = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            roughness: 0.3
        });

        // Multiplier: Radiant Gold
        this.multStarMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffb700,
            emissiveIntensity: 1.1,
            metalness: 0.85
        });

        this.haloRingMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.35
        });
    }

    setWorld(worldName) {
        this.currentWorld = worldName;
        // World-themed coin color
        if (worldName === 'jungle') {
            this.coinMat.color.setHex(0xffd700);
            this.coinMat.emissive.setHex(0xbb9900);
        } else if (worldName === 'candy') {
            this.coinMat.color.setHex(0xff99c8);
            this.coinMat.emissive.setHex(0xff477e);
        } else if (worldName === 'road') {
            this.coinMat.color.setHex(0xffe600);
            this.coinMat.emissive.setHex(0xcca300);
        } else if (worldName === 'horror') {
            this.coinMat.color.setHex(0xc77dff);
            this.coinMat.emissive.setHex(0x9b5de5);
        }
    }

    // =========================================================================
    // COINS SPAWNER & PATTERNS
    // =========================================================================

    createCoin(x, y, z) {
        const mesh = new THREE.Mesh(this.coinGeom, this.coinMat);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        return {
            mesh: mesh,
            baseY: y,
            collected: false
        };
    }

    _spawnCoinPattern(zPos) {
        const roll = Math.random();
        const lane = Math.floor(Math.random() * 3);
        const xPos = this.lanePositions[lane];

        if (roll < 0.45) {
            // Straight row
            for (let i = 0; i < 6; i++) {
                this.coins.push(this.createCoin(xPos, 0.8, zPos - (i * 2.3)));
            }
        } else if (roll < 0.75) {
            // Parabolic Jump Arc over low obstacles
            for (let i = 0; i < 7; i++) {
                const progress = i / 6;
                const arcY = 0.8 + Math.sin(progress * Math.PI) * 1.6;
                this.coins.push(this.createCoin(xPos, arcY, zPos - (i * 2.4)));
            }
        } else {
            // Zig-Zag across adjacent lanes
            let curLane = lane;
            for (let i = 0; i < 5; i++) {
                const x = this.lanePositions[curLane];
                this.coins.push(this.createCoin(x, 0.8, zPos - (i * 2.6)));
                if (curLane === 0) curLane = Math.random() > 0.5 ? 1 : -1;
                else curLane = 0;
            }
        }
    }

    // =========================================================================
    // DISTINCT 3D POWER-UP MODELS
    // =========================================================================

    createPowerup(type, laneIndex, zPos) {
        const group = new THREE.Group();
        const xPos = this.lanePositions[laneIndex];
        const yPos = 1.25;
        group.position.set(xPos, yPos, zPos);

        let iconMesh;

        if (type === 'magnet') {
            // 1. Detailed 3D Horseshoe Magnet
            iconMesh = new THREE.Group();
            // Red U-Curved Body
            const uBody = new THREE.Mesh(
                new THREE.TorusGeometry(0.38, 0.12, 8, 20, Math.PI),
                this.magnetRedMat
            );
            uBody.rotation.z = Math.PI;
            iconMesh.add(uBody);

            // Left & Right Silver Magnetic Poles
            const poleL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), this.magnetSilverMat);
            poleL.position.set(-0.38, -0.15, 0);
            iconMesh.add(poleL);

            const poleR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), this.magnetSilverMat);
            poleR.position.set(0.38, -0.15, 0);
            iconMesh.add(poleR);
        } else if (type === 'shield') {
            // 2. Detailed 3D Crystalline Aegis Shield Crest
            iconMesh = new THREE.Group();
            const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 1), this.shieldMat);
            iconMesh.add(crest);

            const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.03, 6, 24), this.shieldMat);
            orbitRing.rotation.x = Math.PI / 3;
            iconMesh.add(orbitRing);
        } else if (type === 'multiplier') {
            // 3. Detailed 3D Golden Star with "2X" Ring
            iconMesh = new THREE.Group();
            const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), this.multStarMat);
            iconMesh.add(star);

            const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.04, 6, 24), this.multStarMat);
            iconMesh.add(outerRing);
        } else if (type === 'boost') {
            // 4. Detailed 3D Winged Rocket Thruster
            iconMesh = new THREE.Group();
            const rocket = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 8), this.rocketBodyMat);
            rocket.rotation.x = -Math.PI / 2;
            iconMesh.add(rocket);

            const finL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.3), this.rocketFinMat);
            finL.position.set(-0.25, 0, 0.25);
            iconMesh.add(finL);

            const finR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.3), this.rocketFinMat);
            finR.position.set(0.25, 0, 0.25);
            iconMesh.add(finR);
        }

        group.add(iconMesh);

        // Surrounding orbital halo ring
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.02, 6, 24), this.haloRingMat);
        group.add(halo);

        this.scene.add(group);

        return {
            type: type,
            mesh: group,
            iconMesh: iconMesh,
            halo: halo,
            baseY: yPos,
            collected: false
        };
    }

    _spawnRandomPowerup(zPos) {
        const types = ['magnet', 'shield', 'multiplier', 'boost'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const lane = Math.floor(Math.random() * 3);
        this.powerups.push(this.createPowerup(chosenType, lane, zPos));
    }

    // =========================================================================
    // UPDATE & INTERACTION LOOP
    // =========================================================================

    update(playerPos, playerBBox, hasMagnet, delta) {
        const animTime = Date.now() * 0.003;

        // 1. Update Coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (coin.collected) {
                this.scene.remove(coin.mesh);
                this.coins.splice(i, 1);
                continue;
            }

            // Spin & Bob
            coin.mesh.rotation.y += 3.5 * delta;
            coin.mesh.position.y = coin.baseY + Math.sin(animTime * 2 + coin.mesh.position.z * 0.1) * 0.12;

            // Magnet Attraction: pull smoothly towards player
            if (hasMagnet) {
                const distToPlayer = coin.mesh.position.distanceTo(playerPos);
                if (distToPlayer < 22) {
                    const pullSpeed = Math.min(30, 14 + (22 - distToPlayer) * 2.2);
                    coin.mesh.position.lerp(playerPos, pullSpeed * delta);
                }
            }

            // Collision check
            const dx = Math.abs(coin.mesh.position.x - playerPos.x);
            const dy = Math.abs(coin.mesh.position.y - (playerPos.y + 0.8));
            const dz = Math.abs(coin.mesh.position.z - playerPos.z);

            if (dx < 0.95 && dy < 1.25 && dz < 0.95) {
                coin.collected = true;
                this.particles.spawnCoinBurst(coin.mesh.position);
                this.scene.remove(coin.mesh);
                this.coins.splice(i, 1);

                if (window.onCoinCollected) {
                    window.onCoinCollected();
                }
                continue;
            }

            // Despawn behind player
            if (coin.mesh.position.z > playerPos.z + 15) {
                this.scene.remove(coin.mesh);
                this.coins.splice(i, 1);
            }
        }

        // 2. Update Power-Ups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (p.collected) {
                this.scene.remove(p.mesh);
                this.powerups.splice(i, 1);
                continue;
            }

            // Unique 3D Animations per Powerup
            if (p.type === 'magnet') {
                p.iconMesh.rotation.y += 2.2 * delta;
                p.iconMesh.rotation.z = Math.sin(animTime * 3) * 0.2;
            } else if (p.type === 'shield') {
                p.iconMesh.rotation.y += 2.8 * delta;
                p.iconMesh.rotation.x += 1.4 * delta;
            } else if (p.type === 'boost') {
                p.iconMesh.rotation.z += 3.5 * delta;
                p.iconMesh.rotation.y += 2.0 * delta;
            } else if (p.type === 'multiplier') {
                p.iconMesh.rotation.y += 2.5 * delta;
                const pulse = 1.0 + Math.sin(animTime * 4) * 0.12;
                p.iconMesh.scale.set(pulse, pulse, pulse);
            }

            p.halo.rotation.x += 1.8 * delta;
            p.halo.rotation.y += 1.2 * delta;
            p.mesh.position.y = p.baseY + Math.sin(animTime * 3) * 0.14;

            // Collision with player
            const dist = p.mesh.position.distanceTo(
                new THREE.Vector3(playerPos.x, playerPos.y + 1.0, playerPos.z)
            );

            if (dist < 1.5) {
                p.collected = true;
                this.particles.spawnExplosion(p.mesh.position, 0x00f3ff);
                this.scene.remove(p.mesh);
                p.mesh.traverse(child => { if (child.isMesh && child.geometry) child.geometry.dispose(); });
                this.powerups.splice(i, 1);

                if (window.onPowerupCollected) {
                    window.onPowerupCollected(p.type);
                }
                continue;
            }

            // Despawn behind player
            if (p.mesh.position.z > playerPos.z + 15) {
                this.scene.remove(p.mesh);
                p.mesh.traverse(child => { if (child.isMesh && child.geometry) child.geometry.dispose(); });
                this.powerups.splice(i, 1);
            }
        }

        // 3. Spawning Ahead
        const spawnLead = 240;
        while (this.nextCoinZ > playerPos.z - spawnLead) {
            this._spawnCoinPattern(this.nextCoinZ);
            this.nextCoinZ -= 28;
        }

        while (this.nextPowerupZ > playerPos.z - spawnLead) {
            this._spawnRandomPowerup(this.nextPowerupZ);
            this.nextPowerupZ -= (85 + Math.random() * 45);
        }
    }

    reset() {
        for (const coin of this.coins) {
            this.scene.remove(coin.mesh);
        }
        this.coins = [];

        for (const p of this.powerups) {
            this.scene.remove(p.mesh);
            p.mesh.traverse(child => { if (child.isMesh && child.geometry) child.geometry.dispose(); });
        }
        this.powerups = [];

        this.nextCoinZ = -30;
        this.nextPowerupZ = -80;
    }
}
