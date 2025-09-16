// Rhythm patterns and timing

class RhythmPattern {
    constructor(pattern, timeSignature = '4/4') {
        this.pattern = pattern; // Array of 1s and 0s
        this.timeSignature = timeSignature;
        this.currentStep = 0;
    }

    getNextStep() {
        const step = this.pattern[this.currentStep];
        this.currentStep = (this.currentStep + 1) % this.pattern.length;
        return step;
    }

    reset() {
        this.currentStep = 0;
    }

    rotate(amount = 1) {
        for (let i = 0; i < amount; i++) {
            this.pattern.push(this.pattern.shift());
        }
    }

    invert() {
        this.pattern = this.pattern.map(step => step === 1 ? 0 : 1);
    }
}

// Genre-specific rhythm patterns
const RHYTHM_PATTERNS = {
    rock: {
        kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        bass: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        lead: [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        harmony: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
    },
    soft: {
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        bass: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        lead: [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
        harmony: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
    },
    bossa: {
        kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        snare: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
        hihat: [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0],
        bass: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
        lead: [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
        harmony: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
    }
};

// Note durations in beats
const NOTE_DURATIONS = {
    whole: 4.0,
    half: 2.0,
    quarter: 1.0,
    eighth: 0.5,
    sixteenth: 0.25,
    triplet: 0.333,
    dotted_quarter: 1.5,
    dotted_eighth: 0.75
};

class Sequencer {
    constructor(tempo = 120, timeSignature = '4/4') {
        this.tempo = tempo;
        this.timeSignature = timeSignature;
        this.currentBeat = 0;
        this.currentMeasure = 0;
        this.stepTime = this.calculateStepTime();
        this.lastStepTime = Date.now();
        this.isPlaying = false;
        this.swing = false;
        this.swingAmount = 0.67; // 67% for first eighth, 33% for second
    }

    calculateStepTime() {
        // Calculate time per 16th note in milliseconds
        const beatsPerMinute = this.tempo;
        const millisecondsPerBeat = 60000 / beatsPerMinute;
        return millisecondsPerBeat / 4; // 16th note
    }

    setTempo(tempo) {
        this.tempo = tempo;
        this.stepTime = this.calculateStepTime();
    }

    setSwing(enabled, amount = 0.67) {
        this.swing = enabled;
        this.swingAmount = amount;
    }

    start() {
        this.isPlaying = true;
        this.lastStepTime = Date.now();
    }

    stop() {
        this.isPlaying = false;
        this.reset();
    }

    reset() {
        this.currentBeat = 0;
        this.currentMeasure = 0;
    }

    shouldTrigger() {
        if (!this.isPlaying) return false;

        const now = Date.now();
        const elapsed = now - this.lastStepTime;

        // Apply swing if enabled
        let targetTime = this.stepTime;
        if (this.swing && this.currentBeat % 2 === 1) {
            // Every other 16th note is delayed for swing
            targetTime = this.stepTime * (2 - this.swingAmount);
        } else if (this.swing && this.currentBeat % 2 === 0) {
            targetTime = this.stepTime * this.swingAmount;
        }

        if (elapsed >= targetTime) {
            this.lastStepTime = now;
            this.advance();
            return true;
        }

        return false;
    }

    advance() {
        this.currentBeat++;

        // Parse time signature
        const [beatsPerMeasure] = this.timeSignature.split('/').map(Number);
        const stepsPerMeasure = beatsPerMeasure * 4; // 16th notes per measure

        if (this.currentBeat >= stepsPerMeasure) {
            this.currentBeat = 0;
            this.currentMeasure++;
        }
    }

    getCurrentPosition() {
        return {
            measure: this.currentMeasure,
            beat: Math.floor(this.currentBeat / 4),
            subdivision: this.currentBeat % 4,
            absoluteBeat: this.currentMeasure * 4 + Math.floor(this.currentBeat / 4)
        };
    }

    getBeatDuration(duration = 'quarter') {
        const beats = NOTE_DURATIONS[duration] || 1.0;
        return (60000 / this.tempo) * beats; // In milliseconds
    }
}

// Drum pattern generator
class DrumGenerator {
    constructor(genre = 'rock') {
        this.genre = genre;
        this.patterns = this.loadPatterns(genre);
        this.variation = 0;
    }

    loadPatterns(genre) {
        const patterns = RHYTHM_PATTERNS[genre] || RHYTHM_PATTERNS.rock;
        return {
            kick: new RhythmPattern(patterns.kick),
            snare: new RhythmPattern(patterns.snare),
            hihat: new RhythmPattern(patterns.hihat)
        };
    }

    setGenre(genre) {
        this.genre = genre;
        this.patterns = this.loadPatterns(genre);
    }

    generateDrumHit() {
        const hits = [];

        if (this.patterns.kick.getNextStep() === 1) {
            hits.push({ type: 'kick', velocity: 90 + Math.random() * 20 });
        }
        if (this.patterns.snare.getNextStep() === 1) {
            hits.push({ type: 'snare', velocity: 70 + Math.random() * 20 });
        }
        if (this.patterns.hihat.getNextStep() === 1) {
            hits.push({ type: 'hihat', velocity: 50 + Math.random() * 20 });
        }

        return hits;
    }

    addVariation() {
        // Occasionally add ghost notes or fills
        this.variation = (this.variation + 1) % 8;

        if (this.variation === 0) {
            // Add a fill every 8 measures
            this.patterns.snare.pattern[14] = 1;
            this.patterns.snare.pattern[15] = 1;
        }
    }

    reset() {
        Object.values(this.patterns).forEach(pattern => pattern.reset());
        this.variation = 0;
    }
}

module.exports = {
    RhythmPattern,
    RHYTHM_PATTERNS,
    NOTE_DURATIONS,
    Sequencer,
    DrumGenerator
};