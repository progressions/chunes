#!/usr/bin/env node

const blessed = require('blessed');
const { AudioEngine } = require('./audio/player');
const { MusicGenerator } = require('./music/generator');
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
        this.audioEngine = new AudioEngine();
        this.musicGenerator = new MusicGenerator();
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

            // Start audio engine
            await this.audioEngine.initialize();

            // Play a simple test tone to prime the audio
            this.playTestTone();

            // Start music generation
            this.musicGenerator.start(this.parameters);

            // Start buffer recording
            this.bufferManager.startRecording();

            // Initialize UI
            this.uiManager.initialize();
            this.uiManager.setMode('live');

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
            // Generate continuous audio chunks
            const audioData = this.audioEngine.generateChunk();

            // Play the audio
            this.audioEngine.play(audioData);

            // Record to buffer
            this.bufferManager.record(audioData, this.parameters);

            // Update UI visualizations periodically
            if (Date.now() % 100 < 20) {
                this.uiManager.updateVisualization(audioData);
                this.uiManager.updateBufferDuration(this.bufferManager.getDuration());
            }

        } catch (error) {
            console.error('Main loop error:', error);
        }

        // Schedule next iteration more frequently for continuous audio
        setImmediate(() => this.mainLoop());
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
            this.updateParameter(param, value);
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
        this.musicGenerator.updateParameters(this.parameters);
        this.uiManager.updateParameters(this.parameters);
    }

    playTestTone() {
        // Play a simple 440Hz test tone to initialize audio
        const testData = new Float32Array(2048);
        for (let i = 0; i < testData.length; i++) {
            testData[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.1;
        }
        this.audioEngine.play(testData);
    }

    async shutdown() {
        console.log(chalk.yellow('🛑 Shutting down...'));

        this.isRunning = false;

        // Save current session
        await this.sessionManager.saveSession(this);

        // Stop audio
        this.audioEngine.stop();

        // Stop recording
        this.bufferManager.stopRecording();

        // Exit
        process.exit(0);
    }
}

// Start the application
const app = new ChiptuneGenerator();
app.start();