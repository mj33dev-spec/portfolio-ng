import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Project } from './project.model';
import { BehaviorSubject, from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private supabase: SupabaseClient;

  private _projects = new BehaviorSubject<Project[]>([]);
  public readonly projects$ = this._projects.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  /**
   * Fetch all projects from Supabase, ordered by sortOrder
   */
  async fetchProjects(): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .order('sortOrder', { ascending: true });

    if (error) {
      console.error('Error fetching projects from Supabase:', error);
      throw error;
    }

    const projects: Project[] = data || [];
    this._projects.next(projects);
    return projects;
  }

  /**
   * Add a new project
   */
  async addProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) {
      console.error('Error adding project:', error);
      throw error;
    }

    // Update local cache
    const currentProjects = this._projects.getValue();
    this._projects.next([...currentProjects, data]);
    return data;
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }

    // Update local cache
    const currentProjects = this._projects.getValue();
    const index = currentProjects.findIndex(p => (p as any).id === id);
    if (index !== -1) {
      currentProjects[index] = data;
      this._projects.next([...currentProjects]);
    }
    return data;
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }

    // Update local cache
    const currentProjects = this._projects.getValue();
    this._projects.next(currentProjects.filter(p => (p as any).id !== id));
  }
}
