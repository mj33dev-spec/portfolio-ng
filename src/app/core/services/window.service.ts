import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Abstract_File } from '../../components/directory/directory-model';

export type WindowType = 'explorer' | 'default' | 'image' | 'text' | 'pdf' | 'audio' | 'html' | 'unsupported' | 'psd' | 'ai' | 'office' | 'code' | 'excel' | 'hwp' | 'word' | 'portfolio';

export interface WindowInstance {
  id: string;
  title: string;
  color: string;
  type?: WindowType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized?: boolean;
  isMaximized?: boolean;
  isActive?: boolean;
  isMinimizing?: boolean;
  isNew?: boolean;
  previewUrl?: string; // PSD/AI 등의 동적 미리보기 URL
  content?: any; // 엑셀 등의 데이터/HTML 컨텐츠 (단일 시트 호환성 유지)
  sheets?: { name: string; content: string }[]; // 엑셀 다중 시트 데이터
  activeSheetIndex?: number; // 현재 활성화된 시트 인덱스

  folder?: Abstract_File;
  file?: Abstract_File;
  isDirty?: boolean;
  showFileMenu?: boolean;
  showEditMenu?: boolean;
  showFormatMenu?: boolean;
  showViewMenu?: boolean;
  showHelpMenu?: boolean;
  wordWrap?: boolean;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  zoomLevel?: number;
  showStatusBar?: boolean;
  cursorPos?: { ln: number, col: number };
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WindowService {
  private windowsSubject = new BehaviorSubject<WindowInstance[]>([]);
  public windows$: Observable<WindowInstance[]> = this.windowsSubject.asObservable();
  
  private nextZIndex = 1100;

  constructor() {}

  get windows(): WindowInstance[] {
    return this.windowsSubject.value;
  }

  /**
   * 새 윈도우 열기
   */
  openNewWindow(window: WindowInstance) {
    const currentWindows = this.windows;
    
    // 이미 열려있는 창인지 확인 (id 기준)
    const existing = currentWindows.find(w => w.id === window.id);
    if (existing) {
      this.focusWindow(window.id);
      return;
    }

    // z-index 할당
    window.zIndex = this.getNextZIndex();
    window.isActive = true;
    window.isNew = true;

    // 다른 창들 포커스 해제
    currentWindows.forEach(w => w.isActive = false);

    this.windowsSubject.next([...currentWindows, window]);

    // 신규 애니메이션 후 isNew 플래그 제거를 위해 약간 대기 (필요시)
    setTimeout(() => {
      const updated = this.windows.map(w => w.id === window.id ? { ...w, isNew: false } : w);
      this.windowsSubject.next(updated);
    }, 500);
  }

  /**
   * 윈도우 포커스
   */
  focusWindow(windowId: string) {
    const currentWindows = this.windows;
    const window = currentWindows.find(w => w.id === windowId);
    if (!window) return;

    // 이미 활성화된 상태면 z-index만 업데이트 (필요한 경우)
    // if (window.isActive && !window.isMinimized) return;

    const updatedWindows = currentWindows.map(w => {
      if (w.id === windowId) {
        return { 
          ...w, 
          isActive: true, 
          isMinimized: false, 
          zIndex: this.getNextZIndex() 
        };
      } else {
        return { ...w, isActive: false };
      }
    });

    this.windowsSubject.next(updatedWindows);
  }

  /**
   * 모든 윈도우 포커스 해제
   */
  deactivateAllWindows() {
    const updated = this.windows.map(w => ({ ...w, isActive: false }));
    this.windowsSubject.next(updated);
  }

  /**
   * 모든 윈도우 닫기
   */
  closeAllWindows() {
    this.windowsSubject.next([]);
  }

  /**
   * 윈도우 닫기
   */
  closeWindow(windowId: string) {
    const currentWindows = this.windows;
    this.windowsSubject.next(currentWindows.filter(w => w.id !== windowId));
  }

  /**
   * 윈도우 최소화
   */
  minimizeWindow(windowId: string) {
    const updated = this.windows.map(w => {
      if (w.id === windowId) {
        return { ...w, isMinimized: true, isActive: false };
      }
      return w;
    });
    this.windowsSubject.next(updated);
  }

  /**
   * 윈도우 최대화/복원
   */
  maximizeWindow(windowId: string, isMaximized: boolean) {
    // 최대화 상태는 WindowComponent 내부에서 관리하거나 WindowInstance에 추가할 수 있음
    // 여기서는 활성화만 처리
    this.focusWindow(windowId);
  }

  /**
   * 모든 창 최소화
   */
  minimizeAllWindows() {
    const updated = this.windows.map(w => ({ ...w, isMinimized: true, isActive: false }));
    this.windowsSubject.next(updated);
  }

  /**
   * 다음 z-index 값 반환 및 증가
   */
  public getNextZIndex(): number {
    return ++this.nextZIndex;
  }

  /**
   * 윈도우 인스턴스 업데이트 (좌표, 크기 등)
   */
  updateWindow(windowId: string, updates: Partial<WindowInstance>) {
    const updated = this.windows.map(w => {
      if (w.id === windowId) {
        return { ...w, ...updates };
      }
      return w;
    });
    this.windowsSubject.next(updated);
  }
}
