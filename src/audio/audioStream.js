// Improved audio streaming with continuous buffer feeding

const Speaker = require('speaker');
const { Readable } = require('stream');

class AudioStream extends Readable {
    constructor(audioEngine) {
        super();
        this.audioEngine = audioEngine;
        this.sampleRate = 44100;
        this.channels = 2;
        this.bitDepth = 16;
        this.samplesPerFrame = 512;
        this.isActive = true;

        // Pre-generate some buffers to avoid underflow
        this.bufferQueue = [];
        this.maxQueueSize = 10;

        // Start generating audio immediately
        this.generateInitialBuffers();
    }

    generateInitialBuffers() {
        // Pre-fill the queue with audio buffers
        for (let i = 0; i < this.maxQueueSize; i++) {
            const audioData = this.audioEngine.generateChunk();
            const pcmBuffer = this.audioEngine.floatToPCM(audioData);
            this.bufferQueue.push(pcmBuffer);
        }
    }

    _read() {
        if (!this.isActive) {
            this.push(null);
            return;
        }

        // Get buffer from queue or generate new one
        let buffer;
        if (this.bufferQueue.length > 0) {
            buffer = this.bufferQueue.shift();
        } else {
            // Generate audio on demand
            const audioData = this.audioEngine.generateChunk();
            buffer = this.audioEngine.floatToPCM(audioData);
        }

        // Push to stream
        this.push(buffer);

        // Refill queue in background
        if (this.bufferQueue.length < this.maxQueueSize / 2) {
            setImmediate(() => {
                const audioData = this.audioEngine.generateChunk();
                const pcmBuffer = this.audioEngine.floatToPCM(audioData);
                this.bufferQueue.push(pcmBuffer);
            });
        }
    }

    stop() {
        this.isActive = false;
        this.bufferQueue = [];
    }
}

class StreamingAudioPlayer {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.audioStream = null;
        this.speaker = null;
        this.isPlaying = false;
    }

    start() {
        if (this.isPlaying) return;

        // Create audio stream
        this.audioStream = new AudioStream(this.audioEngine);

        // Create speaker
        this.speaker = new Speaker({
            channels: 2,
            bitDepth: 16,
            sampleRate: 44100,
            mode: Speaker.STEREO,
            format: Speaker.SIGNED_16_BIT_LITTLE_ENDIAN,
            samplesPerFrame: 512
        });

        // Handle errors
        this.speaker.on('error', (err) => {
            console.error('Speaker error:', err);
        });

        // Connect stream to speaker
        this.audioStream.pipe(this.speaker);

        this.isPlaying = true;
    }

    stop() {
        if (!this.isPlaying) return;

        if (this.audioStream) {
            this.audioStream.stop();
            this.audioStream.unpipe();
            this.audioStream = null;
        }

        if (this.speaker) {
            this.speaker.end();
            this.speaker = null;
        }

        this.isPlaying = false;
    }

    updateChannelData(channelData) {
        // This would update the audio engine's channel data
        return this.audioEngine.playChannelData(channelData);
    }
}

module.exports = {
    StreamingAudioPlayer,
    AudioStream
};