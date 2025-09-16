// Better audio player with proper buffering and mixing

const Speaker = require('speaker');
const { SquareWaveOscillator, TriangleWaveOscillator, NoiseOscillator } = require('./oscillators');

class BetterAudioPlayer {
    constructor() {
        this.sampleRate = 44100;
        this.channels = 2;
        this.bitDepth = 16;
        this.frameSize = 2048; // Larger buffer for smoother playback

        this.speaker = null;
        this.isPlaying = false;
        this.masterVolume = 0.5;

        // Create oscillators for each channel
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
    }

    async initialize() {
        try {
            this.speaker = new Speaker({
                channels: this.channels,
                bitDepth: this.bitDepth,
                sampleRate: this.sampleRate
            });

            this.speaker.on('error', (err) => {
                console.error('Speaker error:', err);
            });

            this.isPlaying = true;
            this.startAudioLoop();
            return true;

        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }

    startAudioLoop() {
        const generateAndPlay = () => {
            if (!this.isPlaying || !this.speaker) return;

            // Generate mixed audio
            const buffer = this.generateMixedAudio();

            // Write to speaker
            this.speaker.write(buffer, () => {
                // Schedule next buffer
                if (this.isPlaying) {
                    setImmediate(generateAndPlay);
                }
            });
        };

        // Start the loop
        generateAndPlay();
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
        return this.floatToPCM(samples);
    }

    floatToPCM(floatSamples) {
        const buffer = Buffer.allocUnsafe(floatSamples.length * 2 * this.channels);

        for (let i = 0; i < floatSamples.length; i++) {
            // Apply master volume and clipping
            const sample = Math.max(-1, Math.min(1, floatSamples[i] * this.masterVolume));
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
        console.log(`Master volume: ${(this.masterVolume * 100).toFixed(0)}%`);
    }

    setChannelVolume(channel, volume) {
        if (this.channelStates[channel]) {
            this.channelStates[channel].volume = Math.max(0, Math.min(1, volume));
        }
    }

    stop() {
        this.isPlaying = false;

        if (this.speaker) {
            this.speaker.end();
            this.speaker = null;
        }
    }
}

module.exports = {
    BetterAudioPlayer
};