/**
 * NEON PULSE: CYBER RUNNER 3D
 * Audio Engine - 100% Procedural Web Audio API Synthesizer
 * Supports 4 Game World Music Modes, Unique Power-Up Sounds, Mystery Gift Fanfares
 */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.isInitialized = false;

        // Settings (persisted to localStorage)
        this.musicEnabled = localStorage.getItem('neon_music_enabled') !== 'false';
        this.sfxEnabled = localStorage.getItem('neon_sfx_enabled') !== 'false';

        // Master Gain Nodes
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;

        // Music Sequencer State
        this.isPlayingMusic = false;
        this.currentWorld = 'jungle'; // 'jungle', 'candy', 'road', 'horror'
        this.tempo = 120; // BPM
        this.currentStep = 0;
        this.nextNoteTime = 0;
        this.scheduleTimer = null;
        this.scheduleAheadTime = 0.12; // Seconds
        this.lookaheadInterval = 25; // Milliseconds

        // World-Specific Melodies & Basslines
        this.worldPats = {
            jungle: {
                tempo: 120,
                bass: [65.41, 0, 65.41, 87.31, 0, 65.41, 98.0, 0, 58.27, 0, 58.27, 77.78, 0, 58.27, 87.31, 0], // C, F, G
                lead: [523.25, 587.33, 659.25, 0, 783.99, 659.25, 587.33, 523.25, 440, 523.25, 659.25, 783.99, 880, 0, 783.99, 659.25]
            },
            candy: {
                tempo: 128,
                bass: [130.81, 130.81, 196.0, 130.81, 146.83, 146.83, 220.0, 146.83, 164.81, 164.81, 246.94, 164.81, 130.81, 130.81, 196.0, 130.81],
                lead: [523.25, 659.25, 783.99, 1046.5, 880, 659.25, 587.33, 659.25, 783.99, 1046.5, 1174.66, 1046.5, 880, 783.99, 659.25, 523.25]
            },
            road: {
                tempo: 124,
                bass: [55, 55, 110, 55, 43.65, 43.65, 87.3, 43.65, 49, 49, 98, 49, 41.2, 41.2, 82.4, 41.2],
                lead: [440, 0, 523.25, 659.25, 0, 587.33, 523.25, 0, 440, 523.25, 659.25, 880, 783.99, 659.25, 587.33, 523.25]
            },
            horror: {
                tempo: 108,
                bass: [41.2, 0, 41.2, 0, 43.65, 0, 43.65, 0, 36.71, 0, 36.71, 0, 38.89, 0, 38.89, 0], // E, F, D, D#
                lead: [329.63, 0, 349.23, 0, 392, 349.23, 329.63, 311.13, 293.66, 0, 311.13, 0, 349.23, 329.63, 293.66, 277.18]
            }
        };

        // Noise buffer for percussion & SFX
        this.noiseBuffer = null;
    }

    init() {
        if (this.isInitialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            // Setup audio graph
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.42 : 0.0, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 0.75 : 0.0, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this._generateNoiseBuffer();
            this.isInitialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported or blocked:', e);
        }
    }

    resume() {
        if (!this.isInitialized) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    _generateNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
    }

    setWorld(worldName) {
        if (this.worldPats[worldName]) {
            this.currentWorld = worldName;
            this.tempo = this.worldPats[worldName].tempo;
        }
    }

    // =========================================================================
    // BACKGROUND MUSIC SEQUENCER
    // =========================================================================

    startMusic(worldName) {
        this.resume();
        if (worldName) this.setWorld(worldName);
        if (!this.isInitialized || this.isPlayingMusic) return;

        this.isPlayingMusic = true;
        this.currentStep = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.05;

        this.scheduleTimer = setInterval(() => this._scheduler(), this.lookaheadInterval);
    }

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.scheduleTimer) {
            clearInterval(this.scheduleTimer);
            this.scheduleTimer = null;
        }
    }

    _scheduler() {
        if (!this.isPlayingMusic || !this.ctx) return;
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this._scheduleStep(this.currentStep, this.nextNoteTime);
            const secondsPer16th = (60 / this.tempo) / 4;
            this.nextNoteTime += secondsPer16th;
            this.currentStep = (this.currentStep + 1) % 16;
        }
    }

    _scheduleStep(step, time) {
        if (!this.musicEnabled) return;
        const pat = this.worldPats[this.currentWorld] || this.worldPats.jungle;

        // Kick Drum
        if (step % 4 === 0) {
            this._playKick(time);
        }

        // Snare / Clap
        if (step % 8 === 4) {
            this._playSnare(time);
        }

        // Percussion / Shaker
        if (step % 2 === 1) {
            this._playHiHat(time, step % 4 === 2 ? 0.07 : 0.03);
        }

        // World Bassline
        const bassFreq = pat.bass[step % pat.bass.length];
        if (bassFreq > 0) {
            this._playBassNote(bassFreq, time, (60 / this.tempo) / 4 * 0.85);
        }

        // World Lead
        const leadFreq = pat.lead[step % pat.lead.length];
        if (leadFreq > 0) {
            this._playLeadNote(leadFreq, time, (60 / this.tempo) / 4 * 0.9);
        }
    }

    _playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(this.currentWorld === 'horror' ? 90 : 130, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

        gain.gain.setValueAtTime(0.65, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + 0.2);
    }

    _playSnare(time) {
        if (!this.noiseBuffer) return;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        noise.start(time);
        noise.stop(time + 0.16);
    }

    _playHiHat(time, vol = 0.04) {
        if (!this.noiseBuffer) return;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6500, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        noise.start(time);
        noise.stop(time + 0.06);
    }

    _playBassNote(freq, time, duration) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = this.currentWorld === 'candy' ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(this.currentWorld === 'horror' ? 350 : 650, time);
        filter.frequency.exponentialRampToValueAtTime(180, time + duration);

        gain.gain.setValueAtTime(0.24, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + duration + 0.02);
    }

    _playLeadNote(freq, time, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = this.currentWorld === 'horror' ? 'sine' : (this.currentWorld === 'candy' ? 'triangle' : 'square');
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.07, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + duration);
    }

    // =========================================================================
    // SOUND EFFECTS (SFX)
    // =========================================================================

    playCoinSound(combo = 0) {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = 784; // G5
        const semitoneMultiplier = Math.pow(1.059463, Math.min(combo, 12));
        const freq1 = baseFreq * semitoneMultiplier;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq1, now);
        osc.frequency.setValueAtTime(freq1 * 1.5, now + 0.04);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    playJumpSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.16);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    playSlideSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx || !this.noiseBuffer) return;

        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.frequency.exponentialRampToValueAtTime(350, now + 0.25);
        filter.Q.setValueAtTime(2.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.28);
    }

    playLaneSwitchSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.07);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    // Power-Up Unique Sound Effects
    playMagnetSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.25);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.38);
    }

    playShieldSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Resonant major triad chord
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);

            gain.gain.setValueAtTime(0.18, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.28);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.3);
        });
    }

    playSpeedBoostSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.45);
    }

    playDoubleCoinsSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [587.33, 783.99, 1174.66].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + i * 0.07);

            gain.gain.setValueAtTime(0.22, now + i * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + i * 0.07);
            osc.stop(now + i * 0.07 + 0.25);
        });
    }

    playShieldBreakSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(2200, now);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            noise.start(now);
            noise.stop(now + 0.32);
        }
    }

    playCrashSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 0.5);

        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    playReviveSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.24, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.32);
        });
    }

    playGiftOpenSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Pop sound + ascending shimmer
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.15);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playRewardSound() {
        if (!this.sfxEnabled) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51];
        fanfare.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + i * 0.07);

            gain.gain.setValueAtTime(0.22, now + i * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + i * 0.07);
            osc.stop(now + i * 0.07 + 0.35);
        });
    }

    // Settings Toggles
    toggleMusic() {
        this.setMusic(!this.musicEnabled);
        return this.musicEnabled;
    }

    setMusic(enabled) {
        this.musicEnabled = enabled;
        localStorage.setItem('neon_music_enabled', enabled);
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setTargetAtTime(enabled ? 0.42 : 0.0, this.ctx.currentTime, 0.05);
        }
    }

    toggleSfx() {
        this.setSfx(!this.sfxEnabled);
        return this.sfxEnabled;
    }

    setSfx(enabled) {
        this.sfxEnabled = enabled;
        localStorage.setItem('neon_sfx_enabled', enabled);
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setTargetAtTime(enabled ? 0.75 : 0.0, this.ctx.currentTime, 0.05);
        }
    }
}

// Global Audio Engine Instance
window.audio = new AudioEngine();
