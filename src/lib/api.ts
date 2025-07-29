import { getGroqApiKey, getGeminiApiKey } from '../config/config-loader';

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'json');

  try {
    console.log('Sending request to Groq API...');
    const apiKey = await getGroqApiKey();
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status} ${response.statusText}\nResponse: ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Failed to parse response: ${responseText}`);
    }

    if (!data.text) {
      throw new Error(`No transcription in response: ${JSON.stringify(data)}`);
    }

    return data.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

// 支持的语言类型
export type SupportedLanguage = 'en-US' | 'ja-JP' | 'cmn-CN' | 'ko-KR';

// 默认的 prompts
const DEFAULT_PROMPTS = {
  'en-US': `Please improve this transcription to make it more natural and IELTS-like in English, while preserving the original meaning. Do not use any markdown formatting in your response:

Original transcript: "{{text}}"`,

  'ja-JP': `以下の文章を自然な日本語に翻訳してください。

- 翻訳のみを出力し、説明や注釈は不要です
- 原文のニュアンスや話し言葉/書き言葉の特徴を保持してください
- マークダウン形式は使用しないでください

原文: "{{text}}"`,

  'cmn-CN': `请将这段文字翻译成自然的中文，保持原意。请不要使用任何 markdown 格式：

原文："{{text}}"`,

  'ko-KR': `이 텍스트를 자연스러운 한국어로 번역해주세요. 원래 의미를 유지하면서 markdown 형식을 사용하지 마세요:

원본 텍스트: "{{text}}"`
};

let currentPrompt = DEFAULT_PROMPTS['en-US'];
let currentLanguage: SupportedLanguage = 'en-US';

export function setCustomPrompt(prompt: string) {
  currentPrompt = prompt;
}

export function getCustomPrompt(): string {
  return currentPrompt;
}

// 设置目标语言，同时更新 prompt
export function setTargetLanguage(lang: SupportedLanguage) {
  currentLanguage = lang;
  // 如果当前 prompt 是默认的，则切换到新语言的默认 prompt
  if (Object.values(DEFAULT_PROMPTS).includes(currentPrompt)) {
    currentPrompt = DEFAULT_PROMPTS[lang];
  }
}

// 获取当前语言
export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

// 获取特定语言的默认 prompt
export function getDefaultPrompt(lang: SupportedLanguage): string {
  return DEFAULT_PROMPTS[lang];
}

export async function postProcessTranscript(text: string): Promise<string> {
  const prompt = currentPrompt.replace('{{text}}', text);

  try {
    console.log('Sending request to Gemini API...');
    const apiKey = await getGeminiApiKey();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        })
      }
    );

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      throw new Error(`Post-processing failed: ${response.status} ${response.statusText}\nResponse: ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Failed to parse response: ${responseText}`);
    }

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0] || !data.candidates[0].content.parts[0].text) {
      throw new Error(`No post-processed text in response: ${JSON.stringify(data)}`);
    }

    // Remove markdown formatting
    let processedText = data.candidates[0].content.parts[0].text;
    processedText = processedText.replace(/\*\*/g, '');
    return processedText;
  } catch (error) {
    console.error('Post-processing error:', error);
    throw error;
  }
}

export async function textToSpeech(text: string): Promise<Blob> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      text,
      lang: getCurrentLanguage()  
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('TTS error:', error);
    throw new Error(error || 'Failed to convert text to speech');
  }

  const reader = response.body?.getReader();
  let audioUrl: string | null = null;

  if (!reader) {
    throw new Error('Failed to read response stream');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = new TextDecoder().decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.url) {
            audioUrl = data.url;
            break;
          }
        } catch (e) {
          console.error('Failed to parse event data:', e);
        }
      }
    }

    if (audioUrl) break;
  }

  reader.releaseLock();

  if (!audioUrl) {
    throw new Error('Failed to get audio URL');
  }

  // Get the audio file
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error('Failed to fetch audio file');
  }

  return audioResponse.blob();
}
