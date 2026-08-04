import { Injectable, signal, inject } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Only allow this specific email
  private readonly ADMIN_EMAIL = 'blmj3308@gmail.com';
  
  private auth = inject(Auth);

  // Signal to hold the authentication state
  isLoggedIn = signal<boolean>(false);

  constructor() {
    // Automatically update the signal based on Firebase auth state
    authState(this.auth).subscribe((user) => {
      this.isLoggedIn.set(!!user && user.email === this.ADMIN_EMAIL);
    });
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      if (email !== this.ADMIN_EMAIL) {
        return false;
      }
      await signInWithEmailAndPassword(this.auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getAdminEmail(): string {
    return this.ADMIN_EMAIL;
  }
}
