// Enhanced Terminal UI with gradient flow visualization
const blessed = require('blessed');
const chalk = require('chalk');
const gradient = require('gradient-string');

class EnhancedUIManager {
    constructor(screen) {
        this.screen = screen;
        this.mode = 'live';
        this.boxes = {};
        this.harmonySelectedChannel = 1; // Track selected channel in H Mode

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
        // Create main container
        this.container = blessed.box({
            parent: this.screen,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
        });

        // Build UI sections
        this.createHeader();
        this.createParameterDisplay();
        this.createMusicFlow();
        this.createStatusBar();
        this.createControlHints();

        // Update displays with current values
        this.updateParameterDisplay();
        this.updateStatusDisplay();
        this.updateControlHints();

        // Start animations
        this.startFlowAnimation();

        // Force initial render
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
                type: 'line'
            },
            tags: true,
            align: 'center'
        });

        // Set header content directly
        this.boxes.header.setContent(
            '{center}{bold}{yellow-fg}CHIPTUNE GENERATOR{/yellow-fg}{/bold}{/center}\n' +
            '{center}🎵 Live Session Active 🎵{/center}'
        );
    }

    createParameterDisplay() {
        this.boxes.parameters = blessed.box({
            parent: this.container,
            top: 3,
            left: 0,
            width: '100%',
            height: 5,
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
            },
            tags: true,
            content: 'Loading parameters...'
        });

        this.updateParameterDisplay();
    }

    createMusicFlow() {
        this.boxes.musicFlow = blessed.box({
            parent: this.container,
            top: 8,
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
            top: 14,
            left: 0,
            width: '100%',
            height: 3,
            label: ' STATUS ',
            border: {
                type: 'line'
            },
            tags: true
        });
    }

    createControlHints() {
        this.boxes.controls = blessed.box({
            parent: this.container,
            bottom: 0,
            left: 0,
            width: '100%',
            height: 3,
            label: ' CONTROLS ',
            border: {
                type: 'line'
            },
            tags: true
        });
    }

    updateParameterDisplay() {
        const params = this.parameters;

        // Use the pastel colors from the palette
        let modeDisplay = 'LIVE';
        if (this.mode === 'harmony') {
            modeDisplay = this.insertMode ? 'INSERT' : 'H-MODE';
        } else if (this.mode === 'buffer') {
            modeDisplay = 'BUFFER';
        }

        const line1 = `  {#fab1a0-fg}Genre:{/#fab1a0-fg} {bold}{#74b9ff-fg}${params.genre}{/#74b9ff-fg}{/bold}  {#fab1a0-fg}Key:{/#fab1a0-fg} {bold}{#74b9ff-fg}${params.key} ${params.scale}{/#74b9ff-fg}{/bold}  {#fab1a0-fg}Tempo:{/#fab1a0-fg} {bold}{#74b9ff-fg}${params.tempo} BPM{/#74b9ff-fg}{/bold}  {#fab1a0-fg}Time:{/#fab1a0-fg} {bold}{#74b9ff-fg}${params.timeSignature}{/#74b9ff-fg}{/bold}`;
        let line2 = `  {#fab1a0-fg}Loop:{/#fab1a0-fg} {bold}{#74b9ff-fg}${params.loopLength} bars{/#74b9ff-fg}{/bold}  {#fab1a0-fg}Swing:{/#fab1a0-fg} {bold}{#74b9ff-fg}${params.swing ? 'ON' : 'OFF'}{/#74b9ff-fg}{/bold}  {#fab1a0-fg}Mode:{/#fab1a0-fg} {bold}{#00b894-fg}${modeDisplay}{/#00b894-fg}{/bold}`;

        // Add context-specific info
        if (this.mode === 'harmony') {
            const channelTypes = ['Lead', 'Harmony', 'Bass', 'Drums'];
            const selectedType = channelTypes[this.harmonySelectedChannel - 1];

            if (this.insertMode && this.queuedNote) {
                // Show queued note in insert mode
                line2 += `  {#a29bfe-fg}│{/#a29bfe-fg}  {#fab1a0-fg}Selected:{/#fab1a0-fg} {bold}{#ff6b9d-fg}Ch${this.harmonySelectedChannel}{/#ff6b9d-fg}{/bold}  {#a29bfe-fg}│{/#a29bfe-fg}  {#fab1a0-fg}Queued:{/#fab1a0-fg} {bold}{#00b894-fg}${this.queuedNote.name}{/#00b894-fg}{/bold}  {#a29bfe-fg}│{/#a29bfe-fg}  {#ff6b9d-fg}[P] Insert{/#ff6b9d-fg}`;
            } else {
                // Normal H mode display
                line2 += `  {#fab1a0-fg}Selected:{/#fab1a0-fg} {bold}{#ff6b9d-fg}Ch${this.harmonySelectedChannel} (${selectedType}){/#ff6b9d-fg}{/bold}`;
            }
        }

        if (this.boxes.parameters) {
            this.boxes.parameters.setContent(`\n${line1}\n${line2}\n`);
            // Force immediate render
            setImmediate(() => {
                if (this.screen) this.screen.render();
            });
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
        const content = `\n {green-fg}Buffer:{/} ${this.formatDuration(this.bufferDuration)} recording...    {white-fg}Session:{/} ${this.sessionTime}`;

        if (this.boxes.status) {
            this.boxes.status.setContent(content);
        }
    }

    updateControlHints() {
        let content = '';
        if (this.mode === 'live') {
            content = ` {magenta-fg}[{/magenta-fg}{green-fg}T{/green-fg}{magenta-fg}]{/magenta-fg} Tempo  {magenta-fg}[{/magenta-fg}{green-fg}G{/green-fg}{magenta-fg}]{/magenta-fg} Genre  {magenta-fg}[{/magenta-fg}{green-fg}K{/green-fg}{magenta-fg}]{/magenta-fg} Key  {magenta-fg}[{/magenta-fg}{green-fg}S{/green-fg}{magenta-fg}]{/magenta-fg} Scale  {magenta-fg}[{/magenta-fg}{green-fg}L{/green-fg}{magenta-fg}]{/magenta-fg} Loop  {magenta-fg}[{/magenta-fg}{green-fg}W{/green-fg}{magenta-fg}]{/magenta-fg} Swing\n` +
                  ` {magenta-fg}[{/magenta-fg}{green-fg}H{/green-fg}{magenta-fg}]{/magenta-fg} H-Mode  {magenta-fg}[{/magenta-fg}{green-fg}B{/green-fg}{magenta-fg}]{/magenta-fg} Buffer  {magenta-fg}[{/magenta-fg}{green-fg}Ctrl+S{/green-fg}{magenta-fg}]{/magenta-fg} Save  {magenta-fg}[{/magenta-fg}{green-fg}Ctrl+L{/green-fg}{magenta-fg}]{/magenta-fg} Load  {magenta-fg}[{/magenta-fg}{green-fg}Q{/green-fg}{magenta-fg}]{/magenta-fg} Quit`;
        } else if (this.mode === 'harmony') {
            if (this.insertMode) {
                // Insert mode controls
                content = ` {yellow-fg}INSERT MODE:{/yellow-fg}  {magenta-fg}[{/magenta-fg}{green-fg}[{/green-fg}{magenta-fg}]{/magenta-fg} {magenta-fg}[{/magenta-fg}{green-fg}]{/green-fg}{magenta-fg}]{/magenta-fg} {cyan-fg}Select Note{/cyan-fg}  {magenta-fg}[{/magenta-fg}{green-fg}P{/green-fg}{magenta-fg}]{/magenta-fg} {cyan-fg}Insert Note{/cyan-fg}  {magenta-fg}[{/magenta-fg}{green-fg}I{/green-fg}{magenta-fg}]{/magenta-fg} Exit Insert  {magenta-fg}[{/magenta-fg}{green-fg}Esc{/green-fg}{magenta-fg}]{/magenta-fg} Cancel\n` +
                      ` {magenta-fg}[{/magenta-fg}{green-fg}T{/green-fg}{magenta-fg}]{/magenta-fg} Tempo  {magenta-fg}[{/magenta-fg}{green-fg}K{/green-fg}{magenta-fg}]{/magenta-fg} Key  {magenta-fg}[{/magenta-fg}{green-fg}S{/green-fg}{magenta-fg}]{/magenta-fg} Scale  {magenta-fg}[{/magenta-fg}{green-fg}H{/green-fg}{magenta-fg}]{/magenta-fg} Exit H-Mode  {magenta-fg}[{/magenta-fg}{green-fg}Q{/green-fg}{magenta-fg}]{/magenta-fg} Quit`;
            } else {
                // Normal H mode controls
                content = ` {magenta-fg}[{/magenta-fg}{green-fg}[{/green-fg}{magenta-fg}]{/magenta-fg} {magenta-fg}[{/magenta-fg}{green-fg}]{/green-fg}{magenta-fg}]{/magenta-fg} Select Channel  {magenta-fg}[{/magenta-fg}{green-fg}P{/green-fg}{magenta-fg}]{/magenta-fg} Add Random  {magenta-fg}[{/magenta-fg}{green-fg}I{/green-fg}{magenta-fg}]{/magenta-fg} Insert Mode  {magenta-fg}[{/magenta-fg}{green-fg}T{/green-fg}{magenta-fg}]{/magenta-fg} Tempo\n` +
                      ` {magenta-fg}[{/magenta-fg}{green-fg}K{/green-fg}{magenta-fg}]{/magenta-fg} Key  {magenta-fg}[{/magenta-fg}{green-fg}S{/green-fg}{magenta-fg}]{/magenta-fg} Scale  {magenta-fg}[{/magenta-fg}{green-fg}H{/green-fg}{magenta-fg}]{/magenta-fg} Exit H-Mode  {magenta-fg}[{/magenta-fg}{green-fg}B{/green-fg}{magenta-fg}]{/magenta-fg} Buffer  {magenta-fg}[{/magenta-fg}{green-fg}Q{/green-fg}{magenta-fg}]{/magenta-fg} Quit`;
            }
        } else if (this.mode === 'buffer') {
            content = ` {magenta-fg}[{/magenta-fg}{green-fg}←/→{/green-fg}{magenta-fg}]{/magenta-fg} Seek  {magenta-fg}[{/magenta-fg}{green-fg}Space{/green-fg}{magenta-fg}]{/magenta-fg} Play  {magenta-fg}[{/magenta-fg}{green-fg}Enter{/green-fg}{magenta-fg}]{/magenta-fg} Mark  {magenta-fg}[{/magenta-fg}{green-fg}S{/green-fg}{magenta-fg}]{/magenta-fg} Save  {magenta-fg}[{/magenta-fg}{green-fg}ESC{/green-fg}{magenta-fg}]{/magenta-fg} Live  {magenta-fg}[{/magenta-fg}{green-fg}Q{/green-fg}{magenta-fg}]{/magenta-fg} Quit`;
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
            let content = '';
            const isSelected = this.mode === 'harmony' && this.harmonySelectedChannel === (channelIndex + 1);

            // Apply background highlight for selected channel in H Mode
            if (isSelected) {
                // Dark blue background with mint green channel name
                content = `${chalk.bgHex('#0f3460').hex('#00b894')(channelNames[channelIndex])} ${this.getFlowVisualizationWithPlayhead(channelIndex)}`;
                content += ` ${chalk.hex('#ff6b9d')('←')}`;  // Hot pink arrow
            } else {
                // Normal display for unselected channels
                content = `${chalk.hex(channelColors[channelIndex])(channelNames[channelIndex])} ${this.getFlowVisualizationWithPlayhead(channelIndex)}`;
            }

            this.boxes[`channel${channelIndex + 1}`].setContent(content);
        }
    }

    getFlowVisualizationWithPlayhead(channelIndex) {
        const buffer = this.flowBuffers[Object.keys(this.flowBuffers)[channelIndex]];
        const width = Math.min(60, this.termSize.width - 10);

        // Apply gradient coloring with playhead indicator
        let result = '';
        for (let i = 0; i < width; i++) {
            const char = buffer[i] || ' ';
            const colorIndex = Math.floor((i / width) * this.flowGradient.length);
            const color = this.flowGradient[colorIndex];

            // Show playhead caret at current position
            if (this.mode === 'harmony' && this.currentLoopPosition !== undefined) {
                const scaledPosition = Math.floor((this.currentLoopPosition / this.totalLoopSteps) * width);
                if (i === scaledPosition) {
                    // Show playhead with preview indicator
                    if (this.insertMode && this.harmonySelectedChannel === (channelIndex + 1)) {
                        result += chalk.hex('#00b894').bold('▼'); // Mint green caret for insert preview
                    } else {
                        result += chalk.hex('#fdcb6e').bold('▶'); // Yellow playhead
                    }
                } else {
                    result += chalk.hex(color)(char);
                }
            } else {
                result += chalk.hex(color)(char);
            }
        }

        return result;
    }

    updateHarmonyDisplay(selectedChannel, insertMode = false, queuedNote = null, currentStep = 0) {
        this.harmonySelectedChannel = selectedChannel;
        this.insertMode = insertMode;
        this.queuedNote = queuedNote;

        // Calculate current position for playhead
        const loopLength = this.parameters.loopLength || 8;
        this.totalLoopSteps = loopLength * 16; // 16 steps per bar
        this.currentLoopPosition = currentStep;

        // Update parameter display to show insert mode status
        this.updateParameterDisplay();

        // Update control hints for context-sensitive controls
        this.updateControlHints();

        // Trigger update for all channels to show/hide selection and playhead
        for (let i = 0; i < 4; i++) {
            this.updateChannelDisplay(i);
        }
        this.screen.render();
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
        this.parameters = { ...this.parameters, ...parameters };
        this.updateParameterDisplay();
        if (this.screen) {
            this.screen.render();
        }
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