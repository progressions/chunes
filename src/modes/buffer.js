// Buffer playback mode handler

class BufferMode {
    constructor(app) {
        this.app = app;
        this.isActive = false;
        this.isPlaying = false;
        this.currentPosition = 0;
        this.selection = {
            start: null,
            end: null
        };
    }

    activate() {
        this.isActive = true;
        this.isPlaying = false;

        // Set up buffer controls
        this.app.controlHandler.on('bufferSeek', this.handleSeek.bind(this));
        this.app.controlHandler.on('bufferPlayPause', this.handlePlayPause.bind(this));
        this.app.controlHandler.on('bufferRestart', this.handleRestart.bind(this));
        this.app.controlHandler.on('bufferSetStart', this.handleSetStart.bind(this));
        this.app.controlHandler.on('bufferSetEnd', this.handleSetEnd.bind(this));
        this.app.controlHandler.on('bufferClearSelection', this.handleClearSelection.bind(this));
        this.app.controlHandler.on('bufferSelectAll', this.handleSelectAll.bind(this));
        this.app.controlHandler.on('exportSelection', this.handleExportSelection.bind(this));
        this.app.controlHandler.on('previewSelection', this.handlePreviewSelection.bind(this));

        // Update UI
        this.app.uiManager.setMode('buffer');
        this.updateDisplay();
    }

    deactivate() {
        this.isActive = false;
        this.isPlaying = false;

        // Remove all buffer-related listeners
        this.app.controlHandler.removeAllListeners('bufferSeek');
        this.app.controlHandler.removeAllListeners('bufferPlayPause');
        this.app.controlHandler.removeAllListeners('bufferRestart');
        this.app.controlHandler.removeAllListeners('bufferSetStart');
        this.app.controlHandler.removeAllListeners('bufferSetEnd');
        this.app.controlHandler.removeAllListeners('bufferClearSelection');
        this.app.controlHandler.removeAllListeners('bufferSelectAll');
        this.app.controlHandler.removeAllListeners('exportSelection');
        this.app.controlHandler.removeAllListeners('previewSelection');
    }

    handleSeek(amount) {
        const bufferDuration = this.app.bufferManager.getDuration();

        if (amount === 'start') {
            this.currentPosition = 0;
        } else if (amount === 'end') {
            this.currentPosition = bufferDuration;
        } else {
            this.currentPosition += amount;
            this.currentPosition = Math.max(0, Math.min(bufferDuration, this.currentPosition));
        }

        this.updateDisplay();
    }

    handlePlayPause() {
        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {
            this.startPlayback();
        } else {
            this.stopPlayback();
        }

        this.app.uiManager.showMessage(
            this.isPlaying ? 'Playing' : 'Paused',
            'info'
        );
    }

    handleRestart() {
        if (this.selection.start !== null) {
            this.currentPosition = this.selection.start;
        } else {
            this.currentPosition = 0;
        }

        if (this.isPlaying) {
            this.stopPlayback();
            this.startPlayback();
        }

        this.updateDisplay();
    }

    handleSetStart() {
        this.selection.start = this.currentPosition;
        if (this.selection.end !== null && this.selection.end < this.selection.start) {
            this.selection.end = null;
        }

        this.updateDisplay();
        this.app.uiManager.showMessage(
            `Selection start: ${this.formatTime(this.selection.start)}`,
            'info'
        );
    }

    handleSetEnd() {
        if (this.selection.start === null) {
            this.selection.start = 0;
        }
        this.selection.end = this.currentPosition;

        if (this.selection.end < this.selection.start) {
            // Swap if end is before start
            [this.selection.start, this.selection.end] = [this.selection.end, this.selection.start];
        }

        this.updateDisplay();
        this.app.uiManager.showMessage(
            `Selection: ${this.formatTime(this.selection.start)} - ${this.formatTime(this.selection.end)}`,
            'info'
        );
    }

    handleClearSelection() {
        this.selection.start = null;
        this.selection.end = null;
        this.updateDisplay();
        this.app.uiManager.showMessage('Selection cleared', 'info');
    }

    handleSelectAll() {
        this.selection.start = 0;
        this.selection.end = this.app.bufferManager.getDuration();
        this.updateDisplay();
        this.app.uiManager.showMessage('Selected entire buffer', 'info');
    }

    async handleExportSelection() {
        if (this.selection.start === null || this.selection.end === null) {
            this.app.uiManager.showMessage('No selection to export', 'warning');
            return;
        }

        const selectionData = this.app.bufferManager.getSelection(
            this.selection.start,
            this.selection.end
        );

        const themeExporter = new (require('../export/themes').ThemeExporter)();
        const fileName = await themeExporter.exportTheme(selectionData, this.app.parameters);

        this.app.uiManager.showMessage(
            `Exported theme: ${fileName}`,
            'success'
        );
    }

    handlePreviewSelection() {
        if (this.selection.start === null || this.selection.end === null) {
            this.app.uiManager.showMessage('No selection to preview', 'warning');
            return;
        }

        // Start looped playback of selection
        this.currentPosition = this.selection.start;
        this.isPlaying = true;
        this.startPlayback(true); // Loop mode

        this.app.uiManager.showMessage('Previewing selection (looped)', 'info');
    }

    startPlayback(loop = false) {
        if (!this.playbackInterval) {
            this.playbackInterval = setInterval(() => {
                if (this.isPlaying) {
                    // Play audio at current position
                    const audioData = this.app.bufferManager.getAudioAt(this.currentPosition);
                    if (audioData) {
                        this.app.audioEngine.play(audioData);
                    }

                    // Advance position
                    this.currentPosition += 0.01; // 10ms increments

                    // Handle looping or stopping
                    const endPosition = this.selection.end || this.app.bufferManager.getDuration();
                    if (this.currentPosition >= endPosition) {
                        if (loop && this.selection.start !== null) {
                            this.currentPosition = this.selection.start;
                        } else {
                            this.stopPlayback();
                        }
                    }

                    this.updateDisplay();
                }
            }, 10);
        }
    }

    stopPlayback() {
        this.isPlaying = false;
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
    }

    updateDisplay() {
        // Create buffer mode display
        const blessed = require('blessed');

        if (!this.displayBox) {
            this.displayBox = blessed.box({
                parent: this.app.screen,
                top: 'center',
                left: 'center',
                width: '80%',
                height: 15,
                tags: true,
                style: {
                    fg: 'white',
                    bg: '#1e293b'
                },
                border: {
                    type: 'line',
                    fg: '#3b82f6'
                },
                label: ' BUFFER PLAYBACK MODE '
            });
        }

        const bufferDuration = this.app.bufferManager.getDuration();
        const timeline = this.generateTimeline(bufferDuration);

        const content = [
            `Total Buffer: ${this.formatTime(bufferDuration)} | Position: ${this.formatTime(this.currentPosition)}`,
            '',
            `Timeline: ${timeline}`,
            '',
            this.selection.start !== null && this.selection.end !== null
                ? `Selection: ${this.formatTime(this.selection.start)} → ${this.formatTime(this.selection.end)} (${this.formatTime(this.selection.end - this.selection.start)})`
                : 'No selection',
            '',
            'Controls:',
            '[←→] Seek  [Space] Play/Pause  [Enter] Set Start  [Shift+Enter] Set End',
            '[S] Save Selection  [P] Preview  [C] Clear  [Esc] Back to Live'
        ].join('\n');

        this.displayBox.setContent(content);
        this.app.screen.render();
    }

    generateTimeline(duration) {
        const width = 50;
        const position = Math.floor((this.currentPosition / duration) * width);
        let timeline = '[';

        for (let i = 0; i < width; i++) {
            if (i === position) {
                timeline += '●';
            } else if (this.selection.start !== null && this.selection.end !== null) {
                const startPos = Math.floor((this.selection.start / duration) * width);
                const endPos = Math.floor((this.selection.end / duration) * width);
                if (i >= startPos && i <= endPos) {
                    timeline += '=';
                } else {
                    timeline += '-';
                }
            } else {
                timeline += '-';
            }
        }

        timeline += ']';
        return timeline;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    }
}

module.exports = {
    BufferMode
};