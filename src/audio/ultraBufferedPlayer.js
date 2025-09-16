// Ultra-buffered audio player with maximum buffering strategy
const Speaker = require('speaker');
const { SquareWaveOscillator, TriangleWaveOscillator, NoiseOscillator } = require('./oscillators');

class UltraBufferedAudioPlayer {
    constructor() {
        this.sampleRate = 44100;
        this.channels = 2;
        this.bitDepth = 16;
        this.frameSize = 32768; // Extremely large frame size

        this.speaker = null;
        this.isPlaying = false;
        this.masterVolume = 0.5;

        // Ring buffer for maximum buffering
        this.bufferSize = this.frameSize * 16; // 16 frames of buffer
        this.ringBuffer = Buffer.allocUnsafe(this.bufferSize * 2 * this.channels);
        this.writePos = 0;
        this.readPos = 0;

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

        // Pre-generate audio buffers
        this.pregenBuffers = [];
        this.bufferIndex = 0;
    }

    async initialize() {
        try {
            // Pre-generate a bunch of buffers
            for (let i = 0; i < 32; i++) {
                this.pregenBuffers.push(this.generateSilence());
            }

            this.speaker = new Speaker({
                channels: this.channels,
                bitDepth: this.bitDepth,
                sampleRate: this.sampleRate,
                lowWaterMark: this.frameSize * 8,
                highWaterMark: this.frameSize * 16
            });

            this.speaker.on('error', (err) => {
                console.error('Speaker error:', err);
            });

            this.isPlaying = true;

            // Write a massive amount of silence upfront
            for (let i = 0; i < 32; i++) {
                this.speaker.write(this.pregenBuffers[i]);
            }

            // Start multiple generation and playback loops
            this.startGenerationLoop();
            this.startPlaybackLoop();

            // Extra safety loops
            for (let i = 0; i < 4; i++) {
                setTimeout(() => this.startPlaybackLoop(), i * 25);
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }

    startGenerationLoop() {
        const generate = () => {
            if (!this.isPlaying) return;

            // Always keep buffers full
            while (this.pregenBuffers.length < 32) {
                const buffer = this.generateMixedAudio();
                this.pregenBuffers.push(buffer);
            }

            // Continue generating
            setTimeout(generate, 10);
        };

        generate();
    }

    startPlaybackLoop() {
        const writeAudio = () => {
            if (!this.isPlaying || !this.speaker || this.speaker.destroyed) return;

            // Write from pre-generated buffers
            if (this.pregenBuffers.length > 0) {
                const buffer = this.pregenBuffers.shift();
                if (buffer) {
                    this.speaker.write(buffer, () => {
                        if (this.isPlaying) {
                            setImmediate(writeAudio);
                        }
                    });

                    // Immediately queue another write
                    if (this.pregenBuffers.length > 0) {
                        setImmediate(writeAudio);
                    }
                }
            } else {
                // Emergency: generate on the fly
                const buffer = this.generateMixedAudio();
                this.speaker.write(buffer, () => {
                    if (this.isPlaying) {
                        setImmediate(writeAudio);
                    }
                });
            }
        };

        // Start multiple write chains
        for (let i = 0; i < 8; i++) {
            setTimeout(writeAudio, i * 5);
        }
    }

    generateSilence() {
        const buffer = Buffer.allocUnsafe(this.frameSize * 2 * this.channels);
        for (let i = 0; i < buffer.length; i += 2) {
            buffer.writeInt16LE(0, i);
        }
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
        const buffer = Buffer.allocUnsafe(this.frameSize * 2 * this.channels);
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

        if (this.speaker) {
            // Send final silence
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
    UltraBufferedAudioPlayer
};