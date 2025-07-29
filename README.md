# Talk

A modern web application for voice recording, transcription, and text processing with AI-powered enhancements.

## Features
- **Voice Recording**: Record audio with real-time visualization
- **AI Transcription**: Powered by Groq's Whisper-large-v3 model
- **Text Enhancement**: Post-process transcripts using Gemini AI
- **Multi-language Support**: English, Japanese, Chinese, and Korean
- **Text-to-Speech**: Convert processed text back to speech
- **Recording History**: Local storage with playback functionality
- **Keyboard Shortcuts**: Ctrl or Ctrl+/ for quick recording
- **Custom Prompts**: Editable AI processing instructions
- **Dark Mode**: Responsive dark/light theme
- **Real-time Audio Visualization**: Visual feedback during recording

## Prerequisites

### Required Software
- Node.js 18 or higher
- pnpm (recommended) or npm
- Modern web browser with microphone access

### API Keys Required
- **Groq API Key**: For speech-to-text transcription
- **Google Gemini API Key**: For text post-processing

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd Talk
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Configure API keys:
   - Copy `config/credentials/google-cloud-credentials.example.json` to `config/credentials/google-cloud-credentials.json`
   - Add your API keys to `config/api-keys.json`:
   ```json
   {
     "groqApiKey": "your-groq-api-key",
     "geminiApiKey": "your-gemini-api-key"
   }
   ```

## Development

Start the development server:
```bash
pnpm dev
# or
npm run dev
```

The application will be available at http://localhost:5173

## Usage

### Recording Audio
1. Click the "Start Recording" button or use keyboard shortcuts:
   - **Ctrl**: Press and hold to record
   - **Ctrl + /**: Alternative shortcut
2. Speak into your microphone while recording indicator is active
3. Release the key or click "Stop Recording" to finish

### Customizing AI Processing
1. Click the "+" menu button in the top-right corner
2. Select "Edit Prompt" to customize how AI processes your transcriptions
3. Available languages: English, Japanese, Chinese (Simplified), Korean

### Viewing History
- All recordings are automatically saved and displayed below the recording area
- Click on any recording to replay the audio
- Each entry shows original transcript and AI-enhanced text

## Production Build

Build the application:
```bash
pnpm build
# or
npm run build
```

Start the production server:
```bash
pnpm start
# or
npm start
```

The server runs on port 3000 by default.

## Project Structure
```
Talk/
├── src/                     # Source code
│   ├── components/          # React components
│   │   ├── AudioVisualizer.tsx    # Real-time audio visualization
│   │   ├── PromptEditor.tsx       # Custom prompt editing interface
│   │   └── RecordingHistory.tsx   # Recording history display
│   ├── lib/                 # Core functionality
│   │   ├── api.ts           # AI API integrations (Groq, Gemini)
│   │   ├── db.ts            # Local database operations
│   │   ├── recorder.ts      # Audio recording functionality
│   │   ├── tts.ts           # Text-to-speech conversion
│   │   ├── storage.ts       # Local storage management
│   │   └── language-detector.ts # Language detection utilities
│   ├── config/              # Configuration files
│   │   ├── config-loader.ts # API key loading
│   │   └── keys.ts          # Key management
│   ├── App.tsx              # Main application component
│   ├── store.ts             # State management (Zustand)
│   └── types.ts             # TypeScript type definitions
├── config/                  # Configuration directory
│   ├── api-keys.json        # API keys configuration
│   └── credentials/         # Service account credentials
├── server.js                # Express server for production
├── package.json             # Dependencies and scripts
└── vite.config.ts           # Build configuration
```

## Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Audio Processing**: Web Audio API
- **Local Storage**: Dexie (IndexedDB)
- **AI Services**: 
  - Groq API (Whisper-large-v3 for transcription)
  - Google Gemini API (text enhancement)
- **Build Tool**: Vite
- **Backend**: Express.js (production server)

## Security Considerations

1. **API Keys and Credentials**
   - Store API keys in `config/api-keys.json` (not committed)
   - Keep Google Cloud credentials in `config/credentials/` (not committed)
   - Never commit sensitive data to version control

2. **Browser Permissions**
   - Requires microphone access for recording
   - Uses secure HTTPS for production deployment

3. **Data Privacy**
   - All recordings stored locally in browser
   - Transcripts processed via external AI APIs
   - No server-side data persistence

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
MIT License