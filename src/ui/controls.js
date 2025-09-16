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
        this.screen.key(['t', 'S-t'], (ch, key) => {
            const direction = key && key.shift ? 'decrease' : 'increase';
            this.emit('parameterChange', 'tempo', direction);
        });

        // Genre
        this.screen.key(['g', 'S-g'], (ch, key) => {
            const direction = key && key.shift ? 'previous' : 'next';
            this.emit('parameterChange', 'genre', direction);
        });

        // Key
        this.screen.key(['k', 'S-k'], (ch, key) => {
            const direction = key && key.shift ? 'previous' : 'next';
            this.emit('parameterChange', 'key', direction);
        });

        // Scale
        this.screen.key(['s', 'S-s'], (ch, key) => {
            const direction = key && key.shift ? 'previous' : 'next';
            this.emit('parameterChange', 'scale', direction);
        });

        // Loop length
        this.screen.key(['l', 'S-l'], (ch, key) => {
            const direction = key && key.shift ? 'decrease' : 'increase';
            this.emit('parameterChange', 'loopLength', direction);
        });

        // Ctrl combinations
        this.screen.key('C-s', () => {
            this.emit('saveLoop');
        });

        this.screen.key('C-l', () => {
            this.emit('loadLoop');
        });

        // Warmth (replaces swing on W key)
        this.screen.key(['w', 'S-w'], (ch, key) => {
            const direction = key && key.shift ? 'decrease' : 'increase';
            this.emit('parameterChange', 'warmth', direction);
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

        // Help (removed 'h' and 'H' to avoid conflict with H Mode)
        this.screen.key(['?'], () => {
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
