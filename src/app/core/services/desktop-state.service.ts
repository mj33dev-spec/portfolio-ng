import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Abstract_File, QuickLookInfo } from '../../components/directory/directory-model';

export interface DragPreviewState {
  visible: boolean;
  fading: boolean;
  x: number;
  y: number;
  items: Abstract_File[];
  source?: 'desktop' | 'explorer';
  sourceParentId?: number;
}

export interface QuickLookState {
  visible: boolean;
  file: Abstract_File | null;
  x: number;
  y: number;
  type: string;
  source: 'keyboard' | 'hover';
}

export interface ClipboardState {
  items: Abstract_File[];
  op: 'copy' | 'cut';
}

export interface ContextMenuActions {
  createNewFolder: () => void;
  refresh: () => void;
  sortBy: (criteria: string) => void;
  createNewTextFile: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class DesktopStateService {
  private isDraggingSubject = new BehaviorSubject<boolean>(false);
  public isDragging$ = this.isDraggingSubject.asObservable();

  private modalCountSubject = new BehaviorSubject<number>(0);
  public isModalOpen$ = this.modalCountSubject.asObservable().pipe(
    map(count => count > 0)
  );

  private dragPreviewSubject = new BehaviorSubject<DragPreviewState>({
    visible: false,
    fading: false,
    x: -500,
    y: -500,
    items: []
  });
  public dragPreview$ = this.dragPreviewSubject.asObservable();

  private quickLookSubject = new BehaviorSubject<QuickLookState>({
    visible: false,
    file: null,
    x: 0,
    y: 0,
    type: '',
    source: 'keyboard'
  });
  public quickLook$ = this.quickLookSubject.asObservable();

  private clipboardSubject = new BehaviorSubject<ClipboardState>({
    items: [],
    op: 'copy'
  });
  public clipboard$ = this.clipboardSubject.asObservable();

  // --- Context Menu Management ---
  private contextMenuSubject = new BehaviorSubject<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });
  public contextMenu$ = this.contextMenuSubject.asObservable();

  constructor() {}

  /**
   * 드래그 상태 설정
   */
  setIsDragging(value: boolean): void {
    this.isDraggingSubject.next(value);
  }

  /**
   * 현재 드래그 상태 반환
   */
  getIsDragging(): boolean {
    return this.isDraggingSubject.value;
  }

  /**
   * 드래그 프리뷰 상태 업데이트
   */
  setDragPreview(state: Partial<DragPreviewState>): void {
    this.dragPreviewSubject.next({
      ...this.dragPreviewSubject.value,
      ...state
    });
  }

  /**
   * 현재 드래그 프리뷰 상태 반환
   */
  getDragPreview(): DragPreviewState {
    return this.dragPreviewSubject.value;
  }

  /**
   * 드래그 프리뷰 초기화
   */
  clearDragPreview(): void {
    this.dragPreviewSubject.next({
      visible: false,
      fading: false,
      x: -500,
      y: -500,
      items: []
    });
  }

  pushModal(): void {
    this.modalCountSubject.next(this.modalCountSubject.value + 1);
  }

  popModal(): void {
    this.modalCountSubject.next(Math.max(0, this.modalCountSubject.value - 1));
  }

  getIsModalOpen(): boolean {
    return this.modalCountSubject.value > 0;
  }

  /**
   * 키보드로 활성화된 Quick Look 상태인지 확인
   */
  isKeyboardQuickLookActive(): boolean {
    const state = this.quickLookSubject.value;
    return state.visible && state.source === 'keyboard';
  }

  /**
   * Quick Look 열기
   */
  openQuickLook(file: Abstract_File, x: number, y: number, source: 'keyboard' | 'hover' = 'keyboard'): void {
    this.quickLookSubject.next({
      visible: true,
      file,
      x,
      y,
      type: file.extension_info.view_type,
      source
    });
  }

  /**
   * Quick Look 닫기
   */
  closeQuickLook(): void {
    this.quickLookSubject.next({
      visible: false,
      file: null,
      x: 0,
      y: 0,
      type: '',
      source: 'keyboard'
    });
  }

  /**
   * 클립보드 설정
   */
  setClipboard(items: Abstract_File[], op: 'copy' | 'cut' = 'copy'): void {
    this.clipboardSubject.next({
      items: [...items], // 얕은 복사로 저장
      op
    });
  }

  /**
   * 클립보드 내용 가져오기
   */
  getClipboard(): ClipboardState {
    return this.clipboardSubject.value;
  }

  openContextMenu(x: number, y: number, items: ContextMenuItem[]): void {
    this.contextMenuSubject.next({
      visible: true,
      x,
      y,
      items
    });
  }

  closeContextMenu(): void {
    // Only close if it's currently open to avoid unnecessary emits or state trashing if called redundantly
    if (this.contextMenuSubject.value.visible) {
      this.contextMenuSubject.next({
        visible: false,
        x: 0,
        y: 0,
        items: []
      });
    }
  }

  isContextMenuOpen(): boolean {
    return this.contextMenuSubject.value.visible;
  }

  /**
   * 공통 컨텍스트 메뉴 아이템 반환 (바탕화면/탐색기 공용)
   */
  getCommonContextMenuItems(actions: ContextMenuActions): ContextMenuItem[] {
    return [
      {
        label: '새 폴더(N)',
        icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4C2 3.44772 2.44772 3 3 3H6.17157C6.43679 3 6.69107 3.10536 6.87868 3.29289L8.12132 4.53553C8.30893 4.72315 8.56321 4.82851 8.82843 4.82851H13C13.5523 4.82851 14 5.27623 14 5.82851V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z"/></svg>',
        action: actions.createNewFolder
      },
      {
        label: '새로고침',
        action: actions.refresh
      },
      {
        label: '정렬 기준',
        submenu: [
          { label: '이름', action: () => actions.sortBy('name') },
          { label: '크기', action: () => actions.sortBy('size') },
          { label: '항목 유형', action: () => actions.sortBy('type') },
          { label: '수정한 날짜', action: () => actions.sortBy('modified') }
        ]
      },
      { separator: true, label: '' },
      {
        label: '새로 만들기(W)',
        submenu: [
          {
            label: '폴더(F)',
            icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4C2 3.44772 2.44772 3 3 3H6.17157C6.43679 3 6.69107 3.10536 6.87868 3.29289L8.12132 4.53553C8.30893 4.72315 8.56321 4.82851 8.82843 4.82851H13C13.5523 4.82851 14 5.27623 14 5.82851V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z"/></svg>',
            action: actions.createNewFolder
          },
          { separator: true, label: '' },
          {
            label: '텍스트 문서',
            icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H3ZM4 4H12V6H4V4ZM4 7H12V9H4V7ZM4 10H8V12H4V10Z"/></svg>',
            action: actions.createNewTextFile
          }
        ]
      }
    ];
  }
}

export interface ContextMenuItem {
  label: string;
  action?: () => void;
  icon?: string; // HTML string or image URL? Let's assume HTML/SVG string for now or use a component selector if complex
  shortcut?: string;
  separator?: boolean;
  submenu?: ContextMenuItem[];
  disabled?: boolean;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}
