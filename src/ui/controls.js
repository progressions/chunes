// Keyboard input handling

const EventEmitter = require('events');

class ControlHandler extends EventEmitter {
    constructor(screen) {
        super();
        this.screen = screen;

        this.setupKeyBindings();
    }

    setupKeyBindings() {
        // We'll handle shift detection within each key handler instead

        // Parameter controls - Tempo
        this.screen.key('t', () => {
            this.emit('parameterChange', 'tempo', 'increase');
        });

        this.screen.key('T', () => {
            this.emit('parameterChange', 'tempo', 'decrease');
        });

        // Genre
        this.screen.key('g', () => {
            this.emit('parameterChange', 'genre', 'next');
        });

        this.screen.key('G', () => {
            this.emit('parameterChange', 'genre', 'previous');
        });

        // Key
        this.screen.key('k', () => {
            this.emit('parameterChange', 'key', 'next');
        });

        this.screen.key('K', () => {
            this.emit('parameterChange', 'key', 'previous');
        });

        // Scale
        this.screen.key('s', () => {
            this.emit('parameterChange', 'scale', 'next');
        });

        this.screen.key('S', () => {
            this.emit('parameterChange', 'scale', 'previous');
        });

        // Loop length
        this.screen.key('l', () => {
            this.emit('parameterChange', 'loopLength', 'increase');
        });

        this.screen.key('L', () => {
            this.emit('parameterChange', 'loopLength', 'decrease');
        });

        // Ctrl combinations
        this.screen.key('C-s', () => {
            this.emit('saveLoop');
        });

        this.screen.key('C-l', () => {
            this.emit('loadLoop');
        });

        // Swing
        this.screen.key(['w', 'W'], () => {
            this.emit('parameterChange', 'swing', 'toggle');
        });

        // Time signature
        this.screen.key('3', () => {
            this.emit('parameterChange', 'timeSignature', '3/4');
        });

        this.screen.key('4', () => {
            this.emit('parameterChange', 'timeSignature', '4/4');
        });

        // Buffer mode navigation
        this.screen.key(['left'], () => {
            this.emit('bufferSeek', -1);
        });

        this.screen.key(['S-left'], () => {
            this.emit('bufferSeek', -10);
        });

        this.screen.key(['right'], () => {
            this.emit('bufferSeek', 1);
        });

        this.screen.key(['S-right'], () => {
            this.emit('bufferSeek', 10);
        });

        this.screen.key(['home'], () => {
            this.emit('bufferSeek', 'start');
        });

        this.screen.key(['end'], () => {
            this.emit('bufferSeek', 'end');
        });

        this.screen.key(['pageup'], () => {
            this.emit('bufferSeek', -30);
        });

        this.screen.key(['pagedown'], () => {
            this.emit('bufferSeek', 30);
        });

        // Buffer playback controls
        this.screen.key(['space'], () => {
            this.emit('bufferPlayPause');
        });

        this.screen.key(['r', 'R'], () => {
            this.emit('bufferRestart');
        });

        // Buffer selection
        this.screen.key(['enter', 'return'], () => {
            this.emit('bufferSetStart');
        });

        this.screen.key(['S-enter', 'S-return'], () => {
            this.emit('bufferSetEnd');
        });

        this.screen.key(['c'], () => {
            this.emit('bufferClearSelection');
        });

        this.screen.key(['a'], () => {
            this.emit('bufferSelectAll');
        });

        this.screen.key(['p', 'P'], () => {
            this.emit('previewSelection');
        });

        // New session controls
        this.screen.key(['n', 'N'], () => {
            if (this.ctrlPressed) {
                this.emit('newLoop');
            }
        });

        // Volume controls
        this.screen.key(['+', '='], () => {
            this.emit('volumeChange', 'increase');
        });

        this.screen.key(['-', '_'], () => {
            this.emit('volumeChange', 'decrease');
        });

        // Channel mute controls (1-4 keys)
        this.screen.key(['1'], () => {
            this.emit('channelToggle', 'pulse1');
        });

        this.screen.key(['2'], () => {
            this.emit('channelToggle', 'pulse2');
        });

        this.screen.key(['5'], () => {
            this.emit('channelToggle', 'triangle');
        });

        this.screen.key(['6'], () => {
            this.emit('channelToggle', 'noise');
        });

        // Help
        this.screen.key(['h', 'H', '?'], () => {
            this.emit('showHelp');
        });
    }

    getParameterCycleValue(param, direction, currentValue) {
        const cycles = {
            tempo: {
                values: [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 180, 200],
                wrap: true
            },
            genre: {
                values: ['soft', 'rock', 'bossa'],
                wrap: true
            },
            key: {
                values: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
                wrap: true
            },
            scale: {
                values: ['major', 'minor', 'blues', 'dorian', 'mixolydian', 'pentatonic'],
                wrap: true
            },
            loopLength: {
                values: [4, 8, 16, 32],
                wrap: true
            }
        };

        const config = cycles[param];
        if (!config) return currentValue;

        const currentIndex = config.values.indexOf(currentValue);
        let newIndex;

        if (direction === 'next' || direction === 'increase') {
            newIndex = currentIndex + 1;
            if (newIndex >= config.values.length) {
                newIndex = config.wrap ? 0 : config.values.length - 1;
            }
        } else if (direction === 'previous' || direction === 'decrease') {
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
                newIndex = config.wrap ? config.values.length - 1 : 0;
            }
        } else if (typeof direction === 'number') {
            // Direct value set
            return direction;
        } else {
            return currentValue;
        }

        return config.values[newIndex];
    }

    destroy() {
        this.removeAllListeners();
    }
}

module.exports = {
    ControlHandler
};