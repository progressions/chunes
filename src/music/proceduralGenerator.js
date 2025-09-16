// Enhanced procedural music generator with genre support

const { RHYTHM_PATTERNS, NOTE_DURATIONS } = require('./rhythm');

class ProceduralGenerator {
    constructor() {
        this.genre = 'rock';
        this.key = 'C';
        this.scale = 'major';
        this.tempo = 120;
        this.loopLength = 8; // measures
        this.currentStep = 0;
        this.stepTime = (60 / this.tempo) / 4; // Time per 16th note
        this.lastStepTime = Date.now() / 1000;
        this.swing = false;
        this.swingAmount = 0.67; // 67/33 swing ratio
        this.timeSignature = '4/4';
        this.beatsPerMeasure = 4;
        this.beatUnit = 4;

        // Musical scales
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11], // Semitone intervals
            minor: [0, 2, 3, 5, 7, 8, 10],
            blues: [0, 3, 5, 6, 7, 10]
        };

        // Note frequencies for each key
        this.keyFrequencies = {
            'C': 261.63,
            'C#': 277.18,
            'D': 293.66,
            'D#': 311.13,
            'E': 329.63,
            'F': 349.23,
            'F#': 369.99,
            'G': 392.00,
            'G#': 415.30,
            'A': 440.00,
            'A#': 466.16,
            'B': 493.88
        };

        // Genre-specific patterns
        this.genrePatterns = {
            rock: {
                chordProgression: [0, 0, 5, 5, 0, 0, 4, 4], // I-I-V-V-I-I-IV-IV
                melodyRhythm: [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                bassRhythm: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                drumKick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                drumSnare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
            },
            soft: {
                chordProgression: [0, 3, 4, 0, 0, 3, 4, 4], // I-IV-V-I pattern
                melodyRhythm: [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
                bassRhythm: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                drumKick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                drumSnare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
            },
            bossa: {
                chordProgression: [0, 0, 1, 4, 0, 0, 1, 4], // I-ii-V pattern
                melodyRhythm: [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
                bassRhythm: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
                drumKick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
                drumSnare: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]
            }
        };

        // Melody generation state
        this.currentChordIndex = 0;
        this.currentMelodyNote = 0;
        this.melodySeed = Math.random();
        this.firstUpdate = true; // Flag to generate music immediately
        this.forceFirstNote = true; // Force notes on the very first call

        this.regeneratePatterns();
    }

    regeneratePatterns() {
        // Generate procedural variations for current genre
        const pattern = this.genrePatterns[this.genre];

        // Add some random variations to patterns
        this.melodyPattern = this.varyPattern(pattern.melodyRhythm);
        this.bassPattern = pattern.bassRhythm;
        this.drumKickPattern = pattern.drumKick;
        this.drumSnarePattern = pattern.drumSnare;
    }

    varyPattern(pattern) {
        // Add slight variations to patterns for procedural generation
        const varied = [...pattern];
        for (let i = 0; i < varied.length; i++) {
            if (Math.random() < 0.1) { // 10% chance to vary each step
                varied[i] = varied[i] === 1 ? 0 : 1;
            }
        }
        return varied;
    }

    update() {
        const now = Date.now() / 1000;
        const elapsed = now - this.lastStepTime;

        // Apply swing timing if enabled
        let currentStepTime = this.stepTime;
        if (this.swing && this.currentStep % 2 === 1) {
            // Every other 16th note is delayed for swing feel
            currentStepTime = this.stepTime * (2 - this.swingAmount);
        } else if (this.swing && this.currentStep % 2 === 0) {
            currentStepTime = this.stepTime * this.swingAmount;
        }

        // Generate immediately on first update or when time has passed
        if (this.firstUpdate || elapsed >= currentStepTime) {
            this.firstUpdate = false;
            // Move forward by exact step time to prevent drift
            // But if we've fallen too far behind (>2 steps), reset to current time
            if (elapsed > currentStepTime * 2) {
                this.lastStepTime = now;
            } else {
                this.lastStepTime += currentStepTime;
            }

            const events = this.generateEvents();

            // Advance step
            const stepsPerMeasure = this.beatsPerMeasure * 4; // 16th notes per measure
            this.currentStep = (this.currentStep + 1) % (this.loopLength * stepsPerMeasure);

            // Update chord every measure
            if (this.currentStep % stepsPerMeasure === 0) {
                this.currentChordIndex = (this.currentChordIndex + 1) %
                    this.genrePatterns[this.genre].chordProgression.length;
            }

            return events;
        }

        return null;
    }

    generateEvents() {
        const events = {
            pulse1: null,
            pulse2: null,
            triangle: null,
            noise: null
        };

        const stepInPattern = this.currentStep % 16;

        // Get current chord
        const progression = this.genrePatterns[this.genre].chordProgression;
        const chordDegree = progression[this.currentChordIndex];

        // Lead melody (pulse1) - force on first note or follow pattern
        if (this.forceFirstNote || this.melodyPattern[stepInPattern]) {
            this.forceFirstNote = false;
            const note = this.generateMelodyNote(chordDegree);
            events.pulse1 = {
                note: `${this.key}4`,
                frequency: note.frequency,
                duration: this.stepTime * 4,
                velocity: 60 + Math.random() * 20
            };
        }

        // Harmony (pulse2) - plays chord tones
        if (this.forceFirstNote || stepInPattern % 4 === 2) { // Slightly offset from melody
            const harmonyNote = this.generateHarmonyNote(chordDegree);
            events.pulse2 = {
                note: `${this.key}3`,
                frequency: harmonyNote.frequency,
                duration: this.stepTime * 3,
                velocity: 50 + Math.random() * 20
            };
        }

        // Bass (triangle)
        if (this.forceFirstNote || this.bassPattern[stepInPattern]) {
            const bassNote = this.generateBassNote(chordDegree);
            events.triangle = {
                note: `${this.key}2`,
                frequency: bassNote.frequency,
                duration: this.stepTime * 8,
                velocity: 70 + Math.random() * 20
            };
        }

        // Drums (noise)
        if (this.forceFirstNote || this.drumKickPattern[stepInPattern]) {
            events.noise = {
                trigger: true,
                type: 'kick',
                duration: this.stepTime * 2,
                velocity: 80 + Math.random() * 10,
                period: 15
            };
        } else if (this.drumSnarePattern[stepInPattern]) {
            events.noise = {
                trigger: true,
                type: 'snare',
                duration: this.stepTime,
                velocity: 70 + Math.random() * 10,
                period: 4
            };
        }

        return events;
    }

    generateMelodyNote(chordDegree) {
        const scale = this.scales[this.scale];
        const rootFreq = this.keyFrequencies[this.key];

        // Pick notes from scale, favoring chord tones
        let scaleIndex;
        if (Math.random() < 0.7) {
            // Play chord tone
            const chordTones = [chordDegree, (chordDegree + 2) % scale.length,
                               (chordDegree + 4) % scale.length];
            scaleIndex = chordTones[Math.floor(Math.random() * chordTones.length)];
        } else {
            // Play passing tone
            scaleIndex = Math.floor(Math.random() * scale.length);
        }

        const semitones = scale[scaleIndex];
        const frequency = rootFreq * Math.pow(2, semitones / 12) * 2; // Octave up

        return { frequency, note: scaleIndex };
    }

    generateHarmonyNote(chordDegree) {
        const scale = this.scales[this.scale];
        const rootFreq = this.keyFrequencies[this.key];

        // Play the third of the chord
        const scaleIndex = (chordDegree + 2) % scale.length;
        const semitones = scale[scaleIndex];
        const frequency = rootFreq * Math.pow(2, semitones / 12);

        return { frequency, note: scaleIndex };
    }

    generateBassNote(chordDegree) {
        const scale = this.scales[this.scale];
        const rootFreq = this.keyFrequencies[this.key];

        // Play root note of chord
        const semitones = scale[chordDegree];
        const frequency = (rootFreq * Math.pow(2, semitones / 12)) / 2; // Octave down

        return { frequency, note: chordDegree };
    }

    setGenre(genre) {
        this.genre = genre;
        this.regeneratePatterns();

        // Adjust tempo based on genre
        const tempoRanges = {
            rock: [100, 140],
            soft: [60, 100],
            bossa: [80, 120]
        };

        const range = tempoRanges[genre];
        if (range) {
            // Keep current tempo if in range, otherwise set to middle
            if (this.tempo < range[0] || this.tempo > range[1]) {
                this.tempo = Math.floor((range[0] + range[1]) / 2);
                this.updateTempo();
            }
        }
    }

    setKey(key) {
        if (this.keyFrequencies[key]) {
            this.key = key;
        }
    }

    setScale(scale) {
        if (this.scales[scale]) {
            this.scale = scale;
        }
    }

    setTempo(bpm) {
        this.tempo = bpm;
        this.updateTempo();
    }

    updateTempo() {
        // Calculate new step time (time per 16th note)
        this.stepTime = (60 / this.tempo) / 4;
        // Don't reset lastStepTime - let the next update handle timing naturally
    }

    setLoopLength(measures) {
        this.loopLength = measures;
    }

    setSwing(enabled) {
        this.swing = enabled;
    }

    setTimeSignature(signature) {
        this.timeSignature = signature;
        if (signature === '3/4') {
            this.beatsPerMeasure = 3;
            this.beatUnit = 4;
        } else if (signature === '4/4') {
            this.beatsPerMeasure = 4;
            this.beatUnit = 4;
        }
    }

    reset() {
        this.currentStep = 0;
        this.currentChordIndex = 0;
        this.lastStepTime = Date.now() / 1000;
        this.melodySeed = Math.random();
        this.regeneratePatterns();
    }

    getState() {
        return {
            genre: this.genre,
            key: this.key,
            scale: this.scale,
            tempo: this.tempo,
            loopLength: this.loopLength,
            currentStep: this.currentStep,
            swing: this.swing,
            timeSignature: this.timeSignature
        };
    }

    loadState(state) {
        if (state) {
            this.genre = state.genre || 'rock';
            this.key = state.key || 'C';
            this.scale = state.scale || 'major';
            this.tempo = state.tempo || 120;
            this.loopLength = state.loopLength || 8;
            this.currentStep = state.currentStep || 0;
            this.swing = state.swing || false;
            this.timeSignature = state.timeSignature || '4/4';
            this.updateTempo();
            this.regeneratePatterns();
        }
    }
}

module.exports = {
    ProceduralGenerator
};