// Live generation mode handler

class LiveMode {
    constructor(app) {
        this.app = app;
        this.isActive = false;
        this.availableTempos = [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 180, 200];
        this.availableGenres = ['soft', 'rock', 'bossa'];
        this.availableKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.availableScales = ['major', 'minor', 'blues'];
        this.availableLoopLengths = [4, 8, 16];
    }

    activate() {
        this.isActive = true;

        // Set up parameter change handlers
        this.app.controlHandler.on('parameterChange', this.handleParameterChange.bind(this));

        // Set up loop save/load handlers
        this.app.controlHandler.on('saveLoop', this.handleSaveLoop.bind(this));
        this.app.controlHandler.on('loadLoop', this.handleLoadLoop.bind(this));
        this.app.controlHandler.on('newLoop', this.handleNewLoop.bind(this));

        // Set up volume controls
        this.app.controlHandler.on('volumeChange', this.handleVolumeChange.bind(this));
        this.app.controlHandler.on('channelToggle', this.handleChannelToggle.bind(this));

        // Update UI
        this.app.uiManager.setMode('live');
        this.app.uiManager.updateParameters(this.app.parameters);
    }

    deactivate() {
        this.isActive = false;
        this.app.controlHandler.removeAllListeners('parameterChange');
        this.app.controlHandler.removeAllListeners('saveLoop');
        this.app.controlHandler.removeAllListeners('loadLoop');
        this.app.controlHandler.removeAllListeners('newLoop');
        this.app.controlHandler.removeAllListeners('volumeChange');
        this.app.controlHandler.removeAllListeners('channelToggle');
    }

    handleParameterChange(param, direction) {
        const currentValue = this.app.parameters[param];
        let newValue = currentValue;

        switch (param) {
            case 'tempo':
                newValue = this.cycleValue(
                    this.availableTempos,
                    currentValue,
                    direction === 'increase'
                );
                break;

            case 'genre':
                newValue = this.cycleValue(
                    this.availableGenres,
                    currentValue,
                    direction === 'next'
                );
                break;

            case 'key':
                newValue = this.cycleValue(
                    this.availableKeys,
                    currentValue,
                    direction === 'next'
                );
                break;

            case 'scale':
                newValue = this.cycleValue(
                    this.availableScales,
                    currentValue,
                    direction === 'next'
                );
                break;

            case 'loopLength':
                newValue = this.cycleValue(
                    this.availableLoopLengths,
                    currentValue,
                    direction === 'increase'
                );
                break;

            case 'swing':
                newValue = !currentValue;
                break;

            case 'timeSignature':
                newValue = direction; // Direct value ('3/4' or '4/4')
                break;
        }

        if (newValue !== currentValue && newValue !== undefined) {
            this.app.updateParameter(param, newValue);
            this.app.uiManager.showMessage(
                `${param}: ${newValue}`,
                'info'
            );
        }
    }

    cycleValue(values, current, forward = true) {
        const index = values.indexOf(current);
        if (index === -1) return values[0];

        const nextIndex = forward
            ? (index + 1) % values.length
            : (index - 1 + values.length) % values.length;

        return values[nextIndex];
    }

    handleSaveLoop() {
        // Create save dialog
        const blessed = require('blessed');

        const saveForm = blessed.form({
            parent: this.app.screen,
            keys: true,
            top: 'center',
            left: 'center',
            width: '60%',
            height: 10,
            bg: '#1e293b',
            border: {
                type: 'line',
                fg: '#3b82f6'
            },
            label: ' Save Current Loop '
        });

        const infoText = blessed.text({
            parent: saveForm,
            top: 1,
            left: 2,
            content: `Genre: ${this.app.parameters.genre} | Key: ${this.app.parameters.key} | Tempo: ${this.app.parameters.tempo}`
        });

        const nameLabel = blessed.text({
            parent: saveForm,
            top: 3,
            left: 2,
            content: 'Loop Name:'
        });

        const nameInput = blessed.textbox({
            parent: saveForm,
            name: 'loopName',
            top: 3,
            left: 13,
            width: '70%',
            height: 1,
            inputOnFocus: true,
            style: {
                fg: 'white',
                bg: '#334155',
                focus: {
                    fg: 'white',
                    bg: '#475569'
                }
            }
        });

        // Set default name
        const defaultName = `${this.app.parameters.genre}_${this.app.parameters.key}_${this.app.parameters.tempo}`;
        nameInput.setValue(defaultName);

        saveForm.on('submit', async (data) => {
            const loopName = data.loopName || defaultName;
            await this.saveLoop(loopName);
            saveForm.destroy();
            this.app.screen.render();
            this.app.uiManager.showMessage(`Loop saved: ${loopName}`, 'success');
        });

        nameInput.key(['escape'], () => {
            saveForm.destroy();
            this.app.screen.render();
        });

        nameInput.key(['enter'], () => {
            saveForm.submit();
        });

        nameInput.focus();
        this.app.screen.render();
    }

    async saveLoop(name) {
        const fs = require('fs-extra');
        const path = require('path');

        const loopData = {
            loop_id: name.replace(/\s+/g, '_').toLowerCase(),
            name: name,
            timestamp: new Date().toISOString(),
            loop_data: {
                parameters: { ...this.app.parameters },
                pattern_seed: this.app.musicGenerator.patternSeed,
                // Save current patterns
                patterns: {
                    melody: this.app.musicGenerator.melodyPattern,
                    bass: this.app.musicGenerator.bassPattern,
                    harmony: this.app.musicGenerator.harmonyPattern
                }
            }
        };

        const fileName = `${loopData.loop_id}.json`;
        const filePath = path.join('loops', fileName);

        await fs.ensureDir('loops');
        await fs.writeJson(filePath, loopData, { spaces: 2 });

        return filePath;
    }

    handleLoadLoop() {
        // This would open a loop loader interface
        // For now, we'll show a message
        this.app.uiManager.showMessage('Loop loader not yet implemented', 'info');
    }

    handleNewLoop() {
        // Reset to new random loop
        this.app.musicGenerator.reset();
        this.app.uiManager.showMessage('Generated new loop', 'success');
    }

    handleVolumeChange(direction) {
        const currentVolume = this.app.audioEngine.mixer.masterVolume;
        const step = 0.05;
        const newVolume = direction === 'increase'
            ? Math.min(1, currentVolume + step)
            : Math.max(0, currentVolume - step);

        this.app.audioEngine.setMasterVolume(newVolume);
        this.app.uiManager.showMessage(
            `Volume: ${Math.round(newVolume * 100)}%`,
            'info'
        );
    }

    handleChannelToggle(channelId) {
        const channel = this.app.audioEngine.mixer.channels[channelId];
        if (channel) {
            const newState = !channel.enabled;
            channel.setEnabled(newState);
            this.app.uiManager.showMessage(
                `${channelId}: ${newState ? 'ON' : 'OFF'}`,
                'info'
            );
        }
    }
}

module.exports = {
    LiveMode
};