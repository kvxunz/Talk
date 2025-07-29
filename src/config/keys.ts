import { getGroqApiKey, getGeminiApiKey } from './config-loader';

interface AppConfig {
  // 其他服务的配置
  groq?: {
    apiKey: string;
  };
  gemini?: {
    apiKey: string;
  };
}

let configPromise: Promise<AppConfig> | null = null;

async function loadAppConfig(): Promise<AppConfig> {
  if (configPromise) {
    return configPromise;
  }

  configPromise = (async () => {
    return {
      groq: {
        apiKey: await getGroqApiKey()
      },
      gemini: {
        apiKey: await getGeminiApiKey()
      }
    };
  })();

  return configPromise;
}

export const getConfig = loadAppConfig;

