# H Mode (Harmony Building Mode) - Technical Specification

## Overview
H Mode is a live harmony building mode that allows real-time construction of harmonic patterns by adding scale-appropriate notes to channels while they play. The mode provides pattern building capabilities with real-time editing and visualization.

## Mode Activation & State

### Entering H Mode
- **Trigger**: Press `H` key from Live Generation Mode
- **Initial State**: Each channel starts with a sparse pattern of notes
- **Transition**: Switches from procedural generation to pattern-based playback

### Channel Initialization
```javascript
const hModeInitialization = {
  // Each channel starts with a sparse pattern
  channel1: { pattern: generateInitialPattern() }, // Sparse melodic pattern
  channel2: { pattern: generateInitialPattern() }, // Sparse harmonic pattern
  channel3: { pattern: generateInitialPattern() }, // Sparse bass pattern
  channel4: { pattern: generateInitialPattern() }, // Sparse rhythm pattern

  selectedChannel: 0,  // Start with Channel 1 (index 0) selected
  insertMode: false,   // Start in channel selection mode

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
- **`[` key**: Move to previous channel (wraps from Ch1 to Ch4)
- **`]` key**: Move to next channel (wraps from Ch4 to Ch1)
- **Number keys 1-4**: Direct channel selection
- **Wrapping**: Channel selection wraps around in both directions

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

### Insert Mode (I Mode)
- **`I` key**: Toggle Insert Mode for manual note placement
- **Visual Indicator**: Shows "INSERT MODE" when active
- **Note Queue**: Displays available notes to select from

### Note Selection and Placement
- **`[` / `]` keys in Insert Mode**: Navigate through available notes (octaves 2-6)
- **`P` key**: Place selected note at current playhead position
- **Note Duration**: Notes play as quarter notes (4 steps)
- **Scale Compliance**: Notes are automatically adjusted to current scale

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

### Mode Transitions
- **First H press**: Enter H Mode (procedural → harmony building)
- **Second H press**: Return to Live Mode (progression mode)
- **I key**: Toggle Insert Mode within H Mode
- **Behavior**: Built patterns are preserved when switching modes

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
H                    - Toggle H Mode (enter/exit to progression mode)
I                    - Toggle Insert Mode (manual note placement)
Spacebar            - Pause/Resume playback (time-stop edit mode)

Channel Navigation:
[ ]                  - Previous/Next channel (or note in Insert Mode)
1-4                 - Direct channel selection

Pattern Building:
P                    - Place selected note at current position
U                    - Clear note at current position
C                    - Clear all channels (remove all notes)

Time-Stop Edit Mode (when paused):
D                    - Cycle through note durations (whole to sixteenth)
← →                  - Move edit cursor by selected duration
P                    - Place note at cursor with selected duration

Standard Parameters (still active):
T/Shift+T           - Tempo adjust
K/Shift+K           - Key change (transposes patterns)
S/Shift+S           - Scale change (affects note selection)
3/4                 - Time signature
L/Shift+L           - Loop length
W                   - Toggle swing

Mode Switching:
B                   - Buffer Mode (with built patterns)
Q                   - Quit application
```

## Technical Implementation Notes

### Pattern Data Structure
```javascript
const channelPattern = [
  // Array of step objects (null = no note)
  null,                           // Step 0: silence
  { note: 'C4', duration: 4 },    // Step 1: C4 for 4 steps
  null,                           // Step 2: silence
  null,                           // Step 3: silence
  { note: 'E4', duration: 2 },    // Step 4: E4 for 2 steps
  null,                           // Step 5: silence
  { note: 'G4', duration: 1 },    // Step 6: G4 for 1 step
  null,                           // Step 7: silence
  // Pattern continues for full loop length
];

// Pattern metadata
const patternInfo = {
  loopLength: 64,                // Total steps (e.g., 4 bars * 16 steps)
  activeNotes: 12,                // Number of non-null positions
  channels: [pattern1, pattern2, pattern3, pattern4]
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