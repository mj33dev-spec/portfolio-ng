import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface BlogBlock {
  id: string;
  type: 'text' | 'image';
  value: string;
}

export interface BlogPost {
  id: string; // uuid
  title: string;
  content: BlogBlock[];
  color: string;
  category: string;
  image_url: string | null;
  tags: string[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface BlogPostInput {
  title: string;
  content: BlogBlock[];
  color: string;
  category: string;
  image_url: string | null;
  tags: string[];
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
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false, nullsFirst: false })
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

  async createPost(post: BlogPostInput): Promise<boolean> {
    const { error } = await this.supabase
      .from('blogs')
      .insert([post]);
      
    if (error) {
      console.error('Error creating blog post:', error);
      return false;
    }
    return true;
  }

  async updatePost(id: string, post: BlogPostInput): Promise<boolean> {
    const payload = {
      ...post,
      updated_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('blogs')
      .update(payload)
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
      .update({ is_deleted: true })
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting blog post:', error);
      return false;
    }
    return true;
  }

  async uploadImage(path: string, file: File) {
    return await this.supabase.storage.from('blog-images').upload(path, file);
  }

  getImageUrl(path: string) {
    const { data } = this.supabase.storage.from('blog-images').getPublicUrl(path);
    return data.publicUrl;
  }
}
