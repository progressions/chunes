#!/usr/bin/env node

// Simple test to verify audio is working

const { ContinuousAudioPlayer } = require('./src/audio/continuousPlayer');

async function testAudio() {
    console.log('Testing audio system...');

    const player = new ContinuousAudioPlayer();

    try {
        await player.initialize();
        console.log('Audio initialized. You should hear a 440Hz tone.');
        console.log('Press Ctrl+C to stop.');

        // Change frequency every 2 seconds
        let freq = 440;
        setInterval(() => {
            freq = freq === 440 ? 523.25 : 440; // Alternate between A4 and C5
            player.setFrequency(freq);
            console.log(`Frequency changed to ${freq.toFixed(2)}Hz`);
        }, 2000);

        // Keep the process alive
        process.on('SIGINT', () => {
            console.log('\nStopping audio...');
            player.stop();
            process.exit(0);
        });

    } catch (error) {
        console.error('Failed to initialize audio:', error);
        process.exit(1);
    }
}

testAudio();