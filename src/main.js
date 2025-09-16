#!/usr/bin/env node

const blessed = require('blessed');
const { ImprovedAudioPlayer } = require('./audio/improvedPlayer');
const { ProceduralGenerator } = require('./music/proceduralGenerator');
const { UIManager } = require('./ui/display');
const { ControlHandler } = require('./ui/controls');
const { LiveMode } = require('./modes/live');
const { BufferMode } = require('./modes/buffer');
const { BufferManager } = require('./export/buffer');
const { SessionManager } = require('./export/session');
const chalk = require('chalk');

class ChiptuneGenerator {
    constructor() {
        this.currentMode = 'live';
        this.isRunning = false;

        // Initialize all subsystems
        this.audioPlayer = new ImprovedAudioPlayer();
        this.musicGenerator = new ProceduralGenerator();
        this.bufferManager = new BufferManager();
        this.sessionManager = new SessionManager();

        // Initialize UI
        this.screen = blessed.screen({
            smartCSR: true,
            fullUnicode: true,
            title: 'Chiptune Generator'
        });

        this.uiManager = new UIManager(this.screen);
        this.controlHandler = new ControlHandler(this.screen);

        // Initialize modes
        this.liveMode = new LiveMode(this);
        this.bufferMode = new BufferMode(this);

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
            // Check for musical events
            const events = this.musicGenerator.update();

            if (events) {
                // Play notes on channels
                if (events.pulse1) {
                    this.audioPlayer.playNote('pulse1', events.pulse1.frequency, events.pulse1.duration);
                }
                if (events.pulse2) {
                    this.audioPlayer.playNote('pulse2', events.pulse2.frequency, events.pulse2.duration);
                }
                if (events.triangle) {
                    this.audioPlayer.playNote('triangle', events.triangle.frequency, events.triangle.duration);
                }
                if (events.noise && events.noise.trigger) {
                    this.audioPlayer.playNote('noise', 0, events.noise.duration);
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

        this.screen.key(['escape'], () => {
            if (this.currentMode === 'buffer') {
                this.switchMode('live');
            }
        });

        // Parameter controls (delegated to current mode)
        this.controlHandler.on('parameterChange', (param, value) => {
            // Let the active mode handle parameter changes
            if (this.currentMode === 'live' && this.liveMode) {
                this.liveMode.handleParameterChange(param, value);
            }
        });
    }

    switchMode(mode) {
        if (mode === this.currentMode) return;

        // Deactivate current mode
        if (this.currentMode === 'live') {
            this.liveMode.deactivate();
        } else if (this.currentMode === 'buffer') {
            this.bufferMode.deactivate();
        }

        // Switch mode
        this.currentMode = mode;
        this.uiManager.setMode(mode);

        // Activate new mode
        if (mode === 'live') {
            this.liveMode.activate();
        } else if (mode === 'buffer') {
            this.bufferMode.activate();
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