// Enhanced Terminal UI with gradient flow visualization
const blessed = require('blessed');
const chalk = require('chalk');
const gradient = require('gradient-string');

class EnhancedUIManager {
    constructor(screen) {
        this.screen = screen;
        this.mode = 'live';
        this.boxes = {};

        // Pastel color palette from spec
        this.colorPalette = {
            // Background & Structure
            background: '#1a1a2e',
            border: '#16213e',
            panelBg: '#0f3460',

            // Text Colors
            title: '#ffeaa7',
            subtitle: '#fab1a0',
            text: '#ddd',
            muted: '#81ecec',

            // Parameter Display
            paramLabel: '#fab1a0',
            paramValue: '#74b9ff',
            paramActive: '#00b894',
            paramChanged: '#fdcb6e',

            // Status Indicators
            recording: '#00b894',
            warning: '#e17055',
            success: '#55a3ff',
            inactive: '#636e72',

            // Control Highlights
            keyHighlight: '#00b894',
            keyBracket: '#a29bfe',
            keyDesc: '#ddd'
        };

        // Gradient for music flow (7-stop)
        this.flowGradient = [
            '#ff6b9d',    // Hot pink (newest, rightmost)
            '#c44569',    // Rose
            '#8e44ad',    // Purple
            '#5f27cd',    // Deep purple
            '#0abde3',    // Cyan
            '#006ba6',    // Deep blue
            '#1e3799'     // Navy (oldest, leftmost)
        ];

        // Flow visualization state
        this.flowBuffers = {
            pulse1: new Array(60).fill(' '),
            pulse2: new Array(60).fill(' '),
            triangle: new Array(60).fill(' '),
            noise: new Array(60).fill(' ')
        };

        // Animation states
        this.animations = {
            startup: false,
            parameterChanges: {},
            flowPosition: 0
        };

        // Terminal size
        this.termSize = {
            width: process.stdout.columns || 80,
            height: process.stdout.rows || 24
        };

        // Parameters
        this.parameters = {
            genre: 'rock',
            key: 'C',
            scale: 'major',
            tempo: 120,
            timeSignature: '4/4',
            loopLength: 8,
            swing: false
        };

        this.bufferDuration = 0;
        this.sessionTime = new Date().toISOString().slice(0, 19).replace('T', '_');
    }

    initialize() {
        // Clear screen
        this.screen.clearRegion(0, this.termSize.width, 0, this.termSize.height);

        // Create main container with background
        this.container = blessed.box({
            parent: this.screen,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            style: {
                fg: this.colorPalette.text,
                bg: this.colorPalette.background
            }
        });

        // Build UI sections
        this.createHeader();
        this.createParameterDisplay();
        this.createMusicFlow();
        this.createStatusBar();
        this.createControlHints();

        // Start animations
        this.startFlowAnimation();
        this.playStartupAnimation();

        this.screen.render();
    }

    createHeader() {
        // Main header box
        this.boxes.header = blessed.box({
            parent: this.container,
            top: 0,
            left: 0,
            width: '100%',
            height: 3,
            border: {
                type: 'line',
                fg: this.colorPalette.border
            },
            style: {
                border: {
                    fg: this.colorPalette.border
                }
            }
        });

        // Title with gradient effect
        const titleText = 'CHIPTUNE GENERATOR';
        let titleGradient;
        try {
            const headerGradient = gradient(['#ff6b9d', '#8e44ad', '#0abde3']);
            titleGradient = headerGradient(titleText);
        } catch (e) {
            titleGradient = chalk.hex(this.colorPalette.title).bold(titleText);
        }

        // Title line
        this.boxes.headerTitle = blessed.text({
            parent: this.boxes.header,
            top: 0,
            left: 'center',
            content: titleGradient,
            tags: true,
            style: {
                fg: this.colorPalette.title,
                bold: true
            }
        });

        // Status line with animated emoji
        this.boxes.headerStatus = blessed.text({
            parent: this.boxes.header,
            top: 1,
            left: 'center',
            content: '🎵 Live Session Active 🎵',
            tags: true,
            style: {
                fg: this.colorPalette.subtitle
            }
        });
    }

    createParameterDisplay() {
        this.boxes.parameters = blessed.box({
            parent: this.container,
            top: 3,
            left: 0,
            width: '100%',
            height: 3,
            label: ' PARAMETERS ',
            border: {
                type: 'line',
                fg: this.colorPalette.border
            },
            style: {
                label: {
                    fg: this.colorPalette.subtitle,
                    bold: true
                }
            }
        });

        this.updateParameterDisplay();
    }

    createMusicFlow() {
        this.boxes.musicFlow = blessed.box({
            parent: this.container,
            top: 6,
            left: 0,
            width: '100%',
            height: 6,
            label: ' MUSIC FLOW ',
            border: {
                type: 'line',
                fg: this.colorPalette.border
            },
            style: {
                label: {
                    fg: this.colorPalette.subtitle,
                    bold: true
                }
            }
        });

        // Create channel displays
        const channelNames = ['Ch1', 'Ch2', 'Ch3', 'Ch4'];
        const channelColors = ['#ff6b9d', '#c44569', '#0abde3', '#8e44ad'];

        for (let i = 0; i < 4; i++) {
            this.boxes[`channel${i + 1}`] = blessed.text({
                parent: this.boxes.musicFlow,
                top: i + 1,
                left: 1,
                content: `${chalk.hex(channelColors[i])(channelNames[i])} ${this.getFlowVisualization(i)}`,
                tags: true
            });
        }
    }

    createStatusBar() {
        this.boxes.status = blessed.box({
            parent: this.container,
            top: 12,
            left: 0,
            width: '100%',
            height: 3,
            label: ' STATUS ',
            border: {
                type: 'line',
                fg: this.colorPalette.border
            },
            style: {
                label: {
                    fg: this.colorPalette.subtitle,
                    bold: true
                }
            }
        });

        this.updateStatusDisplay();
    }

    createControlHints() {
        this.boxes.controls = blessed.box({
            parent: this.container,
            bottom: 0,
            left: 0,
            width: '100%',
            height: 4,
            label: ' CONTROLS ',
            border: {
                type: 'line',
                fg: this.colorPalette.border
            },
            style: {
                label: {
                    fg: this.colorPalette.subtitle,
                    bold: true
                }
            }
        });

        this.updateControlHints();
    }

    updateParameterDisplay() {
        const params = this.parameters;

        // Format parameters with colors
        const genreText = this.formatParam('Genre', params.genre);
        const keyText = this.formatParam('Key', `${params.key} ${params.scale}`);
        const tempoText = this.formatParam('Tempo', `${params.tempo} BPM`);
        const timeText = this.formatParam('Time', params.timeSignature);
        const loopText = this.formatParam('Loop', `${params.loopLength} bars`);
        const swingText = this.formatParam('Swing', params.swing ? 'ON' : 'OFF');

        const line1 = `${genreText}  ${keyText}  ${tempoText}  ${timeText}`;
        const line2 = `${loopText}  ${swingText}  Mode: ${chalk.hex(this.colorPalette.paramActive)('LIVE')}`;

        if (this.boxes.parameters) {
            this.boxes.parameters.setContent(`\n ${line1}\n ${line2}`);
        }
    }

    formatParam(label, value) {
        const labelColor = chalk.hex(this.colorPalette.paramLabel);
        const valueColor = chalk.hex(this.colorPalette.paramValue).bold;

        // Check if this parameter was recently changed
        if (this.animations.parameterChanges[label.toLowerCase()]) {
            const changedColor = chalk.hex(this.colorPalette.paramChanged).bold;
            return `${labelColor(label)}: ${changedColor(value)}`;
        }

        return `${labelColor(label)}: ${valueColor(value)}`;
    }

    updateStatusDisplay() {
        const bufferText = chalk.hex(this.colorPalette.recording)(
            `Buffer: ${this.formatDuration(this.bufferDuration)} recording...`
        );
        const sessionText = chalk.hex(this.colorPalette.text)(
            `Session: ${this.sessionTime}`
        );

        if (this.boxes.status) {
            this.boxes.status.setContent(`\n ${bufferText}    ${sessionText}`);
        }
    }

    updateControlHints() {
        const keyStyle = (key) => {
            const bracket = chalk.hex(this.colorPalette.keyBracket)('[');
            const keyLetter = chalk.hex(this.colorPalette.keyHighlight).bold(key);
            const closeBracket = chalk.hex(this.colorPalette.keyBracket)(']');
            return `${bracket}${keyLetter}${closeBracket}`;
        };

        const descStyle = (desc) => chalk.hex(this.colorPalette.keyDesc)(desc);

        let content = '';
        if (this.mode === 'live') {
            const line1 = [
                `${keyStyle('T')} ${descStyle('Tempo')}`,
                `${keyStyle('G')} ${descStyle('Genre')}`,
                `${keyStyle('K')} ${descStyle('Key')}`,
                `${keyStyle('S')} ${descStyle('Scale')}`,
                `${keyStyle('L')} ${descStyle('Loop')}`,
                `${keyStyle('W')} ${descStyle('Swing')}`
            ].join('  ');

            const line2 = [
                `${keyStyle('3')}${keyStyle('4')} ${descStyle('Time')}`,
                `${keyStyle('B')} ${descStyle('Buffer')}`,
                `${keyStyle('Ctrl+S')} ${descStyle('Save')}`,
                `${keyStyle('Ctrl+L')} ${descStyle('Load')}`,
                `${keyStyle('Q')} ${descStyle('Quit')}`
            ].join('  ');

            content = ` ${line1}\n ${line2}`;
        }

        if (this.boxes.controls) {
            this.boxes.controls.setContent(content);
        }
    }

    getFlowVisualization(channelIndex) {
        const buffer = this.flowBuffers[Object.keys(this.flowBuffers)[channelIndex]];
        const width = Math.min(60, this.termSize.width - 10);

        // Apply gradient coloring
        let result = '';
        for (let i = 0; i < width; i++) {
            const colorIndex = Math.floor((i / width) * this.flowGradient.length);
            const color = this.flowGradient[colorIndex];
            const char = buffer[i] || ' ';
            result += chalk.hex(color)(char);
        }

        return result;
    }

    updateChannelVisualization(channelId, data) {
        const channelMap = {
            'pulse1': 0,
            'pulse2': 1,
            'triangle': 2,
            'noise': 3
        };

        const channelIndex = channelMap[channelId];
        if (channelIndex === undefined) return;

        // Generate character based on activity
        let char = ' ';
        if (data && data.active) {
            switch (channelId) {
                case 'pulse1':
                case 'pulse2':
                    char = data.velocity > 70 ? '∿' : '~';
                    break;
                case 'triangle':
                    char = data.velocity > 80 ? '▄' : data.velocity > 60 ? '▃' : '▂';
                    break;
                case 'noise':
                    char = data.type === 'kick' ? '▌' : data.type === 'snare' ? '▒' : '░';
                    break;
            }
        }

        // Shift buffer and add new character
        const buffer = this.flowBuffers[channelId];
        buffer.shift();
        buffer.push(char);

        // Update display
        this.updateChannelDisplay(channelIndex);
    }

    updateChannelDisplay(channelIndex) {
        const channelNames = ['Ch1', 'Ch2', 'Ch3', 'Ch4'];
        const channelColors = ['#ff6b9d', '#c44569', '#0abde3', '#8e44ad'];
        const channelId = Object.keys(this.flowBuffers)[channelIndex];

        if (this.boxes[`channel${channelIndex + 1}`]) {
            const content = `${chalk.hex(channelColors[channelIndex])(channelNames[channelIndex])} ${this.getFlowVisualization(channelIndex)}`;
            this.boxes[`channel${channelIndex + 1}`].setContent(content);
        }
    }

    startFlowAnimation() {
        // Animate flow movement
        setInterval(() => {
            this.animations.flowPosition++;

            // Update all channel displays with flow animation
            for (let i = 0; i < 4; i++) {
                this.updateChannelDisplay(i);
            }

            this.screen.render();
        }, 100); // Update every 100ms
    }

    playStartupAnimation() {
        this.animations.startup = true;

        // Fade in effect for each section
        const sections = ['header', 'parameters', 'musicFlow', 'status', 'controls'];
        sections.forEach((section, index) => {
            setTimeout(() => {
                if (this.boxes[section]) {
                    this.boxes[section].show();
                    this.screen.render();
                }
            }, index * 200);
        });

        setTimeout(() => {
            this.animations.startup = false;
        }, 2000);
    }

    onParameterChange(param, value) {
        // Trigger parameter change animation
        this.animations.parameterChanges[param] = true;

        // Update display
        this.updateParameterDisplay();
        this.screen.render();

        // Clear animation after 3 seconds
        setTimeout(() => {
            delete this.animations.parameterChanges[param];
            this.updateParameterDisplay();
            this.screen.render();
        }, 3000);
    }

    updateParameters(parameters) {
        this.parameters = parameters;
        this.updateParameterDisplay();
        this.screen.render();
    }

    updateBufferDuration(seconds) {
        this.bufferDuration = seconds;
        this.updateStatusDisplay();
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}m:${secs.toString().padStart(2, '0')}s`;
    }

    showMessage(message, type = 'info') {
        // Non-intrusive status message (already implemented as status line)
        if (this.boxes.statusLine) {
            const colors = {
                info: this.colorPalette.success,
                success: this.colorPalette.recording,
                warning: this.colorPalette.warning,
                error: this.colorPalette.warning
            };

            const color = colors[type] || this.colorPalette.text;
            const timestamp = new Date().toLocaleTimeString();
            const formattedMessage = chalk.hex(color)(`[${timestamp}] ${message}`);

            this.boxes.statusLine.setContent(formattedMessage);
            this.screen.render();

            // Clear after 3 seconds
            clearTimeout(this.statusTimeout);
            this.statusTimeout = setTimeout(() => {
                if (this.boxes.statusLine) {
                    this.boxes.statusLine.setContent('');
                    this.screen.render();
                }
            }, 3000);
        }
    }

    setMode(mode) {
        this.mode = mode;

        // Update header status
        if (this.boxes.headerStatus) {
            const statusText = mode === 'live'
                ? '🎵 Live Session Active 🎵'
                : '⏯️ Buffer Playback Mode ⏯️';
            this.boxes.headerStatus.setContent(statusText);
        }

        this.updateControlHints();
        this.screen.render();
    }

    destroy() {
        Object.values(this.boxes).forEach(box => {
            if (box && box.destroy) {
                box.destroy();
            }
        });
    }
}

module.exports = {
    EnhancedUIManager
};