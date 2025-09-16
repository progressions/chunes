// Improved audio player with ring buffer to prevent underflow
const Speaker = require('speaker');
const { SquareWaveOscillator, TriangleWaveOscillator, NoiseOscillator } = require('./oscillators');

class ImprovedAudioPlayer {
    constructor() {
        this.sampleRate = 44100;
        this.channels = 2;
        this.bitDepth = 16;
        this.frameSize = 4096; // Larger frame for stability

        // Ring buffer for audio data
        this.bufferSize = this.frameSize * 8; // 8 frames of buffer
        this.audioBuffer = new Float32Array(this.bufferSize);
        this.writePosition = 0;
        this.readPosition = 0;

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
            pulse1: { freq: 0, volume: 0.25, active: false, phase: 0 },
            pulse2: { freq: 0, volume: 0.25, active: false, phase: 0 },
            triangle: { freq: 0, volume: 0.25, active: false, phase: 0 },
            noise: { volume: 0.15, active: false }
        };

        // Generation state
        this.generationInterval = null;
    }

    async initialize() {
        try {
            // Pre-fill buffer with silence
            this.prefillBuffer();

            this.speaker = new Speaker({
                channels: this.channels,
                bitDepth: this.bitDepth,
                sampleRate: this.sampleRate,
                lowWaterMark: 256,
                highWaterMark: 4096
            });

            this.speaker.on('error', (err) => {
                console.error('Speaker error:', err);
            });

            this.isPlaying = true;

            // Start audio generation loop
            this.startGenerationLoop();

            // Start playback loop
            this.startPlaybackLoop();

            return true;

        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }

    prefillBuffer() {
        // Fill entire buffer with silence initially
        for (let i = 0; i < this.bufferSize; i++) {
            this.audioBuffer[i] = 0;
        }
        this.writePosition = this.bufferSize / 2; // Start halfway through
    }

    startGenerationLoop() {
        // Generate audio continuously at a high rate
        this.generationInterval = setInterval(() => {
            this.generateAndBuffer();
        }, 5); // Generate every 5ms
    }

    startPlaybackLoop() {
        const playNextChunk = () => {
            if (!this.isPlaying || !this.speaker) return;

            const buffer = this.consumeBuffer();

            if (buffer) {
                this.speaker.write(buffer, () => {
                    if (this.isPlaying) {
                        setImmediate(playNextChunk);
                    }
                });
            } else {
                // If no buffer, try again quickly
                setTimeout(playNextChunk, 1);
            }
        };

        playNextChunk();
    }

    generateAndBuffer() {
        // Calculate how much space is available in the buffer
        let available = this.readPosition - this.writePosition;
        if (available <= 0) available += this.bufferSize;

        // Don't overfill - leave some space
        if (available < this.frameSize * 2) return;

        // Generate a chunk of audio
        const samples = this.generateMixedAudio(this.frameSize);

        // Write to ring buffer
        for (let i = 0; i < samples.length; i++) {
            this.audioBuffer[this.writePosition] = samples[i];
            this.writePosition = (this.writePosition + 1) % this.bufferSize;
        }
    }

    consumeBuffer() {
        // Calculate how much data is available
        let available = this.writePosition - this.readPosition;
        if (available < 0) available += this.bufferSize;

        // Need at least one frame
        if (available < this.frameSize) {
            // Generate silence to prevent underflow
            const silence = new Float32Array(this.frameSize);
            return this.floatToPCM(silence);
        }

        // Read from ring buffer
        const samples = new Float32Array(this.frameSize);
        for (let i = 0; i < this.frameSize; i++) {
            samples[i] = this.audioBuffer[this.readPosition];
            this.readPosition = (this.readPosition + 1) % this.bufferSize;
        }

        return this.floatToPCM(samples);
    }

    generateMixedAudio(numSamples = this.frameSize) {
        const samples = new Float32Array(numSamples);

        // Generate each channel
        if (this.channelStates.pulse1.active && this.channelStates.pulse1.freq > 0) {
            const pulse1 = this.oscillators.pulse1.generate(
                this.channelStates.pulse1.freq,
                numSamples
            );
            for (let i = 0; i < numSamples; i++) {
                samples[i] += pulse1[i] * this.channelStates.pulse1.volume;
            }
        }

        if (this.channelStates.pulse2.active && this.channelStates.pulse2.freq > 0) {
            const pulse2 = this.oscillators.pulse2.generate(
                this.channelStates.pulse2.freq,
                numSamples
            );
            for (let i = 0; i < numSamples; i++) {
                samples[i] += pulse2[i] * this.channelStates.pulse2.volume;
            }
        }

        if (this.channelStates.triangle.active && this.channelStates.triangle.freq > 0) {
            const triangle = this.oscillators.triangle.generate(
                this.channelStates.triangle.freq,
                numSamples
            );
            for (let i = 0; i < numSamples; i++) {
                samples[i] += triangle[i] * this.channelStates.triangle.volume;
            }
        }

        if (this.channelStates.noise.active) {
            const noise = this.oscillators.noise.generate(numSamples);
            for (let i = 0; i < numSamples; i++) {
                samples[i] += noise[i] * this.channelStates.noise.volume;
            }
        }

        return samples;
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

        if (this.generationInterval) {
            clearInterval(this.generationInterval);
            this.generationInterval = null;
        }

        if (this.speaker) {
            this.speaker.end();
            this.speaker = null;
        }
    }
}

module.exports = {
    ImprovedAudioPlayer
};