// 现代存储管理工具
export class StorageManager {
  private readonly prefix: string = 'ieltstalk_';

  // 存储数据
  set(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serializedValue);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  // 获取数据
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  // 删除数据
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  // 清除所有数据
  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  // 检查是否支持本地存储
  static isAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const storage = new StorageManager();
