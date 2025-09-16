// Clean terminal UI without corruption
const blessed = require('blessed');
const chalk = require('chalk');

class CleanUIManager {
    constructor(screen) {
        this.screen = screen;
        this.mode = 'live';
        this.boxes = {};

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

        // Pastel color palette from spec
        this.colorPalette = {
            background: '#1a1a2e',
            border: '#16213e',
            title: '#ffeaa7',
            subtitle: '#fab1a0',
            paramLabel: '#fab1a0',
            paramValue: '#74b9ff',
            recording: '#00b894',
            warning: '#e17055',
            success: '#55a3ff'
        };

        // 7-stop gradient for music flow
        this.flowGradient = [
            '#ff6b9d',    // Hot pink (newest)
            '#c44569',    // Rose
            '#8e44ad',    // Purple
            '#5f27cd',    // Deep purple
            '#0abde3',    // Cyan
            '#006ba6',    // Deep blue
            '#1e3799'     // Navy (oldest)
        ];

        // Flow visualization buffers
        this.flowBuffers = {
            pulse1: new Array(60).fill(' '),
            pulse2: new Array(60).fill(' '),
            triangle: new Array(60).fill(' '),
            noise: new Array(60).fill(' ')
        };
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

        // Build UI sections with fixed positions
        this.createHeader();
        this.createParameterDisplay();
        this.createMusicFlow();
        this.createStatusBar();
        this.createControlHints();

        // Initial render
        this.screen.render();
    }

    createHeader() {
        this.boxes.header = blessed.box({
            parent: this.container,
            top: 0,
            left: 0,
            width: '100%',
            height: 3,
            border: { type: 'line' },
            tags: true,
            align: 'center',
            content: `{center}{bold}{#ffeaa7-fg}CHIPTUNE GENERATOR{/#ffeaa7-fg}{/bold}{/center}\n{center}🎵 Live Session Active 🎵{/center}`
        });
    }

    createParameterDisplay() {
        this.boxes.parameters = blessed.box({
            parent: this.container,
            top: 3,
            left: 0,
            width: '100%',
            height: 5,
            label: ' PARAMETERS ',
            border: { type: 'line' },
            tags: true
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
            border: { type: 'line' },
            tags: true
        });

        // Create gradient channel displays
        const channelNames = ['Ch1', 'Ch2', 'Ch3', 'Ch4'];
        const channelColors = ['#ff6b9d', '#c44569', '#0abde3', '#8e44ad'];

        for (let i = 0; i < 4; i++) {
            this.boxes[`channel${i + 1}`] = blessed.text({
                parent: this.boxes.musicFlow,
                top: i + 1,
                left: 1,
                content: `${chalk.hex(channelColors[i])(channelNames[i])} ${this.getFlowVisualization(i)}`
            });
        }

        // Start flow animation
        this.startFlowAnimation();
    }

    createStatusBar() {
        this.boxes.status = blessed.box({
            parent: this.container,
            top: 14,
            left: 0,
            width: '100%',
            height: 3,
            label: ' STATUS ',
            border: { type: 'line' },
            tags: true
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
            border: { type: 'line' },
            tags: true
        });

        this.updateControlHints();
    }

    updateParameterDisplay() {
        const p = this.parameters;
        const content = [
            '',
            `  {#fab1a0-fg}Genre:{/#fab1a0-fg} {bold}{#74b9ff-fg}${p.genre}{/#74b9ff-fg}{/bold}    {#fab1a0-fg}Key:{/#fab1a0-fg} {bold}{#74b9ff-fg}${p.key} ${p.scale}{/#74b9ff-fg}{/bold}    {#fab1a0-fg}Tempo:{/#fab1a0-fg} {bold}{#74b9ff-fg}${p.tempo} BPM{/#74b9ff-fg}{/bold}    {#fab1a0-fg}Time:{/#fab1a0-fg} {bold}{#74b9ff-fg}${p.timeSignature}{/#74b9ff-fg}{/bold}`,
            `  {#fab1a0-fg}Loop:{/#fab1a0-fg} {bold}{#74b9ff-fg}${p.loopLength} bars{/#74b9ff-fg}{/bold}    {#fab1a0-fg}Swing:{/#fab1a0-fg} {bold}{#74b9ff-fg}${p.swing ? 'ON' : 'OFF'}{/#74b9ff-fg}{/bold}    {#fab1a0-fg}Mode:{/#fab1a0-fg} {bold}{#00b894-fg}LIVE{/#00b894-fg}{/bold}`,
            ''
        ].join('\n');

        if (this.boxes.parameters) {
            this.boxes.parameters.setContent(content);
            this.screen.render();
        }
    }

    updateStatusDisplay() {
        const content = `\n  {#00b894-fg}Buffer:{/#00b894-fg} ${this.formatDuration(this.bufferDuration)} recording    {#81ecec-fg}Session:{/#81ecec-fg} ${this.sessionTime}`;

        if (this.boxes.status) {
            this.boxes.status.setContent(content);
        }
    }

    updateControlHints() {
        const content = [
            '',
            '  {#a29bfe-fg}[{/#a29bfe-fg}{#00b894-fg}G{/#00b894-fg}{#a29bfe-fg}]{/#a29bfe-fg} Genre  {#a29bfe-fg}[{/#a29bfe-fg}{#00b894-fg}T{/#00b894-fg}{#a29bfe-fg}]{/#a29bfe-fg} Tempo  {#a29bfe-fg}[{/#a29bfe-fg}{#00b894-fg}K{/#00b894-fg}{#a29bfe-fg}]{/#a29bfe-fg} Key  {#a29bfe-fg}[{/#a29bfe-fg}{#00b894-fg}S{/#00b894-fg}{#a29bfe-fg}]{/#a29bfe-fg} Scale  {#a29bfe-fg}[{/#a29bfe-fg}{#00b894-fg}L{/#00b894-fg}{#a29bfe-fg}]{/#a29bfe-fg} Loop  {#a29bfe-fg}[{/#a29bfe-fg}{#00b894-fg}W{/#00b894-fg}{#a29bfe-fg}]{/#a29bfe-fg} Swing',
            '  {#a29bfe-fg}[{/#a29bfe-fg}{#00b894-fg}3{/#00b894-fg}{#a29bfe-fg}][{/#a29bfe-fg}{#00b894-fg}4{/#00b894-fg}{#a29bfe-fg}]{/#a29bfe-fg} Time  {#a29bfe-fg}[{/#a29bfe-fg}{#00b894-fg}B{/#00b894-fg}{#a29bfe-fg}]{/#a29bfe-fg} Buffer  {#a29bfe-fg}[{/#a29bfe-fg}{#00b894-fg}Ctrl+S{/#00b894-fg}{#a29bfe-fg}]{/#a29bfe-fg} Save  {#a29bfe-fg}[{/#a29bfe-fg}{#00b894-fg}Ctrl+L{/#00b894-fg}{#a29bfe-fg}]{/#a29bfe-fg} Load  {#a29bfe-fg}[{/#a29bfe-fg}{#00b894-fg}Q{/#00b894-fg}{#a29bfe-fg}]{/#a29bfe-fg} Quit'
        ].join('\n');

        if (this.boxes.controls) {
            this.boxes.controls.setContent(content);
        }
    }

    getFlowVisualization(channelIndex) {
        const buffer = this.flowBuffers[Object.keys(this.flowBuffers)[channelIndex]];
        const width = 50;

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

        if (this.boxes[`channel${channelIndex + 1}`]) {
            const content = `${chalk.hex(channelColors[channelIndex])(channelNames[channelIndex])} ${this.getFlowVisualization(channelIndex)}`;
            this.boxes[`channel${channelIndex + 1}`].setContent(content);
        }
    }

    startFlowAnimation() {
        setInterval(() => {
            // Update all channel displays with flow animation
            for (let i = 0; i < 4; i++) {
                this.updateChannelDisplay(i);
            }

            this.screen.render();
        }, 150); // Slower update for stability
    }

    updateParameters(parameters) {
        this.parameters = { ...this.parameters, ...parameters };
        this.updateParameterDisplay();
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
        // Simple status message
        if (this.boxes.status) {
            const content = `\n  ${message}`;
            this.boxes.status.setContent(content);
            this.screen.render();

            // Reset after 3 seconds
            setTimeout(() => {
                this.updateStatusDisplay();
                this.screen.render();
            }, 3000);
        }
    }

    setMode(mode) {
        this.mode = mode;
        this.updateParameterDisplay();
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
    CleanUIManager
};