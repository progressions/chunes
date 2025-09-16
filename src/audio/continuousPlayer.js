// Continuous audio player that maintains a steady stream

const Speaker = require('speaker');
const { SquareWaveOscillator, TriangleWaveOscillator, NoiseOscillator } = require('./oscillators');

class ContinuousAudioPlayer {
    constructor() {
        this.sampleRate = 44100;
        this.channels = 2;
        this.bitDepth = 16;
        this.frameSize = 4096; // Larger frame size to prevent underflow

        this.speaker = null;
        this.isPlaying = false;
        this.masterVolume = 0.5;

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
    }

    async initialize() {
        try {
            this.speaker = new Speaker({
                channels: this.channels,
                bitDepth: this.bitDepth,
                sampleRate: this.sampleRate,
                lowWaterMark: this.frameSize * 2,
                highWaterMark: this.frameSize * 4
            });

            this.speaker.on('error', (err) => {
                console.error('Speaker error:', err);
            });

            this.isPlaying = true;

            // Pre-fill with silence to establish the stream
            for (let i = 0; i < 4; i++) {
                const silenceBuffer = this.generateSilence();
                this.speaker.write(silenceBuffer);
            }

            // Start the continuous playback loop
            this.startPlaybackLoop();

            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }

    startPlaybackLoop() {
        const writeAudio = () => {
            if (!this.isPlaying) return;

            // Generate a full buffer of mixed audio
            const buffer = this.generateMixedAudio();

            // Write to speaker
            if (this.speaker && !this.speaker.destroyed) {
                this.speaker.write(buffer, () => {
                    // Continue writing after this buffer is consumed
                    if (this.isPlaying) {
                        setImmediate(writeAudio);
                    }
                });
            }
        };

        // Start multiple write chains for redundancy
        writeAudio();
        setTimeout(writeAudio, 10);
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