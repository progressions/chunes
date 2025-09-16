// Terminal UI display using blessed

const blessed = require('blessed');
const chalk = require('chalk');
const gradient = require('gradient-string');

class UIManager {
    constructor(screen) {
        this.screen = screen;
        this.mode = 'live';
        this.boxes = {};
        this.parameters = {};
        this.bufferDuration = 0;
        this.theme = {
            pulse1: '#7dd3fc',
            pulse2: '#86efac',
            triangle: '#fed7aa',
            noise: '#e9d5ff',
            highlight: '#fef08a',
            background: '#1e293b',
            foreground: '#f1f5f9'
        };
    }

    initialize() {
        // Create main container
        this.container = blessed.box({
            parent: this.screen,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            style: {
                fg: this.theme.foreground,
                bg: this.theme.background
            }
        });

        // Create header
        this.createHeader();

        // Create parameter display
        this.createParameterDisplay();

        // Create visualization area
        this.createVisualization();

        // Create control hints
        this.createControlHints();

        this.screen.render();
    }

    createHeader() {
        const headerGradient = gradient(['#ec4899', '#8b5cf6', '#3b82f6']);
        const titleText = headerGradient(' ♪ CHIPTUNE GENERATOR ♪ ');

        this.boxes.header = blessed.box({
            parent: this.container,
            top: 0,
            left: 0,
            width: '100%',
            height: 3,
            content: `{center}${titleText}{/center}`,
            tags: true,
            style: {
                fg: 'white',
                bold: true
            },
            border: {
                type: 'line',
                fg: '#475569'
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
            tags: true,
            style: {
                fg: this.theme.foreground
            },
            border: {
                type: 'line',
                fg: '#475569'
            }
        });

        this.updateParameterDisplay();
    }

    createVisualization() {
        this.boxes.visualization = blessed.box({
            parent: this.container,
            top: 6,
            left: 0,
            width: '100%',
            height: 10,
            tags: true,
            style: {
                fg: this.theme.foreground
            },
            border: {
                type: 'line',
                fg: '#475569'
            },
            label: ' Channels '
        });

        // Create channel displays
        this.channelDisplays = {
            pulse1: this.createChannelDisplay(0, 'Pulse 1 (Lead)', this.theme.pulse1),
            pulse2: this.createChannelDisplay(1, 'Pulse 2 (Harmony)', this.theme.pulse2),
            triangle: this.createChannelDisplay(2, 'Triangle (Bass)', this.theme.triangle),
            noise: this.createChannelDisplay(3, 'Noise (Drums)', this.theme.noise)
        };
    }

    createChannelDisplay(index, name, color) {
        return blessed.box({
            parent: this.boxes.visualization,
            top: 1 + index * 2,
            left: 1,
            width: '98%',
            height: 2,
            content: `{${color}-fg}${name}:{/} ${this.generateWaveform(index)}`,
            tags: true,
            style: {
                fg: color
            }
        });
    }

    generateWaveform(channelIndex) {
        const waveforms = [
            '∿∿∿~~~∿∿∿~~~∿∿∿~~~∿∿∿~~~',
            '~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~',
            '▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁',
            '▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░'
        ];

        return waveforms[channelIndex] || '';
    }

    createControlHints() {
        this.boxes.controls = blessed.box({
            parent: this.container,
            bottom: 0,
            left: 0,
            width: '100%',
            height: 5,
            tags: true,
            style: {
                fg: this.theme.foreground
            },
            border: {
                type: 'line',
                fg: '#475569'
            },
            label: ' Controls '
        });

        this.updateControlHints();
    }

    updateParameterDisplay() {
        const params = this.parameters;
        const modeText = this.mode === 'live'
            ? `{bold}{green-fg}LIVE GENERATION{/green-fg}{/bold}`
            : `{bold}{blue-fg}BUFFER PLAYBACK{/blue-fg}{/bold}`;

        const bufferText = this.formatDuration(this.bufferDuration);

        const content = [
            `${modeText} {gray-fg}[Buffer: ${bufferText}]{/gray-fg}`,
            `Genre: {${this.theme.highlight}-fg}${params.genre || 'rock'}{/} | ` +
            `Key: {${this.theme.highlight}-fg}${params.key || 'C'} ${params.scale || 'major'}{/} | ` +
            `Time: {${this.theme.highlight}-fg}${params.timeSignature || '4/4'}{/} | ` +
            `Tempo: {${this.theme.highlight}-fg}${params.tempo || 120} BPM{/} | ` +
            `Loop: {${this.theme.highlight}-fg}${params.loopLength || 8} bars{/} | ` +
            `Swing: {${this.theme.highlight}-fg}${params.swing ? 'ON' : 'OFF'}{/}`
        ].join('\n');

        if (this.boxes.parameters) {
            this.boxes.parameters.setContent(content);
            this.screen.render();
        }
    }

    updateControlHints() {
        let content = '';

        if (this.mode === 'live') {
            content = [
                '{bold}Parameter Controls:{/bold}',
                '[T] Tempo  [G] Genre  [K] Key  [S] Scale  [L] Loop  [W] Swing',
                '[3] 3/4  [4] 4/4  [B] Buffer Mode  [Ctrl+S] Save Loop  [Ctrl+L] Load Loop',
                '[Q] Quit'
            ].join('\n');
        } else if (this.mode === 'buffer') {
            content = [
                '{bold}Buffer Controls:{/bold}',
                '[←→] Seek  [Space] Play/Pause  [Enter] Set Start  [Shift+Enter] Set End',
                '[S] Save Selection  [P] Preview  [C] Clear  [A] Select All',
                '[Esc] Back to Live  [Q] Quit'
            ].join('\n');
        }

        if (this.boxes.controls) {
            this.boxes.controls.setContent(content);
            this.screen.render();
        }
    }

    updateVisualization(audioData) {
        // Update channel visualizations based on audio data
        if (!audioData) return;

        // This would be called frequently to update the waveform displays
        // For now, we'll keep the static displays
        this.screen.render();
    }

    updateChannelVisualization(channelId, data) {
        if (!this.channelDisplays[channelId]) return;

        const channel = this.channelDisplays[channelId];
        let visualization = '';

        if (data && data.active) {
            // Generate dynamic visualization based on activity
            const wave = this.generateActiveWaveform(channelId, data);
            visualization = wave;
        } else {
            visualization = this.generateWaveform(
                channelId === 'pulse1' ? 0 :
                channelId === 'pulse2' ? 1 :
                channelId === 'triangle' ? 2 : 3
            );
        }

        const name = channelId.charAt(0).toUpperCase() + channelId.slice(1);
        const noteText = data && data.note ? ` [${data.note}]` : '';
        channel.setContent(`{${this.theme[channelId]}-fg}${name}:{/} ${visualization}${noteText}`);
    }

    generateActiveWaveform(channelId, data) {
        const time = Date.now() / 100;
        const length = 40;
        let wave = '';

        for (let i = 0; i < length; i++) {
            const phase = (time + i) / length;

            switch (channelId) {
                case 'pulse1':
                case 'pulse2':
                    // Square wave visualization
                    wave += Math.sin(phase * Math.PI * 4) > 0 ? '▀' : '▄';
                    break;
                case 'triangle':
                    // Triangle wave visualization
                    const triValue = Math.abs((phase * 4) % 2 - 1);
                    wave += triValue < 0.25 ? '▁' : triValue < 0.5 ? '▂' : triValue < 0.75 ? '▃' : '▄';
                    break;
                case 'noise':
                    // Noise visualization
                    wave += Math.random() > 0.5 ? '▓' : '░';
                    break;
            }
        }

        return wave;
    }

    setMode(mode) {
        this.mode = mode;
        this.updateParameterDisplay();
        this.updateControlHints();
    }

    updateParameters(parameters) {
        this.parameters = parameters;
        this.updateParameterDisplay();
    }

    updateBufferDuration(seconds) {
        this.bufferDuration = seconds;
        this.updateParameterDisplay();
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}m:${secs.toString().padStart(2, '0')}s`;
    }

    showMessage(message, type = 'info') {
        const colors = {
            info: 'blue',
            success: 'green',
            warning: 'yellow',
            error: 'red'
        };

        const messageBox = blessed.message({
            parent: this.screen,
            top: 'center',
            left: 'center',
            width: '50%',
            height: 'shrink',
            style: {
                fg: colors[type] || 'white',
                bg: this.theme.background,
                border: {
                    fg: colors[type] || 'white'
                }
            },
            border: {
                type: 'line'
            },
            label: ` ${type.toUpperCase()} `,
            tags: true,
            hidden: false
        });

        messageBox.display(message, 2, () => {
            messageBox.destroy();
            this.screen.render();
        });

        this.screen.render();
    }

    destroy() {
        // Clean up UI elements
        Object.values(this.boxes).forEach(box => {
            if (box && box.destroy) {
                box.destroy();
            }
        });
    }
}

module.exports = {
    UIManager
};