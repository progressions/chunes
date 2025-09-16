# Visual Style Specification - Chiptune Generator

## Overview
This document defines the complete visual style and interface design for the chiptune generator's terminal-based UI, with particular emphasis on the piano roll visualization and pattern display systems.

## Core Visual Principles

### Design Philosophy
- **Retro-Modern Aesthetic**: Combines classic terminal aesthetics with modern visualization techniques
- **Information Density**: Maximum information in minimal space without clutter
- **Real-Time Feedback**: Immediate visual response to all musical events
- **Accessibility**: Clear contrast and distinct visual elements

## Piano Roll System

### Scrolling Timeline Architecture

#### Playhead Concept
The playhead remains stationary at the center of the display while music scrolls horizontally from right to left. This creates an intuitive "reading" experience where upcoming music approaches from the right and past music exits to the left.

```
Past Music ← [PLAYHEAD] ← Future Music
[Played]      [NOW]       [Upcoming]
```

#### Grid Structure
- **Horizontal Axis**: Time (16th note resolution)
- **Vertical Axis**: Channels (4 channels stacked)
- **Grid Unit**: Each cell represents one 16th note step
- **Display Width**: 64 steps visible (4 bars in 4/4 time)

### Time Markers and Grid

#### Beat Indication System
```
Symbol: • (bullet point)
Color:  #4a4a4a (40% gray)
Spacing: Every 4 steps (quarter notes)
Purpose: Visual rhythm reference

Example Pattern (4/4 time):
• • • • | • • • • | • • • • | • • • •
1 2 3 4   1 2 3 4   1 2 3 4   1 2 3 4
```

#### Bar Lines
```
Symbol: ┊ (dotted vertical line)
Color:  #6a6a6a (50% gray)
Spacing: Every 16 steps in 4/4 time
        Every 12 steps in 3/4 time
Height: Full channel height

Visual Hierarchy:
┊ = Bar line (stronger)
• = Beat dot (subtle)
```

#### Time Signature Adaptations
```
4/4 Time: | • • • • | • • • • | • • • • | • • • • |
3/4 Time: | • • • | • • • | • • • | • • • |
5/4 Time: | • • • • • | • • • • • | • • • • • |
```

### Note Representation

#### Note Symbol System
```
Duration Symbols:
𝅝       = Whole note (16 steps)
𝅗𝅥      = Half note (8 steps)
♩       = Quarter note (4 steps)
♪       = Eighth note (2 steps)
♬       = Sixteenth note (1 step)

Fallback ASCII:
o       = Whole note
d       = Half note
q       = Quarter note
e       = Eighth note
s       = Sixteenth note
```

#### Note Display Rules
1. **Note Start**: Bright symbol at attack point
2. **Note Sustain**: Horizontal line (─) for duration
3. **Note End**: Clear termination, no symbol
4. **Overlapping Notes**: Higher pitch takes visual priority

#### Channel Color Coding
```javascript
const channelColors = {
  channel1: {
    name: 'Pulse 1',
    active: '#00ff00',    // Bright green
    sustained: '#008800', // Medium green
    muted: '#004400'      // Dark green
  },
  channel2: {
    name: 'Pulse 2',
    active: '#0088ff',    // Bright blue
    sustained: '#004488', // Medium blue
    muted: '#002244'      // Dark blue
  },
  channel3: {
    name: 'Triangle',
    active: '#ffff00',    // Bright yellow
    sustained: '#888800', // Medium yellow
    muted: '#444400'      // Dark yellow
  },
  channel4: {
    name: 'Noise',
    active: '#ff00ff',    // Bright magenta
    sustained: '#880088', // Medium magenta
    muted: '#440044'      // Dark magenta
  }
};
```

### Playhead Visualization

#### Static Playhead Design
```
Position: Column 32 (center of 64-column display)
Symbol:   █ (full block) or | (pipe)
Color:    #00ffff (cyan)
Height:   Spans all 4 channels plus headers
Behavior: Remains fixed while content scrolls

Visual Example:
         [31]  [32]  [33]
Ch1  ... • ♩──  █  • • ...
Ch2  ... • • •  █  ♪ • ...
Ch3  ... ♬ • •  █  • • ...
Ch4  ... • • •  █  • ♬ ...
              ┊ █ ┊
         Playhead at Step 32
```

#### Playhead Information Display
```
Below channels:
┌─────────────────┐
│ Step: 32/64     │
│ Bar 2, Beat 4.3 │
│ ▶ PLAYING       │
└─────────────────┘

When Paused:
┌─────────────────┐
│ Step: 32/64     │
│ Bar 2, Beat 4.3 │
│ ⏸ PAUSED       │
└─────────────────┘
```

## Edit Mode Visualization

### Cursor System (Time-Stop Mode)

#### Edit Cursor Design
```
Normal Cell:  •     (empty beat)
              ♩     (note)

Cursor Cell:  ▓     (shaded block)
              ▒     (medium shade)
              ░     (light shade)

Cursor with Note Preview:
[♩]    = Note will be placed here
[×]    = Note will be removed here
```

#### Cursor Movement Visualization
```
Duration: Quarter Note (4 steps)
←────────┤ CURSOR ├────────→
    -4 steps    +4 steps

Duration: Eighth Note (2 steps)
←──┤ CURSOR ├──→
  -2 steps  +2 steps
```

### Mode Indicators

#### H Mode (Harmony Building)
```
┌─── H MODE ─── HARMONY BUILDING ────────────────┐
│ Channel: 1 (Pulse 1)  │  Pattern: Building     │
│ Notes: 12/64          │  Complexity: Medium    │
└─────────────────────────────────────────────────┘
```

#### Insert Mode
```
┌─── INSERT MODE ─── NOTE SELECTION ─────────────┐
│ Note: C4    │  Octave: 4   │  Channel: 1      │
│ [C3 D3 E3 F3 G3 A3 B3 C4 D4 E4 F4 G4]         │
│         Current: ───┘                          │
└─────────────────────────────────────────────────┘
```

#### Paused Edit Mode
```
┌─── ⏸ PAUSED ─── EDIT MODE ────────────────────┐
│ Cursor: Bar 2, Beat 3  │  Duration: ♩ Quarter │
│ [D] Duration  [←→] Move  [P] Place  [Space] ▶ │
└─────────────────────────────────────────────────┘
```

## Visual Effects and Animations

### Note Trigger Animation
```
Frame 1: ♩     (normal)
Frame 2: ◆     (diamond flash)
Frame 3: ♦     (small diamond)
Frame 4: ♩     (return to normal)

Duration: 100ms total
Purpose: Visual feedback for note activation
```

### Pattern Building Animation
```
Empty:    • • • • • • • •
Adding:   • • ➕ • • • • •  (plus symbol appears)
Added:    • • ♩ • • • • •   (note appears)
Flash:    • • ◆ • • • • •   (brief highlight)
Settled:  • • ♩ • • • • •   (normal display)
```

### Scrolling Animation
```
Smooth Scroll Rate: 60 FPS
Step Advance: Every (60000 / tempo / 4) ms

Visual Interpolation:
Step N:     |••••♩•••|••••|
Interp:     |•••♩•••|••••|•
Step N+1:   |••♩•••|••••|••
```

## Complete Visual Example

### Full Interface in H Mode with Insert Mode Active
```
┌─────────────────────────────────────────────────────────────────┐
│ 🎵 CHIPTUNE GENERATOR - H MODE - INSERT MODE                   │
├─────────────────────────────────────────────────────────────────┤
│ Genre: Chiptune  Key: C Major  Scale: Major  Time: 4/4        │
│ Tempo: 120 BPM   Loop: 4 bars  Swing: OFF                     │
├─────────────────────────────────────────────────────────────────┤
│ INSERT MODE - Note: E4  Channel: 1  [C D E F G A B C D E]     │
├─────────────────────────────────────────────────────────────────┤
│     Bar 1        Bar 2        Bar 3        Bar 4              │
│     ┊            ┊            ┊            ┊                  │
│ Ch1 • • ♩── • • • • • • • • • • • • │ • • • • • • • • • • •  │
│ Ch2 • ♪ • • • • • • • • ♪ • • • • • │ • • • • • • • • • • •  │
│ Ch3 ♬ • • • ♬ • • • ♬ • • • ♬ • • • │ • • • • • • • • • • •  │
│ Ch4 • • • • • • • • • • • • • • • • │ • • • • • • • • • • •  │
│                                     █                          │
│                              Playhead: 32/64                   │
├─────────────────────────────────────────────────────────────────┤
│ [H] Exit H Mode  [I] Exit Insert  [P] Place Note  [U] Clear   │
│ [C] Clear All    [Space] Pause    [[] Prev Note   []] Next    │
└─────────────────────────────────────────────────────────────────┘
```

### Visual State in Paused Edit Mode
```
┌─────────────────────────────────────────────────────────────────┐
│ 🎵 CHIPTUNE GENERATOR - H MODE - ⏸ PAUSED                     │
├─────────────────────────────────────────────────────────────────┤
│ Genre: Chiptune  Key: C Major  Scale: Major  Time: 4/4        │
│ Tempo: 120 BPM   Loop: 4 bars  Swing: OFF                     │
├─────────────────────────────────────────────────────────────────┤
│ EDIT MODE - Duration: ♪ Eighth  Cursor: Bar 2, Beat 3.5      │
├─────────────────────────────────────────────────────────────────┤
│     Bar 1        Bar 2        Bar 3        Bar 4              │
│     ┊            ┊            ┊            ┊                  │
│ Ch1 • • ♩── • • • • • ▓ • • • • • • │ • • • • • • • • • • •  │
│ Ch2 • ♪ • • • • • • • • ♪ • • • • • │ • • • • • • • • • • •  │
│ Ch3 ♬ • • • ♬ • • • ♬ • • • ♬ • • • │ • • • • • • • • • • •  │
│ Ch4 • • • • • • • • • • • • • • • • │ • • • • • • • • • • •  │
│                   ▲                 █                          │
│              Edit Cursor      Playhead (frozen)                │
├─────────────────────────────────────────────────────────────────┤
│ [D] Duration  [←→] Move Cursor  [P] Place  [Space] Resume ▶   │
└─────────────────────────────────────────────────────────────────┘
```

## Accessibility Considerations

### High Contrast Mode
- Increased brightness differences between elements
- Bolder separators and indicators
- Optional sound cues for visual events

### Simplified Display Mode
- Removes decorative elements
- Uses only ASCII characters
- Reduces color dependency
- Maintains core functionality

### Screen Reader Support
- Semantic structure for navigation
- Descriptive text for all visual elements
- Keyboard-only operation
- Status announcements for mode changes

## Performance Specifications

### Rendering Requirements
- **Frame Rate**: 60 FPS minimum for smooth scrolling
- **Update Latency**: < 16ms for user input response
- **Audio Sync**: Visual updates within 10ms of audio events
- **Terminal Compatibility**: Works with 80+ column terminals

### Resource Usage
- **CPU**: < 10% for visualization
- **Memory**: < 50MB for pattern storage
- **Terminal Buffer**: Optimized partial updates
- **Color Support**: Graceful degradation for 16-color terminals

This comprehensive visual style specification ensures consistent, intuitive, and aesthetically pleasing presentation of the chiptune generator's musical patterns and editing interface.