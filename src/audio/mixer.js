// Channel mixing for 4-channel NES-style audio

class Channel {
    constructor(name, oscillator, color) {
        this.name = name;
        this.oscillator = oscillator;
        this.color = color;
        this.volume = 0.25; // Default volume per channel
        this.enabled = true;
        this.currentNote = null;
        this.noteStartTime = 0;
        this.noteDuration = 0;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    playNote(note, frequency, duration, velocity = 80) {
        this.currentNote = note;
        this.frequency = frequency;
        this.noteDuration = duration;
        this.noteStartTime = Date.now();
        this.velocity = velocity / 127; // MIDI velocity to amplitude
    }

    generate(numSamples) {
        if (!this.enabled) {
            return new Float32Array(numSamples);
        }

        // Generate waveform
        let samples;
        if (this.oscillator.constructor.name === 'NoiseOscillator') {
            samples = this.oscillator.generate(numSamples);
        } else {
            // Default to 440Hz if no frequency set
            const freq = this.frequency || 440;
            samples = this.oscillator.generate(freq, numSamples);
        }

        // Apply volume
        const amplitude = this.volume * (this.velocity || 0.5);
        for (let i = 0; i < samples.length; i++) {
            samples[i] *= amplitude;
        }

        // Check if note should end
        if (this.currentNote && this.noteDuration) {
            const elapsed = (Date.now() - this.noteStartTime) / 1000;
            if (elapsed >= this.noteDuration) {
                this.currentNote = null;
            }
        }

        return samples;
    }

    getVisualizationData() {
        return {
            name: this.name,
            color: this.color,
            active: this.currentNote !== null,
            note: this.currentNote,
            volume: this.volume
        };
    }
}

class Mixer {
    constructor(sampleRate = 44100) {
        this.sampleRate = sampleRate;
        this.channels = {};
        this.masterVolume = 0.5;
    }

    addChannel(id, channel) {
        this.channels[id] = channel;
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    mix(numSamples = 512) {
        const output = new Float32Array(numSamples);

        // Mix all channels
        Object.values(this.channels).forEach(channel => {
            const channelSamples = channel.generate(numSamples);
            for (let i = 0; i < numSamples; i++) {
                output[i] += channelSamples[i];
            }
        });

        // Apply master volume and clipping
        for (let i = 0; i < numSamples; i++) {
            output[i] *= this.masterVolume;
            // Soft clipping
            output[i] = Math.tanh(output[i]);
        }

        return output;
    }

    getVisualizationData() {
        const data = {};
        Object.entries(this.channels).forEach(([id, channel]) => {
            data[id] = channel.getVisualizationData();
        });
        return data;
    }
}

// Compressor for dynamic range control
class Compressor {
    constructor() {
        this.threshold = 0.7;
        this.ratio = 4;
        this.attack = 0.003;
        this.release = 0.1;
        this.envelope = 0;
    }

    process(samples, sampleRate = 44100) {
        const output = new Float32Array(samples.length);
        const attackCoeff = Math.exp(-1 / (this.attack * sampleRate));
        const releaseCoeff = Math.exp(-1 / (this.release * sampleRate));

        for (let i = 0; i < samples.length; i++) {
            const inputLevel = Math.abs(samples[i]);

            // Envelope follower
            if (inputLevel > this.envelope) {
                this.envelope = inputLevel + (this.envelope - inputLevel) * attackCoeff;
            } else {
                this.envelope = inputLevel + (this.envelope - inputLevel) * releaseCoeff;
            }

            // Apply compression
            let gain = 1;
            if (this.envelope > this.threshold) {
                const excess = this.envelope - this.threshold;
                const compressedExcess = excess / this.ratio;
                gain = (this.threshold + compressedExcess) / this.envelope;
            }

            output[i] = samples[i] * gain;
        }

        return output;
    }
}

module.exports = {
    Channel,
    Mixer,
    Compressor
};