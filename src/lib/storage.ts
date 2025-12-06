export interface Persona {
  id: string;
  name: string;
  description: string;
}

export interface UserProfile {
  goals: string[];
  skillLevel: 'beginner' | 'developing' | 'intermediate' | 'advanced';
  persona: Persona;
  createdAt: string;
}

const STORAGE_KEY = 'activeListening_profile';

export function saveProfile(profile: UserProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
}

export function getProfile(): UserProfile | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return null;
}

export function updateProfile(updates: Partial<UserProfile>): void {
  const current = getProfile();
  if (current) {
    saveProfile({ ...current, ...updates });
  }
}

export function clearProfile(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.clear();
  }
}
