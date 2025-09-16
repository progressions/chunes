// Continuous audio player that maintains a steady stream

const Speaker = require('speaker');
const { SquareWaveOscillator, TriangleWaveOscillator, NoiseOscillator } = require('./oscillators');

class ContinuousAudioPlayer {
    constructor() {
        this.sampleRate = 44100;
        this.channels = 2;
        this.bitDepth = 16;
        this.frameSize = 8192; // Larger frame size to prevent underflow

        this.speaker = null;
        this.isPlaying = false;
        this.masterVolume = 0.5;

        // Buffer queue for continuous playback
        this.bufferQueue = [];
        this.maxQueueSize = 32;
        this.minQueueSize = 4; // Start playing after this many buffers
        this.isWriting = false;

        // Create oscillators
        this.oscillators = {
            pulse1: new SquareWaveOscillator(this.sampleRate, 0.5),
            pulse2: new SquareWaveOscillator(this.sampleRate, 0.25),
            triangle: new TriangleWaveOscillator(this.sampleRate),
            noise: new NoiseOscillator(this.sampleRate)
        };

        // Channel states - start inactive but ready
        this.channelStates = {
            pulse1: { freq: 0, volume: 0.25, active: false },
            pulse2: { freq: 0, volume: 0.25, active: false },
            triangle: { freq: 0, volume: 0.25, active: false },
            noise: { volume: 0.15, active: false }
        };
    }

    async initialize() {
        try {
            this.speaker = new Speaker({
                channels: this.channels,
                bitDepth: this.bitDepth,
                sampleRate: this.sampleRate,
                lowWaterMark: this.frameSize * 4,
                highWaterMark: this.frameSize * 8
            });

            this.speaker.on('error', (err) => {
                console.error('Speaker error:', err);
            });

            this.isPlaying = true;

            // Start generation loop
            this.startGenerationLoop();

            // Start the continuous playback loop
            this.startPlaybackLoop();

            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }

    startGenerationLoop() {
        // Immediately fill to max after starting
        const fillQueue = () => {
            if (!this.isPlaying) return;

            // Keep queue topped up with actual audio
            while (this.bufferQueue.length < this.maxQueueSize) {
                this.bufferQueue.push(this.generateMixedAudio());
            }
        };

        // Initial fill with silence to establish audio stream
        for (let i = 0; i < 2; i++) {
            this.bufferQueue.push(this.generateSilence());
        }

        // Then maintain the queue
        setInterval(() => {
            fillQueue();
        }, 25); // Generate every 25ms
    }

    startPlaybackLoop() {
        const writeAudio = () => {
            if (!this.isPlaying || this.isWriting) return;

            if (this.bufferQueue.length > 0) {
                this.isWriting = true;
                const buffer = this.bufferQueue.shift();

                // Emergency refill if queue is low
                if (this.bufferQueue.length < 8) {
                    for (let i = 0; i < 16; i++) {
                        this.bufferQueue.push(this.generateMixedAudio());
                    }
                }

                if (this.speaker && !this.speaker.destroyed) {
                    const written = this.speaker.write(buffer, () => {
                        this.isWriting = false;
                        if (this.isPlaying) {
                            setImmediate(writeAudio);
                        }
                    });
                }
            } else {
                // Queue empty - generate immediately
                const buffer = this.generateMixedAudio();
                this.speaker.write(buffer, () => {
                    this.isWriting = false;
                    if (this.isPlaying) {
                        setImmediate(writeAudio);
                    }
                });
            }
        };

        // Start multiple write chains for redundancy
        for (let i = 0; i < 4; i++) {
            setTimeout(writeAudio, i * 15);
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
        let hasAudio = false;

        // Generate each channel
        if (this.channelStates.pulse1.active && this.channelStates.pulse1.freq > 0) {
            const pulse1 = this.oscillators.pulse1.generate(
                this.channelStates.pulse1.freq,
                this.frameSize
            );
            for (let i = 0; i < this.frameSize; i++) {
                samples[i] += pulse1[i] * this.channelStates.pulse1.volume;
            }
            hasAudio = true;
        }

        if (this.channelStates.pulse2.active && this.channelStates.pulse2.freq > 0) {
            const pulse2 = this.oscillators.pulse2.generate(
                this.channelStates.pulse2.freq,
                this.frameSize
            );
            for (let i = 0; i < this.frameSize; i++) {
                samples[i] += pulse2[i] * this.channelStates.pulse2.volume;
            }
            hasAudio = true;
        }

        if (this.channelStates.triangle.active && this.channelStates.triangle.freq > 0) {
            const triangle = this.oscillators.triangle.generate(
                this.channelStates.triangle.freq,
                this.frameSize
            );
            for (let i = 0; i < this.frameSize; i++) {
                samples[i] += triangle[i] * this.channelStates.triangle.volume;
            }
            hasAudio = true;
        }

        if (this.channelStates.noise.active) {
            const noise = this.oscillators.noise.generate(this.frameSize);
            for (let i = 0; i < this.frameSize; i++) {
                samples[i] += noise[i] * this.channelStates.noise.volume;
            }
            hasAudio = true;
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
            // Send some silence before closing
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
    ContinuousAudioPlayer
};