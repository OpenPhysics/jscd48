# jscd48 - JavaScript Interface for CD48 Coincidence Counter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome](https://img.shields.io/badge/Chrome-89+-green.svg)](https://www.google.com/chrome/)
[![Edge](https://img.shields.io/badge/Edge-89+-blue.svg)](https://www.microsoft.com/edge)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://openphysics.github.io/jscd48/)

A browser-based JavaScript library and web interface for controlling the [Red Dog Physics CD48 Coincidence Counter](https://www.reddogphysics.com/cd48.html) using the Web Serial API.

**No installation required** - just open the web page in Chrome or Edge and connect to your CD48.

## Live Demo

**[https://openphysics.github.io/jscd48/](https://openphysics.github.io/jscd48/)**

Open the link above in Chrome or Edge, connect your CD48 via USB, and click "Connect".

## Features

- **Zero installation** - Works directly in Chrome/Edge browser
- **Real-time monitoring** - Live count display with rate calculation
- **Full device control** - Trigger levels, impedance, DAC output
- **High-level measurements** - Rate and coincidence measurement with accidental correction
- **Clean JavaScript API** - Easy integration into custom applications
- **Standalone library** - Use `cd48.js` in your own projects

## Quick Start

### Option 1: Use the Web Interface

1. Download or clone this repository
2. Start a local server (choose one):
   ```bash
   # Using npx (no install needed)
   npx serve .

   # Or using npm
   npm start
   ```
3. Open the URL shown (usually http://localhost:3000) in Chrome or Edge
4. Click **Connect** and select your CD48

### Option 2: Use the JavaScript Library

Include `cd48.js` in your HTML:

```html
<script src="cd48.js"></script>
<script>
async function main() {
    const cd48 = new CD48();
    await cd48.connect();

    const version = await cd48.getVersion();
    console.log('Firmware:', version);

    const counts = await cd48.getCounts();
    console.log('Counts:', counts);

    await cd48.disconnect();
}
main();
</script>
```

## Requirements

- **Browser**: Chrome 89+, Edge 89+, or Opera 76+
- **CD48 Device**: Connected via USB

> **Note**: Firefox and Safari do not support the Web Serial API.

## Web Interface

The included `index.html` provides a complete control panel:

- **Channel Counts** - Real-time display for all 8 channels with auto-refresh
- **Rate Display** - Calculated count rates in Hz
- **Trigger Level** - Adjustable threshold (0-4.08V)
- **Impedance** - Toggle between 50Ω and High-Z
- **DAC Output** - Adjustable output voltage (0-4.08V)
- **LED Test** - Verify device communication
- **Activity Log** - Debug messages and status updates

## JavaScript API Reference

### Creating an Instance

```javascript
const cd48 = new CD48({
    baudRate: 115200,    // Default: 115200
    commandDelay: 50     // Delay after commands in ms
});
```

### Connection

```javascript
// Check browser support
if (CD48.isSupported()) {
    // Connect (opens port picker dialog)
    await cd48.connect();

    // Check connection status
    if (cd48.isConnected()) {
        // ... use device
    }

    // Disconnect
    await cd48.disconnect();
}
```

### Reading Counts

```javascript
// Get parsed counts object
const data = await cd48.getCounts();
// Returns: { counts: [n0, n1, n2, n3, n4, n5, n6, n7], overflow: 0 }

// Get human-readable string
const text = await cd48.getCounts(true);

// Clear all counters
await cd48.clearCounts();

// Check overflow status
const overflow = await cd48.getOverflow();
```

### Configuration

```javascript
// Set trigger level (0-4.08V)
await cd48.setTriggerLevel(0.5);

// Set impedance
await cd48.setImpedance50Ohm();
await cd48.setImpedanceHighZ();

// Set DAC output voltage (0-4.08V)
await cd48.setDacVoltage(2.0);

// Configure a channel
// Channel 4 counts A+B coincidences
await cd48.setChannel(4, { A: 1, B: 1, C: 0, D: 0 });

// Set auto-report interval (100-65535 ms)
await cd48.setRepeat(1000);

// Toggle auto-reporting
await cd48.toggleRepeat();
```

### Device Information

```javascript
// Firmware version
const version = await cd48.getVersion();

// Current settings
const settings = await cd48.getSettings();

// Built-in help
const help = await cd48.getHelp();

// Test LEDs
await cd48.testLeds();
```

### High-Level Measurements

```javascript
// Measure count rate on a channel
const rate = await cd48.measureRate(0, 10);  // Channel 0, 10 seconds
// Returns: { counts, duration, rate, channel }
console.log(`Rate: ${rate.rate.toFixed(2)} Hz`);

// Measure coincidences with accidental correction
const result = await cd48.measureCoincidenceRate({
    duration: 60,
    singlesAChannel: 0,
    singlesBChannel: 1,
    coincidenceChannel: 4,
    coincidenceWindow: 25e-9  // 25 ns
});
// Returns: {
//   singlesA, singlesB, coincidences, duration,
//   rateA, rateB, coincidenceRate,
//   accidentalRate, trueCoincidenceRate
// }
console.log(`True coincidence rate: ${result.trueCoincidenceRate.toFixed(2)} Hz`);
```

## Channel Configuration

The CD48 has 8 counter channels (0-7) that can be configured to count singles or coincidences:

| Channel | Default Config | Description |
|---------|---------------|-------------|
| 0 | A only | Input A singles |
| 1 | B only | Input B singles |
| 2 | C only | Input C singles |
| 3 | D only | Input D singles |
| 4 | A + B | Two-fold coincidence |
| 5 | A + C | Two-fold coincidence |
| 6 | A + D | Two-fold coincidence |
| 7 | B + C + D | Three-fold coincidence |

Configure channels using:
```javascript
// Count A+B+C triple coincidences on channel 7
await cd48.setChannel(7, { A: 1, B: 1, C: 1, D: 0 });
```

## Technical Specifications

- **Counters 0-6**: 24-bit (max: 16,777,215)
- **Counter 7**: 16-bit (max: 65,535)
- **Coincidence window**: ~25 ns
- **Trigger range**: 0-4.08V (8-bit resolution)
- **DAC output**: 0-4.08V (8-bit resolution)
- **Input impedance**: 50Ω or High-Z (selectable)
- **Baud rate**: 115200

## Troubleshooting

### "Web Serial API not supported"

Use Chrome 89+, Edge 89+, or Opera 76+. Firefox and Safari don't support Web Serial.

### "No CD48 device selected"

- Ensure the CD48 is connected via USB
- Close any other applications using the serial port (PuTTY, Python, etc.)
- Try unplugging and reconnecting the device

### Connection works but no response

- The CD48 uses Cypress VID `0x04B4` - make sure you select the correct device
- Try refreshing the page and reconnecting
- Check the Activity Log for error messages

### Port picker shows no devices

- On Linux, add your user to the `dialout` group:
  ```bash
  sudo usermod -a -G dialout $USER
  ```
  Then log out and back in.

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 89+ | Full support |
| Edge | 89+ | Full support |
| Opera | 76+ | Full support |
| Firefox | - | Not supported |
| Safari | - | Not supported |

## Security

The Web Serial API requires:
- **User gesture** - Connection must be initiated by a click
- **Explicit selection** - User chooses the port from a picker
- **Secure context** - HTTPS or localhost only

This prevents websites from silently accessing serial devices.

## Examples

### Simple Count Monitor

```javascript
const cd48 = new CD48();
await cd48.connect();

setInterval(async () => {
    const data = await cd48.getCounts();
    console.log('Ch0:', data.counts[0], 'Ch1:', data.counts[1]);
}, 1000);
```

### Coincidence Experiment

```javascript
const cd48 = new CD48();
await cd48.connect();

// Configure for A-B coincidences
await cd48.setChannel(0, { A: 1, B: 0, C: 0, D: 0 });  // A singles
await cd48.setChannel(1, { A: 0, B: 1, C: 0, D: 0 });  // B singles
await cd48.setChannel(4, { A: 1, B: 1, C: 0, D: 0 });  // A+B coincidence

// Set trigger level
await cd48.setTriggerLevel(0.3);

// Measure for 60 seconds
const result = await cd48.measureCoincidenceRate({ duration: 60 });

console.log(`Singles A: ${result.rateA.toFixed(1)} Hz`);
console.log(`Singles B: ${result.rateB.toFixed(1)} Hz`);
console.log(`Coincidences: ${result.coincidenceRate.toFixed(1)} Hz`);
console.log(`Accidentals: ${result.accidentalRate.toFixed(3)} Hz`);
console.log(`True coincidences: ${result.trueCoincidenceRate.toFixed(1)} Hz`);

await cd48.disconnect();
```

## Related Projects

- [pycd48](https://github.com/OpenPhysics/pycd48) - Python interface for CD48
- [Red Dog Physics CD48](https://www.reddogphysics.com/cd48.html) - Official hardware

## License

MIT License - see [LICENSE](LICENSE) file.

## Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

## Acknowledgments

This library interfaces with the CD48 Coincidence Counter designed and manufactured by [Red Dog Physics](https://www.reddogphysics.com/).
