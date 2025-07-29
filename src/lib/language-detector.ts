// 支持的语言类型
export type SupportedLanguage = 'en-US' | 'ja-JP' | 'cmn-CN' | 'ko-KR';

// 语言检测函数
export function detectLanguage(text: string): SupportedLanguage {
  // 日文特有字符范围
  const hasHiragana = /[\u3040-\u309F]/.test(text);
  const hasKatakana = /[\u30A0-\u30FF]/.test(text);
  
  // 中文字符范围
  const hasHanzi = /[\u4E00-\u9FFF]/.test(text);
  
  // 韩文字符范围
  const hasHangul = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
  
  // 日语特有的语法标记
  const hasJapaneseParticles = /(です|ます|だ|よ|ね|か|な|の|を|は|が|に|へ|で)[\s\u3000]*[。\.]?/.test(text);
  
  // 中文特有的语气词和标点
  const hasChineseParticles = /(了|的|吗|呢|吧|啊|呀|哦|哎|嘛)[，。！？\s]*$/.test(text);

  // 优先检测日语
  // 如果有平假名或片假名，几乎可以确定是日语
  if (hasHiragana || hasKatakana) {
    return 'ja-JP';
  }
  
  // 检测韩语
  if (hasHangul) {
    return 'ko-KR';
  }
  
  // 检测中文
  // 有汉字且有中文语气词，或者纯汉字文本
  if (hasHanzi && (hasChineseParticles || !hasJapaneseParticles)) {
    return 'cmn-CN';
  }
  
  // 如果只有汉字，且有日语语法特征，判断为日语
  if (hasHanzi && hasJapaneseParticles) {
    return 'ja-JP';
  }

  // 默认英语
  return 'en-US';
}
