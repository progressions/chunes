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

        // I Mode (Insert Note mode) state
        this.insertMode = false;
        this.availableNotes = [];
        this.selectedNoteIndex = 0;
        this.queuedNote = null;

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

        // Create a continuous drone pattern - every step has the root note
        // This matches the spec: "Each channel starts with root note as monochromatic pulse"
        for (let i = 0; i < totalSteps; i++) {
            pattern[i] = {
                frequency: rootFreq,
                note: this.app.parameters.key + '4',
                velocity: 70,
                duration: 0.25 // Short duration for each step to create a pulsing effect
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

        // Store previous patterns if any (for persistence)
        this.previousPatterns = this.patterns ? { ...this.patterns } : null;

        // Initialize patterns with current parameters
        this.initializePatterns();

        // Reset timing
        this.currentStep = 0;
        this.lastStepTime = Date.now() / 1000;

        // Implement smooth transition (500ms fade as per spec)
        this.transitionTime = 0.5; // 500ms
        this.transitionStartTime = Date.now() / 1000;

        // Set up key handlers
        this.setupKeyHandlers();

        // Update UI
        this.app.uiManager.setMode('harmony');
        this.updateDisplay();
    }

    deactivate() {
        this.isActive = false;

        // Store patterns for persistence
        this.storedPatterns = { ...this.patterns };
        this.storedSelectedChannel = this.selectedChannel;

        // Clean up key handlers
        this.cleanupKeyHandlers();

        // Notify app that patterns should be preserved
        if (this.app.preserveHarmonyPatterns) {
            this.app.preserveHarmonyPatterns(this.storedPatterns);
        }
    }

    setupKeyHandlers() {
        // Context-sensitive [ and ] keys
        this.app.screen.key('[', () => {
            if (this.insertMode) {
                this.selectPreviousNote();
            } else {
                this.selectPreviousChannel();
            }
        });

        this.app.screen.key(']', () => {
            if (this.insertMode) {
                this.selectNextNote();
            } else {
                this.selectNextChannel();
            }
        });

        // P key behavior changes based on mode
        this.app.screen.key(['p', 'P'], () => {
            if (this.insertMode) {
                this.insertQueuedNote();
            } else {
                this.addRandomNote();
            }
        });

        // I key toggles Insert Mode
        this.app.screen.key(['i', 'I'], () => this.toggleInsertMode());

        // Escape key exits Insert Mode
        this.app.screen.key('escape', () => {
            if (this.insertMode) {
                this.exitInsertMode();
            }
        });

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
        this.app.screen.unkey(['i', 'I']);
        this.app.screen.unkey('escape');

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
        // Add note at CURRENT position, not quantized - as per spec:
        // "Note added at whatever beat position is currently playing"
        const currentPosition = this.currentStep;

        // Get weighted random scale note
        const randomNote = this.getWeightedScaleNote();

        // Add to selected channel pattern
        const channelId = this.channelMap[this.selectedChannel];

        if (channelId === 'noise') {
            // For noise channel, add drum hit
            this.patterns[channelId][currentPosition] = {
                trigger: true,
                type: Math.random() > 0.5 ? 'kick' : 'snare',
                duration: 0.2,
                velocity: 80 + Math.random() * 20,
                period: Math.random() > 0.5 ? 15 : 4
            };
        } else {
            // For tonal channels, replace the drone with a new note
            this.patterns[channelId][currentPosition] = {
                frequency: randomNote.frequency,
                note: randomNote.name,
                velocity: 60 + Math.random() * 30,
                duration: 0.5 // Half a beat for staccato quarter notes
            };
        }

        this.app.uiManager.showMessage(
            `Added ${channelId === 'noise' ? 'drum' : randomNote.name} at position ${currentPosition}`,
            'success'
        );
    }

    getQuantizedStep() {
        // Quantize to nearest beat (every 4 steps = 1 beat)
        const nearestBeat = Math.round(this.currentStep / 4) * 4;
        const totalSteps = this.app.parameters.loopLength * 16;
        return nearestBeat % totalSteps;
    }

    getWeightedScaleNote() {
        // Implement weighted note selection as per spec
        const scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            blues: [0, 3, 5, 6, 7, 10]
        };

        const scale = scales[this.app.parameters.scale] || scales.major;
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

        // Weighted selection based on harmonic function
        const weightedIndices = [];

        // Root (30% weight)
        for (let i = 0; i < 30; i++) weightedIndices.push(0);

        // Third (25% weight) - index 2 in scale
        if (scale.length > 2) {
            for (let i = 0; i < 25; i++) weightedIndices.push(2);
        }

        // Fifth (25% weight) - index 4 in scale
        if (scale.length > 4) {
            for (let i = 0; i < 25; i++) weightedIndices.push(4);
        }

        // Seventh (15% weight) - index 6 in scale
        if (scale.length > 6) {
            for (let i = 0; i < 15; i++) weightedIndices.push(6);
        }

        // Other scale tones (5% weight each)
        for (let i = 1; i < scale.length; i++) {
            if (i !== 2 && i !== 4 && i !== 6) {
                for (let j = 0; j < 5; j++) weightedIndices.push(i);
            }
        }

        // Select from weighted indices
        const selectedIndex = weightedIndices[Math.floor(Math.random() * weightedIndices.length)];
        const semitoneOffset = scale[selectedIndex];

        // Random octave selection
        const octaveOffset = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1

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

            // Update display to show current playhead position
            this.updateDisplay();

            // Send pattern visualization data to UI
            this.sendPatternVisualization();

            return events;
        }

        return null;
    }

    sendPatternVisualization() {
        // Send the current patterns to the UI for visualization
        if (this.app.uiManager && this.app.uiManager.updatePatternVisualization) {
            this.app.uiManager.updatePatternVisualization(this.patterns, this.currentStep);
        }
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

        // Apply transition fade if within transition period
        let volumeMultiplier = 1.0;
        if (this.transitionStartTime) {
            const elapsed = (Date.now() / 1000) - this.transitionStartTime;
            if (elapsed < this.transitionTime) {
                // Fade in during transition
                volumeMultiplier = elapsed / this.transitionTime;
            }
        }

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
                        velocity: note.velocity * volumeMultiplier,
                        period: note.period
                    };
                } else if (channel !== 'noise' && note.frequency) {
                    // Note event - duration is in beats, convert to seconds
                    // 1 beat = 1 quarter note = 4 steps * stepTime
                    events[channel] = {
                        frequency: note.frequency,
                        note: note.note,
                        duration: stepTime * 4 * note.duration, // Convert beats to seconds
                        velocity: note.velocity * volumeMultiplier
                    };
                }
            }
        }

        return events;
    }

    toggleInsertMode() {
        if (this.insertMode) {
            this.exitInsertMode();
        } else {
            this.enterInsertMode();
        }
    }

    enterInsertMode() {
        this.insertMode = true;

        // Generate available notes for current scale
        this.generateAvailableNotes();

        // Start at root note in middle octave
        this.selectedNoteIndex = this.findRootNoteIndex(4);
        this.queuedNote = this.availableNotes[this.selectedNoteIndex];

        this.app.uiManager.showMessage(
            'Insert Mode: Use [ ] to select note, P to insert, I or Esc to exit',
            'info'
        );

        this.updateDisplay();
    }

    exitInsertMode() {
        this.insertMode = false;
        this.queuedNote = null;

        this.app.uiManager.showMessage(
            'Exited Insert Mode',
            'info'
        );

        this.updateDisplay();
    }

    generateAvailableNotes() {
        const scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            blues: [0, 3, 5, 6, 7, 10]
        };

        const scale = scales[this.app.parameters.scale] || scales.major;
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const keyIndex = noteNames.indexOf(this.app.parameters.key);

        this.availableNotes = [];

        // Generate notes across octaves 2-6
        for (let octave = 2; octave <= 6; octave++) {
            scale.forEach(interval => {
                const noteIndex = (keyIndex + interval) % 12;
                const noteName = noteNames[noteIndex];
                const frequency = this.getFrequencyForNote(noteName, octave);

                this.availableNotes.push({
                    name: noteName + octave,
                    noteName: noteName,
                    octave: octave,
                    frequency: frequency,
                    interval: interval
                });
            });
        }
    }

    getFrequencyForNote(noteName, octave) {
        const noteFrequencies = {
            'C': 16.35,
            'C#': 17.32,
            'D': 18.35,
            'D#': 19.45,
            'E': 20.60,
            'F': 21.83,
            'F#': 23.12,
            'G': 24.50,
            'G#': 25.96,
            'A': 27.50,
            'A#': 29.14,
            'B': 30.87
        };

        // Base frequencies are for octave 0, multiply by 2 for each octave
        return noteFrequencies[noteName] * Math.pow(2, octave);
    }

    findRootNoteIndex(preferredOctave) {
        // Find the root note (interval 0) at the preferred octave
        const index = this.availableNotes.findIndex(note =>
            note.interval === 0 && note.octave === preferredOctave
        );

        // Fallback to any root note if preferred octave not found
        return index >= 0 ? index : this.availableNotes.findIndex(note => note.interval === 0);
    }

    selectPreviousNote() {
        if (this.selectedNoteIndex > 0) {
            this.selectedNoteIndex--;
            this.queuedNote = this.availableNotes[this.selectedNoteIndex];

            this.app.uiManager.showMessage(
                `Selected: ${this.queuedNote.name}`,
                'info'
            );

            this.updateDisplay();
        }
    }

    selectNextNote() {
        if (this.selectedNoteIndex < this.availableNotes.length - 1) {
            this.selectedNoteIndex++;
            this.queuedNote = this.availableNotes[this.selectedNoteIndex];

            this.app.uiManager.showMessage(
                `Selected: ${this.queuedNote.name}`,
                'info'
            );

            this.updateDisplay();
        }
    }

    insertQueuedNote() {
        if (!this.queuedNote) return;

        // Insert note at current position
        const channelId = this.channelMap[this.selectedChannel];

        if (channelId === 'noise') {
            // For noise channel, add drum hit
            this.patterns[channelId][this.currentStep] = {
                trigger: true,
                type: Math.random() > 0.5 ? 'kick' : 'snare',
                duration: 0.2,
                velocity: 80 + Math.random() * 20,
                period: Math.random() > 0.5 ? 15 : 4
            };
        } else {
            // For tonal channels, insert the queued note
            this.patterns[channelId][this.currentStep] = {
                frequency: this.queuedNote.frequency,
                note: this.queuedNote.name,
                velocity: 70 + Math.random() * 20,
                duration: 0.5 // Half a beat for staccato notes
            };
        }

        this.app.uiManager.showMessage(
            `Inserted ${this.queuedNote.name} at position ${this.currentStep}`,
            'success'
        );

        // Stay in insert mode after adding note
    }

    updateDisplay() {
        // This will be called to update channel selection indicator
        if (this.app.uiManager && this.app.uiManager.updateHarmonyDisplay) {
            this.app.uiManager.updateHarmonyDisplay(this.selectedChannel, this.insertMode, this.queuedNote, this.currentStep);
        }

        // Also send pattern data for visualization
        this.sendPatternVisualization();
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

    // Method to restore patterns when re-entering H Mode
    restorePatterns(patterns) {
        if (patterns) {
            this.patterns = patterns;
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
                // Don't transpose patterns when key changes - per user requirement
                // Only regenerate available notes if in insert mode
                if (newValue !== oldKey && this.insertMode) {
                    this.generateAvailableNotes();
                    // Try to find similar note in new scale
                    this.selectedNoteIndex = Math.min(this.selectedNoteIndex, this.availableNotes.length - 1);
                    this.queuedNote = this.availableNotes[this.selectedNoteIndex];
                }
                break;
            case 'scale':
                const oldScale = currentValue;
                newValue = this.cycleValue(availableScales, currentValue, direction === 'next');
                // Regenerate available notes if scale changes and we're in insert mode
                if (newValue !== oldScale && this.insertMode) {
                    this.generateAvailableNotes();
                    // Try to maintain position in list
                    this.selectedNoteIndex = Math.min(this.selectedNoteIndex, this.availableNotes.length - 1);
                    this.queuedNote = this.availableNotes[this.selectedNoteIndex];
                }
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

            // Update display to show changes
            this.updateDisplay();
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