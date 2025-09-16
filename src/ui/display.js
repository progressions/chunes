// Terminal UI display using blessed

const blessed = require('blessed');
const chalk = require('chalk');
const gradient = require('gradient-string');

class UIManager {
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

        // Update displays with initial values
        this.updateParameterDisplay();
        this.updateControlHints();

        this.screen.render();
    }

    createHeader() {
        // Create gradient text separately
        let titleText = '♪ CHIPTUNE GENERATOR ♪';
        try {
            const headerGradient = gradient(['#ec4899', '#8b5cf6', '#3b82f6']);
            titleText = headerGradient(titleText);
        } catch (e) {
            // Fallback if gradient fails
            titleText = '{bold}{cyan-fg}' + titleText + '{/cyan-fg}{/bold}';
        }

        this.boxes.header = blessed.box({
            parent: this.container,
            top: 0,
            left: 0,
            width: '100%',
            height: 3,
            content: `{center}${titleText}{/center}`,
            tags: true,
            style: {
                fg: 'white'
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
            height: 4,
            tags: true,
            style: {
                fg: this.theme.foreground
            },
            border: {
                type: 'line',
                fg: '#475569'
            },
            label: ' Parameters '
        });

        // Set initial content
        this.boxes.parameters.setContent('Initializing...');
    }

    createVisualization() {
        this.boxes.visualization = blessed.box({
            parent: this.container,
            top: 7,
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
            height: 6,  // Increased to make room for status line
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

        // Add a status line box
        this.boxes.statusLine = blessed.box({
            parent: this.boxes.controls,
            bottom: 0,
            left: 1,
            width: '98%',
            height: 1,
            tags: true,
            content: '',
            style: {
                fg: this.theme.highlight
            }
        });

        this.updateControlHints();
    }

    updateParameterDisplay() {
        const params = this.parameters;
        const modeText = this.mode === 'live'
            ? `{bold}{green-fg}LIVE GENERATION{/green-fg}{/bold}`
            : `{bold}{blue-fg}BUFFER PLAYBACK{/blue-fg}{/bold}`;

        const bufferText = this.formatDuration(this.bufferDuration);

        // Simpler format without complex colors
        const line1 = `${modeText} [Buffer: ${bufferText}]`;
        const line2 = `Genre: {yellow-fg}${params.genre || 'rock'}{/} | Key: {yellow-fg}${params.key || 'C'} ${params.scale || 'major'}{/} | Tempo: {yellow-fg}${params.tempo || 120} BPM{/} | Loop: {yellow-fg}${params.loopLength || 8} bars{/}`;

        const content = [line1, line2].join('\n');

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
            info: '{cyan-fg}',
            success: '{green-fg}',
            warning: '{yellow-fg}',
            error: '{red-fg}'
        };

        const colorTag = colors[type] || '{white-fg}';
        const timestamp = new Date().toLocaleTimeString();
        const formattedMessage = `${colorTag}[${timestamp}] ${message}{/}`;

        // Update status line instead of showing popup
        if (this.boxes.statusLine) {
            this.boxes.statusLine.setContent(formattedMessage);
            this.screen.render();

            // Clear message after 3 seconds
            clearTimeout(this.statusTimeout);
            this.statusTimeout = setTimeout(() => {
                if (this.boxes.statusLine) {
                    this.boxes.statusLine.setContent('');
                    this.screen.render();
                }
            }, 3000);
        }
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