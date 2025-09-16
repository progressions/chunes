#!/usr/bin/env node

// Test script to verify tempo changes affect music timing
const { ProceduralGenerator } = require('./src/music/proceduralGenerator');

const generator = new ProceduralGenerator();
let eventCount = 0;
let lastEventTime = null;

console.log('Testing tempo changes...\n');

// Test at 120 BPM (default)
console.log('Testing at 120 BPM (should trigger ~8 events per second):');
generator.setTempo(120);
testTiming(2000);

setTimeout(() => {
    // Test at 60 BPM
    console.log('\nChanging to 60 BPM (should trigger ~4 events per second):');
    generator.setTempo(60);
    eventCount = 0;
    lastEventTime = null;
    testTiming(2000);

    setTimeout(() => {
        // Test at 240 BPM
        console.log('\nChanging to 240 BPM (should trigger ~16 events per second):');
        generator.setTempo(240);
        eventCount = 0;
        lastEventTime = null;
        testTiming(2000);

        setTimeout(() => {
            process.exit(0);
        }, 2100);
    }, 2100);
}, 2100);

function testTiming(duration) {
    const startTime = Date.now();
    const interval = setInterval(() => {
        const events = generator.update();
        if (events) {
            eventCount++;
            const now = Date.now();
            const timeSinceStart = (now - startTime) / 1000;
            const timeSinceLast = lastEventTime ? ((now - lastEventTime) / 1000).toFixed(3) : 'N/A';
            lastEventTime = now;

            if (eventCount <= 5) {
                console.log(`  Event ${eventCount} at ${timeSinceStart.toFixed(3)}s (gap: ${timeSinceLast}s)`);
            }
        }

        if (Date.now() - startTime > duration) {
            clearInterval(interval);
            const elapsed = (Date.now() - startTime) / 1000;
            const eventsPerSecond = (eventCount / elapsed).toFixed(1);
            console.log(`  Total: ${eventCount} events in ${elapsed.toFixed(1)}s = ${eventsPerSecond} events/sec`);
        }
    }, 5);
}