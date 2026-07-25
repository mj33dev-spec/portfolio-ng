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
  
  private nextZIndex = 100;

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

    // z-index 및 초기 상태 할당
    const newWindow: WindowInstance = {
      ...window,
      zIndex: this.getNextZIndex(),
      isActive: true,
      isMinimized: false,
      isMinimizing: false,
      isNew: true
    };

    // 기존 창들 포커스 해제
    const deactivated = currentWindows.map(w => ({ ...w, isActive: false }));

    this.windowsSubject.next([...deactivated, newWindow]);

    // 신규 애니메이션 후 isNew 플래그 제거
    setTimeout(() => {
      const updated = this.windows.map(w => w.id === newWindow.id ? { ...w, isNew: false } : w);
      this.windowsSubject.next(updated);
    }, 300);
  }

  /**
   * 윈도우 포커스 (복구 및 최상위 전환)
   */
  focusWindow(windowId: string) {
    const currentWindows = this.windows;
    const target = currentWindows.find(w => w.id === windowId);
    if (!target) return;

    const updatedWindows = currentWindows.map(w => {
      if (w.id === windowId) {
        return { 
          ...w, 
          isActive: true, 
          isMinimized: false, 
          isMinimizing: false,
          zIndex: this.getNextZIndex() 
        };
      } else {
        return { ...w, isActive: false };
      }
    });

    this.windowsSubject.next(updatedWindows);
  }

  /**
   * 작업 표시줄 아이콘 토글 (활성화 상태면 최소화, 비활성/최소화 상태면 복구 및 포커스)
   */
  toggleWindow(windowId: string) {
    const target = this.windows.find(w => w.id === windowId);
    if (!target) return;

    if (target.isActive && !target.isMinimized) {
      this.minimizeWindow(windowId);
    } else {
      this.focusWindow(windowId);
    }
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
    const currentWindows = this.windows;
    const target = currentWindows.find(w => w.id === windowId);
    if (!target) return;

    // 1단계: 애니메이션 시작
    const step1 = currentWindows.map(w => {
      if (w.id === windowId) {
        return { ...w, isMinimizing: true, isActive: false };
      }
      return w;
    });
    this.windowsSubject.next(step1);

    // 2단계: 애니메이션 완료 후 최소화 상태 적용
    setTimeout(() => {
      const latestWindows = this.windows;
      const step2 = latestWindows.map(w => {
        if (w.id === windowId) {
          return { ...w, isMinimizing: false, isMinimized: true, isActive: false };
        }
        return w;
      });
      this.windowsSubject.next(step2);
    }, 250);
  }

  /**
   * 모든 윈도우 최소화
   */
  minimizeAllWindows() {
    const currentWindows = this.windows;
    const step1 = currentWindows.map(w => {
      if (!w.isMinimized) {
        return { ...w, isMinimizing: true, isActive: false };
      }
      return w;
    });
    this.windowsSubject.next(step1);

    setTimeout(() => {
      const latestWindows = this.windows;
      const step2 = latestWindows.map(w => {
        if (w.isMinimizing) {
          return { ...w, isMinimizing: false, isMinimized: true, isActive: false };
        }
        return w;
      });
      this.windowsSubject.next(step2);
    }, 250);
  }

  /**
   * 다음 z-index 값 반환 및 증가 (100 ~ 400 범위 순환)
   */
  public getNextZIndex(): number {
    this.nextZIndex++;
    if (this.nextZIndex > 400) {
      this.nextZIndex = 100;
    }
    return this.nextZIndex;
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
