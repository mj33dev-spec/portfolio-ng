import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

export interface BackgroundOption {
  id: number;
  name: string;
  path: string;
}

export interface Workspace {
  uuid: string;
  workspace_id: number;
  workspace_name: string;
  workspace_bg_id?: number;
  is_default?: boolean;
  workspace_member_authority?: string;
  created_at?: string;
  updated_at?: string;
}

import { ApiService } from './api.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  constructor(private apiService: ApiService) {}
  // 배경 이미지 옵션 목록
  private readonly backgroundOptions: BackgroundOption[] = [
    { id: 1, name: '배경 1', path: '/assets/backgrounds/wallpaper01.png' },
    { id: 2, name: '배경 2', path: '/assets/backgrounds/wallpaper02.png' },
    { id: 3, name: '배경 3', path: '/assets/backgrounds/wallpaper03.png' },
    { id: 4, name: '배경 4', path: '/assets/backgrounds/wallpaper04.png' },
    { id: 5, name: '배경 5', path: '/assets/backgrounds/wallpaper05.png' },
    { id: 6, name: '배경 6', path: '/assets/backgrounds/wallpaper06.png' },
  ];

  // 배경 변경 이벤트 (workspaceUUID와 bgId를 함께 전달)
  private backgroundChangeSubject = new Subject<{ workspaceUUID: string; bgId: number }>();
  public backgroundChange$ = this.backgroundChangeSubject.asObservable();

  // 현재 선택된 워크스페이스
  private selectedWorkspaceSubject = new BehaviorSubject<Workspace | null>(null);
  public selectedWorkspace$: Observable<Workspace | null> = this.selectedWorkspaceSubject.asObservable();

  // 워크스페이스 목록
  private workspacesSubject = new BehaviorSubject<Workspace[]>([]);
  public workspaces$: Observable<Workspace[]> = this.workspacesSubject.asObservable();

  /**
   * 모든 배경 이미지 옵션 반환
   */
  getBackgroundOptions(): BackgroundOption[] {
    return [...this.backgroundOptions];
  }

  /**
   * 배경 이미지 ID로 옵션 찾기
   */
  getBackgroundOptionById(bgId: number): BackgroundOption | undefined {
    return this.backgroundOptions.find(bg => bg.id === bgId);
  }

  /**
   * 배경 이미지 ID로 경로 반환
   */
  getBackgroundPath(bgId: number): string {
    const option = this.getBackgroundOptionById(bgId);
    return option ? option.path : this.backgroundOptions[0].path; // 기본값
  }

  /**
   * 배경 이미지 ID로 이름 반환
   */
  getBackgroundName(bgId: number): string {
    const option = this.getBackgroundOptionById(bgId);
    return option ? option.name : this.backgroundOptions[0].name; // 기본값
  }

  /**
   * 배경 이미지 변경 이벤트 발생
   */
  notifyBackgroundChange(workspaceUUID: string, bgId: number): void {
    this.backgroundChangeSubject.next({ workspaceUUID, bgId });
  }

  /**
   * 현재 선택된 워크스페이스 설정
   */
  setSelectedWorkspace(workspace: Workspace | null): void {
    this.selectedWorkspaceSubject.next(workspace);
  }

  /**
   * 현재 선택된 워크스페이스 가져오기
   */
  getSelectedWorkspace(): Workspace | null {
    return this.selectedWorkspaceSubject.value;
  }

  /**
   * 워크스페이스 목록 설정
   */
  setWorkspaces(workspaces: Workspace[]): void {
    this.workspacesSubject.next(workspaces);
  }

  /**
   * 워크스페이스 목록 가져오기
   */
  getWorkspaces(): Workspace[] {
    return this.workspacesSubject.value;
  }
}

