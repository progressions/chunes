# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chiptune Generator - A Node.js command-line application for generating continuous NES-style chiptune music with real-time parameter control, buffer recording/playback, and theme export capabilities.

## Key Commands

### Development
- `npm start` or `npm run dev` - Launch the chiptune generator application
- `node src/main.js` - Direct application launch

### Testing
- `node test-audio.js` - Run audio system tests (test file in root)

## Architecture

### Core Systems

The application follows a modular architecture with distinct subsystems:

1. **Audio System** (`src/audio/`)
   - `continuousPlayer.js` - Main audio streaming engine handling continuous playback
   - `oscillators.js` - NES-style waveform generators (Pulse, Triangle, Noise)
   - `mixer.js` - Multi-channel audio mixing

2. **Music Generation** (`src/music/`)
   - `proceduralGenerator.js` - Primary procedural music generation logic
   - `scales.js` - Musical scale definitions and note mappings
   - `chords.js` - Chord progressions and harmony generation
   - `rhythm.js` - Rhythm and percussion pattern generation

3. **UI System** (`src/ui/`)
   - `enhancedDisplay.js` - Main UI manager using blessed terminal interface
   - `controls.js` - Keyboard input handling and control mapping
   - `visualizer.js` - Real-time audio visualization

4. **Mode System** (`src/modes/`)
   - `live.js` - Live generation mode with real-time parameter control
   - `buffer.js` - Buffer playback mode for seeking, selection, and export

5. **Export System** (`src/export/`)
   - `buffer.js` - Buffer recording and management
   - `themes.js` - Theme export for game integration
   - `session.js` - Full session save/load functionality

### Data Flow

1. Main entry point (`src/main.js`) initializes all subsystems
2. ProceduralGenerator creates musical note sequences based on parameters
3. ContinuousAudioPlayer generates audio samples using oscillators
4. BufferManager records audio for later playback and export
5. UI displays real-time visualization and handles user input
6. Mode system switches between live generation and buffer playback

### File Storage

- `sessions/` - Auto-saved session data with timestamps
- `themes/` - Exported JSON theme clips for game integration
- `loops/` - Saved loop configurations
- `config/` - Musical configuration (scales.json, genres.json)

## Dependencies

Key NPM packages used:
- `speaker` - Audio output
- `blessed` - Terminal UI
- `chalk` - Terminal styling
- `gradient-string` - Visual effects
- `fs-extra` - Enhanced file operations
- `uuid` - Unique identifiers