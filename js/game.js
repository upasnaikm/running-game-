/**
 * NEON PULSE: CYBER RUNNER 3D
 * Core Game Engine:
 * App Opening -> Main Menu -> Character Select -> 4 Worlds -> Fair Speed Run -> Instagram Continue -> Mystery Gift
 */

const STATE_SPLASH = 'splash';
const STATE_MENU = 'menu';
const STATE_CHAR_SELECT = 'char_select';
const STATE_WORLD_SELECT = 'world_select';
const STATE_PLAYING = 'playing';
const STATE_PAUSED = 'paused';
const STATE_CONTINUE_PROMPT = 'continue_prompt';
const STATE_REWARD = 'reward';
const STATE_GAMEOVER = 'gameover';

class GameEngine {
    constructor() {
        this.state = STATE_SPLASH;

        // Three.js Core
        this.canvas = document.getElementById('canvas3d');
        this.renderer = null;
        this.scene = null;
        this.camera = null;

        // Systems
        this.particles = null;
        this.character = null;
        this.track = null;
        this.obstacles = null;
        this.collectibles = null;
        this.ui = null;

        // Selections (persisted to localStorage)
        this.selectedCharacterId = localStorage.getItem('neon_char_id') || 'kai';
        this.selectedWorldId = localStorage.getItem('neon_world_id') || 'jungle';
        this.charList = ['kai', 'maya', 'bonbon', 'raven'];
        this.charIndex = Math.max(0, this.charList.indexOf(this.selectedCharacterId));

        // Fixed comfortable starting speed & progression
        this.baseSpeed = 12.0; // Comfortable 50% start speed
        this.currentSpeed = 12.0;
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.coinCombo = 0;
        this.comboResetTimer = 0;

        // Power-Up States & Timers
        this.magnetTimeRemaining = 0;
        this.shieldActive = false;
        this.multiplierTimeRemaining = 0;
        this.speedBoostTimeRemaining = 0;
        this.invulnerableTimer = 0;

        // Starter perk from Mystery Gift
        this.nextRunPerk = null;
        this.usedInstagramContinueThisRun = false;

        // Camera Follow & Dynamic FOV
        this.camBaseFov = 65;
        this.camCurrentFov = 65;
        this.camOffset = new THREE.Vector3(0, 4.2, 7.5);
        this.camLookOffset = new THREE.Vector3(0, 1.8, -10.0);
        this.cameraShake = 0;

        this.lastTime = performance.now();

        this._initThree();
        this._initSystems();
        this._bindInputs();

        // Launch opening sequence
        this.ui.playOpeningSequence(() => {
            this.showMenu();
        });

        requestAnimationFrame((t) => this._gameLoop(t));
    }

    _initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a3824);

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(this.camBaseFov, aspect, 0.1, 450);
        this.camera.position.set(0, 4.2, 7.5);
        this.camera.lookAt(0, 1.8, -10);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        window.addEventListener('resize', () => this._onWindowResize());
    }

    _initSystems() {
        this.particles = new ParticleEngine(this.scene);
        this.character = new Character(this.scene, this.particles, this.selectedCharacterId);
        this.track = new TrackManager(this.scene, this.selectedWorldId);
        this.obstacles = new ObstacleManager(this.scene, this.particles, this.selectedWorldId);
        this.collectibles = new CollectibleManager(this.scene, this.particles, this.selectedWorldId);
        this.ui = new UIManager();

        window.audio.setWorld(this.selectedWorldId);

        // Collectible callbacks
        window.onCoinCollected = () => this._handleCoinPickup();
        window.onPowerupCollected = (type) => this._handlePowerupPickup(type);
    }

    _onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // =========================================================================
    // INPUT HANDLING
    // =========================================================================

    _bindInputs() {
        window.addEventListener('keydown', (e) => {
            window.audio.resume();

            if (this.state === STATE_MENU) {
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    this.startGame();
                }
                return;
            }

            if (this.state === STATE_GAMEOVER) {
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    this.restartGame();
                }
                return;
            }

            if (e.code === 'KeyP' || e.code === 'Escape') {
                e.preventDefault();
                this.togglePause();
                return;
            }

            if (this.state !== STATE_PLAYING) return;

            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    e.preventDefault();
                    this.character.moveLeft();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    e.preventDefault();
                    this.character.moveRight();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                    e.preventDefault();
                    this.character.jump();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    e.preventDefault();
                    this.character.slide();
                    break;
            }
        });

        // Mobile On-Screen Touch Buttons
        const bindTouchBtn = (id, action) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                window.audio.resume();
                if (this.state === STATE_PLAYING) action();
            });
        };

        bindTouchBtn('touch-left', () => this.character.moveLeft());
        bindTouchBtn('touch-right', () => this.character.moveRight());
        bindTouchBtn('touch-jump', () => this.character.jump());
        bindTouchBtn('touch-slide', () => this.character.slide());

        // Full Screen Swipe Gestures
        let touchStartX = 0, touchStartY = 0;

        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 0) return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            const minSwipeDist = 30;

            if (this.state !== STATE_PLAYING) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > minSwipeDist) {
                    if (dx > 0) this.character.moveRight();
                    else this.character.moveLeft();
                }
            } else {
                if (Math.abs(dy) > minSwipeDist) {
                    if (dy < 0) this.character.jump();
                    else this.character.slide();
                }
            }
        }, { passive: true });
    }

    // =========================================================================
    // STATE MACHINE TRANSITIONS
    // =========================================================================

    showMenu() {
        this.resetGame();
        this.state = STATE_MENU;
        this.ui.showMainMenu(this.selectedCharacterId, this.selectedWorldId);
        window.audio.stopMusic();
    }

    backToMenu() {
        this.showMenu();
    }

    openCharacterSelect() {
        this.state = STATE_CHAR_SELECT;
        this.ui.showCharacterSelect(this.selectedCharacterId);
    }

    prevCharacter() {
        this.charIndex = (this.charIndex - 1 + this.charList.length) % this.charList.length;
        this.selectedCharacterId = this.charList[this.charIndex];
        this.ui.updateCharacterInfo(this.selectedCharacterId);
    }

    nextCharacter() {
        this.charIndex = (this.charIndex + 1) % this.charList.length;
        this.selectedCharacterId = this.charList[this.charIndex];
        this.ui.updateCharacterInfo(this.selectedCharacterId);
    }

    confirmCharacter() {
        localStorage.setItem('neon_char_id', this.selectedCharacterId);
        this.character.setCharacter(this.selectedCharacterId);
        this.ui.showToast(`RUNNER: ${CHARACTERS[this.selectedCharacterId].name} SELECTED!`, '#00f3ff');
        this.showMenu();
    }

    openWorldSelect() {
        this.state = STATE_WORLD_SELECT;
        this.ui.showWorldSelect(this.selectedWorldId);
    }

    selectWorld(worldId) {
        this.selectedWorldId = worldId;
        localStorage.setItem('neon_world_id', worldId);
        this.track.setWorld(worldId);
        this.obstacles.setWorld(worldId);
        this.collectibles.setWorld(worldId);
        window.audio.setWorld(worldId);
    }

    startGame() {
        this.resetGame();
        this.state = STATE_PLAYING;
        this.character.setCharacter(this.selectedCharacterId);
        this.track.setWorld(this.selectedWorldId);
        this.obstacles.setWorld(this.selectedWorldId);
        this.collectibles.setWorld(this.selectedWorldId);
        window.audio.setWorld(this.selectedWorldId);

        // Apply starter perks from mystery gifts if any
        if (this.nextRunPerk === 'shield') {
            this.shieldActive = true;
            this.character.setShieldActive(true);
            this.ui.showToast('🛡️ GIFT SHIELD ACTIVE!', '#00ff88');
            this.nextRunPerk = null;
        } else if (this.nextRunPerk === 'boost') {
            this.speedBoostTimeRemaining = 5.0;
            this.ui.setSpeedBoostVignette(true);
            this.particles.setSpeedBoostVisuals(true, this.character.position);
            this.ui.showToast('🚀 GIFT HYPER DASH ACTIVE!', '#ff0077');
            this.nextRunPerk = null;
        }

        this.ui.showHUD(this.selectedWorldId);
        window.audio.startMusic(this.selectedWorldId);
        this.ui.showToast('ADVENTURE LAUNCHED! ⚡', '#00f3ff');
    }

    togglePause() {
        if (this.state === STATE_PLAYING) {
            this.state = STATE_PAUSED;
            this.ui.showPause(this.score, this.coins);
            window.audio.stopMusic();
        } else if (this.state === STATE_PAUSED) {
            this.state = STATE_PLAYING;
            this.ui.hidePause();
            window.audio.startMusic(this.selectedWorldId);
            this.lastTime = performance.now();
        }
    }

    restartGame() {
        this.startGame();
    }

    // =========================================================================
    // INSTAGRAM CONTINUE FLOW
    // =========================================================================

    handlePlayerCrash() {
        window.audio.stopMusic();

        // If player has not used Instagram continue this run, offer it!
        if (!this.usedInstagramContinueThisRun) {
            this.state = STATE_CONTINUE_PROMPT;
            setTimeout(() => {
                this.ui.showInstagramContinue();
            }, 500);
        } else {
            // Already continued once; proceed directly to mystery gift
            this.proceedToMysteryGift();
        }
    }

    continueFromInstagram() {
        this.usedInstagramContinueThisRun = true;
        this.state = STATE_PLAYING;
        this.ui.showHUD(this.selectedWorldId);

        // Revive character & grant 3s invulnerability
        this.character.revive();
        this.invulnerableTimer = 3.0;

        // Clear obstacles within 35 units ahead of player
        this.obstacles.clearObstaclesAhead(this.character.position.z, 35);

        // Resume audio & notifications
        window.audio.startMusic(this.selectedWorldId);
        this.ui.showToast('ADVENTURE CONTINUED! ⚡', '#00ff88');

        this.lastTime = performance.now();
    }

    declineInstagramContinue() {
        this.proceedToMysteryGift();
    }

    proceedToMysteryGift() {
        this.state = STATE_REWARD;
        this.ui.showMysteryGift();
    }

    collectMysteryReward(reward) {
        if (reward) {
            if (reward.type === 'coins') {
                this.coins += reward.amount;
                this.ui.totalCoins += reward.amount;
                localStorage.setItem('neon_pulse_total_coins', this.ui.totalCoins);
                this.ui.showToast(`+${reward.amount} COINS CLAIMED! 💰`, '#ffd700');
            } else if (reward.type === 'perk') {
                this.nextRunPerk = reward.perk;
                this.ui.showToast(`NEXT RUN PERK READY: ${reward.title}! 🏆`, '#00ff88');
            }
        }

        // Show Game Over Summary
        this.state = STATE_GAMEOVER;
        const isNewRecord = this.score > this.ui.bestScore;
        this.ui.showGameOver(this.score, this.coins, this.distance, isNewRecord);
    }

    resetGame() {
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.currentSpeed = this.baseSpeed;
        this.coinCombo = 0;
        this.comboResetTimer = 0;
        this.usedInstagramContinueThisRun = false;

        this.magnetTimeRemaining = 0;
        this.shieldActive = false;
        this.multiplierTimeRemaining = 0;
        this.speedBoostTimeRemaining = 0;
        this.invulnerableTimer = 0;

        this.character.reset();
        this.track.reset();
        this.obstacles.reset();
        this.collectibles.reset();
        this.particles.clear();
        this.ui.setSpeedBoostVignette(false);

        this.camera.position.set(0, 4.2, 7.5);
        this.camera.fov = this.camBaseFov;
        this.camera.updateProjectionMatrix();

        this.lastTime = performance.now();
    }

    // =========================================================================
    // COLLECTIBLES & POWER-UPS
    // =========================================================================

    _handleCoinPickup() {
        const mult = this.multiplierTimeRemaining > 0 ? 2 : 1;
        this.coins += mult;
        this.score += 50 * mult;

        this.coinCombo++;
        this.comboResetTimer = 1.2;
        window.audio.playCoinSound(this.coinCombo);
    }

    _handlePowerupPickup(type) {
        this.score += 250;

        if (type === 'magnet') {
            this.magnetTimeRemaining = 12.0;
            this.character.setMagnetActive(true);
            window.audio.playMagnetSound();
            this.ui.showToast('🧲 COIN MAGNET ACTIVATED (12s)', '#00f3ff');
        } else if (type === 'shield') {
            this.shieldActive = true;
            this.character.setShieldActive(true);
            window.audio.playShieldSound();
            this.ui.showToast('🛡️ ENERGY SHIELD ONLINE', '#00ff88');
        } else if (type === 'multiplier') {
            this.multiplierTimeRemaining = 15.0;
            window.audio.playDoubleCoinsSound();
            this.ui.showToast('⚡ 2X MULTIPLIER ACTIVATED (15s)', '#ffd700');
        } else if (type === 'boost') {
            this.speedBoostTimeRemaining = 6.0;
            this.ui.setSpeedBoostVignette(true);
            this.particles.setSpeedBoostVisuals(true, this.character.position);
            window.audio.playSpeedBoostSound();
            this.ui.showToast('🚀 HYPER DASH (6s) - INVINCIBLE!', '#ff0077');
        }
    }

    // =========================================================================
    // MAIN GAME LOOP & BALANCED PROGRESSION
    // =========================================================================

    _gameLoop(now) {
        requestAnimationFrame((t) => this._gameLoop(t));

        let delta = (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (delta > 0.1) delta = 0.1;

        if (this.state === STATE_PLAYING) {
            this._updatePlaying(delta);
        } else if (this.state === STATE_MENU || this.state === STATE_SPLASH) {
            this._updateMenuCamera(delta);
        } else if (this.state === STATE_GAMEOVER) {
            this.character.update(delta, 0);
            this.particles.update(delta, this.character.position);
        }

        this.renderer.render(this.scene, this.camera);
    }

    _updatePlaying(delta) {
        // Balanced, comfortable progressive speed curve:
        // Starts at 12.0, gradually ramps up with distance (fair, playable!)
        const progressiveSpeed = this.baseSpeed + Math.min(16, Math.sqrt(this.distance) * 0.28);
        const isSpeedBoostActive = this.speedBoostTimeRemaining > 0;
        this.currentSpeed = isSpeedBoostActive ? progressiveSpeed * 1.65 : progressiveSpeed;

        // Advance character forward (-Z direction)
        const forwardDistance = this.currentSpeed * delta;
        this.character.position.z -= forwardDistance;
        this.distance += forwardDistance;

        // Score Gain
        const scoreMult = this.multiplierTimeRemaining > 0 ? 2 : 1;
        this.score += forwardDistance * 2.0 * scoreMult;

        // Timers
        if (this.magnetTimeRemaining > 0) {
            this.magnetTimeRemaining -= delta;
            if (this.magnetTimeRemaining <= 0) this.character.setMagnetActive(false);
        }
        if (this.multiplierTimeRemaining > 0) {
            this.multiplierTimeRemaining -= delta;
        }
        if (this.speedBoostTimeRemaining > 0) {
            this.speedBoostTimeRemaining -= delta;
            if (this.speedBoostTimeRemaining <= 0) {
                this.ui.setSpeedBoostVignette(false);
                this.particles.setSpeedBoostVisuals(false);
            }
        }
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= delta;
            // Visual flicker while invulnerable
            this.character.mesh.visible = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
        } else {
            this.character.mesh.visible = true;
        }

        if (this.comboResetTimer > 0) {
            this.comboResetTimer -= delta;
            if (this.comboResetTimer <= 0) this.coinCombo = 0;
        }

        // Update Subsystems
        this.character.update(delta, this.currentSpeed);
        this.track.update(this.character.position.z);
        this.obstacles.update(this.character.position.z, this.currentSpeed, delta);
        this.collectibles.update(
            this.character.position,
            this.character.getBounds(),
            this.magnetTimeRemaining > 0,
            delta
        );
        this.particles.update(delta, this.character.position);

        // Collision Check
        const hitObstacle = this.obstacles.checkCollision(this.character.getBounds());
        if (hitObstacle) {
            if (isSpeedBoostActive) {
                // Smashes obstacle in hyper dash!
                this.obstacles.destroyObstacle(hitObstacle);
                this.score += 150;
                this.cameraShake = 0.35;
                window.audio.playShieldBreakSound();
            } else if (this.invulnerableTimer > 0) {
                // In post-hit/revive grace period
            } else if (this.shieldActive) {
                // Shield absorbs collision!
                this.shieldActive = false;
                this.character.setShieldActive(false);
                this.obstacles.destroyObstacle(hitObstacle);
                this.ui.triggerShieldHitEffect();
                window.audio.playShieldBreakSound();
                this.invulnerableTimer = 1.8;
                this.cameraShake = 0.5;
                this.ui.showToast('🛡️ SHIELD BROKEN! EVADE!', '#00ff88');
            } else {
                // Fatal Collision!
                this.character.triggerCrash();
                this.ui.triggerCrashEffect();
                this.cameraShake = 0.8;
                this.handlePlayerCrash();
                return;
            }
        }

        this._updateCamera(delta, isSpeedBoostActive);

        // Update HUD
        this.ui.updateHUD(
            this.score,
            this.coins,
            this.distance,
            this.currentSpeed,
            this.multiplierTimeRemaining > 0
        );

        this._updateActivePowerupsUI();
    }

    _updateCamera(delta, isSpeedBoostActive) {
        const targetFov = isSpeedBoostActive ? 78 : this.camBaseFov;
        this.camCurrentFov += (targetFov - this.camCurrentFov) * (5 * delta);
        this.camera.fov = this.camCurrentFov;
        this.camera.updateProjectionMatrix();

        const targetCamX = this.character.position.x * 0.45;
        const targetCamY = this.character.position.y * 0.4 + this.camOffset.y;
        const targetCamZ = this.character.position.z + this.camOffset.z;

        this.camera.position.x += (targetCamX - this.camera.position.x) * (14 * delta);
        this.camera.position.y += (targetCamY - this.camera.position.y) * (14 * delta);
        this.camera.position.z = targetCamZ;

        if (this.cameraShake > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
            this.cameraShake = Math.max(0, this.cameraShake - 3 * delta);
        }

        const lookTarget = new THREE.Vector3(
            this.character.position.x * 0.25,
            this.character.position.y * 0.4 + this.camLookOffset.y,
            this.character.position.z + this.camLookOffset.z
        );
        this.camera.lookAt(lookTarget);
    }

    _updateActivePowerupsUI() {
        const list = [];
        if (this.speedBoostTimeRemaining > 0) {
            list.push({ name: 'Hyper Dash', icon: '🚀', remaining: this.speedBoostTimeRemaining, duration: 6.0, color: '#ff0077' });
        }
        if (this.magnetTimeRemaining > 0) {
            list.push({ name: 'Coin Magnet', icon: '🧲', remaining: this.magnetTimeRemaining, duration: 12.0, color: '#00f3ff' });
        }
        if (this.multiplierTimeRemaining > 0) {
            list.push({ name: '2X Multiplier', icon: '⚡', remaining: this.multiplierTimeRemaining, duration: 15.0, color: '#ffd700' });
        }
        if (this.shieldActive) {
            list.push({ name: 'Shield', icon: '🛡️', remaining: 1, duration: 1, color: '#00ff88' });
        }
        this.ui.updatePowerupsTray(list);
    }

    _updateMenuCamera(delta) {
        const time = Date.now() * 0.0006;
        this.camera.position.x = Math.sin(time) * 1.8;
        this.camera.position.y = 3.6 + Math.cos(time * 0.5) * 0.3;
        this.camera.lookAt(0, 1.5, -12);
        this.character.update(delta, 0);
        this.particles.update(delta, this.character.position);
    }
}

// Launch Game once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
});
