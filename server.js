import express from 'express';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载API密钥配置
let apiKeys = null;
try {
  const apiKeysPath = path.join(__dirname, 'config', 'api-keys.json');
  apiKeys = JSON.parse(fs.readFileSync(apiKeysPath, 'utf8'));
  console.log('API keys loaded successfully');
} catch (error) {
  console.error('Failed to load API keys:', error);
  process.exit(1);
}

// 创建日志写入流
const logStream = fs.createWriteStream(path.join(__dirname, 'server.log'), { flags: 'a' });

// 自定义日志函数
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
};

const app = express();

// 配置 CORS
app.use(cors({
  origin: '*',  // 在生产环境中应该设置为具体的域名
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// API配置端点
app.get('/api/config', (req, res) => {
  try {
    log('Serving API keys configuration');
    res.json(apiKeys);
  } catch (error) {
    log(`Error serving config: ${error}`);
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});

// Serve static files from the dist directory
app.use(express.static('dist'));

// Initialize Text-to-Speech client
let client;
try {
  log('Initializing Google TTS client...');
  const credentialsPath = path.join(__dirname, 'config/credentials/google-cloud-credentials.json');
  log(`Using credentials from: ${credentialsPath}`);
  
  client = new TextToSpeechClient({
    keyFilename: credentialsPath
  });
  
  log('Google TTS client initialized successfully');
  
  // List available voices
  client.listVoices({}).then(([response]) => {
    log('Available voices: ' + JSON.stringify(response.voices.map(voice => ({
      name: voice.name,
      languageCode: voice.languageCodes[0],
      gender: voice.ssmlGender
    }))));
  }).catch(error => {
    log(`Failed to list voices: ${error}`);
  });
} catch (error) {
  log(`Failed to initialize Google TTS client: ${error}`);
  process.exit(1);
}

const getVoiceConfig = (lang) => {
  switch (lang) {
    case 'en-US':
      return {
        languageCode: 'en-US',
        name: 'en-US-Neural2-C',
        ssmlGender: 'FEMALE'
      };
    case 'ja-JP':
      return {
        languageCode: 'ja-JP',
        name: 'ja-JP-Neural2-B',
        ssmlGender: 'FEMALE'
      };
    case 'cmn-CN':
      return {
        languageCode: 'cmn-CN',
        name: 'cmn-CN-Wavenet-A',
        ssmlGender: 'FEMALE'
      };
    case 'ko-KR':
      return {
        languageCode: 'ko-KR',
        name: 'ko-KR-Neural2-A',
        ssmlGender: 'FEMALE'
      };
    default:
      return {
        languageCode: 'en-US',
        name: 'en-US-Neural2-C',
        ssmlGender: 'FEMALE'
      };
  }
};

app.post('/api/tts', async (req, res) => {
  try {
    log(`Received TTS request: ${JSON.stringify({
      body: req.body,
      headers: req.headers
    }, null, 2)}`);

    if (!req.body || !req.body.text) {
      log('Invalid request: missing text');
      return res.status(400).json({ error: 'Text is required' });
    }

    const { text, lang = 'en-US' } = req.body;
    const voice = getVoiceConfig(lang);

    log(`Creating TTS request with params: ${JSON.stringify({
      text,
      lang,
      voice
    }, null, 2)}`);

    const request = {
      input: { text },
      voice: voice,
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0,
        speakingRate: 1,
      },
    };

    log('Calling Google TTS API...');
    const [response] = await client.synthesizeSpeech(request);
    
    if (!response || !response.audioContent) {
      log('Invalid response from Google TTS API: ' + JSON.stringify(response));
      return res.status(500).json({ error: 'Invalid response from TTS service' });
    }

    log(`TTS API response received: ${JSON.stringify({
      contentLength: response.audioContent.length,
      isBuffer: Buffer.isBuffer(response.audioContent),
      contentType: 'audio/mpeg'
    }, null, 2)}`);
    
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
    log('Audio response sent successfully');
  } catch (error) {
    log(`Detailed TTS Error: ${JSON.stringify({
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack,
      name: error.name,
      status: error.status
    }, null, 2)}`);

    // Send appropriate error response
    const statusCode = error.code === 7 ? 403 : 500; // 7 is PERMISSION_DENIED
    res.status(statusCode).json({ 
      error: 'TTS service error',
      details: {
        message: error.message,
        code: error.code,
        status: error.status
      }
    });
  }
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  log(`Error occurred: ${err.stack}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log(`Server is running on port ${PORT}`);
});