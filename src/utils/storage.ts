export interface StorageState {
  rawRows?: any[];
  fileName?: string;
  mapping?: any;
  modelType?: string;
  horizonDays?: number;
  windowSize?: number;
  filters?: any;
}

const STORAGE_KEY = 'predictive_analytics_state_v1';

export function saveToLocalStorage(data: StorageState): { success: boolean; error?: string } {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (err: any) {
    console.warn('localStorage error:', err);
    if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) {
      return {
        success: false,
        error: 'Storage limit reached. Your current session will continue, but some data could not be saved locally.',
      };
    }
    return {
      success: false,
      error: 'Unable to save session to local storage.',
    };
  }
}

export function loadFromLocalStorage(): StorageState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse state from localStorage:', err);
    return null;
  }
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing localStorage:', e);
  }
}
