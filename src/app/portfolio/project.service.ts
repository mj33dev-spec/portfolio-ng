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
      .select('*, platforms:project_platforms(*)')
      .order('sortOrder', { ascending: true });

    if (error) {
      console.error('Error fetching projects from Supabase:', error);
      throw error;
    }

    const projects: Project[] = (data || []).map(p => this.computeDerivedFields(p));
    this._projects.next(projects);
    return projects;
  }

  /**
   * Add a new project
   */
  async addProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const { platforms, ...projectData } = project;
    const { data, error } = await this.supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Error adding project:', error);
      throw error;
    }

    let platformsData: any[] = [];
    if (platforms && platforms.length > 0) {
      const platformsToInsert = platforms.map(p => ({ ...p, project_id: data.id }));
      const { data: pData, error: pError } = await this.supabase
        .from('project_platforms')
        .insert(platformsToInsert)
        .select();
      if (pError) throw pError;
      platformsData = pData || [];
    }

    const finalData = this.computeDerivedFields({ ...data, platforms: platformsData }) as Project;

    // Update local cache
    const currentProjects = this._projects.getValue();
    this._projects.next([...currentProjects, finalData]);
    return finalData;
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { platforms, ...projectData } = updates;
    const { data, error } = await this.supabase
      .from('projects')
      .update(projectData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }

    let platformsData: any[] = [];
    if (platforms) {
      await this.supabase.from('project_platforms').delete().eq('project_id', id);
      if (platforms.length > 0) {
        const platformsToInsert = platforms.map(p => {
          const { id: _, created_at, project_id, ...rest } = p as any;
          return { ...rest, project_id: id };
        });
        const { data: pData, error: pError } = await this.supabase
          .from('project_platforms')
          .insert(platformsToInsert)
          .select();
        if (pError) throw pError;
        platformsData = pData || [];
      }
    } else {
      // Fetch existing if not provided
      const { data: existingPlatforms } = await this.supabase
        .from('project_platforms')
        .select('*')
        .eq('project_id', id);
      platformsData = existingPlatforms || [];
    }

    const finalData = this.computeDerivedFields({ ...data, platforms: platformsData }) as Project;

    // Update local cache
    const currentProjects = this._projects.getValue();
    const index = currentProjects.findIndex(p => (p as any).id === id);
    if (index !== -1) {
      currentProjects[index] = finalData;
      this._projects.next([...currentProjects]);
    }
    return finalData;
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

  /**
   * Upload an image to Supabase Storage
   */
  async uploadImage(path: string, file: File) {
    return await this.supabase.storage.from('project-images').upload(path, file);
  }

  /**
   * Get the public URL for an uploaded image
   */
  getImageUrl(path: string) {
    const { data } = this.supabase.storage.from('project-images').getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Helper to compute derived fields from platforms
   */
  private computeDerivedFields(project: any): Project {
    if (project.platforms && project.platforms.length > 0) {
      // 1. Compute roleTags
      const roles = new Set<string>();
      project.platforms.forEach((p: any) => {
        if (p.role_tags && Array.isArray(p.role_tags)) {
          p.role_tags.forEach((r: string) => roles.add(r));
        }
      });
      if (roles.size > 0) {
        project.roleTags = Array.from(roles);
      }


      // 3. Compute developmentEnvironment and developmentLanguage
      const envs = new Set<string>();
      const langs = new Set<string>();
      project.platforms.forEach((p: any) => {
        if (p.development_environment && Array.isArray(p.development_environment)) {
          p.development_environment.forEach((e: string) => envs.add(e));
        }
        if (p.development_language && Array.isArray(p.development_language)) {
          p.development_language.forEach((l: string) => langs.add(l));
        }
      });
      if (envs.size > 0) {
        project.developmentEnvironment = Array.from(envs);
      }
      if (langs.size > 0) {
        project.developmentLanguage = Array.from(langs);
      }
    }
    return project;
  }
}
