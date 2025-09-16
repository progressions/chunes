// Audio output using node-speaker

const Speaker = require('speaker');
const { Mixer, Channel, Compressor } = require('./mixer');
const { SquareWaveOscillator, TriangleWaveOscillator, NoiseOscillator } = require('./oscillators');

class AudioEngine {
    constructor() {
        this.sampleRate = 44100;
        this.bitDepth = 16;
        this.channels = 2; // Stereo output
        this.bufferSize = 512;

        this.speaker = null;
        this.mixer = new Mixer(this.sampleRate);
        this.compressor = new Compressor();
        this.isPlaying = false;

        this.setupChannels();
    }

    setupChannels() {
        // Create 4 NES-style channels
        const pulse1 = new Channel(
            'Pulse 1',
            new SquareWaveOscillator(this.sampleRate, 0.5),
            '#7dd3fc' // soft blue
        );

        const pulse2 = new Channel(
            'Pulse 2',
            new SquareWaveOscillator(this.sampleRate, 0.25),
            '#86efac' // gentle green
        );

        const triangle = new Channel(
            'Triangle',
            new TriangleWaveOscillator(this.sampleRate),
            '#fed7aa' // warm orange/peach
        );

        const noise = new Channel(
            'Noise',
            new NoiseOscillator(this.sampleRate),
            '#e9d5ff' // light purple/lavender
        );

        // Add channels to mixer
        this.mixer.addChannel('pulse1', pulse1);
        this.mixer.addChannel('pulse2', pulse2);
        this.mixer.addChannel('triangle', triangle);
        this.mixer.addChannel('noise', noise);
    }

    async initialize() {
        try {
            this.speaker = new Speaker({
                channels: this.channels,
                bitDepth: this.bitDepth,
                sampleRate: this.sampleRate,
                float: false,
                signed: true,
                lowWaterMark: 1024,
                highWaterMark: 4096
            });

            this.speaker.on('error', (err) => {
                console.error('Speaker error:', err);
            });

            this.speaker.on('flush', () => {
                // Keep the audio stream active
                if (this.isPlaying) {
                    const silence = this.generateSilence();
                    this.speaker.write(silence);
                }
            });

            this.isPlaying = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }

    generateSilence() {
        const samples = new Float32Array(this.bufferSize);
        return this.floatToPCM(samples);
    }

    play(audioData) {
        if (!this.speaker || !this.isPlaying) return;

        // Ensure we have valid audio data
        if (!audioData || audioData.length === 0) {
            // Generate silence if no data
            audioData = new Float32Array(this.bufferSize);
        }

        // Convert float samples to PCM buffer
        const buffer = this.floatToPCM(audioData);

        // Write to speaker
        try {
            this.speaker.write(buffer);
        } catch (error) {
            console.error('Audio playback error:', error);
        }
    }

    playChannelData(channelData) {
        // Update channel notes
        if (channelData.pulse1) {
            const channel = this.mixer.channels.pulse1;
            if (channelData.pulse1.note) {
                channel.playNote(
                    channelData.pulse1.note,
                    channelData.pulse1.frequency,
                    channelData.pulse1.duration,
                    channelData.pulse1.velocity
                );
            }
        }

        if (channelData.pulse2) {
            const channel = this.mixer.channels.pulse2;
            if (channelData.pulse2.note) {
                channel.playNote(
                    channelData.pulse2.note,
                    channelData.pulse2.frequency,
                    channelData.pulse2.duration,
                    channelData.pulse2.velocity
                );
            }
        }

        if (channelData.triangle) {
            const channel = this.mixer.channels.triangle;
            if (channelData.triangle.note) {
                channel.playNote(
                    channelData.triangle.note,
                    channelData.triangle.frequency,
                    channelData.triangle.duration,
                    channelData.triangle.velocity
                );
            }
        }

        if (channelData.noise) {
            const channel = this.mixer.channels.noise;
            if (channelData.noise.trigger) {
                // Noise channel plays percussion hits
                channel.playNote(
                    channelData.noise.type,
                    0, // No frequency for noise
                    channelData.noise.duration,
                    channelData.noise.velocity
                );
            }
        }

        // Generate and play mixed audio
        const mixedSamples = this.mixer.mix(this.bufferSize);
        const compressed = this.compressor.process(mixedSamples, this.sampleRate);
        this.play(compressed);

        return compressed;
    }

    generateChunk() {
        // Generate audio chunk from mixer
        const mixedSamples = this.mixer.mix(this.bufferSize);
        const compressed = this.compressor.process(mixedSamples, this.sampleRate);
        return compressed;
    }

    floatToPCM(floatSamples) {
        // Ensure we have a valid array
        if (!floatSamples || floatSamples.length === 0) {
            floatSamples = new Float32Array(this.bufferSize);
        }

        const length = floatSamples.length;
        const bufferSize = length * 2 * this.channels;

        // Ensure buffer size is valid
        if (!Number.isFinite(bufferSize) || bufferSize <= 0) {
            return Buffer.alloc(this.bufferSize * 2 * this.channels);
        }

        const buffer = Buffer.allocUnsafe(bufferSize);

        for (let i = 0; i < length; i++) {
            // Convert float (-1 to 1) to 16-bit PCM
            const sample = Math.max(-1, Math.min(1, floatSamples[i] || 0));
            const value = Math.floor(sample * 32767);

            // Write to both stereo channels
            buffer.writeInt16LE(value, i * 4);
            buffer.writeInt16LE(value, i * 4 + 2);
        }

        return buffer;
    }

    setChannelVolume(channelId, volume) {
        if (this.mixer.channels[channelId]) {
            this.mixer.channels[channelId].setVolume(volume);
        }
    }

    setMasterVolume(volume) {
        this.mixer.setMasterVolume(volume);
    }

    getVisualizationData() {
        return this.mixer.getVisualizationData();
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
    AudioEngine
};