import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Only allow this specific email
  private readonly ADMIN_EMAIL = 'blmj3308@gmail.com';
  
  private supabase: SupabaseClient;

  // Signal to hold the authentication state
  isLoggedIn = signal<boolean>(false);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    // Automatically update the signal based on Supabase auth state
    this.supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      this.isLoggedIn.set(!!user && user.email === this.ADMIN_EMAIL);
    });
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      if (email !== this.ADMIN_EMAIL) {
        return false;
      }
      const { error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getAdminEmail(): string {
    return this.ADMIN_EMAIL;
  }
}
