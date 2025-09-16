// Music buffer management

class BufferManager {
    constructor(maxDuration = 600) { // 10 minutes max
        this.maxDuration = maxDuration;
        this.sampleRate = 44100;
        this.bufferData = [];
        this.timeline = [];
        this.isRecording = false;
        this.startTime = null;
    }

    startRecording() {
        this.isRecording = true;
        this.startTime = Date.now();
        this.bufferData = [];
        this.timeline = [];
    }

    stopRecording() {
        this.isRecording = false;
    }

    record(audioData, parameters) {
        if (!this.isRecording) return;

        const timestamp = (Date.now() - this.startTime) / 1000; // Convert to seconds

        // Store audio data
        this.bufferData.push({
            timestamp,
            audio: audioData,
            parameters: { ...parameters }
        });

        // Update timeline if parameters changed
        if (this.timeline.length === 0 ||
            !this.parametersEqual(this.timeline[this.timeline.length - 1].parameters, parameters)) {
            this.timeline.push({
                time: timestamp,
                parameters: { ...parameters }
            });
        }

        // Trim buffer if it exceeds max duration
        this.trimBuffer();
    }

    trimBuffer() {
        const currentDuration = this.getDuration();
        if (currentDuration > this.maxDuration) {
            // Remove oldest data
            const trimTime = currentDuration - this.maxDuration;
            this.bufferData = this.bufferData.filter(item => item.timestamp > trimTime);
            this.timeline = this.timeline.filter(item => item.time > trimTime);

            // Adjust timestamps
            this.bufferData.forEach(item => item.timestamp -= trimTime);
            this.timeline.forEach(item => item.time -= trimTime);
        }
    }

    getDuration() {
        if (this.bufferData.length === 0) return 0;
        return this.bufferData[this.bufferData.length - 1].timestamp;
    }

    getAudioAt(position) {
        // Find the audio data closest to the requested position
        let closest = null;
        let minDiff = Infinity;

        for (const item of this.bufferData) {
            const diff = Math.abs(item.timestamp - position);
            if (diff < minDiff) {
                minDiff = diff;
                closest = item;
            }
            if (item.timestamp > position) break;
        }

        return closest ? closest.audio : null;
    }

    getParametersAt(position) {
        // Find parameters at the given position
        let params = this.timeline[0]?.parameters || {};

        for (const entry of this.timeline) {
            if (entry.time > position) break;
            params = entry.parameters;
        }

        return params;
    }

    getSelection(startTime, endTime) {
        // Extract a portion of the buffer
        const selection = this.bufferData.filter(item =>
            item.timestamp >= startTime && item.timestamp <= endTime
        );

        // Adjust timestamps to be relative to selection start
        const adjustedSelection = selection.map(item => ({
            ...item,
            timestamp: item.timestamp - startTime
        }));

        // Get timeline events within selection
        const timelineSelection = this.timeline.filter(entry =>
            entry.time >= startTime && entry.time <= endTime
        ).map(entry => ({
            ...entry,
            time: entry.time - startTime
        }));

        return {
            duration: endTime - startTime,
            audioData: adjustedSelection,
            timeline: timelineSelection,
            startParameters: this.getParametersAt(startTime)
        };
    }

    parametersEqual(params1, params2) {
        const keys = ['genre', 'key', 'scale', 'tempo', 'timeSignature', 'swing', 'loopLength'];
        for (const key of keys) {
            if (params1[key] !== params2[key]) return false;
        }
        return true;
    }

    clear() {
        this.bufferData = [];
        this.timeline = [];
        if (this.isRecording) {
            this.startTime = Date.now();
        }
    }

    getBufferStats() {
        return {
            duration: this.getDuration(),
            dataPoints: this.bufferData.length,
            timelineEvents: this.timeline.length,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    estimateMemoryUsage() {
        // Rough estimate of memory usage in MB
        const bytesPerSample = 4; // Float32
        const samplesPerChunk = 512;
        const totalBytes = this.bufferData.length * samplesPerChunk * bytesPerSample * 4; // 4 channels
        return (totalBytes / (1024 * 1024)).toFixed(2);
    }

    exportToWav(selection = null) {
        // This would export the buffer or selection to a WAV file
        // For now, return a placeholder
        const data = selection || {
            duration: this.getDuration(),
            audioData: this.bufferData,
            timeline: this.timeline
        };

        return {
            sampleRate: this.sampleRate,
            channels: 2,
            duration: data.duration,
            data: data.audioData
        };
    }
}

module.exports = {
    BufferManager
};