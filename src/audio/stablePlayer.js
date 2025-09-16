// Stable audio player with worker threads for consistent playback
const Speaker = require('speaker');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { SquareWaveOscillator, TriangleWaveOscillator, NoiseOscillator } = require('./oscillators');

class StableAudioPlayer {
    constructor() {
        this.sampleRate = 44100;
        this.channels = 2;
        this.bitDepth = 16;

        // Use smaller, more manageable frame size
        this.frameSize = 4096;

        this.speaker = null;
        this.isPlaying = false;
        this.masterVolume = 0.5;

        // Queue for audio buffers
        this.audioQueue = [];
        this.maxQueueSize = 64;

        // Create oscillators
        this.oscillators = {
            pulse1: new SquareWaveOscillator(this.sampleRate, 0.5),
            pulse2: new SquareWaveOscillator(this.sampleRate, 0.25),
            triangle: new TriangleWaveOscillator(this.sampleRate),
            noise: new NoiseOscillator(this.sampleRate)
        };

        // Channel states
        this.channelStates = {
            pulse1: { freq: 0, volume: 0.25, active: false },
            pulse2: { freq: 0, volume: 0.25, active: false },
            triangle: { freq: 0, volume: 0.25, active: false },
            noise: { volume: 0.15, active: false }
        };

        this.writeInProgress = false;
        this.generateInterval = null;
    }

    async initialize() {
        try {
            // Create speaker with optimal settings
            this.speaker = new Speaker({
                channels: this.channels,
                bitDepth: this.bitDepth,
                sampleRate: this.sampleRate,
                mode: Speaker.MONO,
                close: false
            });

            this.speaker.on('error', (err) => {
                // Silently handle errors to prevent crashes
                if (err.message && !err.message.includes('underflow')) {
                    console.error('Speaker error:', err);
                }
            });

            this.isPlaying = true;

            // Fill initial queue with silence
            for (let i = 0; i < this.maxQueueSize; i++) {
                this.audioQueue.push(this.generateSilence());
            }

            // Start continuous generation
            this.startGeneration();

            // Start playback
            this.startPlayback();

            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }

    startGeneration() {
        // Generate audio at a steady rate
        this.generateInterval = setInterval(() => {
            if (!this.isPlaying) return;

            // Keep queue full
            while (this.audioQueue.length < this.maxQueueSize) {
                const buffer = this.generateMixedAudio();
                this.audioQueue.push(buffer);
            }
        }, 20); // Generate every 20ms
    }

    startPlayback() {
        const play = () => {
            if (!this.isPlaying || !this.speaker || this.writeInProgress) return;

            if (this.audioQueue.length > 0) {
                this.writeInProgress = true;
                const buffer = this.audioQueue.shift();

                // Always have audio ready
                if (this.audioQueue.length < this.maxQueueSize / 2) {
                    // Emergency generation
                    for (let i = 0; i < 10; i++) {
                        this.audioQueue.push(this.generateMixedAudio());
                    }
                }

                this.speaker.write(buffer, (err) => {
                    this.writeInProgress = false;
                    if (!err && this.isPlaying) {
                        setImmediate(play);
                    }
                });
            } else {
                // Queue empty - generate emergency audio
                const buffer = this.generateMixedAudio();
                this.writeInProgress = true;

                this.speaker.write(buffer, (err) => {
                    this.writeInProgress = false;
                    if (!err && this.isPlaying) {
                        setImmediate(play);
                    }
                });
            }
        };

        // Start playback
        play();
    }

    generateSilence() {
        const buffer = Buffer.alloc(this.frameSize * 2 * this.channels);
        return buffer;
    }

    generateMixedAudio() {
        const samples = new Float32Array(this.frameSize);

        // Generate each channel
        if (this.channelStates.pulse1.active && this.channelStates.pulse1.freq > 0) {
            const pulse1 = this.oscillators.pulse1.generate(
                this.channelStates.pulse1.freq,
                this.frameSize
            );
            for (let i = 0; i < this.frameSize; i++) {
                samples[i] += pulse1[i] * this.channelStates.pulse1.volume;
            }
        }

        if (this.channelStates.pulse2.active && this.channelStates.pulse2.freq > 0) {
            const pulse2 = this.oscillators.pulse2.generate(
                this.channelStates.pulse2.freq,
                this.frameSize
            );
            for (let i = 0; i < this.frameSize; i++) {
                samples[i] += pulse2[i] * this.channelStates.pulse2.volume;
            }
        }

        if (this.channelStates.triangle.active && this.channelStates.triangle.freq > 0) {
            const triangle = this.oscillators.triangle.generate(
                this.channelStates.triangle.freq,
                this.frameSize
            );
            for (let i = 0; i < this.frameSize; i++) {
                samples[i] += triangle[i] * this.channelStates.triangle.volume;
            }
        }

        if (this.channelStates.noise.active) {
            const noise = this.oscillators.noise.generate(this.frameSize);
            for (let i = 0; i < this.frameSize; i++) {
                samples[i] += noise[i] * this.channelStates.noise.volume;
            }
        }

        // Convert to PCM
        const buffer = Buffer.alloc(this.frameSize * 2 * this.channels);
        for (let i = 0; i < this.frameSize; i++) {
            const sample = Math.max(-1, Math.min(1, samples[i] * this.masterVolume));
            const value = Math.floor(sample * 32767);

            // Write to both stereo channels
            buffer.writeInt16LE(value, i * 4);
            buffer.writeInt16LE(value, i * 4 + 2);
        }

        return buffer;
    }

    playNote(channel, frequency, duration = 1.0) {
        if (!this.channelStates[channel]) return;

        this.channelStates[channel].freq = frequency;
        this.channelStates[channel].active = true;

        // Auto-stop after duration
        if (duration > 0) {
            setTimeout(() => {
                this.channelStates[channel].active = false;
            }, duration * 1000);
        }
    }

    stopNote(channel) {
        if (this.channelStates[channel]) {
            this.channelStates[channel].active = false;
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    setChannelVolume(channel, volume) {
        if (this.channelStates[channel]) {
            this.channelStates[channel].volume = Math.max(0, Math.min(1, volume));
        }
    }

    stop() {
        this.isPlaying = false;

        if (this.generateInterval) {
            clearInterval(this.generateInterval);
            this.generateInterval = null;
        }

        if (this.speaker) {
            // Write final silence
            const silence = this.generateSilence();
            this.speaker.write(silence);

            setTimeout(() => {
                if (this.speaker) {
                    this.speaker.end();
                    this.speaker = null;
                }
            }, 100);
        }
    }
}

module.exports = {
    StableAudioPlayer
};