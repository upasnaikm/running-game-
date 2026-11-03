/**
 * NEON PULSE: CYBER RUNNER 3D
 * Character System: Multi-Character 3D Models, Skeletal Animations & 3D Preview Stage
 */

const CHARACTERS = {
    kai: {
        id: 'kai',
        name: 'Kai - Pulse Runner',
        title: 'Cyber Kinetic',
        icon: '⚡',
        desc: 'A cybernetic speedster equipped with dual jet thrusters and responsive anti-grav sneakers.',
        perk: '⚡ Specialty: Agile Lane Transition',
        suitColor: 0x111625,
        accentColor: 0x00f3ff,
        detailColor: 0xff0077,
        headStyle: 'cyber_helmet',
        backStyle: 'jetpack',
        legStyle: 'sneakers'
    },
    maya: {
        id: 'maya',
        name: 'Maya - Jungle Explorer',
        title: 'Ruins Pathfinder',
        icon: '🧭',
        desc: 'A fearless adventurer equipped with explorer safari gear, utility packs, and hiking boots.',
        perk: '🌿 Specialty: Swift High Jumper',
        suitColor: 0x3d4b26, // Olive safari
        accentColor: 0xd4a373, // Leather khaki
        detailColor: 0x2a9d8f, // Emerald band
        headStyle: 'explorer_hat',
        backStyle: 'hiking_pack',
        legStyle: 'hiking_boots'
    },
    bonbon: {
        id: 'bonbon',
        name: 'Bonbon - Candy Dash',
        title: 'Sugar Sprinter',
        icon: '🍭',
        desc: 'A joyful dessert hero wearing a pastel strawberry hoodie and marshmallow sneakers.',
        perk: '🍬 Specialty: Magnet Affinity Surge',
        suitColor: 0xff85a2, // Strawberry pink
        accentColor: 0xa0e7e5, // Mint pastel
        detailColor: 0xffd166, // Golden candy
        headStyle: 'candy_hoodie',
        backStyle: 'candy_pack',
        legStyle: 'candy_shoes'
    },
    raven: {
        id: 'raven',
        name: 'Raven - Shadow Rogue',
        title: 'Night Phantom',
        icon: '🦇',
        desc: 'A stealth ninja wrapped in a midnight cowl with glowing amethyst eyes and shadow grieves.',
        perk: '🌙 Specialty: Low-Profile Slide Stealth',
        suitColor: 0x0d0f17, // Deep obsidian
        accentColor: 0x9b5de5, // Amethyst violet
        detailColor: 0x7209b7, // Dark purple glow
        headStyle: 'shadow_cowl',
        backStyle: 'cape',
        legStyle: 'shadow_boots'
    }
};

class Character {
    constructor(scene, particles, charId = 'kai') {
        this.scene = scene;
        this.particles = particles;
        this.charId = charId;
        this.charData = CHARACTERS[charId] || CHARACTERS.kai;

        // Lane setup: 3 lanes (-2.8, 0, 2.8)
        this.laneWidth = 2.8;
        this.currentLane = 0; // -1: Left, 0: Center, 1: Right
        this.targetX = 0;

        // Physics & Motion
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocityY = 0;
        this.gravity = -34;
        this.jumpForce = 13.0;
        this.isGrounded = true;
        this.isJumping = false;
        this.isSliding = false;
        this.slideTimer = 0;
        this.slideDuration = 0.75;

        // Visual banking & animation timers
        this.rollAngle = 0;
        this.animTime = 0;
        this.isDead = false;

        // Power-Up visual attachments
        this.hasShield = false;
        this.shieldMesh = null;
        this.hasMagnet = false;
        this.magnetAura = null;

        // Character 3D hierarchy
        this.mesh = new THREE.Group();
        this._buildCharacterMesh();
        this.scene.add(this.mesh);

        // Bounding box for collisions
        this.bbox = new THREE.Box3();
    }

    setCharacter(charId) {
        if (!CHARACTERS[charId]) return;
        this.charId = charId;
        this.charData = CHARACTERS[charId];

        // Clean up existing mesh children
        while (this.mesh.children.length > 0) {
            const child = this.mesh.children[0];
            this.mesh.remove(child);
            this._disposeHierarchy(child);
        }

        this._buildCharacterMesh();
    }

    _disposeHierarchy(obj) {
        obj.traverse(c => {
            if (c.isMesh) {
                if (c.geometry) c.geometry.dispose();
                if (c.material) {
                    if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                    else c.material.dispose();
                }
            }
        });
    }

    _buildCharacterMesh() {
        const data = this.charData;

        // Materials based on character personality
        const suitMat = new THREE.MeshStandardMaterial({
            color: data.suitColor,
            roughness: 0.35,
            metalness: 0.7
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: data.accentColor,
            roughness: 0.25,
            metalness: 0.5,
            emissive: data.accentColor,
            emissiveIntensity: 0.5
        });

        const detailMat = new THREE.MeshStandardMaterial({
            color: data.detailColor,
            roughness: 0.15,
            metalness: 0.9,
            emissive: data.detailColor,
            emissiveIntensity: 1.1
        });

        // 1. Root Pivot
        this.pivot = new THREE.Group();
        this.mesh.add(this.pivot);

        // 2. Pelvis / Hips
        this.pelvis = new THREE.Group();
        this.pelvis.position.y = 1.0;
        this.pivot.add(this.pelvis);

        const hipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.35), suitMat);
        this.pelvis.add(hipMesh);

        // 3. Torso / Chest
        this.torso = new THREE.Group();
        this.torso.position.y = 0.2;
        this.pelvis.add(this.torso);

        const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.4), suitMat);
        chestMesh.position.y = 0.3;
        this.torso.add(chestMesh);

        // Chest Armor Plate / Vest Emblem
        const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.42), accentMat);
        plateMesh.position.set(0, 0.35, 0.02);
        this.torso.add(plateMesh);

        // 4. Back Accessory (Jetpack / Hiking Pack / Candy Pack / Cape)
        this.backAcc = new THREE.Group();
        this.backAcc.position.set(0, 0.35, -0.28);
        this.torso.add(this.backAcc);

        if (data.backStyle === 'jetpack') {
            const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.18), suitMat);
            this.backAcc.add(packBody);
            const nozzleGeom = new THREE.CylinderGeometry(0.08, 0.12, 0.2, 8);
            const nozL = new THREE.Mesh(nozzleGeom, detailMat);
            nozL.position.set(-0.14, -0.25, 0);
            this.backAcc.add(nozL);
            const nozR = new THREE.Mesh(nozzleGeom, detailMat);
            nozR.position.set(0.14, -0.25, 0);
            this.backAcc.add(nozR);
        } else if (data.backStyle === 'hiking_pack') {
            const pack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.25), accentMat);
            this.backAcc.add(pack);
            const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 8), detailMat);
            roll.rotation.z = Math.PI / 2;
            roll.position.y = 0.32;
            this.backAcc.add(roll);
        } else if (data.backStyle === 'candy_pack') {
            const pack = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), detailMat);
            this.backAcc.add(pack);
        } else if (data.backStyle === 'cape') {
            const capeGeom = new THREE.BoxGeometry(0.5, 0.9, 0.05);
            const cape = new THREE.Mesh(capeGeom, suitMat);
            cape.position.set(0, -0.2, -0.05);
            cape.rotation.x = 0.2;
            this.backAcc.add(cape);
        }

        // 5. Head & Hat/Helmet
        this.head = new THREE.Group();
        this.head.position.y = 0.75;
        this.torso.add(this.head);

        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), suitMat);
        headMesh.position.y = 0.2;
        this.head.add(headMesh);

        // Head Style Specifics
        if (data.headStyle === 'cyber_helmet') {
            const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.15), detailMat);
            visor.position.set(0, 0.22, 0.2);
            this.head.add(visor);
        } else if (data.headStyle === 'explorer_hat') {
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 12), accentMat);
            brim.position.y = 0.42;
            this.head.add(brim);
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.2, 12), accentMat);
            crown.position.y = 0.52;
            this.head.add(crown);
            const band = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.1), detailMat);
            band.position.set(0, 0.2, 0.2);
            this.head.add(band);
        } else if (data.headStyle === 'candy_hoodie') {
            const hood = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.46), accentMat);
            hood.position.y = 0.2;
            this.head.add(hood);
            const goggles = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 16), detailMat);
            goggles.position.set(0, 0.24, 0.23);
            this.head.add(goggles);
        } else if (data.headStyle === 'shadow_cowl') {
            const cowl = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.55, 6), suitMat);
            cowl.position.set(0, 0.45, -0.05);
            cowl.rotation.x = -0.2;
            this.head.add(cowl);
            const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.08), detailMat);
            eyes.position.set(0, 0.2, 0.2);
            this.head.add(eyes);
        }

        // 6. Arms
        this.leftArm = this._createArm(suitMat, accentMat, -1);
        this.leftArm.position.set(-0.42, 0.55, 0);
        this.torso.add(this.leftArm);

        this.rightArm = this._createArm(suitMat, accentMat, 1);
        this.rightArm.position.set(0.42, 0.55, 0);
        this.torso.add(this.rightArm);

        // 7. Legs
        this.leftLeg = this._createLeg(suitMat, detailMat, -1);
        this.leftLeg.position.set(-0.2, -0.1, 0);
        this.pelvis.add(this.leftLeg);

        this.rightLeg = this._createLeg(suitMat, detailMat, 1);
        this.rightLeg.position.set(0.2, -0.1, 0);
        this.pelvis.add(this.rightLeg);

        // 8. Power-Up Shield Bubble Attachment
        const shieldGeom = new THREE.IcosahedronGeometry(1.4, 2);
        const shieldMat = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0,
            wireframe: true,
            emissive: 0x00ff88,
            emissiveIntensity: 0.9
        });
        this.shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
        this.shieldMesh.position.y = 1.1;
        this.shieldMesh.visible = false;
        this.mesh.add(this.shieldMesh);

        // 9. Magnet Aura (Rotating dual rings)
        const ringGeom = new THREE.TorusGeometry(1.2, 0.04, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.6
        });
        this.magnetAura = new THREE.Mesh(ringGeom, ringMat);
        this.magnetAura.position.y = 1.1;
        this.magnetAura.rotation.x = Math.PI / 2;
        this.magnetAura.visible = false;
        this.mesh.add(this.magnetAura);

        // Cast shadows
        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
    }

    _createArm(suitMat, accentMat, side) {
        const shoulder = new THREE.Group();
        const upper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.18), suitMat);
        upper.position.y = -0.18;
        shoulder.add(upper);

        const elbow = new THREE.Group();
        elbow.position.y = -0.38;
        shoulder.add(elbow);

        const fore = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.16), accentMat);
        fore.position.y = -0.16;
        elbow.add(fore);

        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.18), suitMat);
        hand.position.y = -0.36;
        elbow.add(hand);

        shoulder.userData = { upper, elbow };
        return shoulder;
    }

    _createLeg(suitMat, detailMat, side) {
        const hip = new THREE.Group();
        const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, 0.24), suitMat);
        thigh.position.y = -0.22;
        hip.add(thigh);

        const knee = new THREE.Group();
        knee.position.y = -0.45;
        hip.add(knee);

        const shin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.22), suitMat);
        shin.position.y = -0.2;
        knee.add(shin);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.45), detailMat);
        foot.position.set(0, -0.42, 0.08);
        knee.add(foot);

        hip.userData = { thigh, knee };
        return hip;
    }

    // =========================================================================
    // CONTROLS & ACTIONS
    // =========================================================================

    moveLeft() {
        if (this.isDead) return;
        if (this.currentLane > -1) {
            this.currentLane--;
            this.targetX = this.currentLane * this.laneWidth;
            this.rollAngle = -0.25;
            window.audio.playLaneSwitchSound();
        }
    }

    moveRight() {
        if (this.isDead) return;
        if (this.currentLane < 1) {
            this.currentLane++;
            this.targetX = this.currentLane * this.laneWidth;
            this.rollAngle = 0.25;
            window.audio.playLaneSwitchSound();
        }
    }

    jump() {
        if (this.isDead) return;
        if (this.isSliding) {
            this.stopSlide();
        }
        if (this.isGrounded) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
            this.isJumping = true;
            this.particles.spawnJumpDust(this.position);
            window.audio.playJumpSound();
        }
    }

    slide() {
        if (this.isDead) return;
        if (!this.isSliding) {
            this.isSliding = true;
            this.slideTimer = this.slideDuration;
            if (!this.isGrounded) {
                this.velocityY = -22; // Fast fall
            }
            this.particles.spawnSlideSparks(this.position);
            window.audio.playSlideSound();
        } else {
            this.slideTimer = this.slideDuration;
        }
    }

    stopSlide() {
        this.isSliding = false;
        this.slideTimer = 0;
        this.pivot.rotation.x = 0;
        this.pivot.position.y = 0;
    }

    setShieldActive(active) {
        this.hasShield = active;
        if (this.shieldMesh) {
            this.shieldMesh.visible = active;
            this.shieldMesh.material.opacity = active ? 0.65 : 0;
        }
    }

    setMagnetActive(active) {
        this.hasMagnet = active;
        if (this.magnetAura) {
            this.magnetAura.visible = active;
        }
    }

    // =========================================================================
    // UPDATE & ANIMATION LOOP
    // =========================================================================

    update(delta, runSpeed) {
        if (this.isDead) {
            this.mesh.rotation.x += 4 * delta;
            this.mesh.rotation.y += 2 * delta;
            this.position.y = Math.max(0, this.position.y + this.velocityY * delta);
            this.velocityY += this.gravity * delta;
            this.mesh.position.copy(this.position);
            return;
        }

        // Smooth Lane Transition (comfortable & responsive)
        this.position.x += (this.targetX - this.position.x) * (16 * delta);
        this.rollAngle += (0 - this.rollAngle) * (10 * delta);

        // Jump Physics
        if (!this.isGrounded) {
            this.position.y += this.velocityY * delta;
            this.velocityY += this.gravity * delta;

            if (this.position.y <= 0) {
                this.position.y = 0;
                this.velocityY = 0;
                this.isGrounded = true;
                this.isJumping = false;
                this.particles.spawnJumpDust(this.position);
            }
        }

        // Slide Timer
        if (this.isSliding) {
            this.slideTimer -= delta;
            this.particles.spawnSlideSparks(this.position);
            if (this.slideTimer <= 0) {
                this.stopSlide();
            }
        }

        // Particle Thruster Trail (Kai & high speed runs)
        if (Math.random() < 0.5) {
            this.particles.spawnJetpackTrail(
                new THREE.Vector3(this.position.x, this.position.y + 1.2, this.position.z),
                runSpeed > 22
            );
        }

        // Procedural Skeletal Animations
        this._animateSkeleton(delta, runSpeed);

        // Visual Shields & Magnets
        if (this.hasShield && this.shieldMesh) {
            this.shieldMesh.rotation.y += 2.0 * delta;
            this.shieldMesh.rotation.z += 1.4 * delta;
            const pulse = 1.0 + Math.sin(Date.now() * 0.007) * 0.07;
            this.shieldMesh.scale.set(pulse, pulse, pulse);
        }
        if (this.hasMagnet && this.magnetAura) {
            this.magnetAura.rotation.z += 3.2 * delta;
        }

        this.mesh.position.copy(this.position);
        this.mesh.rotation.z = -this.rollAngle;

        this._updateBoundingBox();
    }

    _animateSkeleton(delta, runSpeed) {
        this.animTime += delta * (Math.max(8, runSpeed) * 0.55);

        if (this.isSliding) {
            this.pivot.position.y = -0.45;
            this.pivot.rotation.x = 1.2;
            this.leftLeg.rotation.x = -1.2;
            this.rightLeg.rotation.x = 0.4;
            this.leftArm.rotation.x = -0.8;
            this.rightArm.rotation.x = 1.1;
            this.head.rotation.x = -1.0;
            return;
        }

        this.pivot.position.y = 0;
        this.pivot.rotation.x = 0;
        this.head.rotation.x = 0;

        if (!this.isGrounded) {
            this.leftLeg.rotation.x = -0.7;
            this.leftLeg.userData.knee.rotation.x = 1.2;
            this.rightLeg.rotation.x = -0.4;
            this.rightLeg.userData.knee.rotation.x = 0.9;
            this.leftArm.rotation.x = 1.4;
            this.rightArm.rotation.x = 1.4;
            this.leftArm.rotation.z = -0.4;
            this.rightArm.rotation.z = 0.4;
            return;
        }

        const legAngle = Math.sin(this.animTime) * 0.85;
        const armAngle = -Math.sin(this.animTime) * 0.8;

        this.leftLeg.rotation.x = legAngle;
        this.leftLeg.userData.knee.rotation.x = legAngle < 0 ? Math.abs(legAngle) * 1.2 : 0.1;

        this.rightLeg.rotation.x = -legAngle;
        this.rightLeg.userData.knee.rotation.x = -legAngle < 0 ? Math.abs(legAngle) * 1.2 : 0.1;

        this.leftArm.rotation.x = armAngle;
        this.leftArm.rotation.z = -0.15;
        this.leftArm.userData.elbow.rotation.x = -0.4 - Math.abs(armAngle) * 0.4;

        this.rightArm.rotation.x = -armAngle;
        this.rightArm.rotation.z = 0.15;
        this.rightArm.userData.elbow.rotation.x = -0.4 - Math.abs(armAngle) * 0.4;

        this.pelvis.position.y = 1.0 + Math.abs(Math.sin(this.animTime * 2)) * 0.08;
        this.torso.rotation.y = Math.sin(this.animTime) * 0.1;
    }

    _updateBoundingBox() {
        if (this.isSliding) {
            this.bbox.min.set(this.position.x - 0.45, this.position.y, this.position.z - 0.6);
            this.bbox.max.set(this.position.x + 0.45, this.position.y + 0.75, this.position.z + 0.6);
        } else {
            this.bbox.min.set(this.position.x - 0.4, this.position.y + 0.1, this.position.z - 0.45);
            this.bbox.max.set(this.position.x + 0.4, this.position.y + 1.95, this.position.z + 0.45);
        }
    }

    getBounds() {
        return this.bbox;
    }

    triggerCrash() {
        this.isDead = true;
        this.velocityY = 10;
        this.particles.spawnExplosion(this.position, 0xff0055);
        window.audio.playCrashSound();
    }

    revive() {
        this.isDead = false;
        this.velocityY = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.isSliding = false;
        this.mesh.rotation.set(0, 0, 0);
        this.pivot.rotation.set(0, 0, 0);
        this.pivot.position.set(0, 0, 0);
        this.position.y = 0;
        window.audio.playReviveSound();
    }

    reset() {
        this.currentLane = 0;
        this.targetX = 0;
        this.position.set(0, 0, 0);
        this.velocityY = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.isSliding = false;
        this.slideTimer = 0;
        this.rollAngle = 0;
        this.animTime = 0;
        this.isDead = false;
        this.mesh.rotation.set(0, 0, 0);
        this.pivot.rotation.set(0, 0, 0);
        this.pivot.position.set(0, 0, 0);
        this.setShieldActive(false);
        this.setMagnetActive(false);
        this._updateBoundingBox();
    }
}

/**
 * Character Preview Stage for Selection Screen
 */
class CharacterPreviewStage {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        const width = this.canvas.clientWidth || 480;
        const height = this.canvas.clientHeight || 230;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
        this.camera.position.set(0, 1.4, 3.8);
        this.camera.lookAt(0, 1.0, 0);

        // Pedestal Platform
        const pedGeom = new THREE.CylinderGeometry(1.2, 1.3, 0.2, 24);
        const pedMat = new THREE.MeshStandardMaterial({
            color: 0x141c30,
            roughness: 0.3,
            metalness: 0.8
        });
        const pedestal = new THREE.Mesh(pedGeom, pedMat);
        pedestal.position.y = -0.1;
        this.scene.add(pedestal);

        // Glowing Pedestal Rim
        const rimGeom = new THREE.TorusGeometry(1.25, 0.03, 8, 32);
        const rimMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
        const rim = new THREE.Mesh(rimGeom, rimMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.01;
        this.scene.add(rim);

        // Lighting
        const amb = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(amb);
        const dir = new THREE.DirectionalLight(0xaad4ff, 1.5);
        dir.position.set(5, 10, 7);
        this.scene.add(dir);

        this.dummyParticles = { spawnJumpDust: () => {}, spawnSlideSparks: () => {}, spawnJetpackTrail: () => {} };
        this.currentChar = null;
        this.activeCharId = 'kai';

        this.loadCharacter('kai');

        // Render loop
        this.isAnimating = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this._loop(t));
    }

    loadCharacter(charId) {
        if (this.currentChar) {
            this.scene.remove(this.currentChar.mesh);
            this.currentChar._disposeHierarchy(this.currentChar.mesh);
        }
        this.activeCharId = charId;
        this.currentChar = new Character(this.scene, this.dummyParticles, charId);
        this.currentChar.position.set(0, 0, 0);
    }

    resize() {
        if (!this.canvas || !this.renderer || !this.camera) return;
        const width = this.canvas.clientWidth || 480;
        const height = this.canvas.clientHeight || 230;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    _loop(now) {
        if (this.isAnimating) {
            requestAnimationFrame((t) => this._loop(t));
        }
        const delta = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        if (this.currentChar) {
            // Gentle showcase rotation on pedestal
            this.currentChar.mesh.rotation.y += 1.2 * delta;
            this.currentChar.update(delta, 12);
        }

        this.renderer.render(this.scene, this.camera);
    }
}
