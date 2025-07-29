class TTSService {
  private readonly API_URL = '/api/tts';

  async synthesize(text: string, lang: string = 'en-US'): Promise<ArrayBuffer> {
    try {
      console.log('Sending TTS request:', { text, lang });
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, lang })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to synthesize speech: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('Content-Type');
      console.log('TTS response received:', { contentType });
      
      if (!contentType?.includes('audio/')) {
        const errorText = await response.text();
        console.error('Invalid content type:', { contentType, errorText });
        throw new Error('Invalid response from TTS service');
      }

      const buffer = await response.arrayBuffer();
      console.log('Audio buffer received, size:', buffer.byteLength);
      return buffer;
    } catch (error) {
      console.error('TTS Error:', error);
      throw error;
    }
  }

  async playText(text: string, lang: string = 'en-US'): Promise<void> {
    try {
      console.log('Starting TTS playback:', { text, lang });
      
      // 首先尝试使用服务器端 TTS API
      try {
        const audioContent = await this.synthesize(text, lang);
        
        console.log('Creating audio blob...');
        const blob = new Blob([audioContent], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        return new Promise((resolve, reject) => {
          audio.oncanplay = () => {
            console.log('Audio ready to play');
          };
          
          audio.onplay = () => {
            console.log('Audio playback started');
          };
          
          audio.onended = () => {
            console.log('Audio playback completed');
            URL.revokeObjectURL(url);
            resolve();
          };
          
          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            URL.revokeObjectURL(url);
            reject(new Error('Failed to play audio'));
          };
          
          console.log('Starting audio playback...');
          audio.play().catch((error) => {
            console.error('Audio play error:', error);
            URL.revokeObjectURL(url);
            reject(error);
          });
        });
      } catch (serverError) {
        // 服务器TTS失败，降级使用浏览器的Web Speech API
        console.warn('Server TTS failed, falling back to Web Speech API:', serverError);
        return this.useWebSpeechAPI(text, lang);
      }
    } catch (error) {
      console.error('Play TTS Error:', error);
      throw error;
    }
  }

  // 使用浏览器的Web Speech API作为备用TTS方案
  private useWebSpeechAPI(text: string, lang: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        console.error('Web Speech API is not supported in this browser');
        reject(new Error('Web Speech API is not supported'));
        return;
      }

      // 停止任何当前播放
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // 处理语言代码
      if (lang.startsWith('cmn-')) {
        utterance.lang = 'zh-CN'; // 中文
      } else if (lang.includes('-')) {
        utterance.lang = lang;
      } else {
        utterance.lang = lang;
      }

      utterance.onend = () => {
        console.log('Web Speech API playback completed');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Web Speech API error:', event);
        reject(new Error('Web Speech API playback failed'));
      };

      console.log('Starting Web Speech API playback', { lang: utterance.lang });
      window.speechSynthesis.speak(utterance);
    });
  }
}

// 创建单例实例
export const ttsService = new TTSService();
