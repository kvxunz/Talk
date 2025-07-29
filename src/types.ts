export interface Recording {
  id: string;
  text: string;
  originalText: string;
  duration: number;
  audioBlob: Blob;
  timestamp: string;
  ttsAudioBlob?: Blob;
}
