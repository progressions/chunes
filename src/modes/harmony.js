// H Mode - Harmony Building Mode

class HarmonyMode {
    constructor(app) {
        this.app = app;
        this.isActive = false;

        // Channel mapping
        this.channelMap = {
            1: 'pulse1',   // Lead
            2: 'pulse2',   // Harmony
            3: 'triangle', // Bass
            4: 'noise'     // Drums
        };

        // H Mode state
        this.selectedChannel = 1;
        this.patterns = {};
        this.currentStep = 0;
        this.lastStepTime = Date.now() / 1000;

        // Musical parameters
        this.octaveRange = 2; // Two octave range for random notes

        // Don't initialize patterns in constructor - wait for activate()
    }

    initializePatterns() {
        // Initialize patterns for each channel
        const loopLength = this.app.parameters.loopLength || 8;
        const stepsPerBar = 16; // 16 steps per bar
        const totalSteps = loopLength * stepsPerBar;

        // Get root note frequency
        const rootNote = this.getRootNoteFrequency();

        // Initialize each channel with appropriate pattern
        this.patterns = {
            pulse1: this.createInitialPattern(rootNote, totalSteps, 4),   // Quarter notes
            pulse2: this.createInitialPattern(rootNote, totalSteps, 4),   // Quarter notes
            triangle: this.createInitialPattern(rootNote, totalSteps, 8), // Half notes
            noise: this.createEmptyPattern(totalSteps)                    // Empty/silent
        };
    }

    createInitialPattern(rootFreq, totalSteps, noteInterval) {
        const pattern = new Array(totalSteps).fill(null);

        // Place root note at regular intervals
        for (let i = 0; i < totalSteps; i += noteInterval) {
            pattern[i] = {
                frequency: rootFreq,
                note: this.app.parameters.key + '4',
                velocity: 70,
                duration: noteInterval === 4 ? 0.5 : 1 // Staccato: 0.5 beat for quarters, 1 beat for halves
            };
        }

        return pattern;
    }

    createEmptyPattern(totalSteps) {
        return new Array(totalSteps).fill(null);
    }

    getRootNoteFrequency() {
        // Note frequencies for each key at octave 4
        const keyFrequencies = {
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

        return keyFrequencies[this.app.parameters.key] || 261.63;
    }

    activate() {
        this.isActive = true;

        // Initialize patterns with current parameters
        this.initializePatterns();

        // Reset timing
        this.currentStep = 0;
        this.lastStepTime = Date.now() / 1000;

        // Set up key handlers
        this.setupKeyHandlers();

        // Update UI
        this.app.uiManager.setMode('harmony');
        this.updateDisplay();
    }

    deactivate() {
        this.isActive = false;

        // Clean up key handlers
        this.cleanupKeyHandlers();
    }

    setupKeyHandlers() {
        // Channel selection
        this.app.screen.key('[', () => this.selectPreviousChannel());
        this.app.screen.key(']', () => this.selectNextChannel());

        // Add note
        this.app.screen.key(['p', 'P'], () => this.addRandomNote());

        // H key toggle is handled in main.js to avoid conflicts

        // Set up parameter change handler from controlHandler
        this.parameterHandler = this.handleParameterChange.bind(this);
        this.app.controlHandler.on('parameterChange', this.parameterHandler);

        // Volume and channel controls
        this.volumeHandler = this.handleVolumeChange.bind(this);
        this.channelToggleHandler = this.handleChannelToggle.bind(this);
        this.app.controlHandler.on('volumeChange', this.volumeHandler);
        this.app.controlHandler.on('channelToggle', this.channelToggleHandler);
    }

    cleanupKeyHandlers() {
        this.app.screen.unkey('[');
        this.app.screen.unkey(']');
        this.app.screen.unkey(['p', 'P']);

        // Clean up parameter handlers
        if (this.parameterHandler) {
            this.app.controlHandler.removeListener('parameterChange', this.parameterHandler);
        }
        if (this.volumeHandler) {
            this.app.controlHandler.removeListener('volumeChange', this.volumeHandler);
        }
        if (this.channelToggleHandler) {
            this.app.controlHandler.removeListener('channelToggle', this.channelToggleHandler);
        }
    }

    selectPreviousChannel() {
        this.selectedChannel = this.selectedChannel === 1 ? 4 : this.selectedChannel - 1;
        this.updateDisplay();

        const channelNames = {
            1: 'Lead (Pulse 1)',
            2: 'Harmony (Pulse 2)',
            3: 'Bass (Triangle)',
            4: 'Drums (Noise)'
        };

        this.app.uiManager.showMessage(
            `Selected: Ch${this.selectedChannel} - ${channelNames[this.selectedChannel]}`,
            'info'
        );
    }

    selectNextChannel() {
        this.selectedChannel = this.selectedChannel === 4 ? 1 : this.selectedChannel + 1;
        this.updateDisplay();

        const channelNames = {
            1: 'Lead (Pulse 1)',
            2: 'Harmony (Pulse 2)',
            3: 'Bass (Triangle)',
            4: 'Drums (Noise)'
        };

        this.app.uiManager.showMessage(
            `Selected: Ch${this.selectedChannel} - ${channelNames[this.selectedChannel]}`,
            'info'
        );
    }

    addRandomNote() {
        // Get current quantized position
        const quantizedStep = this.getQuantizedStep();

        // Get random scale note
        const randomNote = this.getRandomScaleNote();

        // Add to selected channel pattern
        const channelId = this.channelMap[this.selectedChannel];

        if (channelId === 'noise') {
            // For noise channel, add drum hit
            this.patterns[channelId][quantizedStep] = {
                trigger: true,
                type: Math.random() > 0.5 ? 'kick' : 'snare',
                duration: 0.2,
                velocity: 80 + Math.random() * 20,
                period: Math.random() > 0.5 ? 15 : 4
            };
        } else {
            // For tonal channels, add note
            this.patterns[channelId][quantizedStep] = {
                frequency: randomNote.frequency,
                note: randomNote.name,
                velocity: 60 + Math.random() * 30,
                duration: 0.5 // Half a beat for staccato quarter notes
            };
        }

        this.app.uiManager.showMessage(
            `Added ${channelId === 'noise' ? 'drum' : randomNote.name} at step ${quantizedStep}`,
            'success'
        );
    }

    getQuantizedStep() {
        // Quantize to nearest beat (every 4 steps = 1 beat)
        const nearestBeat = Math.round(this.currentStep / 4) * 4;
        const totalSteps = this.app.parameters.loopLength * 16;
        return nearestBeat % totalSteps;
    }

    getRandomScaleNote() {
        // Get scale intervals
        const scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            blues: [0, 3, 5, 6, 7, 10]
        };

        const scale = scales[this.app.parameters.scale] || scales.major;

        // Get base frequency
        const keyFrequencies = {
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

        const baseFreq = keyFrequencies[this.app.parameters.key] || 261.63;

        // Choose random octave within range (0 = same octave, 1 = up one, -1 = down one)
        const octaveOffset = Math.floor(Math.random() * (this.octaveRange + 1)) - Math.floor(this.octaveRange / 2);

        // Choose random note from scale
        const noteIndex = Math.floor(Math.random() * scale.length);
        const semitoneOffset = scale[noteIndex];

        // Calculate frequency
        const totalSemitones = semitoneOffset + (octaveOffset * 12);
        const frequency = baseFreq * Math.pow(2, totalSemitones / 12);

        // Generate note name
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const keyIndex = noteNames.indexOf(this.app.parameters.key);
        const noteName = noteNames[(keyIndex + semitoneOffset) % 12];
        const octave = 4 + octaveOffset;

        return {
            frequency: frequency,
            name: noteName + octave,
            semitones: totalSemitones
        };
    }

    update() {
        if (!this.isActive) return null;

        const now = Date.now() / 1000;
        const stepTime = (60 / this.app.parameters.tempo) / 4; // Time per 16th note
        const elapsed = now - this.lastStepTime;

        if (elapsed >= stepTime) {
            this.lastStepTime += stepTime;

            // Get events for current step
            const events = this.getCurrentStepEvents();

            // Advance step
            const totalSteps = this.app.parameters.loopLength * 16;
            this.currentStep = (this.currentStep + 1) % totalSteps;

            return events;
        }

        return null;
    }

    getCurrentStepEvents() {
        const events = {
            pulse1: null,
            pulse2: null,
            triangle: null,
            noise: null
        };

        // Calculate step time for note durations
        const stepTime = (60 / this.app.parameters.tempo) / 4;

        // Check each channel for notes at current step
        for (const [channel, pattern] of Object.entries(this.patterns)) {
            const note = pattern[this.currentStep];

            if (note) {
                if (channel === 'noise' && note.trigger) {
                    // Drum event
                    events[channel] = {
                        trigger: true,
                        type: note.type,
                        duration: note.duration,
                        velocity: note.velocity,
                        period: note.period
                    };
                } else if (channel !== 'noise' && note.frequency) {
                    // Note event - duration is in beats, convert to seconds
                    // 1 beat = 1 quarter note = 4 steps * stepTime
                    events[channel] = {
                        frequency: note.frequency,
                        note: note.note,
                        duration: stepTime * 4 * note.duration, // Convert beats to seconds
                        velocity: note.velocity
                    };
                }
            }
        }

        return events;
    }

    updateDisplay() {
        // This will be called to update channel selection indicator
        if (this.app.uiManager && this.app.uiManager.updateHarmonyDisplay) {
            this.app.uiManager.updateHarmonyDisplay(this.selectedChannel);
        }
    }

    getState() {
        // Return current state for saving
        return {
            patterns: this.patterns,
            selectedChannel: this.selectedChannel
        };
    }

    loadState(state) {
        // Load saved state
        if (state.patterns) {
            this.patterns = state.patterns;
        }
        if (state.selectedChannel) {
            this.selectedChannel = state.selectedChannel;
        }
    }

    handleParameterChange(param, direction) {
        // Similar to LiveMode, handle parameter changes
        const currentValue = this.app.parameters[param];
        let newValue = currentValue;

        // Arrays of available values (from LiveMode)
        const availableTempos = [60, 80, 100, 120, 140, 160, 180, 200, 240];
        const availableGenres = ['soft', 'rock', 'bossa'];
        const availableKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const availableScales = ['major', 'minor', 'blues'];
        const availableLoopLengths = [4, 8, 16];

        switch (param) {
            case 'tempo':
                newValue = this.cycleValue(availableTempos, currentValue, direction === 'increase');
                break;
            case 'genre':
                newValue = this.cycleValue(availableGenres, currentValue, direction === 'next');
                break;
            case 'key':
                const oldKey = currentValue;
                newValue = this.cycleValue(availableKeys, currentValue, direction === 'next');
                if (newValue !== oldKey) {
                    this.transposePatterns(newValue);
                }
                break;
            case 'scale':
                newValue = this.cycleValue(availableScales, currentValue, direction === 'next');
                break;
            case 'loopLength':
                const oldLength = currentValue;
                newValue = this.cycleValue(availableLoopLengths, currentValue, direction === 'increase');
                if (newValue !== oldLength) {
                    this.adjustPatternLength(newValue);
                }
                break;
            case 'swing':
                newValue = !currentValue;
                break;
            case 'timeSignature':
                newValue = direction; // Direct value ('3/4' or '4/4')
                break;
        }

        if (newValue !== currentValue && newValue !== undefined) {
            this.app.updateParameter(param, newValue);

            // Show parameter change message
            let displayValue = newValue;
            if (param === 'tempo') {
                displayValue = `${newValue} BPM`;
            } else if (param === 'loopLength') {
                displayValue = `${newValue} bars`;
            } else if (param === 'swing') {
                displayValue = newValue ? 'ON' : 'OFF';
            }

            this.app.uiManager.showMessage(
                `${param}: ${displayValue}`,
                'info'
            );
        }
    }

    cycleValue(values, current, forward = true) {
        if (!Array.isArray(values) || values.length === 0) {
            return current;
        }

        const index = values.indexOf(current);
        if (index === -1) {
            return values[0];
        }

        const nextIndex = forward
            ? (index + 1) % values.length
            : (index - 1 + values.length) % values.length;

        return values[nextIndex];
    }

    handleVolumeChange(direction) {
        // Pass volume changes to the app
        this.app.handleVolumeChange(direction);
    }

    handleChannelToggle(channel) {
        // Pass channel toggles to the app
        this.app.toggleChannelMute(channel);
    }

    transposePatterns(newKey) {
        // Calculate semitone difference
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const oldIndex = noteNames.indexOf(this.app.parameters.key);
        const newIndex = noteNames.indexOf(newKey);
        const semitoneDiff = newIndex - oldIndex;
        const transposeRatio = Math.pow(2, semitoneDiff / 12);

        // Transpose all tonal patterns
        for (const channel of ['pulse1', 'pulse2', 'triangle']) {
            const pattern = this.patterns[channel];
            for (let i = 0; i < pattern.length; i++) {
                if (pattern[i] && pattern[i].frequency) {
                    pattern[i].frequency *= transposeRatio;
                    // Update note name (simplified - doesn't handle all edge cases)
                    if (pattern[i].note) {
                        const octave = pattern[i].note.slice(-1);
                        const note = pattern[i].note.slice(0, -1);
                        const noteIndex = noteNames.indexOf(note);
                        const newNoteIndex = (noteIndex + semitoneDiff + 12) % 12;
                        pattern[i].note = noteNames[newNoteIndex] + octave;
                    }
                }
            }
        }
    }

    adjustPatternLength(newLoopLength) {
        const newTotalSteps = newLoopLength * 16;
        const oldTotalSteps = this.patterns.pulse1.length;

        for (const channel of Object.keys(this.patterns)) {
            const oldPattern = this.patterns[channel];
            const newPattern = new Array(newTotalSteps).fill(null);

            // Copy existing pattern, repeating or truncating as needed
            for (let i = 0; i < newTotalSteps; i++) {
                newPattern[i] = oldPattern[i % oldTotalSteps];
            }

            this.patterns[channel] = newPattern;
        }
    }
}

module.exports = {
    HarmonyMode
};