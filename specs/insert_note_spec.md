# Insert Note Mode (I Mode) - Technical Specification

## Overview
Insert Note Mode provides manual note selection and placement within H Mode, allowing precise control over pattern building with time-stop editing capabilities.

## Mode Activation & State

### Entering Insert Mode
- **Trigger**: Press `I` key while in H Mode
- **Visual Indicator**: Shows "INSERT MODE" in the UI
- **Note Display**: Shows available notes from octaves 2-6
- **Initial State**: Displays note selection queue with current note highlighted

## Note Selection System

### Available Notes
```javascript
const insertModeState = {
  // Available notes across octaves 2-6
  availableNotes: generateNotesForOctaves(2, 6),
  currentNoteIndex: 0,     // Current position in note array
  selectedNote: null,      // Currently selected note
  isActive: false,         // Insert mode active flag

  // Time-stop edit mode
  isPaused: false,         // Playback paused for editing
  editCursor: 0,          // Position for placing notes when paused
  selectedDuration: 1      // Duration index (0=whole to 4=sixteenth)
};
```

### Note Navigation
- **`[` key**: Navigate to previous note (lower pitch)
- **`]` key**: Navigate to next note (higher pitch)
- **Navigation**: Cycles through all available notes in octaves 2-6
- **Visual**: Selected note displayed in UI with highlight

## Note Placement System

### Real-Time Placement
- **`P` key**: Place selected note at current playhead position
- **Duration**: Notes play for 4 steps (quarter note) by default
- **Behavior**: Remains in Insert Mode after placing note
- **Multiple Placements**: Can place multiple notes without exiting mode

### Time-Stop Edit Mode
- **Spacebar**: Pause/Resume playback for precise editing
- **Visual Indicator**: Shows "PAUSED" when time is stopped
- **Edit Cursor**: Separate cursor for editing when paused

### Duration Selection (When Paused)
```javascript
const noteDurations = [
  { name: 'whole', steps: 16, symbol: '𝅝' },
  { name: 'half', steps: 8, symbol: '𝅗𝅥' },
  { name: 'quarter', steps: 4, symbol: '♩' },
  { name: 'eighth', steps: 2, symbol: '♪' },
  { name: 'sixteenth', steps: 1, symbol: '♬' }
];
```

- **`D` key**: Cycle through note durations
- **Arrow Keys**: Move edit cursor by selected duration
- **`P` key**: Place note with selected duration at cursor

## Pattern Editing

### Note Clearing
- **`U` key**: Clear note at current playhead/cursor position
- **Effect**: Removes note from selected channel at current position
- **Visual**: Pattern updates immediately to show cleared position

### Clear All Channels
- **`C` key**: Clear entire loop (all 4 channels)
- **Confirmation**: Immediate clear without confirmation
- **Result**: All patterns reset to empty state

## Visual Interface

### Insert Mode Display
```
┌─── INSERT MODE ─────────────────────────────────────────────────┐
│ Selected Note: C4    Channel: 1    Position: Beat 3            │
│ Available: [C3 D3 E3 F3 G3 A3 B3 C4 D4 E4 F4 G4...]          │
└─────────────────────────────────────────────────────────────────┘
```

### Paused Mode Display
```
┌─── PAUSED - EDIT MODE ──────────────────────────────────────────┐
│ Duration: ♩ Quarter    Cursor: Bar 2, Beat 3                  │
│ [D] Change Duration    [←→] Move Cursor    [P] Place Note     │
└─────────────────────────────────────────────────────────────────┘
```

### Piano Roll Visualization
- **Playhead**: Stationary vertical line (music scrolls past)
- **Notes**: Individual note symbols on timeline
- **Beat Dots**: Visual markers for beats (• • • •)
- **Bar Lines**: Vertical lines marking measure boundaries (┊)
- **Edit Cursor**: Highlighted position when paused (█)

## Control Summary

### Insert Mode Controls
```
Mode Control:
I                    - Toggle Insert Mode (enter/exit)
Spacebar            - Pause/Resume playback

Note Selection (Insert Mode):
[ ]                  - Navigate through available notes

Note Placement:
P                    - Place selected note at position
U                    - Clear note at current position
C                    - Clear all channels

Time-Stop Controls (When Paused):
D                    - Cycle note durations
← →                  - Move cursor by selected duration
P                    - Place note at cursor with duration

Channel Selection (When Not in Insert Mode):
[ ]                  - Previous/Next channel
1-4                 - Direct channel selection
```

## Workflow Examples

### Basic Note Placement
1. Press `I` to enter Insert Mode
2. Use `[` and `]` to select desired note
3. Press `P` when playhead reaches desired position
4. Note is placed and continues playing

### Precise Editing with Time-Stop
1. Press `I` to enter Insert Mode
2. Press `Spacebar` to pause playback
3. Press `D` to select note duration (e.g., eighth note)
4. Use arrow keys to position cursor precisely
5. Use `[` and `]` to select note
6. Press `P` to place note at cursor
7. Press `Spacebar` to resume playback

### Pattern Cleanup
1. Enter Insert Mode with `I`
2. Use `U` to clear unwanted notes as playhead passes
3. Or press `C` to clear all and start fresh

## Integration with H Mode

### Mode Coexistence
- Insert Mode is a sub-mode within H Mode
- Channel patterns persist when toggling Insert Mode
- Parameter changes (tempo, key, scale) remain active
- Can switch between channels when not in Insert Mode

### Data Structure
```javascript
const channelPattern = [
  // Array indexed by step position
  null,                           // Step 0: no note
  { note: 'C4', duration: 4 },    // Step 1: C4 quarter note
  null,                           // Step 2: no note
  { note: 'E4', duration: 2 },    // Step 3: E4 eighth note
  // ... continues for full loop length
];
```

### Pattern Persistence
- Patterns saved to session when exiting H Mode
- Patterns continue playing when returning to Live Mode
- Can be exported to Buffer Mode for playback

## Technical Implementation Notes

### Step Resolution
- 16th note resolution (16 steps per bar)
- Loop length determines total steps (e.g., 4 bars = 64 steps)
- Note duration can span multiple steps

### Audio Scheduling
- Notes scheduled ahead for smooth playback
- Immediate updates when placing/clearing notes
- Pause mode stops scheduling but maintains position

### Visual Synchronization
- UI updates at 60 FPS for smooth animation
- Pattern display synchronized with audio playback
- Edit cursor and playhead tracked independently

This specification defines the complete Insert Mode functionality for precise pattern building within the H Mode framework.