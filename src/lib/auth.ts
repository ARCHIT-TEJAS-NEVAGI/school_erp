import { users } from '@/db/schema';

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
}

export function setUser(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
}

export function clearUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
}

export function isAuthenticated(): boolean {
  return getUser() !== null;
}

export function hasRole(role: string): boolean {
  const user = getUser();
  return user?.role === role;
}
