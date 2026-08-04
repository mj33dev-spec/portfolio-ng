import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface BlogPost {
  id: string; // uuid
  title: string;
  content: string;
  color: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getPosts(): Promise<BlogPost[]> {
    const { data, error } = await this.supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching blogs:', error);
      return [];
    }
    return data || [];
  }

  async getPost(id: string): Promise<BlogPost | null> {
    const { data, error } = await this.supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching blog post:', error);
      return null;
    }
    return data;
  }

  async createPost(post: { title: string; content: string; color: string }): Promise<boolean> {
    const { error } = await this.supabase
      .from('blogs')
      .insert([post]);
      
    if (error) {
      console.error('Error creating blog post:', error);
      return false;
    }
    return true;
  }

  async updatePost(id: string, post: { title: string; content: string; color: string }): Promise<boolean> {
    const { error } = await this.supabase
      .from('blogs')
      .update(post)
      .eq('id', id);
      
    if (error) {
      console.error('Error updating blog post:', error);
      return false;
    }
    return true;
  }

  async deletePost(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('blogs')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting blog post:', error);
      return false;
    }
    return true;
  }
}
