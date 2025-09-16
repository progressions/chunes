#!/usr/bin/env node

const blessed = require('blessed');
const { ContinuousAudioPlayer } = require('./audio/continuousPlayer');
const { ProceduralGenerator } = require('./music/proceduralGenerator');
const { EnhancedUIManager } = require('./ui/enhancedDisplay');
const { ControlHandler } = require('./ui/controls');
const { LiveMode } = require('./modes/live');
const { BufferMode } = require('./modes/buffer');
const { HarmonyMode } = require('./modes/harmony');
const { BufferManager } = require('./export/buffer');
const { SessionManager } = require('./export/session');
const chalk = require('chalk');

class ChiptuneGenerator {
    constructor() {
        this.currentMode = 'live';
        this.isRunning = false;

        // Initialize all subsystems
        this.audioPlayer = new ContinuousAudioPlayer();
        this.musicGenerator = new ProceduralGenerator();
        this.bufferManager = new BufferManager();
        this.sessionManager = new SessionManager();

        // Initialize UI
        this.screen = blessed.screen({
            smartCSR: true,
            fullUnicode: true,
            title: 'Chiptune Generator'
        });

        this.uiManager = new EnhancedUIManager(this.screen);
        this.controlHandler = new ControlHandler(this.screen);

        // Initialize modes
        this.liveMode = new LiveMode(this);
        this.bufferMode = new BufferMode(this);
        this.harmonyMode = new HarmonyMode(this);

        // Current parameters
        this.parameters = {
            genre: 'rock',
            key: 'C',
            scale: 'major',
            timeSignature: '4/4',
            tempo: 120,
            swing: false,
            loopLength: 8
        };

        // Bind controls
        this.setupControls();
    }

    async start() {
        console.log(chalk.cyan('🎵 Starting Chiptune Generator...'));

        try {
            // Restore previous session if exists
            await this.sessionManager.restoreSession(this);

            // Start audio player
            await this.audioPlayer.initialize();
            console.log('Audio initialized');

            // Initialize music generator with default parameters
            this.musicGenerator.setGenre(this.parameters.genre);
            this.musicGenerator.setKey(this.parameters.key);
            this.musicGenerator.setScale(this.parameters.scale);
            this.musicGenerator.setTempo(this.parameters.tempo);
            this.musicGenerator.setLoopLength(this.parameters.loopLength);

            // Start buffer recording
            this.bufferManager.startRecording();

            // Initialize UI
            this.uiManager.initialize();
            this.uiManager.setMode('live');
            this.uiManager.updateParameters(this.parameters);

            // Start live mode
            this.liveMode.activate();

            // Start main loop
            this.isRunning = true;

            // Play music immediately
            const rootFreq = this.musicGenerator.keyFrequencies[this.musicGenerator.key];

            // Start all channels immediately
            this.audioPlayer.playNote('pulse1', rootFreq * 2, 0.5);
            this.audioPlayer.playNote('pulse2', rootFreq * 1.5, 0.5);
            this.audioPlayer.playNote('triangle', rootFreq / 2, 0.5);
            this.audioPlayer.playNote('noise', 0, 0.1);

            this.mainLoop();

            // Render screen
            this.screen.render();

        } catch (error) {
            console.error(chalk.red('Failed to start:', error.message));
            process.exit(1);
        }
    }

    mainLoop() {
        if (!this.isRunning) return;

        try {
            // Check for musical events based on current mode
            let events = null;

            if (this.currentMode === 'harmony') {
                // In H Mode, get events from harmony patterns
                events = this.harmonyMode.update();
            } else if (this.currentMode === 'live') {
                // In Live Mode, get events from procedural generator
                events = this.musicGenerator.update();
            }
            // Buffer mode doesn't generate new events, it plays recorded ones

            if (events) {
                // Play notes on channels
                if (events.pulse1) {
                    this.audioPlayer.playNote('pulse1', events.pulse1.frequency, events.pulse1.duration);
                    this.uiManager.updateChannelVisualization('pulse1', {
                        active: true,
                        velocity: events.pulse1.velocity,
                        note: events.pulse1.note
                    });
                }
                if (events.pulse2) {
                    this.audioPlayer.playNote('pulse2', events.pulse2.frequency, events.pulse2.duration);
                    this.uiManager.updateChannelVisualization('pulse2', {
                        active: true,
                        velocity: events.pulse2.velocity,
                        note: events.pulse2.note
                    });
                }
                if (events.triangle) {
                    this.audioPlayer.playNote('triangle', events.triangle.frequency, events.triangle.duration);
                    this.uiManager.updateChannelVisualization('triangle', {
                        active: true,
                        velocity: events.triangle.velocity,
                        note: events.triangle.note
                    });
                }
                if (events.noise && events.noise.trigger) {
                    this.audioPlayer.playNote('noise', 0, events.noise.duration);
                    this.uiManager.updateChannelVisualization('noise', {
                        active: true,
                        type: events.noise.type,
                        velocity: events.noise.velocity
                    });
                }
            }

            // Update UI periodically
            if (Date.now() % 100 < 20) {
                this.uiManager.updateBufferDuration(this.bufferManager.getDuration());
            }

        } catch (error) {
            console.error('Main loop error:', error);
        }

        // Schedule next iteration for music timing
        // Use a shorter interval for better timing accuracy
        setTimeout(() => this.mainLoop(), 10);
    }

    setupControls() {
        // Quit controls
        this.screen.key(['q', 'C-c'], () => {
            this.shutdown();
        });

        // Mode switching
        this.screen.key('b', () => {
            this.switchMode('buffer');
        });

        // H Mode toggle
        this.screen.key(['h', 'H'], () => {
            this.toggleHarmonyMode();
        });

        this.screen.key(['escape'], () => {
            if (this.currentMode === 'buffer') {
                this.switchMode('live');
            } else if (this.currentMode === 'harmony') {
                this.switchMode('live');
            }
        });

        // Parameter controls are handled by the active mode directly
        // The mode will set up its own listeners in activate()
    }

    toggleHarmonyMode() {
        if (this.currentMode === 'harmony') {
            // Exit H Mode back to Live Mode
            this.switchMode('live');
            this.uiManager.showMessage('Exited H Mode - Returning to Live Mode', 'info');
        } else {
            // Enter H Mode from any other mode
            this.switchMode('harmony');
            this.uiManager.showMessage('Entered H Mode - Building Harmony', 'success');
        }
    }

    switchMode(mode) {
        if (mode === this.currentMode) return;

        // Deactivate current mode
        if (this.currentMode === 'live') {
            this.liveMode.deactivate();
        } else if (this.currentMode === 'buffer') {
            this.bufferMode.deactivate();
        } else if (this.currentMode === 'harmony') {
            this.harmonyMode.deactivate();
        }

        // Switch mode
        this.currentMode = mode;
        this.uiManager.setMode(mode);

        // Activate new mode
        if (mode === 'live') {
            this.liveMode.activate();
        } else if (mode === 'buffer') {
            this.bufferMode.activate();
        } else if (mode === 'harmony') {
            this.harmonyMode.activate();
        }

        this.screen.render();
    }

    updateParameter(param, value) {
        this.parameters[param] = value;
        this.uiManager.updateParameters(this.parameters);

        // Update music generator
        if (this.musicGenerator) {
            switch (param) {
                case 'tempo':
                    this.musicGenerator.setTempo(value);
                    break;
                case 'genre':
                    this.musicGenerator.setGenre(value);
                    break;
                case 'key':
                    this.musicGenerator.setKey(value);
                    break;
                case 'scale':
                    this.musicGenerator.setScale(value);
                    break;
                case 'loopLength':
                    this.musicGenerator.setLoopLength(value);
                    break;
                case 'swing':
                    this.musicGenerator.setSwing(value);
                    break;
                case 'timeSignature':
                    this.musicGenerator.setTimeSignature(value);
                    break;
            }
        }

        // Force immediate screen render for responsive feedback
        this.screen.render();
    }


    async shutdown() {
        console.log(chalk.yellow('🛑 Shutting down...'));

        this.isRunning = false;

        // Save current session
        await this.sessionManager.saveSession(this);

        // Stop audio
        this.audioPlayer.stop();

        // Stop recording
        this.bufferManager.stopRecording();

        // Exit
        process.exit(0);
    }
}

// Start the application
const app = new ChiptuneGenerator();
app.start();