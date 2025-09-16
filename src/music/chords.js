// Chord progressions and harmony

const { Scale } = require('./scales');

// Chord types (intervals from root in semitones)
const CHORD_INTERVALS = {
    major: [0, 4, 7],               // 1 3 5
    minor: [0, 3, 7],               // 1 b3 5
    diminished: [0, 3, 6],          // 1 b3 b5
    augmented: [0, 4, 8],           // 1 3 #5
    major7: [0, 4, 7, 11],          // 1 3 5 7
    minor7: [0, 3, 7, 10],          // 1 b3 5 b7
    dominant7: [0, 4, 7, 10],       // 1 3 5 b7
    diminished7: [0, 3, 6, 9],      // 1 b3 b5 bb7
    sus2: [0, 2, 7],                // 1 2 5
    sus4: [0, 5, 7],                // 1 4 5
    add9: [0, 4, 7, 14],            // 1 3 5 9
    power: [0, 7]                   // 1 5 (power chord)
};

// Common chord progressions for different genres
const PROGRESSIONS = {
    rock: {
        basic: ['I', 'V', 'vi', 'IV'],           // C G Am F
        blues: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V'],
        power: ['I', 'bVII', 'IV', 'I'],         // C Bb F C
        classic: ['I', 'vi', 'IV', 'V']          // C Am F G
    },
    soft: {
        jazz: ['IIM7', 'V7', 'IM7', 'VIM7'],     // Dm7 G7 CM7 Am7
        smooth: ['IM7', 'VIM7', 'IIM7', 'V7'],   // CM7 Am7 Dm7 G7
        ballad: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
        ambient: ['I', 'IV', 'I', 'IV']          // Simple, peaceful
    },
    bossa: {
        classic: ['IIM7', 'V7', 'IM7', 'IM7'],   // Dm7 G7 CM7 CM7
        extended: ['IM7', 'I7', 'IVM7', 'IVm7', 'IM7', 'V7', 'IM7', 'IM7'],
        samba: ['IM7', 'VIM7', 'IIM7', 'V7']     // CM7 Am7 Dm7 G7
    }
};

class Chord {
    constructor(root, type = 'major', octave = 3) {
        this.root = root;
        this.type = type;
        this.octave = octave;
        this.notes = this.generateNotes();
    }

    generateNotes() {
        const intervals = CHORD_INTERVALS[this.type] || CHORD_INTERVALS.major;
        const { CHROMATIC_NOTES } = require('./scales');

        return intervals.map(interval => {
            // Calculate the note based on interval
            const noteIndex = CHROMATIC_NOTES.indexOf(this.root);
            const targetIndex = (noteIndex + interval) % 12;
            const note = CHROMATIC_NOTES[targetIndex];

            // Calculate octave adjustment
            const octaveAdjust = Math.floor((noteIndex + interval) / 12);
            return {
                note: note,
                octave: this.octave + octaveAdjust,
                fullNote: `${note}${this.octave + octaveAdjust}`
            };
        });
    }

    getFrequencies() {
        return this.notes.map(noteInfo => {
            const scale = new Scale(this.root, 'major');
            return scale.getFrequency(noteInfo.note, noteInfo.octave);
        });
    }

    getRootFrequency() {
        const scale = new Scale(this.root, 'major');
        return scale.getFrequency(this.root, this.octave);
    }

    getInversion(inversionNumber = 0) {
        const rotated = [...this.notes];
        for (let i = 0; i < inversionNumber; i++) {
            const first = rotated.shift();
            first.octave += 1;
            rotated.push(first);
        }
        return rotated;
    }
}

class ChordProgression {
    constructor(key = 'C', scaleType = 'major', progressionPattern = null) {
        this.key = key;
        this.scaleType = scaleType;
        this.scale = new Scale(key, scaleType);
        this.progressionPattern = progressionPattern || ['I', 'V', 'vi', 'IV'];
        this.chords = this.generateChords();
        this.currentIndex = 0;
    }

    generateChords() {
        return this.progressionPattern.map(degree => {
            return this.buildChordFromDegree(degree);
        });
    }

    buildChordFromDegree(degree) {
        // Parse the degree notation (e.g., "IIM7" -> degree: 2, type: "minor7")
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
        let degreeNum = 0;
        let chordType = 'major';
        let degreeStr = degree.toUpperCase();

        // Check for flat modifier
        let modifier = 0;
        if (degreeStr.startsWith('B')) {
            modifier = -1;
            degreeStr = degreeStr.substring(1);
        }

        // Find the roman numeral
        for (let i = 0; i < romanNumerals.length; i++) {
            if (degreeStr.startsWith(romanNumerals[i])) {
                degreeNum = i + 1;
                degreeStr = degreeStr.substring(romanNumerals[i].length);
                break;
            }
        }

        // Check for lowercase (minor)
        if (degree.match(/^[a-z]/)) {
            chordType = 'minor';
        }

        // Check for chord extensions
        if (degreeStr.includes('M7')) {
            chordType = chordType === 'minor' ? 'minor7' : 'major7';
        } else if (degreeStr.includes('7')) {
            chordType = 'dominant7';
        } else if (degreeStr.includes('DIM')) {
            chordType = 'diminished';
        }

        // Get the root note of the chord
        const rootNote = this.scale.getNoteAtDegree(degreeNum);

        // Apply modifier if present
        if (modifier !== 0) {
            const noteIndex = this.scale.notes.indexOf(rootNote);
            const modifiedIndex = (noteIndex + modifier + 12) % 12;
            const modifiedNote = this.scale.notes[modifiedIndex];
            return new Chord(modifiedNote, chordType);
        }

        return new Chord(rootNote, chordType);
    }

    getCurrentChord() {
        return this.chords[this.currentIndex];
    }

    nextChord() {
        this.currentIndex = (this.currentIndex + 1) % this.chords.length;
        return this.getCurrentChord();
    }

    reset() {
        this.currentIndex = 0;
    }

    getChordAtBeat(beat, beatsPerChord = 4) {
        const chordIndex = Math.floor(beat / beatsPerChord) % this.chords.length;
        return this.chords[chordIndex];
    }
}

// Voice leading helper - smooth transitions between chords
function getVoiceLeading(fromChord, toChord) {
    const fromNotes = fromChord.notes;
    const toNotes = toChord.notes;
    const voiceLeading = [];

    fromNotes.forEach((fromNote, i) => {
        // Find the closest note in the target chord
        let closestNote = toNotes[0];
        let minDistance = 12; // Maximum semitone distance

        toNotes.forEach(toNote => {
            const distance = Math.abs(noteDistance(fromNote, toNote));
            if (distance < minDistance) {
                minDistance = distance;
                closestNote = toNote;
            }
        });

        voiceLeading.push({
            from: fromNote,
            to: closestNote,
            distance: minDistance
        });
    });

    return voiceLeading;
}

function noteDistance(note1, note2) {
    // Calculate semitone distance between two notes
    const scale = new Scale('C', 'chromatic');
    const index1 = scale.notes.indexOf(note1.note);
    const index2 = scale.notes.indexOf(note2.note);
    const octaveDiff = (note2.octave - note1.octave) * 12;
    return (index2 - index1) + octaveDiff;
}

module.exports = {
    CHORD_INTERVALS,
    PROGRESSIONS,
    Chord,
    ChordProgression,
    getVoiceLeading
};