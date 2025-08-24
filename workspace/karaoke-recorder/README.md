# Karaoke Recorder (Web)

A React + TypeScript app built with Vite for recording your voice over high-quality backing tracks. It mixes your microphone and the selected track in real-time using the Web Audio API and lets you download the final recording.

## Features
- Mix microphone + backing track with per-channel and master gain
- Record the mixed output using MediaRecorder
- Import tracks via curated library, file upload, or URL
- Input device selection (microphone)
- Level meter for monitoring
- Adjustable recording bitrate (64–320 kbps)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the dev server:
```bash
npm run dev
```
Open the printed local URL in a browser that supports getUserMedia and MediaRecorder (Chrome, Edge, or recent Firefox).

3. Build for production:
```bash
npm run build
```
Serve `dist/` with any static server.

## How to Use
1. Allow microphone access when prompted.
2. Select a backing track from the dropdown, upload an audio file, or paste a URL.
3. Choose your microphone device.
4. Adjust Mic/Track/Master levels and press Play to rehearse.
5. Press Record to start recording the mix, then Stop to finish.
6. Click Download to save your recording (WebM/Opus by default).

## Notes
- Backing tracks in the library use Wikimedia Commons OGG files (public domain/CC). You can add more in `src/library/tracks.ts`.
- For best quality, use headphones to avoid feedback and echo cancellation artifacts.
- Browser security requires user interaction (e.g., button press) before audio playback/recording can start.

## License
This project code is provided for demonstration. Ensure you have the rights to any music you use. The bundled curated track URLs point to public domain/CC-licensed recordings.
