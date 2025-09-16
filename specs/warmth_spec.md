# Warmth Parameter - Technical Specification

## Overview
Add a "Warmth" parameter to control the harshness/smoothness of all audio channels, adjustable in real-time during music generation.

## Warmth Parameter System

### Parameter Definition
```javascript
const warmthParameter = {
  name: 'Warmth',
  key: 'W',               // W to increase, Shift+W to decrease
  range: { min: 0, max: 100 },
  default: 50,            // Start at medium warmth
  step: 10,               // Adjust by 10% increments
  units: '%',
  displayFormat: (value) => `${value}%`
};
```

### Warmth Levels & Audio Effects
```javascript
const warmthLevels = {
  // 0-20%: Harsh (Original NES-style)
  harsh: {
    range: [0, 20],
    displayName: 'Harsh',
    waveforms: {
      pulse1: 'square',
      pulse2: 'square', 
      triangle: 'triangle',
      noise: 'white_noise'
    },
    filtering: 'none'
  },
  
  // 30-50%: Medium (Slightly filtered)
  medium: {
    range: [30, 50], 
    displayName: 'Medium',
    waveforms: {
      pulse1: 'filtered_square',
      pulse2: 'filtered_square',
      triangle: 'triangle',
      noise: 'filtered_noise'
    },
    filtering: 'light_lowpass'
  },
  
  // 60-80%: Soft (Heavy filtering)
  soft: {
    range: [60, 80],
    displayName: 'Soft',
    waveforms: {
      pulse1: 'heavily_filtered_square',
      pulse2: 'heavily_filtered_square', 
      triangle: 'soft_triangle',
      noise: 'soft_noise'
    },
    filtering: 'heavy_lowpass'
  },
  
  // 90-100%: Warm (Sine waves)
  warm: {
    range: [90, 100],
    displayName: 'Warm',
    waveforms: {
      pulse1: 'sine',
      pulse2: 'sine',
      triangle: 'sine',
      noise: 'pink_noise'
    },
    filtering: 'none_needed'
  }
};
```

## Visual Interface Integration

### Parameter Display Update
```
├─── PARAMETERS ─────────────────────────────────────────────────┤
│ Genre: Rock    Key: C Major    Scale: Major    Time: 4/4     │
│ Tempo: 120 BPM    Loop: 8 bars    Warmth: 60%    Mode: LIVE  │
└─────────────────────────────────────────────────────────────────┘
```

### Alternative Display with Names
```
├─── PARAMETERS ─────────────────────────────────────────────────┤
│ Genre: Rock    Key: C Major    Scale: Major    Time: 4/4     │
│ Tempo: 120 BPM    Loop: 8 bars    Warmth: Soft    Mode: LIVE │
└─────────────────────────────────────────────────────────────────┘
```

### Warmth Level Color Coding
```javascript
const warmthColors = {
  harsh: '#e17055',      // Coral (harsh/aggressive)
  medium: '#fdcb6e',     // Warm yellow (balanced)
  soft: '#74b9ff',       // Light blue (gentle)
  warm: '#00b894'        // Mint green (very warm)
};
```

## Control System

### Key Mapping Integration
```javascript
const updatedControls = {
  // Existing controls
  tempo: { up: 'T', down: 'Shift+T' },
  genre: { up: 'G', down: 'Shift+G' },
  key: { up: 'K', down: 'Shift+K' },
  scale: { up: 'S', down: 'Shift+S' },
  loop: { up: 'L', down: 'Shift+L' },
  
  // NEW: Warmth control (replaces swing)
  warmth: { up: 'W', down: 'Shift+W' },
  
  // Swing moved to different key (or removed)
  swing: { toggle: 'Shift+W' }  // Or reassign to different key
};
```

### Warmth Control Behavior
```javascript
const warmthControl = {
  // Increase warmth
  increaseWarmth: () => {
    currentWarmth = Math.min(currentWarmth + 10, 100);
    updateAudioFiltering(currentWarmth);
    showParameterChange('Warmth', currentWarmth + '%');
  },
  
  // Decrease warmth
  decreaseWarmth: () => {
    currentWarmth = Math.max(currentWarmth - 10, 0);
    updateAudioFiltering(currentWarmth);
    showParameterChange('Warmth', currentWarmth + '%');
  },
  
  // Real-time audio update
  updateAudioFiltering: (warmthValue) => {
    const level = getWarmthLevel(warmthValue);
    
    // Update all channels
    channels.forEach(channel => {
      channel.waveform = level.waveforms[channel.type];
      channel.filtering = level.filtering;
    });
    
    // Apply changes immediately
    refreshAudioEngine();
  }
};
```

## Audio Implementation

### Warmth-Based Waveform Generation
```javascript
const warmthAudio = {
  // Generate waveform based on warmth level
  generateWaveform: (type, frequency, warmth, time) => {
    switch(getWarmthLevel(warmth).waveforms[type]) {
      case 'square':
        return generateSquareWave(frequency, time);
        
      case 'filtered_square':
        const square = generateSquareWave(frequency, time);
        const cutoff = mapWarmthToCutoff(warmth); // 2000Hz - 8000Hz
        return lowPassFilter(square, cutoff);
        
      case 'heavily_filtered_square':
        const heavySquare = generateSquareWave(frequency, time);
        return lowPassFilter(heavySquare, 1000); // Heavy filtering
        
      case 'sine':
        return generateSineWave(frequency, time);
        
      case 'triangle':
        return generateTriangleWave(frequency, time);
        
      case 'soft_triangle':
        const triangle = generateTriangleWave(frequency, time);
        return lowPassFilter(triangle, 3000); // Gentle filtering
        
      default:
        return generateSquareWave(frequency, time);
    }
  },
  
  // Map warmth percentage to filter cutoff
  mapWarmthToCutoff: (warmth) => {
    // Higher warmth = lower cutoff = warmer sound
    return 8000 - (warmth * 60); // 8000Hz at 0% to 2000Hz at 100%
  }
};
```

### Simple Low-Pass Filter Implementation
```javascript
const audioFiltering = {
  // Simple one-pole low-pass filter
  lowPassFilter: (input, cutoffFreq, sampleRate = 44100) => {
    const RC = 1.0 / (cutoffFreq * 2 * Math.PI);
    const dt = 1.0 / sampleRate;
    const alpha = dt / (RC + dt);
    
    let output = [];
    let prev = 0;
    
    for (let i = 0; i < input.length; i++) {
      prev = prev + alpha * (input[i] - prev);
      output[i] = prev;
    }
    
    return output;
  }
};
```

## Updated Control Display

### Enhanced Controls Section
```
├─── CONTROLS ───────────────────────────────────────────────────┤
│ [T] Tempo  [G] Genre  [K] Key  [S] Scale  [L] Loop  [W] Warmth │
│ [3][4] Time  [B] Buffer  [Ctrl+S] Save  [Ctrl+L] Load  [Q] Quit │
└─────────────────────────────────────────────────────────────────┘
```

### Swing Control Relocation Options
Since W is now used for Warmth, swing could be:
1. **Removed entirely** (simplify interface)
2. **Moved to different key** (like `Shift+S` for swing)
3. **Combined with time signature** (3/4, 4/4, 4/4s for swing)

## Genre Integration

### Genre-Specific Warmth Defaults
```javascript
const genreWarmthDefaults = {
  rock: 30,      // Medium-harsh for rock energy
  bossa: 70,     // Soft for smooth bossa nova
  soft: 80       // Very warm for ambient soft music
};

// When switching genres, warmth auto-adjusts but can be overridden
const genreSwitch = (newGenre) => {
  if (!userHasChangedWarmth) {
    currentWarmth = genreWarmthDefaults[newGenre];
    updateAudioFiltering(currentWarmth);
  }
};
```

## H Mode Integration

### Warmth in H Mode
```javascript
const hModeWarmth = {
  // Warmth affects all built patterns
  applyToBuiltPatterns: true,
  
  // Can adjust warmth while building
  realTimeAdjustment: true,
  
  // Warmth preserved when exiting H mode
  persistence: true
};
```

## Implementation Priority

### Phase 1: Basic Warmth
- Add warmth parameter (0-100%)
- W/Shift+W controls  
- Simple sine wave at 100% warmth
- Square wave at 0% warmth
- Linear interpolation between

### Phase 2: Enhanced Filtering
- Add low-pass filtering for intermediate values
- Multiple warmth levels with names
- Genre-specific defaults

### Phase 3: Advanced Features
- Per-channel warmth control (future)
- Warmth visualization in flow
- Warmth presets/memory

This warmth parameter will make a huge difference in making your chiptune generator sound much more musical and pleasant while maintaining the real-time control paradigm!