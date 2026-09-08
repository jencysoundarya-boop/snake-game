// audio.js - Web Audio API Synthesizer

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        
        // Load settings from localStorage
        const savedSettings = JSON.parse(localStorage.getItem('snakeSettings'));
        if (savedSettings) {
            this.soundEnabled = savedSettings.sound !== false;
            this.musicEnabled = savedSettings.music !== false;
        }
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(frequency, type, duration, vol = 0.1) {
        if (!this.soundEnabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        // Envelope
        gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playEatNormal() {
        this.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.15, 0.1), 50);
    }

    playEatSpecial(type) {
        if (type === 'GOLD') {
            this.playTone(400, 'square', 0.1, 0.05);
            setTimeout(() => this.playTone(600, 'square', 0.1, 0.05), 100);
            setTimeout(() => this.playTone(800, 'square', 0.2, 0.05), 200);
        } else if (type === 'SPEED') {
            this.playTone(1200, 'triangle', 0.3, 0.05);
            // Sliding pitch up
            if(this.soundEnabled && this.ctx) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.frequency.setValueAtTime(400, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.2);
            }
        } else if (type === 'SLOW') {
            this.playTone(200, 'sawtooth', 0.3, 0.05);
        } else {
            // Rare or default
            this.playTone(900, 'sine', 0.2, 0.1);
        }
    }

    playCollision() {
        if (!this.soundEnabled || !this.ctx) return;
        
        // Noise burst
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        // Filter to make it sound like an explosion
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start();
    }

    playLevelUp() {
        // Arpeggio
        const notes = [300, 400, 500, 600, 800, 1000];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'square', 0.2, 0.05);
            }, i * 80);
        });
    }

    playClick() {
        this.playTone(800, 'square', 0.05, 0.05);
    }
    
    playHover() {
        this.playTone(400, 'sine', 0.05, 0.02);
    }
}

// Global instance
const audio = new AudioEngine();
