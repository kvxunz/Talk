interface ApiConfig {
  groq: {
    apiKey: string;
  };
  gemini: {
    apiKey: string;
  };
}

let config: ApiConfig | null = null;

async function loadConfig(): Promise<ApiConfig> {
  if (config) {
    return config;
  }

  try {
    // 从服务器端点获取配置
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status}`);
    }
    config = await response.json();
    return config as ApiConfig;
  } catch (error) {
    console.error('Failed to load API keys config:', error);
    throw new Error('Could not load API configuration');
  }
}

export async function getGroqApiKey(): Promise<string> {
  const cfg = await loadConfig();
  return cfg.groq.apiKey;
}

export async function getGeminiApiKey(): Promise<string> {
  const cfg = await loadConfig();
  return cfg.gemini.apiKey;
}