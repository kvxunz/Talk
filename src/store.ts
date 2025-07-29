import { create } from 'zustand'
import { db } from './lib/db'
import { Recording as RecordingType } from './types';

export interface RecordingStore {
  recordings: RecordingType[];
  isLoading: boolean;
  addRecording: (recording: RecordingType) => Promise<void>;
  loadRecordings: () => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
  updateTTSAudio: (id: string, ttsAudioBlob: Blob) => Promise<void>;
}

export const useStore = create<RecordingStore>((set) => ({
  recordings: [],
  isLoading: false,

  addRecording: async (recording: RecordingType) => {
    await db.recordings.add(recording);
    const recordings = await db.recordings.toArray();
    // 按时间戳降序排序，最新的在前面
    recordings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    set({ recordings });
  },

  loadRecordings: async () => {
    set({ isLoading: true });
    try {
      const recordings = await db.recordings.toArray();
      // 按时间戳降序排序，最新的在前面
      recordings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      set({ recordings });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteRecording: async (id: string) => {
    await db.recordings.delete(id);
    const recordings = await db.recordings.toArray();
    // 按时间戳降序排序，最新的在前面
    recordings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    set({ recordings });
  },

  updateTTSAudio: async (id: string, ttsAudioBlob: Blob) => {
    await db.recordings.update(id, { ttsAudioBlob });
    const recordings = await db.recordings.toArray();
    // 按时间戳降序排序，最新的在前面
    recordings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    set({ recordings });
  }
}))
