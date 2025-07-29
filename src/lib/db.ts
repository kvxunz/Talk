import Dexie, { Table } from 'dexie';

export interface Recording {
  id: string;
  text: string;
  originalText: string;
  duration: number;
  audioBlob: Blob;
  ttsAudioBlob?: Blob; // 存储 TTS 生成的音频
  timestamp: string;
}

class WhispoDB extends Dexie {
  recordings!: Table<Recording>;

  constructor() {
    super('whispoDB');
    this.version(2).stores({
      recordings: 'id, timestamp'
    });
  }
}

export const db = new WhispoDB();
