// Music theory - scales and note definitions

// Note frequencies (A4 = 440Hz)
const NOTE_FREQUENCIES = {
    'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83,
    'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
    'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65,
    'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
    'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91,
    'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53
};

// Chromatic notes
const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Scale intervals (in semitones from root)
const SCALE_INTERVALS = {
    major: [0, 2, 4, 5, 7, 9, 11],       // C D E F G A B
    minor: [0, 2, 3, 5, 7, 8, 10],       // C D Eb F G Ab Bb
    blues: [0, 3, 5, 6, 7, 10],          // C Eb F F# G Bb
    dorian: [0, 2, 3, 5, 7, 9, 10],      // C D Eb F G A Bb
    phrygian: [0, 1, 3, 5, 7, 8, 10],    // C Db Eb F G Ab Bb
    lydian: [0, 2, 4, 6, 7, 9, 11],      // C D E F# G A B
    mixolydian: [0, 2, 4, 5, 7, 9, 10],  // C D E F G A Bb
    pentatonic: [0, 2, 4, 7, 9],         // C D E G A
    harmonic_minor: [0, 2, 3, 5, 7, 8, 11], // C D Eb F G Ab B
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] // All 12 notes
};

class Scale {
    constructor(root = 'C', scaleType = 'major') {
        this.root = root;
        this.scaleType = scaleType;
        this.notes = this.generateNotes();
    }

    generateNotes() {
        const rootIndex = CHROMATIC_NOTES.indexOf(this.root);
        if (rootIndex === -1) {
            throw new Error(`Invalid root note: ${this.root}`);
        }

        const intervals = SCALE_INTERVALS[this.scaleType];
        if (!intervals) {
            throw new Error(`Invalid scale type: ${this.scaleType}`);
        }

        return intervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            return CHROMATIC_NOTES[noteIndex];
        });
    }

    getNoteAtDegree(degree) {
        // Degree is 1-indexed (1 = root, 2 = second, etc.)
        const index = (degree - 1) % this.notes.length;
        return this.notes[index];
    }

    getRandomNote() {
        const index = Math.floor(Math.random() * this.notes.length);
        return this.notes[index];
    }

    contains(note) {
        // Remove octave number if present
        const noteName = note.replace(/\d+$/, '');
        return this.notes.includes(noteName);
    }

    getFrequency(note, octave = 4) {
        const fullNote = `${note}${octave}`;
        return NOTE_FREQUENCIES[fullNote] || 440; // Default to A4 if not found
    }
}

// Key transposition helper
function transposeKey(originalKey, semitones) {
    const keyIndex = CHROMATIC_NOTES.indexOf(originalKey);
    if (keyIndex === -1) return originalKey;

    const newIndex = (keyIndex + semitones + 12) % 12;
    return CHROMATIC_NOTES[newIndex];
}

// Convert MIDI note number to note name
function midiToNote(midiNumber) {
    const octave = Math.floor(midiNumber / 12) - 1;
    const noteIndex = midiNumber % 12;
    return `${CHROMATIC_NOTES[noteIndex]}${octave}`;
}

// Convert note name to MIDI number
function noteToMidi(noteName) {
    const match = noteName.match(/^([A-G]#?)(\d+)$/);
    if (!match) return 60; // Default to middle C

    const note = match[1];
    const octave = parseInt(match[2]);
    const noteIndex = CHROMATIC_NOTES.indexOf(note);

    return (octave + 1) * 12 + noteIndex;
}

module.exports = {
    NOTE_FREQUENCIES,
    CHROMATIC_NOTES,
    SCALE_INTERVALS,
    Scale,
    transposeKey,
    midiToNote,
    noteToMidi
};