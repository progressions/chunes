// Channel visualization for the terminal UI

class Visualizer {
    constructor() {
        this.waveformChars = {
            square: ['▀', '▄', '█', '▐', '▌'],
            triangle: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
            noise: ['░', '▒', '▓', '█', '▓', '▒', '░', ' '],
            silence: ['-', '-', '-', '-', '-']
        };

        this.channelStates = {
            pulse1: { active: false, level: 0 },
            pulse2: { active: false, level: 0 },
            triangle: { active: false, level: 0 },
            noise: { active: false, level: 0 }
        };
    }

    updateChannelState(channelId, active, level = 0) {
        if (this.channelStates[channelId]) {
            this.channelStates[channelId].active = active;
            this.channelStates[channelId].level = level;
        }
    }

    generateWaveform(channelType, width = 40, phase = 0) {
        let waveform = '';
        const chars = this.waveformChars[channelType] || this.waveformChars.silence;

        for (let i = 0; i < width; i++) {
            const position = (i + phase) % chars.length;
            waveform += chars[Math.floor(position)];
        }

        return waveform;
    }

    generateChannelVisualization(channelId, width = 40) {
        const state = this.channelStates[channelId];
        if (!state.active) {
            return this.generateSilentVisualization(width);
        }

        const phase = Date.now() / 100; // Animate based on time

        switch (channelId) {
            case 'pulse1':
            case 'pulse2':
                return this.generateSquareWave(width, phase, state.level);
            case 'triangle':
                return this.generateTriangleWave(width, phase, state.level);
            case 'noise':
                return this.generateNoisePattern(width);
            default:
                return this.generateSilentVisualization(width);
        }
    }

    generateSquareWave(width, phase, level) {
        let wave = '';
        const dutyCycle = 0.5; // 50% duty cycle

        for (let i = 0; i < width; i++) {
            const position = ((i + phase) / width * 4) % 1;
            if (position < dutyCycle) {
                wave += level > 0.5 ? '▀' : '▄';
            } else {
                wave += level > 0.5 ? '▄' : '▀';
            }
        }

        return wave;
    }

    generateTriangleWave(width, phase, level) {
        let wave = '';
        const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

        for (let i = 0; i < width; i++) {
            const position = ((i + phase) / width * 2) % 1;
            let value;

            if (position < 0.25) {
                value = position * 4;
            } else if (position < 0.75) {
                value = 2 - (position * 4);
            } else {
                value = (position * 4) - 4;
            }

            value = Math.abs(value) * level;
            const charIndex = Math.floor(value * (chars.length - 1));
            wave += chars[Math.min(charIndex, chars.length - 1)];
        }

        return wave;
    }

    generateNoisePattern(width) {
        let pattern = '';
        const chars = ['░', '▒', '▓', '█'];

        for (let i = 0; i < width; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            pattern += chars[randomIndex];
        }

        return pattern;
    }

    generateSilentVisualization(width) {
        return '─'.repeat(width);
    }

    generateSpectrum(audioData, width = 40, height = 8) {
        // Generate a spectrum analyzer visualization
        const bars = [];
        const barCount = Math.min(width / 2, 20);

        for (let i = 0; i < barCount; i++) {
            // Simulate frequency analysis
            const amplitude = Math.random() * height;
            const barHeight = Math.floor(amplitude);

            let bar = '';
            for (let j = 0; j < height; j++) {
                if (j < barHeight) {
                    bar = '█' + bar;
                } else {
                    bar = ' ' + bar;
                }
            }

            bars.push(bar);
        }

        return bars;
    }

    generateBeatIndicator(isOnBeat) {
        return isOnBeat ? '●' : '○';
    }

    formatChannelDisplay(channelName, waveform, note = null, color = 'white') {
        const noteDisplay = note ? ` [${note}]` : '';
        const padding = ' '.repeat(Math.max(0, 10 - channelName.length));

        return `${channelName}:${padding}${waveform}${noteDisplay}`;
    }
}

module.exports = {
    Visualizer
};