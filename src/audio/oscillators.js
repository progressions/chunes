// Waveform generation for chiptune sounds

class Oscillator {
    constructor(sampleRate = 44100) {
        this.sampleRate = sampleRate;
        this.phase = 0;
    }

    reset() {
        this.phase = 0;
    }
}

class SquareWaveOscillator extends Oscillator {
    constructor(sampleRate = 44100, dutyCycle = 0.5) {
        super(sampleRate);
        this.dutyCycle = dutyCycle;
    }

    setDutyCycle(dutyCycle) {
        this.dutyCycle = Math.max(0, Math.min(1, dutyCycle));
    }

    generate(frequency, numSamples) {
        const samples = new Float32Array(numSamples);
        const phaseIncrement = frequency / this.sampleRate;

        for (let i = 0; i < numSamples; i++) {
            // Generate square wave based on duty cycle
            const phasePosition = this.phase % 1.0;
            samples[i] = phasePosition < this.dutyCycle ? 0.5 : -0.5; // Moderate amplitude
            this.phase += phaseIncrement;
            while (this.phase >= 1.0) this.phase -= 1.0;
        }

        return samples;
    }
}

class TriangleWaveOscillator extends Oscillator {
    generate(frequency, numSamples) {
        const samples = new Float32Array(numSamples);
        const phaseIncrement = frequency / this.sampleRate;

        for (let i = 0; i < numSamples; i++) {
            // Generate triangle wave
            const p = this.phase % 1.0;
            let sample;

            if (p < 0.25) {
                sample = p * 4.0;
            } else if (p < 0.75) {
                sample = 2.0 - (p * 4.0);
            } else {
                sample = (p * 4.0) - 4.0;
            }

            samples[i] = sample * 0.5; // Moderate amplitude

            this.phase += phaseIncrement;
            while (this.phase >= 1.0) this.phase -= 1.0;
        }

        return samples;
    }
}

class NoiseOscillator extends Oscillator {
    constructor(sampleRate = 44100) {
        super(sampleRate);
        this.period = 16;
        this.counter = 0;
        this.currentValue = 0;
        this.lfsr = 0x0001; // Linear feedback shift register
    }

    setPeriod(period) {
        this.period = Math.max(1, Math.min(16, period));
    }

    generate(numSamples) {
        const samples = new Float32Array(numSamples);

        for (let i = 0; i < numSamples; i++) {
            // Update noise value based on period
            if (this.counter >= this.period) {
                // LFSR-based noise generation (NES-style)
                const feedback = ((this.lfsr & 0x0001) ^ ((this.lfsr & 0x0002) >> 1)) ? 0x8000 : 0;
                this.lfsr = (this.lfsr >> 1) | feedback;
                this.currentValue = (this.lfsr & 0x0001) ? 0.2 : -0.2; // Reduced amplitude
                this.counter = 0;
            }
            samples[i] = this.currentValue;
            this.counter++;
        }

        return samples;
    }

    generateWhiteNoise(numSamples) {
        const samples = new Float32Array(numSamples);
        for (let i = 0; i < numSamples; i++) {
            samples[i] = Math.random() * 2 - 1;
        }
        return samples;
    }
}

// Envelope generator for note shaping
class EnvelopeGenerator {
    constructor(sampleRate = 44100) {
        this.sampleRate = sampleRate;
        this.attack = 0.01;  // seconds
        this.decay = 0.1;    // seconds
        this.sustain = 0.7;  // level (0-1)
        this.release = 0.2;  // seconds
        this.stage = 'off';
        this.level = 0;
        this.time = 0;
    }

    setADSR(attack, decay, sustain, release) {
        this.attack = attack;
        this.decay = decay;
        this.sustain = sustain;
        this.release = release;
    }

    noteOn() {
        this.stage = 'attack';
        this.time = 0;
    }

    noteOff() {
        if (this.stage !== 'off') {
            this.stage = 'release';
            this.time = 0;
        }
    }

    process(samples) {
        const output = new Float32Array(samples.length);
        const dt = 1 / this.sampleRate;

        for (let i = 0; i < samples.length; i++) {
            switch (this.stage) {
                case 'attack':
                    this.level = this.time / this.attack;
                    if (this.time >= this.attack) {
                        this.stage = 'decay';
                        this.time = 0;
                    }
                    break;

                case 'decay':
                    this.level = 1.0 - ((1.0 - this.sustain) * (this.time / this.decay));
                    if (this.time >= this.decay) {
                        this.stage = 'sustain';
                        this.level = this.sustain;
                    }
                    break;

                case 'sustain':
                    this.level = this.sustain;
                    break;

                case 'release':
                    this.level = this.sustain * (1.0 - (this.time / this.release));
                    if (this.time >= this.release) {
                        this.stage = 'off';
                        this.level = 0;
                    }
                    break;

                case 'off':
                    this.level = 0;
                    break;
            }

            output[i] = samples[i] * Math.max(0, Math.min(1, this.level));
            this.time += dt;
        }

        return output;
    }
}

module.exports = {
    SquareWaveOscillator,
    TriangleWaveOscillator,
    NoiseOscillator,
    EnvelopeGenerator
};