// Continuous audio player that maintains a steady stream

const Speaker = require('speaker');

class ContinuousAudioPlayer {
    constructor() {
        this.sampleRate = 44100;
        this.channels = 2;
        this.bitDepth = 16;
        this.frameSize = 1024; // Larger frame size for smoother playback

        this.speaker = null;
        this.isPlaying = false;
        this.audioQueue = [];
        this.minQueueSize = 5;
        this.maxQueueSize = 10;

        // Simple oscillator state for testing
        this.phase = 0;
        this.frequency = 440;
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

            // Generate a full buffer of audio
            const buffer = this.generateTestTone();

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

        // Start the loop
        writeAudio();
    }

    generateTestTone() {
        const samplesPerBuffer = this.frameSize;
        const buffer = Buffer.allocUnsafe(samplesPerBuffer * 2 * this.channels);

        for (let i = 0; i < samplesPerBuffer; i++) {
            // Generate a simple sine wave
            const sample = Math.sin(2 * Math.PI * this.phase) * 0.3;
            const value = Math.floor(sample * 32767);

            // Write to both stereo channels
            buffer.writeInt16LE(value, i * 4);
            buffer.writeInt16LE(value, i * 4 + 2);

            // Update phase
            this.phase += this.frequency / this.sampleRate;
            if (this.phase > 1.0) this.phase -= 1.0;
        }

        return buffer;
    }

    playBuffer(pcmBuffer) {
        if (!this.speaker || !this.isPlaying) return;

        // Queue the buffer for playback
        if (this.audioQueue.length < this.maxQueueSize) {
            this.audioQueue.push(pcmBuffer);
        }
    }

    setFrequency(freq) {
        this.frequency = freq;
    }

    stop() {
        this.isPlaying = false;

        if (this.speaker) {
            this.speaker.end();
            this.speaker = null;
        }

        this.audioQueue = [];
    }
}

module.exports = {
    ContinuousAudioPlayer
};