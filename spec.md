# Chiptune Procedural Music Generator - Complete Technical Specification

## Overview
A Node.js command-line application that generates continuous chiptune music loops with real-time parameter control and exports musical themes as data files for game integration.

## System Architecture

### Audio Engine (NES-Style 4-Channel Architecture)
```
Channel 1: Pulse Wave A (Lead Melody)
- Square wave with duty cycle control (12.5%, 25%, 50%, 75%)
- Frequency range: ~100Hz - 2000Hz
- Follows chord tones and scale notes
- Primary melodic voice

Channel 2: Pulse Wave B (Harmony)
- Square wave with duty cycle control
- Plays chord tones, thirds, fifths
- Rhythmic counterpoint to Channel 1

Channel 3: Triangle Wave (Bass)
- Pure triangle wave (no duty cycle)
- Lower frequency range: ~50Hz - 500Hz
- Plays root notes of chord progression
- Simple bass patterns

Channel 4: Noise Channel (Percussion)
- White/periodic noise generation
- 16 different noise periods
- Genre-specific drum patterns
- Hi-hats, snares, kicks
```

### Harmonic System
- **Chord Progressions**: Simple I-V-vi-IV style progressions per genre
- **Scale System**: Configurable note availability (extensible for modes)
- **Voice Leading**: All channels follow harmonic rules together
- **Parameter Transitions**: Smooth fading between changes (not instant)

## Two-Mode System

### Mode 1: Live Generation Mode (Default)
- Real-time procedural music generation
- Parameter controls (T, G, K, S, L, W, etc.)
- Continuous recording to buffer
- Visual display of current generation

### Mode 2: Buffer Playback Mode
- **Enter**: Press `B` key to switch to Buffer mode
- **Exit**: Press `Esc` or `Q` to return to Live mode
- Playback and selection of recorded buffer content
- Export functionality

## Audio Implementation

### Node.js CLI Audio (No Web Server)
- **node-speaker** + custom oscillator generation
- Generate raw PCM audio data for chiptune waveforms
- Real-time audio streaming to system audio

### Waveform Generation Structure
```javascript
const channels = {
  pulse1: { waveType: 'square', dutyCycle: 0.5, frequency: 440 },
  pulse2: { waveType: 'square', dutyCycle: 0.25, frequency: 330 },
  triangle: { waveType: 'triangle', frequency: 110 },
  noise: { waveType: 'noise', period: 16 }
}
```

## Genre System (MVP: 3 Genres)

### Soft
- **Rhythm**: Gentle, legato patterns
- **Chords**: Extended chords, jazz-influenced
- **Tempo Range**: 60-100 BPM
- **Channel Behavior**: Smoother attacks, longer notes

### Rock
- **Rhythm**: Driving eighth notes, strong beats
- **Chords**: Power chords, simple progressions
- **Tempo Range**: 100-140 BPM
- **Channel Behavior**: Sharp attacks, staccato elements

### Bossa
- **Rhythm**: Syncopated, off-beat emphasis
- **Chords**: Extended jazz chords with 7ths
- **Tempo Range**: 80-120 BPM
- **Channel Behavior**: Swing feel, complex rhythms

## Scale/Mode System (Extensible)

### Configuration-Based Note Availability
```javascript
const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],        // C D E F G A B
  minor: [0, 2, 3, 5, 7, 8, 10],        // C D Eb F G Ab Bb
  blues: [0, 3, 5, 6, 7, 10]            // C Eb F F# G Bb
}
```

### Future Mode Extension Ready
- System designed to accept any scale pattern
- Easy addition of Dorian, Mixolydian, etc.

## Live Generation Mode

### Control Scheme (Keyboard-Based)
```
Parameter Controls:
Tempo: T (up) / Shift+T (down) - cycle through BPM values
Time Signature: 3 (3/4) / 4 (4/4) - simple toggle
Key: K (up) / Shift+K (down) - cycle through keys C, D, E, F, G, A, B
Scale: S (up) / Shift+S (down) - cycle major, minor, blues
Genre: G (up) / Shift+G (down) - cycle soft, rock, bossa
Loop Length: L (up) / Shift+L (down) - cycle 4, 8, 16 measures
Swing: W - toggle swing/shuffle on/off

Mode Control:
B - Enter Buffer Playback Mode
Q or Ctrl+C - Quit application
```

### Visual Display System
```
┌─ LIVE GENERATION MODE ─ [Buffer: 3m:45s] ─ [B] Buffer Mode ─┐
│ Genre: Rock | Key: C Major | Scale: Major | 4/4             │
│ Tempo: 120 BPM | Loop: 8 bars | Swing: OFF                 │
├──────────────────────────────────────────────────────────────┤
│ Ch1: ∿∿∿~~~∿∿∿~~~∿∿∿~~~∿∿∿  (Lead)                        │
│ Ch2: ~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~  (Harmony)                    │  
│ Ch3: ▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁  (Bass)                       │
│ Ch4: ▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░  (Drums)                      │
├──────────────────────────────────────────────────────────────┤
│ Recording to buffer... [3m:45s]                             │
│ [T] Tempo [G] Genre [K] Key [S] Scale [L] Loop [W] Swing    │
└──────────────────────────────────────────────────────────────┘
```

### Color Scheme (Pastel Spectrum)
- **Channel 1**: Soft blue waves
- **Channel 2**: Gentle green waves
- **Channel 3**: Warm orange/peach
- **Channel 4**: Light purple/lavender
- **Parameters**: Soft yellow highlights
- **Current Position**: Bright white

## Buffer Playback Mode

### Visual Layout
```
┌─ BUFFER PLAYBACK MODE ─────────────────────────────────┐
│ Total Buffer: 5m:23s | Playing: 2m:15s / 2m:25s      │
├───────────────────────────────────────────────────────┤
│ Timeline: [────●────[====]────────────────────]       │
│           0:00   2:15  2:25                    5:23   │
├───────────────────────────────────────────────────────┤
│ Selection: 2m:15s → 2m:25s (10.0 seconds)            │
│ Parameters at 2m:15s:                                 │
│   Genre: Rock | Key: C Major | Tempo: 120 BPM        │
│   Scale: Major | Time: 4/4 | Loop: 8 bars            │
├───────────────────────────────────────────────────────┤
│ CONTROLS:                                             │
│ [←→] Seek  [Space] Play/Pause  [Enter] Set Mark      │
│ [Shift+Enter] Set End  [S] Save Selection  [C] Clear │
│ [Esc] Back to Live Mode                               │
└───────────────────────────────────────────────────────┘
```

### Buffer Mode Controls
```
Navigation:
← → (Arrow Keys)     - Seek backward/forward (1 second steps)
Shift + ← →          - Seek backward/forward (10 second steps)
Home / End           - Jump to buffer start/end
Page Up / Page Down  - Jump by 30 seconds

Playback:
Space                - Play/Pause current position
R                    - Restart from selection start

Selection:
Enter                - Set selection start point
Shift + Enter        - Set selection end point
C                    - Clear current selection
A                    - Select all buffer content

Export:
S                    - Save current selection as theme file
P                    - Preview selection (play selection on loop)

Mode Control:
B or Esc             - Return to Live Generation Mode
Q                    - Quit application
```

### Selection Workflow
1. **Enter Buffer Mode**: Press `B` from Live mode
2. **Navigate**: Use arrow keys to find interesting section
3. **Listen**: Press `Space` to play from current position
4. **Mark Start**: Press `Enter` when you hear start of desired section
5. **Mark End**: Continue listening, press `Shift+Enter` at end point
6. **Preview**: Press `P` to loop the selected section
7. **Save**: Press `S` to export as theme file
8. **Continue**: Return to Live mode with `Esc` or find another section

## Loop System

### Loop Lengths
- **4 measures**: Quick, punchy loops
- **8 measures**: Standard pop/rock structure
- **16 measures**: Extended development

### Loop Behavior
- Generate procedural content for loop length
- Repeat until parameters change or new loop generated
- Smooth transitions between loops when parameters change

### Swing/Shuffle Implementation
- Delay every other note by configurable amount
- Typical swing: 67% / 33% timing split instead of 50% / 50%
- Toggle on/off with W key

## Data Export System

### File Format for Game Consumption (JSON Theme Files)
```javascript
{
  "theme_id": "rock_theme_001",
  "timestamp": "2025-09-15T14:30:22Z",
  "duration_seconds": 8.5,
  "parameters": {
    "genre": "rock",
    "key": "C",
    "scale": "major", 
    "time_signature": "4/4",
    "tempo": 120,
    "swing": false,
    "loop_length": 8
  },
  "channels": {
    "pulse1": [
      {"time": 0.0, "note": "C4", "duration": 0.5, "velocity": 80},
      {"time": 0.5, "note": "E4", "duration": 0.5, "velocity": 75},
      {"time": 1.0, "note": "G4", "duration": 1.0, "velocity": 85}
    ],
    "pulse2": [
      {"time": 0.0, "note": "E3", "duration": 1.0, "velocity": 60},
      {"time": 1.0, "note": "G3", "duration": 1.0, "velocity": 65}
    ],
    "triangle": [
      {"time": 0.0, "note": "C2", "duration": 2.0, "velocity": 90},
      {"time": 2.0, "note": "F2", "duration": 2.0, "velocity": 85}
    ],
    "noise": [
      {"time": 0.0, "type": "kick", "duration": 0.1},
      {"time": 0.5, "type": "snare", "duration": 0.1},
      {"time": 1.0, "type": "kick", "duration": 0.1}
    ]
  }
}
```

### Storage Strategy
- **Session Files**: Auto-save each session in `./sessions/YYYY-MM-DD_HH-MM/`
- **Exported Themes**: User-saved sections in `./themes/`
- **File Size**: JSON themes ~1-5KB each (for 2-10 second clips)
- **Session Persistence**: Save current state on exit, restore on startup
- **File Naming**: Auto-generated IDs with genre prefix (e.g., `rock_theme_001.json`)

## Music Buffer System

### Buffer Management
- Continuous recording of generated music in memory
- Buffer duration: Session-based (temporary file storage)
- Real-time navigation through buffer history
- Visual timeline with current position indicator

### Buffer Data Structure
```javascript
const buffer = {
  totalDuration: 345.7,  // seconds
  currentPosition: 0,
  selection: { start: null, end: null },
  audioData: [...],      // PCM audio samples
  timeline: [            // Parameter changes over time
    { time: 0, params: { genre: 'rock', key: 'C', ... }},
    { time: 45.2, params: { genre: 'rock', tempo: 140, ... }},
    // ...
  ]
}
```

## Technical Implementation

### Dependencies
```json
{
  "node-speaker": "^0.5.4",
  "blessed": "^0.1.81", 
  "chalk": "^5.3.0",
  "gradient-string": "^2.0.2",
  "keypress": "^0.2.1",
  "fs-extra": "^11.1.1",
  "uuid": "^9.0.0"
}
```

### Project Structure
```
/chiptune-generator
├── src/
│   ├── audio/
│   │   ├── oscillators.js      # Waveform generation
│   │   ├── mixer.js            # Channel mixing
│   │   └── player.js           # Audio output
│   ├── music/
│   │   ├── scales.js           # Scale definitions
│   │   ├── chords.js           # Chord progressions
│   │   ├── rhythm.js           # Rhythm patterns
│   │   └── generator.js        # Procedural music logic
│   ├── ui/
│   │   ├── display.js          # Terminal interface
│   │   ├── controls.js         # Keyboard input
│   │   └── visualizer.js       # Channel visualization
│   ├── modes/
│   │   ├── live.js             # Live generation mode
│   │   └── buffer.js           # Buffer playback mode
│   ├── export/
│   │   ├── buffer.js           # Music buffer management
│   │   └── themes.js           # Theme export system
│   └── main.js                 # Entry point
├── sessions/                   # Auto-saved sessions
├── themes/                     # Exported themes
├── config/
│   ├── scales.json            # Scale definitions
│   └── genres.json            # Genre configurations
├── package.json
└── README.md
```

### Startup Behavior
1. Initialize audio system
2. Load previous session state (if exists)
3. Begin playing with default parameters:
   - Genre: Random selection from [soft, rock, bossa]
   - Key: C Major
   - Time Signature: 4/4
   - Tempo: 120 BPM
   - Loop Length: 8 measures
   - Swing: OFF
4. Display terminal interface with real-time visualization

---

# Development Roadmap - Atomic Implementation Chunks

## Phase 1: Foundation (Basic App Structure)
**Goal**: Get the app running with basic terminal interface and keyboard input

### 1.1 Project Setup
- [ ] Initialize npm project with dependencies
- [ ] Create project structure with empty files
- [ ] Set up main.js entry point
- [ ] Basic package.json with all required dependencies

### 1.2 Terminal Interface Foundation
- [ ] Initialize blessed terminal interface
- [ ] Create basic layout boxes (header, content, footer)
- [ ] Implement basic color scheme with chalk/gradient-string
- [ ] Display static "CHIPTUNE GENERATOR" interface

### 1.3 Keyboard Input System
- [ ] Set up keypress event handling
- [ ] Create input handler for basic keys (Q to quit)
- [ ] Test keyboard responsiveness
- [ ] Implement graceful exit on Ctrl+C

**Deliverable**: App launches, shows interface, accepts Q to quit

---

## Phase 2: Basic Audio Output
**Goal**: Generate and play a simple tone through speakers

### 2.1 Audio System Setup
- [ ] Initialize node-speaker for audio output
- [ ] Create basic audio stream pipeline
- [ ] Test system audio connectivity
- [ ] Handle audio system errors gracefully

### 2.2 Simple Oscillator
- [ ] Create basic square wave oscillator function
- [ ] Generate PCM audio data at 44.1kHz
- [ ] Play continuous 440Hz tone (A note)
- [ ] Add volume control

### 2.3 Audio Controls
- [ ] Space key to start/stop audio
- [ ] Volume up/down with +/- keys
- [ ] Test audio output stability

**Deliverable**: App plays/stops a continuous tone with keyboard control

---

## Phase 3: Multiple Channels
**Goal**: Generate 4 separate audio channels with different waveforms

### 3.1 Channel Architecture
- [ ] Create Channel class for individual audio channels
- [ ] Implement square wave (pulse1, pulse2)
- [ ] Implement triangle wave (triangle)
- [ ] Implement noise generation (noise)

### 3.2 Audio Mixer
- [ ] Create mixer to combine 4 channels
- [ ] Set individual channel volumes
- [ ] Test all 4 channels playing simultaneously
- [ ] Balance channel levels

### 3.3 Channel Visualization
- [ ] Display 4 channel rows in terminal
- [ ] Show basic activity indicators per channel
- [ ] Color-code each channel (blue, green, orange, purple)

**Deliverable**: 4 channels playing different waveforms with visual feedback

---

## Phase 4: Basic Music Theory
**Goal**: Play actual musical notes and simple chord progressions

### 4.1 Note System
- [ ] Create note-to-frequency conversion
- [ ] Implement chromatic scale (C, C#, D, etc.)
- [ ] Test playing individual notes on command
- [ ] Add octave support (C3, C4, C5)

### 4.2 Scale System
- [ ] Implement major scale configuration
- [ ] Create scale class with note availability
- [ ] Test playing notes within scale constraints
- [ ] Add minor and blues scales

### 4.3 Simple Chord Progression
- [ ] Create basic I-V-vi-IV progression in C major
- [ ] Assign channels: bass (root), harmony (3rd/5th), melody (scale notes)
- [ ] Play static 4-chord loop
- [ ] Test harmonic relationships between channels

**Deliverable**: Plays a musical chord progression with proper harmony

---

## Phase 5: Rhythm and Timing
**Goal**: Add rhythmic patterns and measure-based looping

### 5.1 Timing System
- [ ] Implement BPM-based timing
- [ ] Create measure/beat subdivision system
- [ ] Test steady tempo at 120 BPM
- [ ] Add 4/4 time signature support

### 5.2 Rhythm Patterns
- [ ] Create basic rhythm patterns for each channel
- [ ] Implement note on/off timing
- [ ] Add simple drum patterns for noise channel
- [ ] Test synchronized channel timing

### 5.3 Loop System
- [ ] Implement 8-measure loop structure
- [ ] Auto-repeat loop when complete
- [ ] Test seamless loop transitions
- [ ] Add loop length variation (4, 8, 16 measures)

**Deliverable**: Plays rhythmic musical loops that repeat seamlessly

---

## Phase 6: Live Parameter Control
**Goal**: Real-time parameter changes while music plays

### 6.1 Parameter System
- [ ] Create parameter state management
- [ ] Implement key controls (T for tempo, K for key, etc.)
- [ ] Display current parameters in interface
- [ ] Test parameter changes during playback

### 6.2 Smooth Transitions
- [ ] Implement gradual parameter changes (not instant)
- [ ] Add transition timing for tempo/key changes
- [ ] Test parameter change smoothness
- [ ] Handle edge cases (extreme values)

### 6.3 Genre System
- [ ] Create 3 genre configurations (soft, rock, bossa)
- [ ] Implement genre-specific rhythm patterns
- [ ] Add genre switching with G key
- [ ] Test distinct musical styles

**Deliverable**: Full live parameter control with smooth transitions

---

## Phase 7: Procedural Generation
**Goal**: Generate varied musical content automatically

### 7.1 Simple Randomization
- [ ] Add random note selection within scales
- [ ] Randomize rhythm variations
- [ ] Create simple melody generation rules
- [ ] Test musical coherence

### 7.2 Harmonic Rules
- [ ] Implement chord progression logic
- [ ] Ensure channels follow harmonic relationships
- [ ] Add voice leading between chords
- [ ] Test harmonic quality

### 7.3 Style Variation
- [ ] Create variation patterns within genres
- [ ] Add occasional rhythm variations
- [ ] Implement simple song structure (verse/chorus ideas)
- [ ] Test long-term musical interest

**Deliverable**: Continuously varying procedural music generation

---

## Phase 8: Music Buffer System
**Goal**: Record and store generated music for later playback

### 8.1 Buffer Recording
- [ ] Implement continuous audio recording to memory
- [ ] Store audio data with timestamps
- [ ] Track parameter changes over time
- [ ] Test buffer memory management

### 8.2 Buffer Playback
- [ ] Create playback system for recorded audio
- [ ] Implement seek/scrub functionality
- [ ] Add play/pause controls
- [ ] Test audio quality and synchronization

### 8.3 Timeline Management
- [ ] Create timeline data structure
- [ ] Store parameter states at time points
- [ ] Implement buffer size limits
- [ ] Add buffer cleanup/management

**Deliverable**: Records and plays back generated music sessions

---

## Phase 9: Buffer Playback Mode
**Goal**: Dedicated interface for buffer navigation and selection

### 9.1 Mode Switching
- [ ] Implement B key to enter buffer mode
- [ ] Create separate buffer mode interface
- [ ] Add Esc key to return to live mode
- [ ] Test mode transitions

### 9.2 Buffer Navigation
- [ ] Arrow key seeking through buffer
- [ ] Timeline visualization with position indicator
- [ ] Time display (current/total)
- [ ] Test navigation responsiveness

### 9.3 Selection System
- [ ] Enter key to mark selection start
- [ ] Shift+Enter for selection end
- [ ] Visual selection highlighting
- [ ] Clear and preview selection functionality

**Deliverable**: Full buffer playback mode with selection tools

---

## Phase 10: Export System
**Goal**: Save selected music as JSON theme files

### 10.1 Data Conversion
- [ ] Convert audio buffer to note/timing data
- [ ] Create JSON theme file format
- [ ] Include parameter metadata
- [ ] Test data accuracy

### 10.2 File Export
- [ ] Implement S key to save selections
- [ ] Auto-generate meaningful filenames
- [ ] Create themes/ directory structure
- [ ] Test file creation and validity

### 10.3 Session Persistence
- [ ] Save session state on exit
- [ ] Restore session on startup
- [ ] Manage session files
- [ ] Test session continuity

**Deliverable**: Complete export system producing game-ready theme files

---

## Phase 11: Polish and Optimization
**Goal**: Finalize interface, performance, and user experience

### 11.1 Visual Polish
- [ ] Enhance channel visualizations with waveforms
- [ ] Improve color schemes and animations
- [ ] Add smooth visual transitions
- [ ] Polish all interface elements

### 11.2 Performance Optimization
- [ ] Optimize audio generation performance
- [ ] Improve memory usage for long sessions
- [ ] Reduce CPU usage during idle periods
- [ ] Test on various system configurations

### 11.3 Error Handling and Documentation
- [ ] Add comprehensive error handling
- [ ] Create user documentation/help system
- [ ] Add in-app help (H key)
- [ ] Test edge cases and error recovery

**Deliverable**: Production-ready chiptune generator with polished UX

---

Each phase builds incrementally on the previous phases, ensuring working functionality at every step. The developer can test and validate each chunk before moving to the next, making debugging easier and progress more visible.# Addition to Specification: Loop Loading System

## Session and Loop Management

### Enhanced File Structure
```
/chiptune-generator
├── sessions/                   # Auto-saved full sessions
│   ├── 2025-09-15_14-30/
│   │   ├── session.json       # Full session state
│   │   ├── buffer.wav         # Audio buffer
│   │   └── timeline.json      # Parameter timeline
├── themes/                     # Exported theme clips (2-10 seconds)
│   ├── rock_theme_001.json
│   ├── bossa_theme_042.json
│   └── battle_music_intense.json
├── loops/                      # **NEW: Saved loop configurations**
│   ├── rock_groove_120.json
│   ├── bossa_chill_95.json
│   └── soft_ambient_80.json
```

## Loop Save/Load System

### Loop File Format
```javascript
{
  "loop_id": "rock_groove_120",
  "name": "Rock Groove 120 BPM",
  "timestamp": "2025-09-15T14:30:22Z",
  "loop_data": {
    "parameters": {
      "genre": "rock",
      "key": "C",
      "scale": "major",
      "time_signature": "4/4", 
      "tempo": 120,
      "swing": false,
      "loop_length": 8
    },
    "pattern_seed": 12345,           # For procedural regeneration
    "chord_progression": ["C", "Am", "F", "G"],
    "rhythm_patterns": {
      "pulse1": [1, 0, 1, 0, 1, 0, 0, 1],
      "pulse2": [0, 1, 0, 1, 0, 1, 1, 0],
      "triangle": [1, 0, 0, 0, 1, 0, 0, 0],
      "noise": [1, 0, 1, 0, 1, 0, 1, 0]
    },
    "note_sequences": {             # Optional: exact notes if needed
      "pulse1": [...],
      "pulse2": [...],
      "triangle": [...],
      "noise": [...]
    }
  }
}
```

### Live Generation Mode - Enhanced Controls

#### Additional Keyboard Controls
```
Loop Management:
Ctrl+S - Quick save current loop state to loops/ folder
Ctrl+L - Open loop loader interface
Ctrl+N - Reset to new random loop (clear current)

Existing controls remain the same:
T/Shift+T - Tempo, G/Shift+G - Genre, etc.
```

### Loop Loader Interface

#### Visual Layout (Overlay Mode)
```
┌─ LOOP LOADER ──────────────────────────────────────────┐
│ Available Loops (3 found):                            │
├────────────────────────────────────────────────────────┤
│ > rock_groove_120.json     [Rock | C Major | 120 BPM] │
│   bossa_chill_95.json      [Bossa | F Major | 95 BPM] │
│   soft_ambient_80.json     [Soft | A Minor | 80 BPM]  │
├────────────────────────────────────────────────────────┤
│ Preview: rock_groove_120.json                          │
│ Genre: Rock | Key: C Major | Scale: Major | 4/4       │
│ Tempo: 120 BPM | Loop: 8 bars | Created: 2025-09-15   │
├────────────────────────────────────────────────────────┤
│ [↑↓] Select [Enter] Load [P] Preview [D] Delete       │
│ [N] New Name [Esc] Cancel                              │
└────────────────────────────────────────────────────────┘
```

#### Loop Loader Controls
```
Navigation:
↑ ↓ (Arrow Keys)    - Select different loops
Enter               - Load selected loop into live session
P                   - Preview selected loop (play 2-3 cycles)
D                   - Delete selected loop (with confirmation)
N                   - Rename selected loop
Esc                 - Cancel and return to live mode

Preview Controls (during P preview):
Space               - Stop preview
Enter               - Load this loop and exit preview
Esc                 - Stop preview, return to list
```

### Quick Save Interface

#### Save Current Loop (Ctrl+S)
```
┌─ SAVE CURRENT LOOP ────────────────────────────────────┐
│ Current Parameters:                                    │
│ Genre: Rock | Key: C Major | Scale: Major | 4/4       │
│ Tempo: 120 BPM | Loop: 8 bars | Swing: OFF           │
├────────────────────────────────────────────────────────┤
│ Loop Name: [rock_groove_120________________]           │
│                                                        │
│ [Enter] Save [Esc] Cancel                             │
└────────────────────────────────────────────────────────┘
```

### Integration with Existing Modes

#### Live Generation Mode - Updated Status Bar
```
┌─ LIVE GENERATION ─ [Buffer: 3m:45s] ─ Loop: rock_groove_120 ─┐
│ Genre: Rock | Key: C Major | Scale: Major | 4/4              │
│ Tempo: 120 BPM | Loop: 8 bars | Swing: OFF                  │
│ [Ctrl+S] Save Loop [Ctrl+L] Load Loop [B] Buffer Mode       │
```

#### Session Restoration
- When starting app, check for `loops/last_session_loop.json`
- Option to restore last used loop or start fresh
- Preserve loop attribution in session files

### Loop vs Theme vs Session Distinction

#### Three Types of Saved Data:

**1. Loops** (New)
- Current generation parameters + pattern seeds
- Infinite regeneration of similar but varied content
- Used as starting points for new sessions
- File size: ~1-2KB
- Purpose: Reproducible procedural generation state

**2. Themes** (Existing)
- Exact audio sequences (2-10 seconds)
- Fixed musical content for game use
- Exported from buffer selections
- File size: ~1-5KB
- Purpose: Game integration

**3. Sessions** (Existing) 
- Complete session state + full audio buffer
- Everything about a working session
- File size: Variable (could be large)
- Purpose: Continue previous work

### Updated Development Roadmap

#### Add to Phase 6 (Live Parameter Control):
**6.4 Loop Save System**
- [ ] Implement Ctrl+S quick save dialog
- [ ] Create loop file format and saving
- [ ] Add loop naming interface
- [ ] Test loop file creation

#### Add to Phase 7 (Procedural Generation):
**7.4 Reproducible Generation**
- [ ] Add pattern seeds for consistent regeneration
- [ ] Ensure saved loops recreate similar content
- [ ] Test procedural consistency
- [ ] Handle edge cases in pattern recreation

#### New Phase 7.5: Loop Loading System
**Goal**: Load and integrate saved loops into new sessions

**7.5.1 Loop Loader Interface**
- [ ] Create loop loader overlay mode
- [ ] Implement loop file scanning and display
- [ ] Add navigation and selection controls
- [ ] Test interface usability

**7.5.2 Loop Preview System**
- [ ] Implement P key preview functionality
- [ ] Generate and play loop from saved parameters
- [ ] Add preview controls (stop/load)
- [ ] Test preview audio quality

**7.5.3 Loop Integration**
- [ ] Load loop parameters into live generation
- [ ] Seamlessly transition from current to loaded loop
- [ ] Update UI to show loaded loop name
- [ ] Test parameter integration

**7.5.4 Loop Management**
- [ ] Add delete functionality with confirmation
- [ ] Implement loop renaming
- [ ] Handle duplicate names
- [ ] Test file management operations

**Deliverable**: Complete loop save/load system integrated with live generation

### Use Cases

#### Typical Workflow:
1. **Create**: Generate interesting loop in live mode
2. **Save**: Press Ctrl+S, name it "epic_battle_theme"
3. **Later**: Start new session, press Ctrl+L
4. **Load**: Select "epic_battle_theme", press Enter
5. **Modify**: Tweak parameters (tempo, key, etc.) from loaded base
6. **Export**: Use buffer mode to export variations as themes

#### Benefits:
- **Reproducible**: Recreate good musical ideas
- **Iterative**: Build on previous work
- **Organized**: Categorize loops by style/purpose
- **Efficient**: Skip random generation when you have a good starting point

This loop system bridges the gap between the ephemeral live generation and the permanent theme exports, giving users a way to build a library of musical starting points.