// Simplified music generator for testing

class SimpleGenerator {
    constructor() {
        this.bpm = 120;
        this.stepTime = (60 / this.bpm) / 4; // Time per 16th note in seconds
        this.lastStepTime = Date.now() / 1000;
        this.currentStep = 0;

        // Simple repeating patterns
        this.patterns = {
            melody: [
                { step: 0, note: 'C4', freq: 261.63 },
                { step: 4, note: 'E4', freq: 329.63 },
                { step: 8, note: 'G4', freq: 392.00 },
                { step: 12, note: 'E4', freq: 329.63 }
            ],
            bass: [
                { step: 0, note: 'C2', freq: 65.41 },
                { step: 8, note: 'G2', freq: 98.00 }
            ],
            harmony: [
                { step: 2, note: 'E3', freq: 164.81 },
                { step: 6, note: 'G3', freq: 196.00 },
                { step: 10, note: 'C4', freq: 261.63 },
                { step: 14, note: 'G3', freq: 196.00 }
            ],
            drums: [
                { step: 0, type: 'kick' },
                { step: 4, type: 'snare' },
                { step: 8, type: 'kick' },
                { step: 12, type: 'snare' }
            ]
        };
    }

    update() {
        const now = Date.now() / 1000;
        const elapsed = now - this.lastStepTime;

        if (elapsed >= this.stepTime) {
            this.lastStepTime = now;

            const events = this.getEventsForStep(this.currentStep);

            this.currentStep = (this.currentStep + 1) % 16;

            return events;
        }

        return null;
    }

    getEventsForStep(step) {
        const events = {
            pulse1: null,
            pulse2: null,
            triangle: null,
            noise: null
        };

        // Check melody
        const melodyNote = this.patterns.melody.find(p => p.step === step);
        if (melodyNote) {
            events.pulse1 = {
                note: melodyNote.note,
                frequency: melodyNote.freq,
                duration: this.stepTime * 4,
                velocity: 70
            };
        }

        // Check harmony
        const harmonyNote = this.patterns.harmony.find(p => p.step === step);
        if (harmonyNote) {
            events.pulse2 = {
                note: harmonyNote.note,
                frequency: harmonyNote.freq,
                duration: this.stepTime * 3,
                velocity: 60
            };
        }

        // Check bass
        const bassNote = this.patterns.bass.find(p => p.step === step);
        if (bassNote) {
            events.triangle = {
                note: bassNote.note,
                frequency: bassNote.freq,
                duration: this.stepTime * 8,
                velocity: 80
            };
        }

        // Check drums
        const drum = this.patterns.drums.find(p => p.step === step);
        if (drum) {
            events.noise = {
                trigger: true,
                type: drum.type,
                duration: this.stepTime,
                velocity: drum.type === 'kick' ? 90 : 70
            };
        }

        return events;
    }

    setTempo(bpm) {
        this.bpm = bpm;
        this.stepTime = (60 / this.bpm) / 4;
    }

    reset() {
        this.currentStep = 0;
        this.lastStepTime = Date.now() / 1000;
    }
}

module.exports = {
    SimpleGenerator
};