/**
 * NEON PULSE: CYBER RUNNER 3D
 * UI Manager - Complete Screen Flow:
 * Splash -> Main Menu -> Character Select -> World Select -> HUD -> Instagram Continue -> Mystery Gift -> Game Over
 */

class UIManager {
    constructor() {
        this.bestScore = parseInt(localStorage.getItem('neon_pulse_best_score') || '0', 10);
        this.totalCoins = parseInt(localStorage.getItem('neon_pulse_total_coins') || '0', 10);

        // Screens
        this.splashScreen = document.getElementById('splash-screen');
        this.mainMenuScreen = document.getElementById('main-menu-screen');
        this.charSelectScreen = document.getElementById('char-select-screen');
        this.worldSelectScreen = document.getElementById('world-select-screen');
        this.instagramScreen = document.getElementById('instagram-continue-screen');
        this.mysteryGiftScreen = document.getElementById('mystery-gift-screen');
        this.settingsModal = document.getElementById('settings-modal');
        this.pauseModal = document.getElementById('pause-modal');
        this.gameoverModal = document.getElementById('gameover-modal');
        this.hudOverlay = document.getElementById('hud-overlay');

        // Splash elements
        this.splashLoaderFill = document.getElementById('splash-loader-fill');
        this.splashLoaderText = document.getElementById('splash-loader-text');
        this.splashTapBtn = document.getElementById('splash-tap-btn');

        // Main Menu elements
        this.menuBestScore = document.getElementById('menu-best-score');
        this.menuCharIcon = document.getElementById('menu-char-icon');
        this.menuCharName = document.getElementById('menu-char-name');
        this.menuWorldIcon = document.getElementById('menu-world-icon');
        this.menuWorldName = document.getElementById('menu-world-name');

        // Character Select elements
        this.charDisplayName = document.getElementById('char-display-name');
        this.charTitleTag = document.getElementById('char-title-tag');
        this.charDescText = document.getElementById('char-desc-text');
        this.charPerkBadge = document.getElementById('char-perk-badge');

        // Mystery Gift elements
        this.giftBoxElement = document.getElementById('gift-box-element');
        this.rewardRevealCard = document.getElementById('reward-reveal-card');
        this.rewardRevealIcon = document.getElementById('reward-reveal-icon');
        this.rewardRevealTitle = document.getElementById('reward-reveal-title');
        this.rewardRevealDesc = document.getElementById('reward-reveal-desc');
        this.btnGiftCollect = document.getElementById('btn-gift-collect');
        this.currentReward = null;

        // HUD elements
        this.hudScore = document.getElementById('hud-score');
        this.hudBestSmall = document.getElementById('hud-best-small');
        this.hudCoins = document.getElementById('hud-coins');
        this.hudSpeed = document.getElementById('hud-speed');
        this.hudDistance = document.getElementById('hud-distance');
        this.hudWorldIcon = document.getElementById('hud-world-icon');
        this.hudMultiplierBadge = document.getElementById('hud-multiplier-badge');
        this.powerupsTray = document.getElementById('powerups-tray');
        this.screenEffects = document.getElementById('screen-effects');
        this.toastContainer = document.getElementById('toast-container');

        // Game Over elements
        this.gameoverScore = document.getElementById('gameover-score');
        this.gameoverBest = document.getElementById('gameover-best');
        this.gameoverCoins = document.getElementById('gameover-coins');
        this.gameoverDistance = document.getElementById('gameover-distance');
        this.gameoverRecordBadge = document.getElementById('gameover-record-badge');

        // 3D Preview Stage
        this.charPreviewStage = null;

        this._bindUIEvents();
    }

    _bindUIEvents() {
        // Main Menu Navigation
        document.getElementById('btn-menu-play').addEventListener('click', () => {
            if (window.game) window.game.startGame();
        });
        document.getElementById('btn-menu-characters').addEventListener('click', () => {
            if (window.game) window.game.openCharacterSelect();
        });
        document.getElementById('btn-menu-worlds').addEventListener('click', () => {
            if (window.game) window.game.openWorldSelect();
        });
        document.getElementById('btn-menu-settings').addEventListener('click', () => {
            this.showSettings();
        });
        document.getElementById('menu-chip-char').addEventListener('click', () => {
            if (window.game) window.game.openCharacterSelect();
        });
        document.getElementById('menu-chip-world').addEventListener('click', () => {
            if (window.game) window.game.openWorldSelect();
        });

        // Character Select screen buttons
        document.getElementById('btn-char-prev').addEventListener('click', () => {
            if (window.game) window.game.prevCharacter();
        });
        document.getElementById('btn-char-next').addEventListener('click', () => {
            if (window.game) window.game.nextCharacter();
        });
        document.getElementById('btn-char-confirm').addEventListener('click', () => {
            if (window.game) window.game.confirmCharacter();
        });
        document.getElementById('btn-char-back').addEventListener('click', () => {
            if (window.game) window.game.backToMenu();
        });

        // World Select screen cards & buttons
        const worldCards = document.querySelectorAll('.world-card');
        worldCards.forEach(card => {
            card.addEventListener('click', () => {
                worldCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const chosenWorld = card.getAttribute('data-world');
                if (window.game) window.game.selectWorld(chosenWorld);
            });
        });
        document.getElementById('btn-world-confirm').addEventListener('click', () => {
            if (window.game) window.game.startGame();
        });
        document.getElementById('btn-world-back').addEventListener('click', () => {
            if (window.game) window.game.backToMenu();
        });

        // Instagram Continue screen
        document.getElementById('btn-insta-continue').addEventListener('click', () => {
            // Open Instagram profile
            window.open('https://www.instagram.com/upasna_ikm/', '_blank');
            if (window.game) window.game.continueFromInstagram();
        });
        document.getElementById('btn-insta-cancel').addEventListener('click', () => {
            if (window.game) window.game.declineInstagramContinue();
        });

        // Mystery Gift box tap & collect
        this.giftBoxElement.addEventListener('click', () => {
            this._openMysteryGift();
        });
        this.btnGiftCollect.addEventListener('click', () => {
            if (window.game) window.game.collectMysteryReward(this.currentReward);
        });

        // Settings toggles & close
        const toggleMusic = document.getElementById('setting-toggle-music');
        const toggleSfx = document.getElementById('setting-toggle-sfx');

        toggleMusic.addEventListener('click', () => {
            const active = window.audio.toggleMusic();
            toggleMusic.classList.toggle('active', active);
        });
        toggleSfx.addEventListener('click', () => {
            const active = window.audio.toggleSfx();
            toggleSfx.classList.toggle('active', active);
        });
        document.getElementById('btn-settings-close').addEventListener('click', () => {
            this.settingsModal.classList.add('hidden');
        });

        // Pause controls
        document.getElementById('btn-pause').addEventListener('click', () => {
            if (window.game) window.game.togglePause();
        });
        document.getElementById('btn-resume').addEventListener('click', () => {
            if (window.game) window.game.togglePause();
        });
        document.getElementById('btn-pause-restart').addEventListener('click', () => {
            if (window.game) window.game.restartGame();
        });
        document.getElementById('btn-pause-menu').addEventListener('click', () => {
            if (window.game) window.game.backToMenu();
        });

        // Game Over controls
        document.getElementById('btn-restart').addEventListener('click', () => {
            if (window.game) window.game.restartGame();
        });
        document.getElementById('btn-menu').addEventListener('click', () => {
            if (window.game) window.game.backToMenu();
        });
    }

    // =========================================================================
    // 1. SPLASH SCREEN (APP OPENING ANIMATION)
    // =========================================================================

    playOpeningSequence(onComplete) {
        this._hideAllModals();
        this.splashScreen.classList.remove('hidden');

        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            this.splashLoaderFill.style.width = `${progress}%`;

            if (progress === 30) {
                this.splashLoaderText.textContent = 'SYNCHRONIZING WORLD REALMS...';
            } else if (progress === 70) {
                this.splashLoaderText.textContent = 'CALIBRATING QUANTUM RUNNERS...';
            } else if (progress >= 100) {
                clearInterval(interval);
                this.splashLoaderText.textContent = 'READY TO DASH! ⚡';
                this.splashTapBtn.style.display = 'block';

                const handleTap = () => {
                    this.splashTapBtn.removeEventListener('click', handleTap);
                    window.audio.resume();
                    this.splashScreen.classList.add('hidden');
                    if (onComplete) onComplete();
                };
                this.splashTapBtn.addEventListener('click', handleTap);
            }
        }, 50);
    }

    // =========================================================================
    // 2. MAIN MENU
    // =========================================================================

    showMainMenu(selectedCharId, selectedWorldId) {
        this._hideAllModals();
        this.hudOverlay.style.display = 'none';

        const char = CHARACTERS[selectedCharId] || CHARACTERS.kai;
        this.menuCharIcon.textContent = char.icon;
        this.menuCharName.textContent = char.name.split(' - ')[0];

        const worldNames = { jungle: 'Jungle 🌴', candy: 'Ice Cream 🍦', road: 'Road 🏙️', horror: 'Horror 🎃' };
        this.menuWorldIcon.textContent = selectedWorldId === 'jungle' ? '🌴' : (selectedWorldId === 'candy' ? '🍦' : (selectedWorldId === 'road' ? '🏙️' : '🎃'));
        this.menuWorldName.textContent = worldNames[selectedWorldId] || 'Jungle';

        this.menuBestScore.textContent = this._formatNumber(this.bestScore);
        this.mainMenuScreen.classList.remove('hidden');
    }

    // =========================================================================
    // 3. CHARACTER SELECTION SCREEN
    // =========================================================================

    showCharacterSelect(selectedCharId) {
        this._hideAllModals();
        this.charSelectScreen.classList.remove('hidden');

        if (!this.charPreviewStage) {
            this.charPreviewStage = new CharacterPreviewStage('char-preview-canvas');
        } else {
            this.charPreviewStage.resize();
        }

        this.updateCharacterInfo(selectedCharId);
    }

    updateCharacterInfo(charId) {
        const char = CHARACTERS[charId] || CHARACTERS.kai;
        this.charDisplayName.textContent = char.name;
        this.charTitleTag.textContent = char.title;
        this.charDescText.textContent = char.desc;
        this.charPerkBadge.textContent = char.perk;

        if (this.charPreviewStage) {
            this.charPreviewStage.loadCharacter(charId);
        }
    }

    // =========================================================================
    // 4. WORLD SELECTION SCREEN
    // =========================================================================

    showWorldSelect(currentWorldId) {
        this._hideAllModals();
        this.worldSelectScreen.classList.remove('hidden');

        const cards = document.querySelectorAll('.world-card');
        cards.forEach(card => {
            if (card.getAttribute('data-world') === currentWorldId) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    // =========================================================================
    // 5. INSTAGRAM CONTINUE MODAL
    // =========================================================================

    showInstagramContinue() {
        this._hideAllModals();
        this.instagramScreen.classList.remove('hidden');
    }

    // =========================================================================
    // 6. MYSTERY REWARD GIFT SCREEN
    // =========================================================================

    showMysteryGift() {
        this._hideAllModals();
        this.giftBoxElement.className = 'gift-box-interactive';
        this.giftBoxElement.style.display = 'block';
        this.rewardRevealCard.style.display = 'none';
        this.btnGiftCollect.style.display = 'none';
        this.mysteryGiftScreen.classList.remove('hidden');
    }

    _openMysteryGift() {
        if (this.giftBoxElement.classList.contains('gift-box-opened')) return;

        this.giftBoxElement.classList.add('gift-box-opened');
        window.audio.playGiftOpenSound();

        // Randomize reward
        const rewards = [
            { id: 'coins_150', type: 'coins', amount: 150, icon: '💰', title: '+150 BONUS COINS!', desc: 'Added directly to your treasury!' },
            { id: 'coins_300', type: 'coins', amount: 300, icon: '💎', title: '+300 MEGA COINS!', desc: 'Huge bonus for your courageous run!' },
            { id: 'shield', type: 'perk', perk: 'shield', icon: '🛡️', title: 'FREE SHIELD ON NEXT RUN!', desc: 'Start your next adventure with a protective barrier!' },
            { id: 'boost', type: 'perk', perk: 'boost', icon: '🚀', title: 'HYPER DASH STARTER!', desc: 'Launch your next run with a rocket boost headstart!' }
        ];

        this.currentReward = rewards[Math.floor(Math.random() * rewards.length)];

        setTimeout(() => {
            this.giftBoxElement.style.display = 'none';
            this.rewardRevealIcon.textContent = this.currentReward.icon;
            this.rewardRevealTitle.textContent = this.currentReward.title;
            this.rewardRevealDesc.textContent = this.currentReward.desc;
            this.rewardRevealCard.style.display = 'flex';
            this.btnGiftCollect.style.display = 'block';

            window.audio.playRewardSound();
            this.showToast('REWARD UNLOCKED! 🎁', '#ffd700');
        }, 550);
    }

    // =========================================================================
    // 7. SETTINGS MODAL
    // =========================================================================

    showSettings() {
        const toggleMusic = document.getElementById('setting-toggle-music');
        const toggleSfx = document.getElementById('setting-toggle-sfx');
        toggleMusic.classList.toggle('active', window.audio.musicEnabled);
        toggleSfx.classList.toggle('active', window.audio.sfxEnabled);
        this.settingsModal.classList.remove('hidden');
    }

    // =========================================================================
    // 8. IN-GAME HUD & GAME OVER
    // =========================================================================

    showHUD(worldId = 'jungle') {
        this._hideAllModals();
        const worldIcons = { jungle: '🌴', candy: '🍦', road: '🏙️', horror: '🎃' };
        this.hudWorldIcon.textContent = worldIcons[worldId] || '🌴';
        this.hudOverlay.style.display = 'flex';
        this.hudBestSmall.textContent = this._formatNumber(this.bestScore);
    }

    showPause(score, coins) {
        document.getElementById('pause-score').textContent = this._formatNumber(score);
        document.getElementById('pause-coins').textContent = coins;
        this.pauseModal.classList.remove('hidden');
    }

    hidePause() {
        this.pauseModal.classList.add('hidden');
    }

    showGameOver(score, coins, distance, isNewRecord) {
        this._hideAllModals();
        if (score > this.bestScore) {
            this.bestScore = Math.floor(score);
            localStorage.setItem('neon_pulse_best_score', this.bestScore);
            isNewRecord = true;
        }

        this.gameoverScore.textContent = this._formatNumber(score);
        this.gameoverBest.textContent = this._formatNumber(this.bestScore);
        this.gameoverCoins.textContent = coins;
        this.gameoverDistance.textContent = `${Math.floor(distance)} m`;

        this.gameoverRecordBadge.style.display = isNewRecord ? 'inline-block' : 'none';
        this.gameoverModal.classList.remove('hidden');
    }

    updateHUD(score, coins, distance, speed, isMultiplierActive) {
        this.hudScore.textContent = this._formatNumber(score);
        this.hudCoins.textContent = coins;
        this.hudDistance.textContent = `${Math.floor(distance)} m`;
        this.hudSpeed.textContent = `${Math.floor(speed * 3.6)} km/h`;

        this.hudMultiplierBadge.style.display = isMultiplierActive ? 'flex' : 'none';
    }

    updatePowerupsTray(activePowerups) {
        let html = '';
        for (const p of activePowerups) {
            const pct = Math.max(0, Math.min(100, (p.remaining / p.duration) * 100));
            const isExpiring = p.remaining < 2.8;

            html += `
                <div class="powerup-pill ${isExpiring ? 'expiring' : ''}">
                    <div class="powerup-pill-icon" style="background: ${p.color};">
                        ${p.icon}
                    </div>
                    <div class="powerup-pill-info">
                        <div class="powerup-pill-title" style="color: ${p.color};">
                            ${p.name} (${Math.ceil(p.remaining)}s)
                        </div>
                        <div class="powerup-bar-track">
                            <div class="powerup-bar-fill" style="width: ${pct}%; background: ${p.color};"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        this.powerupsTray.innerHTML = html;
    }

    showToast(message, color = '#00f3ff') {
        const toast = document.createElement('div');
        toast.className = 'game-toast';
        toast.style.color = color;
        toast.style.borderColor = color;
        toast.textContent = message;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentElement) toast.parentElement.removeChild(toast);
            }, 400);
        }, 1500);
    }

    triggerShieldHitEffect() {
        this.screenEffects.className = 'shield-hit-effect';
        setTimeout(() => { this.screenEffects.className = ''; }, 450);
    }

    triggerCrashEffect() {
        this.screenEffects.className = 'crash-effect';
    }

    setSpeedBoostVignette(active) {
        this.screenEffects.className = active ? 'speed-boost-active' : '';
    }

    _hideAllModals() {
        this.splashScreen.classList.add('hidden');
        this.mainMenuScreen.classList.add('hidden');
        this.charSelectScreen.classList.add('hidden');
        this.worldSelectScreen.classList.add('hidden');
        this.instagramScreen.classList.add('hidden');
        this.mysteryGiftScreen.classList.add('hidden');
        this.settingsModal.classList.add('hidden');
        this.pauseModal.classList.add('hidden');
        this.gameoverModal.classList.add('hidden');
    }

    _formatNumber(num) {
        return Math.floor(num).toLocaleString();
    }
}
