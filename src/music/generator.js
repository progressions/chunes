// Main procedural music generation logic

const { Scale } = require('./scales');
const { ChordProgression, PROGRESSIONS } = require('./chords');
const { Sequencer, DrumGenerator, RHYTHM_PATTERNS, NOTE_DURATIONS } = require('./rhythm');

class MusicGenerator {
    constructor() {
        this.isGenerating = false;

        // Music parameters
        this.parameters = {
            genre: 'rock',
            key: 'C',
            scale: 'major',
            timeSignature: '4/4',
            tempo: 120,
            swing: false,
            loopLength: 8
        };

        // Music components
        this.scale = new Scale(this.parameters.key, this.parameters.scale);
        this.chordProgression = this.createProgression();
        this.sequencer = new Sequencer(this.parameters.tempo, this.parameters.timeSignature);
        this.drumGenerator = new DrumGenerator(this.parameters.genre);

        // Pattern state
        this.currentMeasure = 0;
        this.patternSeed = Math.random();
        this.melodyPattern = [];
        this.bassPattern = [];
        this.harmonyPattern = [];

        // Generate initial patterns
        this.generatePatterns();
    }

    createProgression() {
        const progressions = PROGRESSIONS[this.parameters.genre];
        const progressionType = progressions ? Object.keys(progressions)[0] : 'basic';
        const pattern = progressions ? progressions[progressionType] : ['I', 'V', 'vi', 'IV'];

        return new ChordProgression(
            this.parameters.key,
            this.parameters.scale,
            pattern
        );
    }

    start(parameters) {
        this.updateParameters(parameters);
        this.isGenerating = true;
        this.sequencer.start();
    }

    stop() {
        this.isGenerating = false;
        this.sequencer.stop();
    }

    updateParameters(parameters) {
        const needsRegeneration =
            parameters.key !== this.parameters.key ||
            parameters.scale !== this.parameters.scale ||
            parameters.genre !== this.parameters.genre;

        this.parameters = { ...this.parameters, ...parameters };

        // Update components
        if (parameters.key || parameters.scale) {
            this.scale = new Scale(this.parameters.key, this.parameters.scale);
            this.chordProgression = this.createProgression();
        }

        if (parameters.genre) {
            this.drumGenerator.setGenre(parameters.genre);
        }

        if (parameters.tempo) {
            this.sequencer.setTempo(parameters.tempo);
        }

        if (parameters.swing !== undefined) {
            this.sequencer.setSwing(parameters.swing);
        }

        // Regenerate patterns if key elements changed
        if (needsRegeneration) {
            this.generatePatterns();
        }
    }

    generatePatterns() {
        // Generate melodic patterns based on genre
        this.melodyPattern = this.generateMelodyPattern();
        this.bassPattern = this.generateBassPattern();
        this.harmonyPattern = this.generateHarmonyPattern();
    }

    generateMelodyPattern() {
        const pattern = [];
        const length = this.parameters.loopLength * 16; // 16th notes per measure

        for (let i = 0; i < length; i++) {
            // Genre-specific melody generation
            const probability = this.getMelodyProbability(i);

            if (Math.random() < probability) {
                const note = this.selectMelodyNote(i);
                const duration = this.selectNoteDuration('melody');
                pattern.push({
                    position: i,
                    note,
                    duration,
                    velocity: 60 + Math.random() * 40
                });
            }
        }

        return pattern;
    }

    generateBassPattern() {
        const pattern = [];
        const length = this.parameters.loopLength * 16;

        for (let i = 0; i < length; i += 4) { // Quarter notes for bass
            const chord = this.chordProgression.getChordAtBeat(Math.floor(i / 4), 4);

            // Play root note of chord
            pattern.push({
                position: i,
                note: chord.root,
                octave: 2,
                duration: this.selectNoteDuration('bass'),
                velocity: 80 + Math.random() * 20
            });

            // Sometimes add passing tones
            if (Math.random() < 0.3) {
                pattern.push({
                    position: i + 2,
                    note: this.scale.getNoteAtDegree(5), // Fifth
                    octave: 2,
                    duration: 0.25,
                    velocity: 60 + Math.random() * 20
                });
            }
        }

        return pattern;
    }

    generateHarmonyPattern() {
        const pattern = [];
        const length = this.parameters.loopLength * 16;

        for (let i = 0; i < length; i += 8) { // Half notes for harmony
            const chord = this.chordProgression.getChordAtBeat(Math.floor(i / 4), 4);
            const chordNotes = chord.notes;

            // Play chord tones
            chordNotes.slice(1, 3).forEach((noteInfo, index) => {
                pattern.push({
                    position: i + index * 2,
                    note: noteInfo.note,
                    octave: 3,
                    duration: this.selectNoteDuration('harmony'),
                    velocity: 50 + Math.random() * 30
                });
            });
        }

        return pattern;
    }

    getMelodyProbability(position) {
        // Genre-specific probability of playing a note
        const beat = position % 16;

        switch (this.parameters.genre) {
            case 'rock':
                // More notes on strong beats
                return beat % 4 === 0 ? 0.8 : 0.3;
            case 'soft':
                // Sparse, gentle melody
                return beat % 8 === 0 ? 0.6 : 0.2;
            case 'bossa':
                // Syncopated rhythm
                return beat % 3 === 0 ? 0.7 : 0.4;
            default:
                return 0.5;
        }
    }

    selectMelodyNote(position) {
        const chord = this.chordProgression.getChordAtBeat(Math.floor(position / 4), 4);
        const chordNotes = chord.notes.map(n => n.note);

        // 70% chance to play chord tone, 30% to play scale note
        if (Math.random() < 0.7) {
            return chordNotes[Math.floor(Math.random() * chordNotes.length)];
        } else {
            return this.scale.getRandomNote();
        }
    }

    selectNoteDuration(channelType) {
        // Select appropriate note duration based on channel and genre
        const durations = {
            melody: ['eighth', 'quarter', 'dotted_eighth'],
            bass: ['quarter', 'half', 'whole'],
            harmony: ['quarter', 'half', 'dotted_quarter']
        };

        const available = durations[channelType] || durations.melody;
        const selected = available[Math.floor(Math.random() * available.length)];
        return NOTE_DURATIONS[selected];
    }

    generateNextChunk() {
        if (!this.isGenerating) {
            return {
                pulse1: null,
                pulse2: null,
                triangle: null,
                noise: null
            };
        }

        const channelData = {
            pulse1: null,
            pulse2: null,
            triangle: null,
            noise: null
        };

        // Check if we should trigger next step
        if (!this.sequencer.shouldTrigger()) {
            return channelData;
        }

        const position = this.sequencer.getCurrentPosition();
        const currentStep = position.measure * 16 + position.beat * 4 + position.subdivision;

        // Check melody pattern for pulse1
        const melodyNote = this.melodyPattern.find(p => p.position === currentStep % (this.parameters.loopLength * 16));
        if (melodyNote) {
            channelData.pulse1 = {
                note: melodyNote.note,
                frequency: this.scale.getFrequency(melodyNote.note, 4),
                duration: melodyNote.duration,
                velocity: melodyNote.velocity
            };
        }

        // Check harmony pattern for pulse2
        const harmonyNote = this.harmonyPattern.find(p => p.position === currentStep % (this.parameters.loopLength * 16));
        if (harmonyNote) {
            channelData.pulse2 = {
                note: harmonyNote.note,
                frequency: this.scale.getFrequency(harmonyNote.note, harmonyNote.octave || 3),
                duration: harmonyNote.duration,
                velocity: harmonyNote.velocity
            };
        }

        // Check bass pattern for triangle
        const bassNote = this.bassPattern.find(p => p.position === currentStep % (this.parameters.loopLength * 16));
        if (bassNote) {
            channelData.triangle = {
                note: bassNote.note,
                frequency: this.scale.getFrequency(bassNote.note, bassNote.octave || 2),
                duration: bassNote.duration,
                velocity: bassNote.velocity
            };
        }

        // Generate drums for noise channel
        const drumHits = this.drumGenerator.generateDrumHit();
        if (drumHits.length > 0) {
            // Combine multiple drum hits into one noise burst
            const hit = drumHits[0]; // Take the most prominent hit
            channelData.noise = {
                trigger: true,
                type: hit.type,
                duration: 0.1,
                velocity: hit.velocity
            };

            // Set noise period based on drum type
            if (hit.type === 'kick') {
                channelData.noise.period = 15; // Low frequency noise
            } else if (hit.type === 'snare') {
                channelData.noise.period = 4; // Mid frequency noise
            } else if (hit.type === 'hihat') {
                channelData.noise.period = 1; // High frequency noise
            }
        }

        // Add variation every few measures
        if (position.measure % 4 === 0 && position.beat === 0 && position.subdivision === 0) {
            this.addVariation();
        }

        return channelData;
    }

    addVariation() {
        // Occasionally regenerate parts of patterns for variation
        if (Math.random() < 0.3) {
            // Regenerate last few notes of melody
            const startIndex = this.melodyPattern.length - 8;
            for (let i = startIndex; i < this.melodyPattern.length; i++) {
                if (Math.random() < 0.5 && this.melodyPattern[i]) {
                    this.melodyPattern[i].note = this.scale.getRandomNote();
                }
            }
        }

        // Add drum variations
        this.drumGenerator.addVariation();
    }

    reset() {
        this.sequencer.reset();
        this.drumGenerator.reset();
        this.chordProgression.reset();
        this.currentMeasure = 0;
        this.generatePatterns();
    }

    getState() {
        return {
            parameters: this.parameters,
            patternSeed: this.patternSeed,
            position: this.sequencer.getCurrentPosition()
        };
    }

    loadState(state) {
        this.parameters = state.parameters;
        this.patternSeed = state.patternSeed;
        this.updateParameters(this.parameters);
    }
}

module.exports = {
    MusicGenerator
};