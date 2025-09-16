# H Mode Note Queuing System - Technical Specification

## Overview
Enhanced H Mode with manual note selection system allowing users to queue up specific notes before inserting them into the currently playing loop.

## Note Queuing Interface

### Queue Activation & Control
- **`I` key (first press)**: Enter note queuing mode
- **`[ ]` keys**: Navigate up/down through available notes while in queue mode
- **`I` key (second press)**: Insert queued note into current channel at current loop position
- **`Esc` key**: Cancel queuing mode without inserting note

### Available Notes List
```javascript
const noteQueueSystem = {
  // Available notes based on current scale and key
  getAvailableNotes: (key, scale) => {
    const scaleIntervals = {
      major: [0, 2, 4, 5, 7, 9, 11],        // C D E F G A B
      minor: [0, 2, 3, 5, 7, 8, 10],        // C D Eb F G Ab Bb  
      blues: [0, 3, 5, 6, 7, 10]            // C Eb F F# G Bb
    };
    
    const intervals = scaleIntervals[scale];
    const rootNote = getNoteValue(key); // C=0, D=2, etc.
    
    // Generate notes across 2 octaves for variety
    const availableNotes = [];
    for (let octave = 3; octave <= 5; octave++) {
      intervals.forEach(interval => {
        const noteValue = rootNote + interval + (octave * 12);
        availableNotes.push({
          name: getNoteName(noteValue),
          value: noteValue,
          octave: octave
        });
      });
    }
    
    return availableNotes.sort((a, b) => a.value - b.value);
  },
  
  currentQueueIndex: 0,  // Index in available notes array
  queuedNote: null,      // Currently queued note
  isQueuing: false       // Queue mode active flag
};
```

## Visual Interface Updates

### Parameter Section Enhancement
```
├─── PARAMETERS ─────────────────────────────────────────────────┤
│ Genre: Rock    Key: C Major    Scale: Major    Time: 4/4     │
│ Tempo: 120 BPM    Loop: 8 bars    Swing: OFF    Mode: H-LIVE │
│ Selected Channel: Ch1 (Lead)  │  Queued Note: D4  │  [I] Insert │
└─────────────────────────────────────────────────────────────────┘
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                   (shows when in queue mode)
```

### Queue Mode Visual States
```javascript
const queueVisualStates = {
  // Not queuing (normal H mode)
  inactive: {
    display: "Selected Channel: Ch1 (Lead)    Pattern Complexity: Simple",
    color: '#ddd'  // Normal light gray
  },
  
  // Queuing active
  active: {
    display: "Selected Channel: Ch1 (Lead)  │  Queued Note: D4  │  [I] Insert",
    colors: {
      channelInfo: '#ddd',      // Light gray
      separator: '#a29bfe',     // Soft purple
      queuedNote: '#00b894',    // Mint green (highlighted)
      insertHint: '#ff6b9d'     // Hot pink
    }
  },
  
  // Invalid note (out of scale)
  error: {
    display: "Selected Channel: Ch1 (Lead)  │  Invalid Note!  │  [Esc] Cancel",
    colors: {
      queuedNote: '#e17055',    // Coral error color
      errorMsg: '#e17055'
    }
  }
};
```

## Note Navigation System

### Note Selection Logic
```javascript
const noteNavigation = {
  // Move up through available notes
  moveUp: () => {
    const availableNotes = getAvailableNotes(currentKey, currentScale);
    noteQueueSystem.currentQueueIndex = Math.min(
      noteQueueSystem.currentQueueIndex + 1,
      availableNotes.length - 1
    );
    noteQueueSystem.queuedNote = availableNotes[noteQueueSystem.currentQueueIndex];
    updateQueueDisplay();
  },
  
  // Move down through available notes
  moveDown: () => {
    const availableNotes = getAvailableNotes(currentKey, currentScale);
    noteQueueSystem.currentQueueIndex = Math.max(
      noteQueueSystem.currentQueueIndex - 1,
      0
    );
    noteQueueSystem.queuedNote = availableNotes[noteQueueSystem.currentQueueIndex];
    updateQueueDisplay();
  },
  
  // Smart starting position (near current channel's last note)
  getStartingIndex: (channel) => {
    const availableNotes = getAvailableNotes(currentKey, currentScale);
    const lastNote = getLastAddedNote(channel);
    
    if (!lastNote) {
      // Start with root note if no notes added yet
      return availableNotes.findIndex(note => note.name.includes(currentKey));
    }
    
    // Start near the last added note
    const lastNoteIndex = availableNotes.findIndex(note => 
      note.name === lastNote.name && note.octave === lastNote.octave
    );
    
    return Math.max(0, lastNoteIndex);
  }
};
```

### Note Display Format
```javascript
const noteDisplayFormat = {
  // Standard note representation
  format: (note) => `${note.name}${note.octave}`,  // e.g., "D4", "F#3"
  
  // Examples in different scales
  examples: {
    cMajor: ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
    aMinor: ["A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5"],
    cBlues: ["C3", "Eb3", "F3", "F#3", "G3", "Bb3", "C4", "Eb4", "F4", "F#4", "G4", "Bb4", "C5"]
  }
};
```

## Queuing Workflow

### Complete User Flow
```javascript
const queueWorkflow = {
  // Step 1: Activate queuing
  step1_activate: {
    trigger: 'I key press',
    action: () => {
      noteQueueSystem.isQueuing = true;
      const startIndex = noteNavigation.getStartingIndex(selectedChannel);
      noteQueueSystem.currentQueueIndex = startIndex;
      noteQueueSystem.queuedNote = availableNotes[startIndex];
      showQueueInterface();
    }
  },
  
  // Step 2: Navigate notes
  step2_navigate: {
    trigger: '[ or ] key press',
    action: (direction) => {
      if (direction === 'up') noteNavigation.moveUp();
      if (direction === 'down') noteNavigation.moveDown();
      updateQueueDisplay();
      
      // Optional: Preview note sound
      if (PREVIEW_ENABLED) {
        playNotePreview(noteQueueSystem.queuedNote);
      }
    }
  },
  
  // Step 3: Insert or cancel
  step3_complete: {
    triggers: {
      insert: 'I key press',
      cancel: 'Esc key press'
    },
    actions: {
      insert: () => {
        const currentBeat = getCurrentLoopPosition();
        insertNoteIntoPattern(selectedChannel, currentBeat, noteQueueSystem.queuedNote);
        exitQueueMode();
        showInsertFeedback();
      },
      cancel: () => {
        exitQueueMode();
        showCancelFeedback();
      }
    }
  }
};
```

### Visual Feedback System
```javascript
const queueFeedback = {
  // Note insertion success
  insertSuccess: {
    message: `Added ${noteQueueSystem.queuedNote.name} to Ch${selectedChannel}`,
    color: '#00b894',    // Mint green
    duration: 1000       // 1 second display
  },
  
  // Queue cancelled
  cancelled: {
    message: 'Note queuing cancelled',
    color: '#fdcb6e',    // Warm yellow
    duration: 500        // 0.5 second display
  },
  
  // Note navigation feedback
  navigation: {
    highlightDuration: 200,  // Brief highlight when changing notes
    color: '#ff6b9d'         // Hot pink flash
  }
};
```

## Enhanced Control System

### Updated H Mode Controls
```
Mode Control:
H                    - Toggle H Mode (enter/exit)

Channel Navigation:
[ ]                  - Previous/Next channel (when not queuing)
                      - Previous/Next note (when queuing)

Pattern Building:
P                    - Add random scale note at current position
I                    - Enter note queue mode / Insert queued note
Esc                  - Cancel note queuing (when in queue mode)

Standard Parameters (still active):
T/Shift+T           - Tempo
K/Shift+K           - Key (transposes patterns)
S/Shift+S           - Scale (affects available notes)
3/4                 - Time signature
L/Shift+L           - Loop length
W                   - Swing

Mode Switching:
B                   - Buffer Mode (with built patterns)
Q                   - Quit
```

### Context-Sensitive Key Behavior
```javascript
const contextualControls = {
  // Bracket keys behavior depends on queue state
  bracketKeys: {
    notQueuing: {
      '[': 'selectPreviousChannel',
      ']': 'selectNextChannel'
    },
    queuing: {
      '[': 'selectPreviousNote', 
      ']': 'selectNextNote'
    }
  },
  
  // I key behavior
  iKey: {
    notQueuing: 'enterQueueMode',
    queuing: 'insertQueuedNote'
  },
  
  // Escape key only active when queuing
  escKey: {
    notQueuing: null,        // No action
    queuing: 'cancelQueue'   // Cancel and return to normal mode
  }
};
```

## Advanced Features

### Note Preview (Optional)
```javascript
const notePreview = {
  enabled: false,  // Can be toggled in settings
  
  playPreview: (note) => {
    if (!notePreview.enabled) return;
    
    // Play brief preview of queued note
    const previewDuration = 200; // 200ms preview
    const previewVelocity = 60;   // Quiet preview
    
    playNote(selectedChannel, note, previewVelocity, previewDuration);
  },
  
  // Visual preview in flow
  showInFlow: false  // Future: could show preview note in flow visualization
};
```

### Scale-Based Note Filtering
```javascript
const scaleFiltering = {
  // Only show notes that fit current scale
  filterByScale: true,
  
  // Handle scale changes during queuing
  onScaleChange: () => {
    if (noteQueueSystem.isQueuing) {
      // Recalculate available notes
      const newAvailableNotes = getAvailableNotes(currentKey, currentScale);
      
      // Try to maintain similar note if possible
      const currentNote = noteQueueSystem.queuedNote;
      const newIndex = findSimilarNote(newAvailableNotes, currentNote);
      
      noteQueueSystem.currentQueueIndex = newIndex;
      noteQueueSystem.queuedNote = newAvailableNotes[newIndex];
      updateQueueDisplay();
    }
  }
};
```

### Integration with Existing Pattern System
```javascript
const patternIntegration = {
  // Queue system works with existing random system
  coexistence: {
    randomAddition: 'P key still works for random notes',
    manualAddition: 'I key system for precise note selection',
    channelSwitching: 'Bracket keys context-sensitive'
  },
  
  // Both systems use same pattern storage
  sharedStorage: 'Both P and I additions stored in same channel pattern data',
  
  // Visual representation unchanged
  visualization: 'All added notes show in same gradient flow system'
};
```

This queuing system provides precise manual control while maintaining the intuitive real-time nature of H Mode, giving users both random discovery (P key) and intentional note selection (I + bracket navigation) options.