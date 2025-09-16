# Chiptune Generator

A Node.js command-line application that generates continuous chiptune music loops with real-time parameter control and exports musical themes as data files for game integration.

## Features

- **4-Channel NES-Style Audio**: Pulse Wave A (Lead), Pulse Wave B (Harmony), Triangle Wave (Bass), Noise Channel (Percussion)
- **Real-time Parameter Control**: Adjust tempo, genre, key, scale, loop length, and swing on the fly
- **Three Music Genres**: Soft, Rock, and Bossa Nova
- **Buffer Recording & Playback**: Record your session and navigate through the buffer to find interesting sections
- **Theme Export**: Export selected portions as JSON theme files for game integration
- **Loop Save/Load System**: Save and reload your favorite loop configurations

## Installation

```bash
npm install
```

## Running the Application

```bash
npm start
```

## Controls

### Live Generation Mode

#### Parameter Controls:
- `T` / `Shift+T` - Increase/decrease tempo
- `G` / `Shift+G` - Cycle through genres (soft, rock, bossa)
- `K` / `Shift+K` - Cycle through musical keys
- `S` / `Shift+S` - Cycle through scales (major, minor, blues)
- `L` / `Shift+L` - Increase/decrease loop length
- `W` - Toggle swing/shuffle rhythm
- `3` - Switch to 3/4 time signature
- `4` - Switch to 4/4 time signature

#### Mode Controls:
- `B` - Enter Buffer Playback Mode
- `Ctrl+S` - Save current loop configuration
- `Ctrl+L` - Load saved loop
- `Ctrl+N` - Generate new random loop
- `Q` or `Ctrl+C` - Quit application

#### Volume Controls:
- `+` / `=` - Increase master volume
- `-` - Decrease master volume
- `1` - Toggle Pulse 1 channel
- `2` - Toggle Pulse 2 channel
- `5` - Toggle Triangle channel
- `6` - Toggle Noise channel

### Buffer Playback Mode

#### Navigation:
- `←` / `→` - Seek backward/forward (1 second)
- `Shift+←` / `Shift+→` - Seek backward/forward (10 seconds)
- `Home` - Jump to buffer start
- `End` - Jump to buffer end
- `Page Up` / `Page Down` - Jump by 30 seconds

#### Playback:
- `Space` - Play/Pause
- `R` - Restart from selection start

#### Selection:
- `Enter` - Set selection start point
- `Shift+Enter` - Set selection end point
- `C` - Clear current selection
- `A` - Select all buffer content

#### Export:
- `S` - Save current selection as theme file
- `P` - Preview selection (looped playback)

#### Mode Control:
- `Esc` or `B` - Return to Live Generation Mode
- `Q` - Quit application

## File Structure

- `sessions/` - Auto-saved full sessions
- `themes/` - Exported theme clips (JSON format for game integration)
- `loops/` - Saved loop configurations
- `config/` - Scale and genre configuration files

## Theme File Format

Exported themes are saved as JSON files containing:
- Musical parameters (genre, key, scale, tempo, etc.)
- Note sequences for each channel
- Duration and timing information

Example:
```json
{
  "theme_id": "rock_theme_001",
  "duration_seconds": 8.5,
  "parameters": {
    "genre": "rock",
    "key": "C",
    "scale": "major",
    "tempo": 120
  },
  "channels": {
    "pulse1": [...],
    "pulse2": [...],
    "triangle": [...],
    "noise": [...]
  }
}
```

## Troubleshooting

If you encounter audio issues:
1. Make sure your system audio is working
2. Check that no other applications are using the audio device
3. Try adjusting the master volume with `+` and `-` keys

## Technical Details

- **Sample Rate**: 44.1kHz
- **Bit Depth**: 16-bit
- **Channels**: Stereo output
- **Buffer Size**: 512 samples
- **Max Buffer Duration**: 10 minutes

## License

ISC