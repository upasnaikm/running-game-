/**
 * NEON PULSE: CYBER RUNNER 3D
 * Obstacles System: 4 Worlds Themed Obstacles, Moving Vehicles & Fair Solvable Spawner
 */

class ObstacleManager {
    constructor(scene, particles, initialWorld = 'jungle') {
        this.scene = scene;
        this.particles = particles;
        this.currentWorld = initialWorld;
        this.obstacles = [];

        this.lanePositions = [-2.8, 0, 2.8];
        this.nextSpawnZ = -60; // Generous safe runway before first obstacle
        this.baseSpacing = 38;  // Fair spacing for relaxed reaction time
    }

    setWorld(worldName) {
        this.currentWorld = worldName;
    }

    clearObstaclesAhead(playerZ, distance = 40) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            if (obs.mesh.position.z <= playerZ + 8 && obs.mesh.position.z >= playerZ - distance) {
                this.particles.spawnExplosion(obs.mesh.position, 0x00ff88);
                this.scene.remove(obs.mesh);
                this._disposeGroup(obs.mesh);
                this.obstacles.splice(i, 1);
            }
        }
        if (this.nextSpawnZ > playerZ - distance - 20) {
            this.nextSpawnZ = playerZ - distance - 25;
        }
    }

    // =========================================================================
    // OBSTACLE FACTORIES PER WORLD
    // =========================================================================

    // 1. Low Barrier (Requires Jump over)
    createLowBarrier(laneIndex, zPos) {
        const xPos = this.lanePositions[laneIndex];
        const group = new THREE.Group();
        group.position.set(xPos, 0, zPos);
        const w = this.currentWorld;

        if (w === 'jungle') {
            // Fallen mossy log
            const logMat = new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 0.9 });
            const log = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 2.2, 8), logMat);
            log.rotation.z = Math.PI / 2;
            log.position.y = 0.35;
            group.add(log);

            const moss = new THREE.Mesh(
                new THREE.BoxGeometry(1.6, 0.15, 0.45),
                new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.7 })
            );
            moss.position.y = 0.65;
            group.add(moss);
        } else if (w === 'candy') {
            // Donut / Gummy barricade
            const donutMat = new THREE.MeshStandardMaterial({ color: 0xff70a6, roughness: 0.4 });
            const donut = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.2, 8, 16), donutMat);
            donut.position.set(-0.5, 0.45, 0);
            group.add(donut);

            const donut2 = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.2, 8, 16), donutMat);
            donut2.position.set(0.5, 0.45, 0);
            group.add(donut2);
        } else if (w === 'road') {
            // Orange & white construction barrier
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const legL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.4), baseMat);
            legL.position.set(-0.8, 0.35, 0);
            group.add(legL);

            const legR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.4), baseMat);
            legR.position.set(0.8, 0.35, 0);
            group.add(legR);

            const bar = new THREE.Mesh(
                new THREE.BoxGeometry(2.0, 0.32, 0.15),
                new THREE.MeshStandardMaterial({ color: 0xff7b00, emissive: 0xcc5500, emissiveIntensity: 0.6 })
            );
            bar.position.y = 0.6;
            group.add(bar);
        } else if (w === 'horror') {
            // Spiked iron cemetery fence
            const fenceMat = new THREE.MeshStandardMaterial({ color: 0x1c1524, roughness: 0.8 });
            const rail = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.15), fenceMat);
            rail.position.y = 0.55;
            group.add(rail);

            for (let s = -0.8; s <= 0.8; s += 0.4) {
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.7, 5), fenceMat);
                spike.position.set(s, 0.5, 0);
                group.add(spike);
            }
        }

        const bbox = new THREE.Box3();
        this.scene.add(group);

        const obj = {
            type: 'low_barrier',
            mesh: group,
            lane: laneIndex,
            bbox: bbox,
            isMoving: false,
            updateBBox: function () {
                bbox.min.set(xPos - 0.95, 0, group.position.z - 0.3);
                bbox.max.set(xPos + 0.95, 0.82, group.position.z + 0.3);
            }
        };
        obj.updateBBox();
        return obj;
    }

    // 2. Overhead Barrier (Requires Slide under)
    createOverheadBarrier(laneIndex, zPos) {
        const xPos = this.lanePositions[laneIndex];
        const group = new THREE.Group();
        group.position.set(xPos, 0, zPos);
        const w = this.currentWorld;

        let poleColor = 0x3d3526, signColor = 0x228b22;
        if (w === 'candy') { poleColor = 0xffffff; signColor = 0xff477e; }
        if (w === 'road') { poleColor = 0x7f8c8d; signColor = 0x0077b6; }
        if (w === 'horror') { poleColor = 0x1c1524; signColor = 0x7209b7; }

        const poleMat = new THREE.MeshStandardMaterial({ color: poleColor, roughness: 0.6 });
        const signMat = new THREE.MeshStandardMaterial({ color: signColor, roughness: 0.4 });

        // Left & Right Support Poles (Height: 3.2m)
        const poleL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.25), poleMat);
        poleL.position.set(-0.95, 1.6, 0);
        group.add(poleL);

        const poleR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.25), poleMat);
        poleR.position.set(0.95, 1.6, 0);
        group.add(poleR);

        // Overhead Sign / Beam (Clearance below is Y: 0 to 1.25)
        const sign = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 0.3), signMat);
        sign.position.set(0, 2.05, 0);
        group.add(sign);

        const bbox = new THREE.Box3();
        this.scene.add(group);

        const obj = {
            type: 'overhead_barrier',
            mesh: group,
            lane: laneIndex,
            bbox: bbox,
            isMoving: false,
            updateBBox: function () {
                bbox.min.set(xPos - 1.0, 1.25, group.position.z - 0.3);
                bbox.max.set(xPos + 1.0, 2.9, group.position.z + 0.3);
            }
        };
        obj.updateBBox();
        return obj;
    }

    // 3. Tall Solid Barrier (Must change lanes)
    createTallBlock(laneIndex, zPos) {
        const xPos = this.lanePositions[laneIndex];
        const group = new THREE.Group();
        group.position.set(xPos, 0, zPos);
        const w = this.currentWorld;

        let blockMat;
        if (w === 'jungle') {
            blockMat = new THREE.MeshStandardMaterial({ color: 0x5a4d3b, roughness: 0.9 });
        } else if (w === 'candy') {
            blockMat = new THREE.MeshStandardMaterial({ color: 0x6b3e2e, roughness: 0.5 }); // Chocolate cake
        } else if (w === 'road') {
            blockMat = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.4, metalness: 0.6 }); // Heavy container
        } else if (w === 'horror') {
            blockMat = new THREE.MeshStandardMaterial({ color: 0x1f1629, roughness: 0.95 }); // Sarcophagus
        }

        const block = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.7, 1.8), blockMat);
        block.position.set(0, 1.35, 0);
        block.castShadow = true;
        group.add(block);

        const bbox = new THREE.Box3();
        this.scene.add(group);

        const obj = {
            type: 'tall_block',
            mesh: group,
            lane: laneIndex,
            bbox: bbox,
            isMoving: false,
            updateBBox: function () {
                bbox.min.set(xPos - 1.0, 0, group.position.z - 0.95);
                bbox.max.set(xPos + 1.0, 2.85, group.position.z + 0.95);
            }
        };
        obj.updateBBox();
        return obj;
    }

    // 4. Moving Vehicles (Approaches player down the lane)
    createMovingVehicle(laneIndex, zPos) {
        const xPos = this.lanePositions[laneIndex];
        const group = new THREE.Group();
        group.position.set(xPos, 0.2, zPos);
        const w = this.currentWorld;

        let carColor = 0x2d6a4f, lightColor = 0xfff382;
        if (w === 'candy') { carColor = 0xff70a6; lightColor = 0x06d6a0; }
        if (w === 'road') { carColor = 0xffb703; lightColor = 0xffffff; } // Yellow taxi
        if (w === 'horror') { carColor = 0x1b1322; lightColor = 0x9b5de5; } // Phantom hearse

        // Car Body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2.1, 1.8, 6.0),
            new THREE.MeshStandardMaterial({ color: carColor, roughness: 0.3, metalness: 0.7 })
        );
        body.position.set(0, 1.0, 0);
        body.castShadow = true;
        group.add(body);

        // Cabin Top
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 1.0, 3.2),
            new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.2, metalness: 0.8 })
        );
        cabin.position.set(0, 2.1, -0.4);
        group.add(cabin);

        // Headlights
        const lightMat = new THREE.MeshStandardMaterial({
            color: lightColor,
            emissive: lightColor,
            emissiveIntensity: 1.4
        });
        const lightL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.15), lightMat);
        lightL.position.set(-0.65, 0.9, 3.02);
        group.add(lightL);

        const lightR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.15), lightMat);
        lightR.position.set(0.65, 0.9, 3.02);
        group.add(lightR);

        const bbox = new THREE.Box3();
        this.scene.add(group);

        const obj = {
            type: 'moving_vehicle',
            mesh: group,
            lane: laneIndex,
            bbox: bbox,
            isMoving: true,
            moveSpeed: 7.5, // Fair, comfortable approach speed
            updateBBox: function () {
                bbox.min.set(xPos - 1.1, 0, group.position.z - 3.1);
                bbox.max.set(xPos + 1.1, 2.8, group.position.z + 3.1);
            }
        };
        obj.updateBBox();
        return obj;
    }

    // =========================================================================
    // UPDATE & SOLVABLE SPAWNER
    // =========================================================================

    update(playerZ, runSpeed, delta) {
        // Move approaching vehicles
        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            if (obs.isMoving) {
                obs.mesh.position.z += obs.moveSpeed * delta;
            }
            obs.updateBBox();
        }

        // Spawn patterns with fair, comfortable distance buffer
        const spawnLead = 260;
        while (this.nextSpawnZ > playerZ - spawnLead) {
            this._spawnFairPattern(this.nextSpawnZ, runSpeed);
            // Spacing expands with speed to guarantee sufficient reaction time
            const dynamicSpacing = this.baseSpacing + (runSpeed * 0.75);
            this.nextSpawnZ -= dynamicSpacing;
        }

        // Despawn obstacles behind player
        const despawnZ = playerZ + 25;
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            if (obs.mesh.position.z > despawnZ) {
                this.scene.remove(obs.mesh);
                this._disposeGroup(obs.mesh);
                this.obstacles.splice(i, 1);
            }
        }
    }

    _spawnFairPattern(zPos, runSpeed) {
        // Solvable rules: Never block all 3 lanes with impassable obstacles!
        const roll = Math.random();

        if (roll < 0.3) {
            // Pattern 1: Single low barrier (jumpable or 2 clear lanes)
            const lane = Math.floor(Math.random() * 3);
            this.obstacles.push(this.createLowBarrier(lane, zPos));
        } else if (roll < 0.55) {
            // Pattern 2: Single overhead barrier (slideable or 2 clear lanes)
            const lane = Math.floor(Math.random() * 3);
            this.obstacles.push(this.createOverheadBarrier(lane, zPos));
        } else if (roll < 0.78) {
            // Pattern 3: Tall block in one lane, low hurdle in second, 1 completely clear lane
            const tallLane = Math.floor(Math.random() * 3);
            this.obstacles.push(this.createTallBlock(tallLane, zPos));

            const otherLanes = [0, 1, 2].filter(l => l !== tallLane);
            const lowLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
            this.obstacles.push(this.createLowBarrier(lowLane, zPos));
        } else {
            // Pattern 4: Moving vehicle approaching down one lane
            const vehicleLane = Math.floor(Math.random() * 3);
            this.obstacles.push(this.createMovingVehicle(vehicleLane, zPos));
        }
    }

    checkCollision(playerBBox) {
        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            if (obs.bbox.intersectsBox(playerBBox)) {
                return obs;
            }
        }
        return null;
    }

    destroyObstacle(obs) {
        const index = this.obstacles.indexOf(obs);
        if (index !== -1) {
            this.particles.spawnExplosion(obs.mesh.position, 0x00f3ff);
            this.scene.remove(obs.mesh);
            this._disposeGroup(obs.mesh);
            this.obstacles.splice(index, 1);
        }
    }

    _disposeGroup(group) {
        group.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }
        });
    }

    reset() {
        for (const obs of this.obstacles) {
            this.scene.remove(obs.mesh);
            this._disposeGroup(obs.mesh);
        }
        this.obstacles = [];
        this.nextSpawnZ = -60;
    }
}
