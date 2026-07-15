class SafeStorage {
  private memory: Record<string, string> = {};
  private storage: Storage | null;

  constructor(type: 'local' | 'session') {
    try {
      this.storage = type === 'local' ? window.localStorage : window.sessionStorage;
      const x = '__test__';
      this.storage.setItem(x, x);
      this.storage.removeItem(x);
    } catch (e) {
      console.warn(`[SafeStorage] ${type}Storage is not available. Falling back to memory storage.`, e);
      this.storage = null;
    }
  }

  getItem(key: string): string | null {
    if (this.storage) {
      try {
        return this.storage.getItem(key);
      } catch (e) {
        return this.memory[key] || null;
      }
    }
    return this.memory[key] || null;
  }

  setItem(key: string, value: string): void {
    if (this.storage) {
      try {
        this.storage.setItem(key, value);
      } catch (e) {
        this.memory[key] = value;
      }
    } else {
      this.memory[key] = value;
    }
  }

  removeItem(key: string): void {
    if (this.storage) {
      try {
        this.storage.removeItem(key);
      } catch (e) {
        delete this.memory[key];
      }
    } else {
      delete this.memory[key];
    }
  }

  clear(): void {
    if (this.storage) {
      try {
        this.storage.clear();
      } catch (e) {
        this.memory = {};
      }
    } else {
      this.memory = {};
    }
  }
}

export const safeLocalStorage = new SafeStorage('local');
export const safeSessionStorage = new SafeStorage('session');
