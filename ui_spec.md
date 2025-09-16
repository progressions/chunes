# Chiptune Procedural Music Generator - Visual Interface Specification

## Overview
A full-screen terminal user interface (TUI) with flowing gradient music visualization, pastel color scheme, and intuitive keyboard controls for real-time music generation and parameter control.

## Screen Layout & Dimensions

### Target Terminal Sizes
- **Minimum**: 80x24 characters
- **Optimal**: 100x30 characters  
- **Maximum**: 120x40 characters
- **Responsive**: Auto-adapts to terminal size

### Full Screen Layout Structure (80x24 baseline)
```
Row 1  ┌────────────────────── CHIPTUNE GENERATOR ──────────────────────┐
Row 2  │                      🎵 Live Session Active 🎵                │
Row 3  ├─── PARAMETERS ─────────────────────────────────────────────────┤
Row 4  │ Genre: Rock    Key: C Major    Scale: Major    Time: 4/4     │
Row 5  │ Tempo: 120 BPM    Loop: 8 bars    Swing: OFF    Mode: LIVE   │
Row 6  ├─── MUSIC FLOW ─────────────────────────────────────────────────┤
Row 7  │ Ch1 ∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~ │
Row 8  │ Ch2 ~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~ │
Row 9  │ Ch3 ▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂ │
Row 10 │ Ch4 ▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░ │
Row 11 ├─── STATUS ─────────────────────────────────────────────────────┤
Row 12 │ Buffer: 3m:45s recording...    Session: 2025-09-15_14:30     │
Row 13 ├─── CONTROLS ───────────────────────────────────────────────────┤
Row 14 │ [T] Tempo  [G] Genre  [K] Key  [S] Scale  [L] Loop  [W] Swing │
Row 15 │ [3][4] Time  [B] Buffer  [Ctrl+S] Save  [Ctrl+L] Load  [Q] Quit │
Row 16 └─────────────────────────────────────────────────────────────────┘
Rows 17-24: Reserved for overlays and extended content
```

## Color Palette & Theming

### Master Color Scheme (Pastel Terminal Colors)
```javascript
const colorPalette = {
  // Background & Structure
  background: '#1a1a2e',           // Deep navy background
  border: '#16213e',               // Darker navy borders
  panelBg: '#0f3460',              // Panel background
  
  // Text Colors
  title: '#ffeaa7',                // Soft yellow titles
  subtitle: '#fab1a0',             // Coral subtitles
  text: '#ddd',                    // Light gray standard text
  muted: '#81ecec',                // Soft cyan muted text
  
  // Parameter Display
  paramLabel: '#fab1a0',           // Coral parameter labels
  paramValue: '#74b9ff',           // Light blue values
  paramActive: '#00b894',          // Mint green active parameter
  paramChanged: '#fdcb6e',         // Warm yellow recently changed
  
  // Status Indicators
  recording: '#00b894',            // Mint green recording
  warning: '#e17055',              // Coral warnings
  success: '#55a3ff',              // Success blue
  inactive: '#636e72',             // Gray inactive
  
  // Control Highlights
  keyHighlight: '#00b894',         // Mint for keyboard shortcuts
  keyBracket: '#a29bfe',           // Soft purple brackets
  keyDesc: '#ddd',                 // Light gray descriptions
  
  // Music Flow Gradient (7-stop)
  flowGradient: [
    '#ff6b9d',    // Hot pink (newest, rightmost)
    '#c44569',    // Rose
    '#8e44ad',    // Purple  
    '#5f27cd',    // Deep purple
    '#0abde3',    // Cyan
    '#006ba6',    // Deep blue
    '#1e3799'     // Navy (oldest, leftmost)
  ]
};
```

### Genre-Specific Color Variations
```javascript
const genreColorMods = {
  rock: {
    intensity: 1.2,              // 20% more vibrant
    contrast: 'high',
    accentColor: '#ff3838'       // Red accent
  },
  bossa: {
    warmth: 1.1,                 // 10% warmer tones
    contrast: 'smooth',
    accentColor: '#ffa726'       // Orange accent
  },
  soft: {
    saturation: 0.8,             // 20% less saturated
    contrast: 'gentle',
    accentColor: '#74b9ff'       // Soft blue accent
  }
};
```

## Header Section (Rows 1-2)

### Title Display
```
┌────────────────────── CHIPTUNE GENERATOR ──────────────────────┐
│                      🎵 Live Session Active 🎵                │
```

#### Visual Properties
- **Background**: Deep navy (`#1a1a2e`)
- **Title Text**: Soft yellow (`#ffeaa7`), centered, bold
- **Border**: Darker navy (`#16213e`) with rounded corners
- **Status Indicator**: Animated music emoji 🎵 with gentle pulse
- **Session Status**: Changes based on mode:
  - `🎵 Live Session Active 🎵` (Live Generation Mode)
  - `⏯️ Buffer Playback Mode ⏯️` (Buffer Mode)  
  - `💾 Saving Session... 💾` (During save operations)

#### Animation Effects
- **Title**: Subtle glow effect on startup
- **Music emoji**: Gentle pulsing every 2 seconds
- **Status changes**: Smooth fade transition (300ms)

## Parameters Section (Rows 3-5)

### Parameter Display Layout
```
├─── PARAMETERS ─────────────────────────────────────────────────┤
│ Genre: Rock    Key: C Major    Scale: Major    Time: 4/4     │
│ Tempo: 120 BPM    Loop: 8 bars    Swing: OFF    Mode: LIVE   │
```

### Parameter Styling Rules
```javascript
const parameterStyles = {
  // Standard parameter
  default: {
    label: { color: '#fab1a0', weight: 'normal' },    // Coral
    value: { color: '#74b9ff', weight: 'bold' }       // Light blue
  },
  
  // Currently active/being changed
  active: {
    label: { color: '#fab1a0', weight: 'bold' },
    value: { color: '#00b894', weight: 'bold', bg: '#0f3460' } // Mint on dark
  },
  
  // Recently changed (3 second highlight)
  changed: {
    label: { color: '#fab1a0', weight: 'normal' },
    value: { color: '#fdcb6e', weight: 'bold' }       // Warm yellow
  },
  
  // Invalid/error state
  error: {
    label: { color: '#fab1a0', weight: 'normal' },
    value: { color: '#e17055', weight: 'bold' }       // Coral warning
  }
};
```

### Parameter Layout Responsive Rules
```javascript
const parameterLayout = {
  // 80-character width (minimum)
  narrow: {
    row1: ['Genre', 'Key', 'Scale', 'Time'],
    row2: ['Tempo', 'Loop', 'Swing', 'Mode']
  },
  
  // 100+ character width
  wide: {
    row1: ['Genre', 'Key', 'Scale', 'Time', 'Tempo'],
    row2: ['Loop', 'Swing', 'Mode', 'Buffer', 'Session']
  },
  
  // Spacing calculation
  spacing: (termWidth, numParams) => Math.floor((termWidth - 20) / numParams)
};
```

## Music Flow Visualization (Rows 6-10)

### Channel Display Structure
```
├─── MUSIC FLOW ─────────────────────────────────────────────────┤
│ Ch1 ∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~ │
│ Ch2 ~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~ │
│ Ch3 ▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂ │
│ Ch4 ▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░ │
```

### Horizontal Gradient Flow System

#### 7-Stop Gradient Spectrum
```javascript
const musicFlowGradient = {
  // Position-based color mapping
  gradientStops: [
    { position: 0,   color: '#ff6b9d', name: 'hot_pink' },     // Newest (right)
    { position: 16,  color: '#c44569', name: 'rose' },
    { position: 32,  color: '#8e44ad', name: 'purple' },
    { position: 48,  color: '#5f27cd', name: 'deep_purple' },
    { position: 64,  color: '#0abde3', name: 'cyan' },
    { position: 80,  color: '#006ba6', name: 'deep_blue' },
    { position: 100, color: '#1e3799', name: 'navy' }          // Oldest (left)
  ],
  
  // Smooth interpolation between stops
  width: 76,  // Characters available for flow display
  direction: 'right_to_left',
  interpolation: 'smooth'
};
```

#### Visual Flow Example with Gradient
```
Position:  0    10   20   30   40   50   60   70   76
Color:     🌸   🌹   💜   🔮   🩵   💙   🌀   ⚫
Ch1:       ∿∿∿  ~~~  ∿∿~  ~~∿  ∿~~  ~∿∿  ~~~  ∿~~
Ch2:       ~~∿  ∿~~  ∿∿~  ~∿∿  ~~∿  ∿~~  ∿∿~  ~∿∿
Ch3:       ▁▁▂  ▂▁▁  ▂▂▁  ▁▂▂  ▁▁▂  ▂▁▁  ▂▂▁  ▁▂▂
Ch4:       ▌░▌  ░▌░  ▌░▌  ░▌░  ▌░▌  ░▌░  ▌░▌  ░▌░

Gradient:  Hot Pink → Rose → Purple → Deep Purple → Cyan → Deep Blue → Navy
```

### Channel-Specific Character Mapping

#### Channel 1 - Pulse Wave A (Lead Melody)
```javascript
const channel1Mapping = {
  characters: {
    high: '∿',      // Above middle C (C4)
    mid: '~',       // Around middle C
    low: '_',       // Below middle C  
    rest: ' ',      // No note playing
    accent: '≋'     // Accented/loud notes
  },
  
  // Note-to-character logic
  getChar: (note, velocity) => {
    if (!note) return ' ';
    if (velocity > 85) return '≋';
    if (note.octave >= 5) return '∿';
    if (note.octave === 4) return '~';
    return '_';
  }
};
```

#### Channel 2 - Pulse Wave B (Harmony)
```javascript
const channel2Mapping = {
  characters: {
    harmony_high: '∿',    // Harmony notes above melody
    harmony_mid: '~',     // Harmony at melody level
    harmony_low: '_',     // Harmony below melody
    chord: '≈',           // Multiple notes (chord)
    rest: ' '
  },
  
  // Harmony relationship to Channel 1
  harmonicRelation: (melody, harmony) => {
    const interval = calculateInterval(melody, harmony);
    if (interval >= 7) return '∿';      // High harmony
    if (interval >= 3) return '~';      // Mid harmony  
    return '_';                         // Low harmony
  }
};
```

#### Channel 3 - Triangle Wave (Bass)
```javascript
const channel3Mapping = {
  characters: {
    loud: '▄',       // Peak bass volume
    medium: '▃',     // Medium bass
    quiet: '▂',      // Soft bass
    minimal: '▁',    // Very quiet bass
    rest: ' '        // No bass
  },
  
  // Volume-based mapping
  getChar: (note, velocity) => {
    if (!note) return ' ';
    if (velocity >= 85) return '▄';
    if (velocity >= 70) return '▃';
    if (velocity >= 50) return '▂';
    return '▁';
  }
};
```

#### Channel 4 - Noise (Percussion)
```javascript
const channel4Mapping = {
  characters: {
    kick: '▌',       // Strong beat (kick drum)
    snare: '▒',      // Medium beat (snare)
    hihat: '░',      // Light beat (hi-hat)
    crash: '█',      // Accent/crash
    rest: ' '        // No percussion
  },
  
  // Percussion type mapping
  getChar: (percType, velocity) => {
    switch(percType) {
      case 'kick': return velocity > 80 ? '█' : '▌';
      case 'snare': return '▒';
      case 'hihat': return '░';
      case 'crash': return '█';
      default: return ' ';
    }
  }
};
```

### Flow Animation Properties

#### Movement Timing
```javascript
const flowAnimation = {
  // Base speed calculation
  baseSpeed: 60,  // Characters per minute at 60 BPM
  
  // Tempo-based speed multiplier
  speedMultiplier: (tempo) => tempo / 60,
  
  // Frame rate for smooth animation
  frameRate: 30,  // 30 FPS
  
  // Character shift timing
  shiftInterval: (tempo) => 1000 / ((tempo / 60) * (60 / 4)), // Quarter note timing
  
  // Smooth movement calculation
  pixelShift: (tempo) => {
    const beatsPerSecond = tempo / 60;
    const charactersPerBeat = 4; // 4 chars per beat
    return (beatsPerSecond * charactersPerBeat) / 30; // Per frame at 30 FPS
  }
};
```

#### Gradient Color Interpolation
```javascript
const gradientRenderer = {
  // Color interpolation function
  interpolateColor: (color1, color2, ratio) => {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },
  
  // Calculate color for specific position
  getPositionColor: (position, totalWidth) => {
    const normalizedPos = (position / totalWidth) * 100;
    const stops = musicFlowGradient.gradientStops;
    
    // Find surrounding stops
    let lowerStop = stops[0];
    let upperStop = stops[stops.length - 1];
    
    for (let i = 0; i < stops.length - 1; i++) {
      if (normalizedPos >= stops[i].position && normalizedPos <= stops[i + 1].position) {
        lowerStop = stops[i];
        upperStop = stops[i + 1];
        break;
      }
    }
    
    if (lowerStop.position === upperStop.position) return lowerStop.color;
    
    const ratio = (normalizedPos - lowerStop.position) / (upperStop.position - lowerStop.position);
    return this.interpolateColor(lowerStop.color, upperStop.color, ratio);
  }
};
```

## Status Section (Row 11-12)

### Status Bar Layout
```
├─── STATUS ─────────────────────────────────────────────────────┤
│ Buffer: 3m:45s recording...    Session: 2025-09-15_14:30     │
```

### Status Information Types
```javascript
const statusDisplay = {
  // Left side - Buffer/Recording info
  buffer: {
    recording: {
      text: (time) => `Buffer: ${time} recording...`,
      color: '#00b894',      // Mint green
      animation: 'dots'      // Animated dots
    },
    
    paused: {
      text: (time) => `Buffer: ${time} paused`,
      color: '#fdcb6e',      // Warm yellow
      animation: 'none'
    },
    
    playback: {
      text: (current, total) => `Playback: ${current} / ${total}`,
      color: '#74b9ff',      // Light blue
      animation: 'none'
    }
  },
  
  // Right side - Session info
  session: {
    active: {
      text: (timestamp) => `Session: ${timestamp}`,
      color: '#ddd',         // Light gray
      animation: 'none'
    },
    
    saving: {
      text: 'Saving session...',
      color: '#00b894',      // Mint green
      animation: 'pulse'     // Gentle pulse
    },
    
    loaded: {
      text: (loopName) => `Loop: ${loopName}`,
      color: '#a29bfe',      // Soft purple
      animation: 'none'
    }
  }
};
```

### Status Animation Effects
```javascript
const statusAnimations = {
  dots: {
    frames: ['', '.', '..', '...'],
    interval: 500,  // 500ms per frame
    loop: true
  },
  
  pulse: {
    frames: ['normal', 'bright', 'normal'],
    interval: 800,  // 800ms per cycle
    loop: true
  },
  
  // Color intensity cycling
  bright: (baseColor) => adjustColorBrightness(baseColor, 1.3),
  normal: (baseColor) => baseColor
};
```

## Controls Section (Rows 13-15)

### Control Display Layout
```
├─── CONTROLS ───────────────────────────────────────────────────┤
│ [T] Tempo  [G] Genre  [K] Key  [S] Scale  [L] Loop  [W] Swing │
│ [3][4] Time  [B] Buffer  [Ctrl+S] Save  [Ctrl+L] Load  [Q] Quit │
```

### Control Styling System
```javascript
const controlStyles = {
  // Key bracket styling
  keyBracket: {
    color: '#a29bfe',        // Soft purple
    weight: 'bold'
  },
  
  // Key letter styling  
  keyLetter: {
    color: '#00b894',        // Mint green
    weight: 'bold',
    bg: '#0f3460'            // Dark background highlight
  },
  
  // Description styling
  keyDesc: {
    color: '#ddd',           // Light gray
    weight: 'normal'
  },
  
  // Special keys (Ctrl+, Shift+)
  modifier: {
    color: '#fdcb6e',        // Warm yellow
    weight: 'bold'
  },
  
  // Currently pressed key feedback
  pressed: {
    color: '#ff6b9d',        // Hot pink
    weight: 'bold',
    bg: '#16213e',           // Darker background
    duration: 200            // 200ms highlight
  }
};
```

### Responsive Control Layout
```javascript
const controlLayout = {
  // Priority order for limited space
  essential: [
    '[T] Tempo', '[G] Genre', '[K] Key', '[Q] Quit'
  ],
  
  standard: [
    '[T] Tempo', '[G] Genre', '[K] Key', '[S] Scale', 
    '[L] Loop', '[W] Swing', '[B] Buffer', '[Q] Quit'
  ],
  
  extended: [
    '[T] Tempo', '[G] Genre', '[K] Key', '[S] Scale', '[L] Loop', 
    '[W] Swing', '[3][4] Time', '[B] Buffer', '[Ctrl+S] Save', 
    '[Ctrl+L] Load', '[Q] Quit'
  ],
  
  // Auto-select based on terminal width
  selectLayout: (width) => {
    if (width >= 100) return 'extended';
    if (width >= 80) return 'standard';
    return 'essential';
  }
};
```

### Key Press Visual Feedback
```javascript
const keyPressFeedback = {
  // Visual feedback on key press
  onKeyPress: (key) => {
    // Highlight pressed key for 200ms
    highlightKey(key, controlStyles.pressed);
    
    // Show parameter change animation
    if (parameterKeys.includes(key)) {
      animateParameterChange(getParameterForKey(key));
    }
    
    // Reset after duration
    setTimeout(() => {
      resetKeyHighlight(key);
    }, controlStyles.pressed.duration);
  },
  
  // Invalid key press feedback
  onInvalidKey: (key) => {
    // Brief error flash
    flashError(100); // 100ms red flash
  }
};
```

## Mode-Specific Interface Variations

### Live Generation Mode
```
┌────────────────────── CHIPTUNE GENERATOR ──────────────────────┐
│                      🎵 Live Session Active 🎵                │
├─── PARAMETERS ─────────────────────────────────────────────────┤
│ Genre: Rock    Key: C Major    Scale: Major    Time: 4/4     │
│ Tempo: 120 BPM    Loop: 8 bars    Swing: OFF    Mode: LIVE   │
├─── MUSIC FLOW ─────────────────────────────────────────────────┤
│ Ch1 ∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~ │
│ Ch2 ~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~ │
│ Ch3 ▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂ │
│ Ch4 ▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░ │
├─── STATUS ─────────────────────────────────────────────────────┤
│ Buffer: 3m:45s recording...    Session: 2025-09-15_14:30     │
├─── CONTROLS ───────────────────────────────────────────────────┤
│ [T] Tempo  [G] Genre  [K] Key  [S] Scale  [L] Loop  [W] Swing │
│ [3][4] Time  [B] Buffer  [Ctrl+S] Save  [Ctrl+L] Load  [Q] Quit │
└─────────────────────────────────────────────────────────────────┘
```

### Buffer Playback Mode
```
┌────────────────────── CHIPTUNE GENERATOR ──────────────────────┐
│                      ⏯️ Buffer Playback Mode ⏯️               │
├─── TIMELINE ───────────────────────────────────────────────────┤
│ Total: 5m:23s │ Position: 2m:15s │ Selection: 10.0s          │
│ [████████●████[====]████████████████████████████████████████] │
│  0:00      2:15    2:25                                 5:23  │
├─── MUSIC FLOW (Playback) ──────────────────────────────────────┤
│ Ch1 ∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~~∿∿~~~∿∿~~~∿∿∿~~ │
│ Ch2 ~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~∿∿~~ │
│ Ch3 ▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂▁▁▂▂ │
│ Ch4 ▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░▌░ │
├─── PLAYBACK PARAMS ────────────────────────────────────────────┤
│ At 2m:15s: Rock | C Major | 120 BPM | 4/4 | 8 bars | No Swing │
├─── BUFFER CONTROLS ────────────────────────────────────────────┤
│ [←→] Seek  [Space] Play/Pause  [Enter] Mark Start  [S] Save   │
│ [Shift+Enter] Mark End  [P] Preview  [C] Clear  [Esc] Live    │
└─────────────────────────────────────────────────────────────────┘
```

### Timeline Visualization Elements
```javascript
const timelineElements = {
  // Timeline bar characters
  filled: '█',           // Played/filled time
  empty: '█',            // Unplayed time (dimmed)
  position: '●',         // Current playback position
  selectionStart: '[',   // Selection start marker
  selectionEnd: ']',     // Selection end marker
  selectionFill: '=',    // Selected region fill
  
  // Timeline colors
  colors: {
    filled: '#74b9ff',       // Light blue played
    empty: '#636e72',        // Gray unplayed
    position: '#00b894',     // Mint current position
    selection: '#ff6b9d',    // Pink selection
    selectionFill: '#fd79a8' // Darker pink fill
  }
};
```

## Overlay Interfaces

### Loop Loader Overlay
```
┌─── LOOP LOADER ────────────────────────────────────────────────┐
│ Available Loops (3 found):                                    │
├────────────────────────────────────────────────────────────────┤
│ > rock_groove_120.json     [Rock | C Major | 120 BPM]         │
│   bossa_chill_95.json      [Bossa | F Major | 95 BPM]         │
│   soft_ambient_80.json     [Soft | A Minor | 80 BPM]          │
├────────────────────────────────────────────────────────────────┤
│ Preview: rock_groove_120.json                                  │
│ Created: 2025-09-15 14:30 | Genre: Rock | Key: C Major        │
│ Scale: Major | Time: 4/4 | Tempo: 120 BPM | Loop: 8 bars     │
├────────────────────────────────────────────────────────────────┤
│ [↑↓] Select  [Enter] Load  [P] Preview  [D] Delete  [Esc] Cancel │
└────────────────────────────────────────────────────────────────┘
```

#### Loop Loader Styling
```javascript
const loaderStyles = {
  // Overlay background
  overlay: {
    bg: 'rgba(26, 26, 46, 0.95)',  // Semi-transparent background
    border: '#a29bfe',              // Soft purple border
    shadow: true
  },
  
  // Selected loop highlighting
  selected: {
    bg: '#0f3460',                  // Dark blue background
    fg: '#00b894',                  // Mint green text
    prefix: '> ',                   // Selection indicator
    prefixColor: '#ff6b9d'          // Hot pink prefix
  },
  
  // Unselected loops
  unselected: {
    bg: 'transparent',
    fg: '#ddd',                     // Light gray text
    prefix: '  ',                   // Spacing
  },
  
  // Loop metadata
  metadata: {
    brackets: '#a29bfe',            // Soft purple brackets
    genre: '#fab1a0',               // Coral genre
    key: '#74b9ff',                 // Light blue key
    tempo: '#00b894'                // Mint green tempo
  }
};
```

### Save Loop Dialog
```
┌─── SAVE CURRENT LOOP ──────────────────────────────────────────┐
│ Current Parameters:                                            │
│ Genre: Rock | Key: C Major | Scale: Major | Time: 4/4         │
│ Tempo: 120 BPM | Loop: 8 bars | Swing: OFF                    │
├────────────────────────────────────────────────────────────────┤
│ Loop Name: [rock_groove_120________________________]           │
│            ▌ (cursor)                                         │
├────────────────────────────────────────────────────────────────┤
│ [Enter] Save  [Esc] Cancel  [Tab] Auto-generate name          │
└────────────────────────────────────────────────────────────────┘
```

#### Text Input Styling
```javascript
const textInputStyles = {
  // Input field
  field: {
    bg: '#0f3460',                  // Dark blue background
    fg: '#ddd',                     // Light gray text
    border: '#74b9ff',              // Light blue border
    focusBorder: '#00b894'          // Mint green when focused
  },
  
  // Cursor
  cursor: {
    char: '▌',                      // Block cursor
    color: '#00b894',               // Mint green
    blinkRate: 800                  // 800ms blink cycle
  },
  
  // Placeholder text
  placeholder: {
    color: '#636e72',               // Gray placeholder
    text: 'enter_loop_name_here'
  }
};
```

## Animation & Transition Effects

### Startup Animation Sequence
```javascript
const startupAnimation = {
  duration: 2000,  // 2 second total startup
  
  sequence: [
    { time: 0,    effect: 'fadeIn', target: 'header', duration: 500 },
    { time: 200,  effect: 'slideIn', target: 'parameters', duration: 400 },
    { time: 400,  effect: 'slideIn', target: 'musicFlow', duration: 400 },
    { time: 600,  effect: 'fadeIn', target: 'status', duration: 300 },
    { time: 800,  effect: 'fadeIn', target: 'controls', duration: 300 },
    { time: 1000, effect: 'startFlow', target: 'gradient', duration: 1000 }
  ]
};
```

### Parameter Change Animations
```javascript
const parameterAnimations = {
  // Parameter value change
  valueChange: {
    duration: 300,
    effect: 'colorTransition',
    fromColor: '#74b9ff',           // Light blue
    toColor: '#fdcb6e',             // Warm yellow
    finalColor: '#74b9ff'           // Back to light blue
  },
  
  // Active parameter highlight
  activeHighlight: {
    duration: 150,
    effect: 'backgroundPulse',
    color: '#0f3460',               // Dark blue background
    intensity: 0.8
  },
  
  // Invalid parameter flash
  errorFlash: {
    duration: 200,
    effect: 'colorFlash',
    color: '#e17055',               // Coral error
    intensity: 1.0
  }
};
```

### Mode Transition Effects
```javascript
const modeTransitions = {
  // Live to Buffer mode
  liveToBuffer: {
    duration: 500,
    effects: [
      { target: 'header', effect: 'textChange', newText: '⏯️ Buffer Playback Mode ⏯️' },
      { target: 'musicFlow', effect: 'pauseAnimation' },
      { target: 'timeline', effect: 'slideIn', direction: 'down' },
      { target: 'controls', effect: 'replaceContent', newContent: 'bufferControls' }
    ]
  },
  
  // Buffer to Live mode  
  bufferToLive: {
    duration: 500,
    effects: [
      { target: 'timeline', effect: 'slideOut', direction: 'up' },
      { target: 'header', effect: 'textChange', newText: '🎵 Live Session Active 🎵' },
      { target: 'musicFlow', effect: 'resumeAnimation' },
      { target: 'controls', effect: 'replaceContent', newContent: 'liveControls' }
    ]
  }
};
```

## Responsive Design & Adaptations

### Terminal Size Adaptations
```javascript
const responsiveRules = {
  // Minimum viable layout (80x24)
  small: {
    width: 80,
    height: 24,
    adaptations: {
      parameters: 'compact',      // Shorter parameter names
      flow: 'reduced',            // Fewer flow characters
      controls: 'essential'       // Only essential controls
    }
  },
  
  // Standard layout (100x30)
  medium: {
    width: 100,
    height: 30,
    adaptations: {
      parameters: 'standard',
      flow: 'full',
      controls: 'standard',
      extra: 'help_hints'         // Show additional hints
    }
  },
  
  // Extended layout (120x40)
  large: {
    width: 120,
    height: 40,
    adaptations: {
      parameters: 'expanded',     // More detailed parameters
      flow: 'wide',               // Wider flow visualization
      controls: 'extended',       // All controls
      extra: 'performance_stats'  // Show performance info
    }
  }
};
```

### Color Depth Adaptations
```javascript
const colorAdaptations = {
  // 8-color terminals
  basic: {
    background: 'black',
    text: 'white',
    highlight: 'green',
    warning: 'red',
    gradient: ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta']
  },
  
  // 256-color terminals
  extended: {
    // Use full palette with fallback colors
    fallbackMap: {
      '#ff6b9d': 'brightred',
      '#8e44ad': 'magenta',
      '#0abde3': 'cyan',
      '#1e3799': 'blue'
    }
  },
  
  // True color terminals (24-bit)
  trueColor: {
    // Use full hex color palette
    enableGradients: true,
    enableTransparency: true
  }
};
```

This comprehensive visual specification provides a complete blueprint for implementing a beautiful, functional, and responsive terminal user interface for the chiptune music generator with flowing gradient visualization and intuitive controls.