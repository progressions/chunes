# H Mode (Harmony Building Mode) - Technical Specification

## Overview
H Mode is a live harmony building mode that allows real-time construction of harmonic patterns by adding scale-appropriate notes to monochromatic channel drones while they play.

## Mode Activation & State

### Entering H Mode
- **Trigger**: Press `H` key from Live Generation Mode
- **Initial State**: Each channel starts with root note of current key as monochromatic pulse
- **Transition**: Smooth fade from procedural generation to drone state (500ms)

### Channel Initialization
```javascript
const hModeInitialization = {
  // All channels start with root note drone
  channel1: { note: getCurrentKey().root, pattern: [1,1,1,1,1,1,1,1] }, // Root pulse
  channel2: { note: getCurrentKey().root, pattern: [1,1,1,1,1,1,1,1] }, // Root pulse  
  channel3: { note: getCurrentKey().root, pattern: [1,1,1,1,1,1,1,1] }, // Root pulse
  channel4: { note: getCurrentKey().root, pattern: [1,1,1,1,1,1,1,1] }, // Root pulse
  
  selectedChannel: 1,  // Start with Channel 1 selected
  
  // Preserve current parameters
  tempo: getCurrentTempo(),
  key: getCurrentKey(),
  scale: getCurrentScale(),
  timeSignature: getCurrentTimeSignature(),
  loopLength: getCurrentLoopLength()
};
```

## Channel Selection System

### Navigation Controls
- **`[` key**: Move up one channel (1→2→3→4→1)
- **`]` key**: Move down one channel (4→3→2→1→4)
- **Wrapping**: Channel selection wraps around (after Ch4 goes to Ch1)

### Visual Channel Selection Indicator
```javascript
const channelSelectionDisplay = {
  // Selected channel highlighting
  selectedChannel: {
    indicator: '←',           // Right-pointing arrow after selected channel
    indicatorColor: '#ff6b9d', // Hot pink indicator
    channelHighlight: {
      background: '#0f3460',   // Dark blue background
      border: '#00b894'        // Mint green border
    }
  },
  
  // Unselected channels
  unselectedChannel: {
    background: 'transparent',
    border: 'none'
  }
};
```

### Visual Example
```
│ Ch1 ∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~ │ ←
│ Ch2 ~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~ │
│ Ch3 ▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂ │
│ Ch4 ▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░ │
     ↑ (Ch1 selected - hot pink arrow, mint green highlight)
```

## Note Addition System

### Note Addition Control
- **`P` key**: Add random scale-appropriate note at current loop position
- **Timing**: Note added at whatever beat position is currently playing
- **Scale Compliance**: Only notes from current scale (Major/Minor/Blues) are selected
- **Randomization**: Random selection from available scale notes

### Note Addition Logic
```javascript
const noteAddition = {
  // Get available notes from current scale
  getAvailableNotes: () => {
    const currentKey = getCurrentKey();
    const currentScale = getCurrentScale();
    const scaleNotes = getScaleNotes(currentKey, currentScale);
    
    // Exclude notes already heavily present in pattern
    const availableNotes = scaleNotes.filter(note => {
      const usage = calculateNoteUsage(selectedChannel, note);
      return usage < 0.5; // Don't overuse any single note
    });
    
    return availableNotes.length > 0 ? availableNotes : scaleNotes;
  },
  
  // Add note at current position
  addNoteAtCurrentPosition: () => {
    const currentBeat = getCurrentLoopPosition();
    const availableNotes = getAvailableNotes();
    const randomNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    
    // Insert note into channel pattern
    insertNoteIntoPattern(selectedChannel, currentBeat, randomNote);
  },
  
  // Pattern integration
  insertNoteIntoPattern: (channel, position, note) => {
    const pattern = channels[channel].pattern;
    const loopLength = getCurrentLoopLength() * 4; // Convert bars to beats
    const beatIndex = position % loopLength;
    
    // Add note to pattern at specific beat
    pattern[beatIndex] = { note: note, velocity: getRandomVelocity() };
  }
};
```

### Pattern Evolution Example
```javascript
// Initial state (C root drone)
pattern: [C, C, C, C, C, C, C, C]

// After first P press at beat 3 (adds D)
pattern: [C, C, D, C, C, C, C, C]

// After second P press at beat 6 (adds E)  
pattern: [C, C, D, C, C, E, C, C]

// After third P press at beat 1 (adds G)
pattern: [G, C, D, C, C, E, C, C]
```

## Parameter Integration

### H Mode Parameter Display
```
├─── PARAMETERS ─────────────────────────────────────────────────┤
│ Genre: Rock    Key: C Major    Scale: Major    Time: 4/4     │
│ Tempo: 120 BPM    Loop: 8 bars    Swing: OFF    Mode: H-LIVE │
│ Selected Channel: Ch1 (Lead)    Pattern Complexity: Simple   │
└─────────────────────────────────────────────────────────────────┘
```

### Parameter Change Behavior
```javascript
const parameterIntegration = {
  // Tempo changes
  tempo: {
    behavior: 'immediate',
    effect: 'changes playback speed of all built patterns'
  },
  
  // Key changes  
  key: {
    behavior: 'transpose',
    effect: 'all built patterns transpose to new key',
    example: 'C-D-E pattern becomes D-E-F# in D Major'
  },
  
  // Scale changes
  scale: {
    behavior: 'affects_future_additions',
    effect: 'existing notes remain, new P presses use new scale',
    constraint: 'may limit available notes for addition'
  },
  
  // Time signature changes
  timeSignature: {
    behavior: 'restructure_patterns',
    effect: 'patterns adapt to new beat grouping',
    example: '4/4 pattern [C,D,E,F] becomes 3/4 [C,D,E]'
  },
  
  // Loop length changes
  loopLength: {
    behavior: 'extend_or_truncate',
    effect: 'patterns repeat or extend to match new length'
  }
};
```

## Pattern Persistence & State Management

### Channel Pattern Storage
```javascript
const hModeState = {
  channels: {
    1: {
      baseNote: 'C4',
      pattern: [
        { beat: 0, note: 'C4', velocity: 80 },
        { beat: 2, note: 'D4', velocity: 75 },
        { beat: 5, note: 'E4', velocity: 82 }
      ],
      complexity: 'simple'  // simple, medium, complex
    },
    2: { /* similar structure */ },
    3: { /* similar structure */ },  
    4: { /* similar structure */ }
  },
  
  selectedChannel: 1,
  
  // Preserve mode state
  isActive: true,
  lastModified: timestamp,
  
  // Pattern metadata
  totalNotesAdded: 15,
  averageComplexity: 'medium'
};
```

### Cross-Channel Coordination
```javascript
const channelCoordination = {
  // Independent playback
  playback: 'independent',     // Each channel maintains its own pattern
  
  // Harmonic awareness (future enhancement)
  harmonicRules: {
    avoidClashes: false,       // For now, allow any combinations
    preferConsonance: false,   // Future: could prefer harmonic intervals
    voiceLeading: false        // Future: could implement voice leading rules
  },
  
  // Visual synchronization
  visualization: 'synchronized'  // All channels show same gradient flow timing
};
```

## Mode Exit & Integration

### Exiting H Mode
- **First H press**: Enter H Mode (procedural → harmony building)
- **Second H press**: Return to Live Mode with pattern memory
- **Behavior**: Built patterns continue playing, procedural generation resumes on top

### Pattern Integration Logic
```javascript
const modeExit = {
  // Preserve built patterns as foundation
  preservePatterns: true,
  
  // Resume procedural generation
  proceduralBehavior: {
    foundation: 'use_built_patterns_as_base',
    generation: 'add_procedural_elements_on_top',
    harmony: 'respect_established_patterns',
    rhythm: 'complement_existing_rhythms'
  },
  
  // Transition smoothness
  transition: {
    duration: 500,              // 500ms fade
    effect: 'gradual_procedural_introduction',
    preserve: 'all_built_harmony'
  }
};
```

### Buffer Mode Integration
- **B key from H Mode**: Switch to Buffer Playback Mode
- **Behavior**: All built patterns are recorded in buffer
- **Export**: Built patterns can be exported as themes
- **Return**: Can return to H Mode with patterns intact

## Control Summary

### H Mode Controls
```
Mode Control:
H                    - Toggle H Mode (enter/exit)

Channel Navigation:
[ ]                  - Previous/Next channel selection

Pattern Building:
P                    - Add random scale note at current position

Standard Parameters (still active):
T/Shift+T           - Tempo
K/Shift+K           - Key (transposes patterns)
S/Shift+S           - Scale (affects future additions)
3/4                 - Time signature
L/Shift+L           - Loop length
W                   - Swing

Mode Switching:
B                   - Buffer Mode (with built patterns)
Q                   - Quit
```

## Technical Implementation Notes

### Pattern Data Structure
```javascript
const channelPattern = {
  baseNote: 'C4',               // Root drone note
  addedNotes: [                 // Additional notes added via P key
    { position: 2, note: 'D4', velocity: 75, timestamp: '...' },
    { position: 5, note: 'E4', velocity: 82, timestamp: '...' },
    { position: 7, note: 'G4', velocity: 78, timestamp: '...' }
  ],
  loopLength: 8,                // In beats
  complexity: 0.375             // Ratio of added notes to total positions
};
```

### Random Note Selection Algorithm
```javascript
const noteSelection = {
  // Weight notes by harmonic function
  weights: {
    root: 0.3,          // 30% chance
    third: 0.25,        // 25% chance  
    fifth: 0.25,        // 25% chance
    seventh: 0.15,      // 15% chance (if in scale)
    other: 0.05         // 5% chance for other scale tones
  },
  
  // Avoid over-repetition
  recentNotesPenalty: 0.5,    // 50% reduction for recently used notes
  recentNotesWindow: 4,       // Last 4 additions count as "recent"
  
  // Ensure variety
  minimumInterval: 1,         // At least 1 semitone from last note
  maximumRepeats: 3          // Max 3 consecutive identical notes
};
```

This H Mode specification provides a complete framework for real-time harmony building with intuitive controls and seamless integration with the existing chiptune generator system.