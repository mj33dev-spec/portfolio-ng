import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ElementRef,
  HostListener,
  ViewChildren,
  QueryList,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Abstract_File, Model_File, Model_Folder, QuickLookInfo } from '../directory/directory-model';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { Model_Extension_TXT, getExtensionModelByFileName } from '../directory/file-extension-model';
import { take, first, takeUntil } from 'rxjs/operators';
import { ApiService, Parameter } from '../../core/services/api.service';
import { SHARED_MODULES } from '../../shared/shared-modules';
import { DesktopStateService, ContextMenuActions } from '../../core/services/desktop-state.service';
import { Subject } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { DAlertService } from '../../portfolio/components/d-alert/d-alert.service';


const _RESET_POSITION: number = -9999;

@Component({
  selector: 'app-file-explorer',
  imports: [
    SHARED_MODULES
  ],
  templateUrl: './file-explorer.html',
  styleUrl: './file-explorer.scss',
})
export class FileExplorer implements OnInit, OnChanges, OnDestroy {
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.isActive) return;

    // if (event.code === 'Space' && !event.repeat) {
    //   const target = event.target as HTMLElement;
    //   if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    //     return;
    //   }

    //   if (this.desktopStateService.getIsModalOpen()) {
    //     return;
    //   }
    //   if (this.renamingFile) {
    //     return;
    //   }

    //   if (this.selectedFiles.length === 1) {
    //     event.preventDefault();
    //     const uuid = this.selectedFiles[0];
    //     const file = this.findFileInCurrentFolder(uuid);
    //     if (file) {
    //       this.showQuickLook(file);
    //     }
    //   }
    // }

    // Delete key handling
    if (event.key === 'Delete') {
      if (this.renamingFile) return;
      this.deleteFile();
    }
  }

  // @HostListener('window:keyup', ['$event'])
  // onKeyUp(event: KeyboardEvent) {
  //   if (event.code === 'Space') {
  //     this.closeQuickLook();
  //   }
  // }

  private findFileInCurrentFolder(uuid: string): Abstract_File | null {
    return this.selectedFolder?.children?.find(f => f.uuid === uuid) || null;
  }

  showQuickLook(file: Abstract_File, source: 'keyboard' | 'hover' = 'keyboard') {
    const fileElement = this.elementRef.nativeElement.querySelector(`[data-file-uuid="${file.uuid}"]`) as HTMLElement;
    let x = 0, y = 0;
    
    // 파일 아이콘 위치 기반 좌표 계산
    if (fileElement) {
      // 아이콘 요소 찾기 (썸네일 또는 폴더 아이콘 영역)
      const iconElement = fileElement.querySelector('.thumbnail-file') as HTMLElement;
      
      if (iconElement) {
        const rect = iconElement.getBoundingClientRect();
        // 아이콘의 오른쪽 + 10px 위치
        x = rect.right + 10;
        // 아이콘의 상단 위치 (살짝 보정 가능)
        y = rect.top;
      } else {
        // 아이콘을 못 찾으면 기존 방식(파일 행 전체 기준) 사용
        const rect = fileElement.getBoundingClientRect();
        x = rect.right + 10;
        y = rect.top;
      }
    } else {
      // 요소를 찾지 못하면 화면 중앙(또는 적절한 기본값)
      x = window.innerWidth / 2;
      y = window.innerHeight / 2;
    }

    // 전역 서비스 호출
    this.desktopStateService.openQuickLook(file, x, y, source);
  }



  closeQuickLook() {
    this.desktopStateService.closeQuickLook();
  }

  @Input() workspaceUUID: string = '';

  @Input() title: string = '';
  @Input() rootFolder: Abstract_File | null = null;
  @Input() desktopFolders: Abstract_File[] = [];
  @Input() isActive: boolean = false; // 창 활성화 상태
  @Output() folderChange = new EventEmitter<Abstract_File>();
  @Output() fileOpen = new EventEmitter<Abstract_File>();
  @Output() newFolderCreated = new EventEmitter<{
    parentPath: string;
    folder: Abstract_File;
  }>();
  @Output() fileDelete = new EventEmitter<{
    parentPath: string;
    filePath: string;
  }>();
  @Output() fileUpload = new EventEmitter<{
    files: File[];
    folderId: number;
  }>();
  @Output() propertiesOpen = new EventEmitter<Abstract_File>();

  selectedFolder: Abstract_File | null = null;
  currentPath: string = '';

  // 탐색 기록
  history: Abstract_File[] = [];
  currentHistoryIndex: number = -1;

  // 컨텍스트 메뉴
  // contextMenu = { ... }; // Removed in favor of DesktopStateService
  contextMenuTarget: Abstract_File | null = null;
  // 컨텍스트 메뉴가 열릴 때의 선택 상태 저장 (삭제 시 사용)
  contextMenuSelectedFiles: string[] = [];

  // 드래그 앤 드롭
  isDragging = false;
  draggedFile: Abstract_File | null = null;
  
  // 선택된 항목 드래그 관련
  isDraggingSelectedItems = false;
  private dragPreviewFadeTimeout: any = null;
  dragOverFolder: Abstract_File | null = null;
  dragOverFolderCanDrop: boolean = false;
  private destroy$ = new Subject<void>();
  private transparentDragImage = new Image();

  // 드래그 선택 (Rubber Band)
  isSelecting = false;
  isRightClickDrag = false; // 우클릭으로 시작된 드래그인지 추적
  selectionStartPos = { x: _RESET_POSITION, y: _RESET_POSITION };
  selectionBox = {
    x: _RESET_POSITION,
    y: _RESET_POSITION,
    width: 0,
    height: 0,
  };
  selectedFiles: string[] = []; // UUID 배열
  lastSelectedUuid: string | null = null; // 키보드 탐색을 위한 마지막 선택 항목 추적
  pendingRightClickInfo: {
    x: number;
    y: number;
    target: Abstract_File | null;
  } | null = null; // 우클릭 정보 저장

  // 이름 바꾸기
  renamingFile: Abstract_File | null = null;
  renameText: string = '';

  // 호버 딜레이 타이머
  private hoverTimeout: any = null;

  onFileMouseEnter(file: Abstract_File) {
    if (this.desktopStateService.getIsDragging() || this.renamingFile) return;

    // 키보드로 열린 Quick Look이 있으면 호버 무시
    if (this.desktopStateService.isKeyboardQuickLookActive()) return;

    // 폴더는 호버 시 Quick Look 표시 안 함
    if (file.type === 'folder') return;

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    this.hoverTimeout = setTimeout(() => {
      this.showQuickLook(file, 'hover');
    }, 0);
  }

  onFileMouseLeave(file: Abstract_File) {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.desktopStateService.closeQuickLook();
  }



  // 기본 폴더 구조
  folders: Abstract_File[] = [];

  // 드래그 선택 시작 시의 선택 상태 저장
  private initialSelectedFiles: string[] = []; // UUID 배열
  private isCtrlDrag = false;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private desktopStateService: DesktopStateService,
    private toast: ToastService,
    private dAlert: DAlertService
  ) {}

  /**
   * 컴포넌트 초기화: 폴더 트리 구조를 생성하고 초기 폴더를 설정
   */
  ngOnInit() {
    // 투명한 드래그 이미지 초기화
    this.transparentDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    
    // 바탕화면 폴더를 포함한 폴더 구조 생성
    const desktopFolder = new Model_Folder('', '바탕 화면', '/desktop', 0);
    desktopFolder.folder_id = 0;
    desktopFolder.children = [...this.desktopFolders].sort((a, b) => a.file_name.localeCompare(b.file_name, 'ko')); // 가나다순 정렬
    desktopFolder.expanded = 'close';

    this.folders = [
      desktopFolder,
      // new Model_Folder('', '다운로드', '/downloads', 0),
      // new Model_Folder('', 'OneDrive', '/onedrive', 0),
      // new Model_Folder('', '내 PC', '/this-pc', 0),
      // new Model_Folder('', '네트워크', '/network', 0),
    ];

    if (this.rootFolder) {
      this.navigateToFolder(this.rootFolder);

      // rootFolder가 바탕화면 폴더인 경우
      if (this.rootFolder.file_path === '/desktop') {
        desktopFolder.expanded = 'open';
      }
      // rootFolder가 바탕화면 폴더 중 하나인 경우 바탕화면 폴더를 확장
      else if (
        this.desktopFolders.some(
          (f) => f.file_path === this.rootFolder?.file_path
        )
      ) {
        desktopFolder.expanded = 'open';
      }
    } else {
      // 기본으로 "바탕 화면" 선택
      this.navigateToFolder(desktopFolder);
    }

    // 전역 프리뷰 상태 구독 및 로컬 상태 동기화 (Task 1: 전역 프리뷰 공유를 위해)
    this.desktopStateService.dragPreview$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        // 로컬 dragPreview 객체는 업데이트하지 않고 가시성만 참고 (하이라이트용)
        this.isDraggingSelectedItems = state.visible;
        this.cdr.detectChanges();
      });
  }

  /**
   * desktopFolders 변경 감지 및 사이드바 업데이트
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['desktopFolders'] && !changes['desktopFolders'].firstChange) {
      // 사이드바의 바탕화면 폴더 찾기
      const desktopFolder = this.folders.find(
        (f) => f.file_path === '/desktop' && f.folder_id === 0
      );
      
      if (desktopFolder) {
        // desktopFolders 변경사항을 children에 반영
        desktopFolder.children = [...this.desktopFolders];
        
        // 현재 선택된 폴더가 바탕화면인 경우, 우측 패널도 업데이트
        if (this.selectedFolder?.file_path === '/desktop') {
          this.selectedFolder.children = [...this.desktopFolders];
        }
      }
    }

    // 포커스를 잃을 때 선택 해제
    if (changes['isActive'] && changes['isActive'].currentValue === false) {
      this.clearSelection();
    }
  }

  ngOnDestroy() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    if (this.dragPreviewFadeTimeout) {
      clearTimeout(this.dragPreviewFadeTimeout);
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 폴더 선택 또는 파일 열기: 폴더면 탐색 기록에 추가하고 이동, 파일이면 열기 이벤트 발생
   */
  selectFolder(folder: Abstract_File) {
    this.finishRename();
    if (folder.type === 'folder') {
      // 새로운 폴더로 이동하는 경우 기록에 추가
      if (this.selectedFolder?.file_path !== folder.file_path) {
        // 현재 위치 이후의 기록 삭제 (새로운 분기)
        if (this.currentHistoryIndex < this.history.length - 1) {
          this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        }
        this.history.push(folder);
        this.currentHistoryIndex = this.history.length - 1;

        this.navigateToFolder(folder);
      }
    } else {
      // 파일인 경우 열기 이벤트 발생
      this.fileOpen.emit(folder);
    }
  }

  /**
   * 폴더로 이동: 현재 폴더를 업데이트하고 부모 컴포넌트에 알림
   */
  navigateToFolder(folder: Abstract_File) {
    this.finishRename();
    this.selectedFolder = folder;
    this.currentPath = folder.file_path;
    this.folderChange.emit(folder);
    this.hideContextMenu();

    // 폴더 내용 로드
    this.loadFolderContents(folder);
  }

  /**
   * 현재 선택된 폴더 새로고침 (외부에서 호출 가능)
   */
  public refreshSelectedFolder() {
    if (this.selectedFolder) {
      console.log('file-explorer의 selectedFolder 새로고침:', this.selectedFolder.file_path);
      this.selectedFolder.isLoaded = false;
      this.loadFolderContents(this.selectedFolder, true);
    }
  }

  /**
   * 폴더 내용 로드 (로컬 시뮬레이션)
   * @param folder 로드할 폴더
   * @param forceReload 강제로 다시 로드할지 여부 (기본값: false)
   */
  private loadFolderContents(folder: Abstract_File, forceReload: boolean = false) {
    // 바탕화면 폴더는 이미 desktopFolders가 설정되어 있으므로 API 호출하지 않음
    if (folder.file_path === '/desktop' && folder.folder_id === 0) {
      if (!folder.children || folder.children.length === 0) {
        folder.children = [...this.desktopFolders];
      }
      folder.isLoaded = true;
      folder.children_count = folder.children?.length || 0;
      return;
    }

    // 로컬 환경에서는 이미 folder.children에 데이터가 있다고 가정 (Desktop에서 관리)
    // 혹은 빈 폴더로 처리
    if (!folder.children) {
      folder.children = [];
    }

    folder.isLoaded = true;
    folder.children_count = folder.children.length;

    // 현재 선택된 폴더인 경우 change detection 트리거
    if (this.selectedFolder && this.selectedFolder.uuid === folder.uuid) {
      this.cdr.detectChanges();
    }
  }

  goBack() {
    if (this.canGoBack()) {
      this.currentHistoryIndex--;
      this.navigateToFolder(this.history[this.currentHistoryIndex]);
    }
  }

  goForward() {
    if (this.canGoForward()) {
      this.currentHistoryIndex++;
      this.navigateToFolder(this.history[this.currentHistoryIndex]);
    }
  }

  canGoBack(): boolean {
    return this.currentHistoryIndex > 0;
  }

  canGoForward(): boolean {
    return this.currentHistoryIndex < this.history.length - 1;
  }

  goToFolder(part: string, index: number) {
    const parts = this.currentPath.split('/');
    // 경로 재구성: index까지의 경로를 합침
    // 예: ['', 'desktop', 'shared'] -> index 1 ('desktop') -> '/desktop'
    let targetPath = parts.slice(0, index + 1).join('/');
    
    // 빈 경로이거나 '/'로 시작하지 않는 경우 처리 (보통 split 결과 첫번째가 빈 문자열이면 join시 /로 시작함)
    if (targetPath === '') targetPath = '/'; 

    const folder = this.findFolderByPath(targetPath);
    if (folder) {
      this.navigateToFolder(folder);
    }
  }

  findFolderByPath(path: string): Abstract_File | null {
    for (const root of this.folders) {
      if (root.file_path === path) return root;
      const found = this.findFolderRecursive(root, path);
      if (found) return found;
    }
    return null;
  }

  /**
   * 경로 세그먼트를 표시용 이름으로 변환
   * UUID인 경우 폴더 트리에서 file_name을 찾아 반환
   */
  getPathSegmentDisplayName(part: string, index: number): string {
    if (part === 'desktop') return '바탕 화면';
    
    // UUID 패턴 감지 (8-4-4-4-12 형태)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(part)) {
      // 폴더 트리에서 해당 UUID를 가진 폴더를 찾아 이름 반환
      const folder = this.findFolderByUuid(part);
      if (folder) return folder.file_name;
    }
    
    return part;
  }

  private findFolderByUuid(uuid: string): Abstract_File | null {
    for (const root of this.folders) {
      if (root.uuid === uuid) return root;
      const found = this.findFolderByUuidRecursive(root, uuid);
      if (found) return found;
    }
    return null;
  }

  private findFolderByUuidRecursive(folder: Abstract_File, uuid: string): Abstract_File | null {
    if (folder.children) {
      for (const child of folder.children) {
        if (child.uuid === uuid) return child;
        if (child.type === 'folder') {
          const found = this.findFolderByUuidRecursive(child, uuid);
          if (found) return found;
        }
      }
    }
    return null;
  }

  findFolderRecursive(folder: Abstract_File, targetPath: string): Abstract_File | null {
    if (folder.file_path === targetPath) return folder;
    if (folder.children) {
      for (const child of folder.children) {
        if (child.type === 'folder') {
          const found = this.findFolderRecursive(child, targetPath);
          if (found) return found;
        }
      }
    }
    return null;
  }

  /**
   * 파일 아이템 클릭 처리: Ctrl/Cmd 키에 따라 다중 선택 또는 단일 선택
   */
  onFileItemClick(event: MouseEvent, file: Abstract_File) {
    // 더블클릭은 제외
    if (event.detail === 2) return;

    event.stopPropagation(); // 이벤트 전파 중지

    if (this.renamingFile && this.renamingFile.uuid !== file.uuid) {
      this.finishRename();
    }

    // Ctrl/Cmd 키를 누른 경우 다중 선택
    if (event.ctrlKey || event.metaKey) {
      this.toggleFileSelection(file.uuid);
    } else {
      // 단일 선택
      this.selectedFiles = [file.uuid];
    }
    
    // 키보드 탐색을 위해 마지막 선택 항목 정보 업데이트
    this.lastSelectedUuid = file.uuid;
  }

  downloadFile() {
    if (this.selectedFiles.length === 0 && !this.contextMenuTarget) return;

    const targetFiles: Abstract_File[] = [];
    const sourceFiles = this.selectedFolder?.children || [];

    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach(uuid => {
        const file = sourceFiles.find(f => f.uuid === uuid);
        if (file && file.type !== 'folder') targetFiles.push(file);
      });
    } else if (this.contextMenuTarget && this.contextMenuTarget.type !== 'folder') {
      targetFiles.push(this.contextMenuTarget);
    }

    if (targetFiles.length === 0) return;

    targetFiles.forEach(file => {
      // 로컬 다운로드 시뮬레이션: 앵커 태그를 사용하여 직접 다운로드
      const link = document.createElement('a');
      link.href = file.file_path;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    
    this.toast.success(`${targetFiles.length}개 파일 다운로드 시작`);
  }

  /**
   * 파일 우클릭 처리: 파일을 선택하고 컨텍스트 메뉴 표시를 위한 정보 저장
   */
  /**
   * 파일 우클릭 처리: 파일을 선택하고 컨텍스트 메뉴 표시
   */
  onRightClick(event: MouseEvent, file: Abstract_File) {
    event.preventDefault();
    event.stopPropagation();

    if (this.renamingFile && this.renamingFile.uuid !== file.uuid) {
      this.finishRename();
    }

    // 우클릭 시 선택 처리
    if (event.ctrlKey || event.metaKey) {
      this.toggleFileSelection(file.uuid);
    } else {
      // 선택되지 않은 항목을 우클릭하면 기존 선택을 해제하고 해당 항목만 선택
      // 이미 선택된 항목을 우클릭하면 기존 선택 유지 (다중 연산을 위해)
      if (!this.selectedFiles.includes(file.uuid)) {
        this.selectOnly(file.uuid);
      }
    }

    this.contextMenuTarget = file;
    // 컨텍스트 메뉴가 열릴 때 선택 상태 저장
    this.contextMenuSelectedFiles = [...this.selectedFiles];

    // 메뉴 아이템 구성
    const items = [
      {
        label: '열기(O)',
        action: () => {
          this.desktopStateService.closeContextMenu();
          this.selectFolder(file);
        }
      },
      { separator: true, label: '' },
      {
        label: this.selectedFiles.length > 1 ? `다운로드 (${this.selectedFiles.length}개)` : '다운로드',
        action: () => {
          this.desktopStateService.closeContextMenu();
          this.downloadFile();
        }
      },
      { separator: true, label: '' },
      {
        label: this.selectedFiles.length > 1 ? `삭제(D) (${this.selectedFiles.length}개)` : '삭제(D)',
        icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>',
        action: () => {
          // deleteFile 내부에서 hideContextMenu 호출하지만 명시적으로 닫기
          this.desktopStateService.closeContextMenu();
          this.deleteFile();
        }
      },
      { separator: true, label: '' },
      {
        label: '이름 바꾸기(M)',
        action: () => {
          this.desktopStateService.closeContextMenu();
          this.startRename(file);
        }
      },
      { separator: true, label: '' },
      {
        label: '속성(R)',
        icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-9ZM3.5 3a.5.5 0 0 0-.5.5V12.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-9Z"/><path d="M5 6.5A.5.5 0 0 1 5.5 6h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 5 6.5ZM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Z"/></svg>',
        action: () => {
          this.desktopStateService.closeContextMenu();
          this.propertiesOpen.emit(file);
        }
      }
    ];

    this.desktopStateService.openContextMenu(event.clientX, event.clientY, items);
  }

  onBackgroundRightClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation(); // Stop propagation to prevent desktop context menu

    // 드래그 선택 중일 때 처리
    if (this.isSelecting) {
      // 드래그 박스가 일정 크기 이상이면 컨텍스트 메뉴 표시 안 함 (우클릭 드래그 지원)
      if (this.selectionBox.width > 5 || this.selectionBox.height > 5) {
        return;
      }
      
      // 클릭으로 간주되면 선택 모드 초기화
      this.isSelecting = false;
      this.selectionBox = {
        x: -9999,
        y: -9999,
        width: 0,
        height: 0,
      };
      this.selectionStartPos = { x: -9999, y: -9999 };
      this.isRightClickDrag = false;
    }
    
    // Check if click target is valid (background or file list container)
    if (
      event.target === event.currentTarget ||
      (event.target as HTMLElement).classList.contains('file-list') ||
      (event.target as HTMLElement).closest('.file-panel')
    ) {
      this.contextMenuTarget = null;

      // 공통 컨텍스트 메뉴 아이템 사용
      const actions: ContextMenuActions = {
         createNewFolder: () => this.createNewFolder(),
         refresh: () => this.refreshSelectedFolder(),
         sortBy: (criteria: string) => {
             console.log('Sort by', criteria);
             // TODO: Implement sort in FileExplorer
         },
         createNewTextFile: () => this.createNewTextFile()
      };
      
      const items = this.desktopStateService.getCommonContextMenuItems(actions);
      
      this.desktopStateService.openContextMenu(event.clientX, event.clientY, items);
    }
  }

  /*
  showContextMenuAtPosition(x: number, y: number) {
    // ...
  }
  */

  hideContextMenu() {
    this.desktopStateService.closeContextMenu();
    this.contextMenuTarget = null;
    // this.showNewSubmenu = false;
  }

  /**
   * 파일 삭제: 선택된 항목들을 모두 삭제하거나 contextMenuTarget만 삭제
   */
  deleteFile() {
    if (!this.selectedFolder) return;

    // hideContextMenu() 호출 전에 contextMenuTarget 저장
    const savedContextMenuTarget = this.contextMenuTarget;
    const savedSelectedFiles = this.contextMenuSelectedFiles.length > 0 
      ? [...this.contextMenuSelectedFiles] 
      : [...this.selectedFiles];

    this.hideContextMenu();

    // 선택된 항목이 있으면 모두 삭제
    const itemsToDelete: Abstract_File[] = [];
    
    if (savedSelectedFiles.length > 0) {
      savedSelectedFiles.forEach((uuid) => {
        const file = this.selectedFolder?.children?.find((f) => f.uuid === uuid);
        if (file) itemsToDelete.push(file);
      });
    } else if (savedContextMenuTarget) {
      itemsToDelete.push(savedContextMenuTarget);
    }

    if (itemsToDelete.length === 0) return;

    const parentPath = this.currentPath;

    // 로컬 상태에서 제거
    itemsToDelete.forEach((item) => {
      this.selectedFiles = this.selectedFiles.filter((uuid) => uuid !== item.uuid);
      
      if (this.renamingFile?.uuid === item.uuid) {
        this.renamingFile = null;
        this.renameText = '';
      }

      // 부모 컴포넌트에 삭제 이벤트 전달 (바탕화면 동기화를 위해)
      this.fileDelete.emit({
        parentPath,
        filePath: item.file_path,
      });

      // 현재 폴더의 children에서 제거
      if (this.selectedFolder?.children) {
        this.selectedFolder.children = this.selectedFolder.children.filter(
          (f) => f.uuid !== item.uuid
        );
      }

      // 바탕화면 폴더인 경우 desktopFolders에서도 제거
      if (this.selectedFolder?.file_path === '/desktop' && this.selectedFolder.folder_id === 0) {
        const index = this.desktopFolders.findIndex((f) => f.uuid === item.uuid);
        if (index !== -1) {
          this.desktopFolders.splice(index, 1);
        }
      }
    });

    if (this.selectedFolder) {
      this.selectedFolder.children_count = this.selectedFolder.children?.length || 0;
    }

    this.toast.success(`${itemsToDelete.length}개 항목이 삭제되었습니다.`);
    this.cdr.detectChanges();
  }

  // 드래그 앤 드롭 관련
  isDragOver = false;
  dragType: 'upload' | 'move' | null = null;

  onDragStart(event: DragEvent, file: Abstract_File, parentId?: number) {
    // 이벤트 버블링 방지 (중요: 사이드바 트리에서 자식 드래그 시 부모도 드래그 이벤트 받는 것 방지)
    event.stopPropagation();

    if (this.renamingFile?.uuid === file.uuid) {
      event.preventDefault();
      return;
    }

    // 기존 드래그 상태 초기화 (충돌 방지)
    this.isDragging = false;
    this.isDraggingSelectedItems = false;
    this.draggedFile = null;
    this.desktopStateService.clearDragPreview();

    // 선택된 파일이 없어도 드래그를 시작하면 그 파일을 선택하고 드래그
    if (this.selectedFiles.length === 0) {
      // 선택된 항목이 없으면 현재 파일을 선택
      this.selectedFiles = [file.uuid];
    } else if (!this.selectedFiles.includes(file.uuid)) {
      // 선택된 항목이 있지만 현재 파일이 포함되지 않은 경우 (예: 사이드바 드래그)
      if (event.ctrlKey || event.metaKey) {
        this.selectedFiles = [...this.selectedFiles, file.uuid];
      } else {
        // 사이드바 등에서 다른 파일을 드래그하면 기존 선택을 해제하고 해당 파일만 선택
        this.selectedFiles = [file.uuid];
      }
    }
 
    // 선택된 항목들 가져오기
    const currentFiles = this.selectedFolder?.children || [];
    let selectedItems = currentFiles.filter((f) =>
      this.selectedFiles.includes(f.uuid)
    );

    // 사이드바 등에서 드래그한 경우, currentFiles에 없을 수 있음
    if (!selectedItems.some((item) => item.uuid === file.uuid)) {
        selectedItems.push(file);
    }

    if (selectedItems.length === 0) {
      event.preventDefault();
      return;
    }

    // 항상 선택된 항목 드래그 모드로 처리
    this.isDraggingSelectedItems = true;
    
    // Task 1: 전역 서비스에 드래그 아이템 및 소스 정보 주입 (바탕화면 프리뷰 공유)
    this.desktopStateService.setDragPreview({
      items: selectedItems,
      fading: false,
      visible: true,
      source: 'explorer',
      sourceParentId: parentId !== undefined ? parentId : this.selectedFolder?.folder_id
    });

    // 드래그 데이터 설정
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      // 선택된 항목들의 경로를 전달
      event.dataTransfer.setData(
        'application/json',
        JSON.stringify(selectedItems.map((item) => item.file_path))
      );

      // 브라우저 기본 드래그 이미지를 숨김
      event.dataTransfer.setDragImage(this.transparentDragImage, 0, 0);
    }
  }

  onDragOver(event: DragEvent) {
    if (event.dataTransfer) {
      // 1. 선택된 항목(내부/바탕화면)을 드래그 중인 경우
      if (this.isDraggingSelectedItems) {
        const dragPreview = this.desktopStateService.getDragPreview();
        const items = dragPreview.items;
        
        if (this.selectedFolder && items.length > 0) {
          const canDrop = this.canDropItemsToFolder(items, this.selectedFolder);
          
          if (canDrop) {
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = 'move';
            this.isDragOver = true;
            this.dragType = 'move';
          } else {
            // 동일 폴더 등으로 드롭 불가일 때
            event.dataTransfer.dropEffect = 'none';
          }
        }
        return;
      }
      
      // 2. 외부 파일 업로드 또는 단일 파일 드래그의 경우
      event.preventDefault();
      event.stopPropagation();
      
      this.isDragOver = true;
      if (Array.from(event.dataTransfer.types).includes('Files')) {
        this.dragType = 'upload';
        event.dataTransfer.dropEffect = 'copy';
      } else {
        this.dragType = 'move';
        event.dataTransfer.dropEffect = 'move';
      }
    }
  }

  onDragLeave(event: DragEvent) {
    // 관련 타겟이 현재 요소 내부에 있으면 무시 (자식 요소로 진입할 때 이벤트 발생 방지)
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }

    this.isDragOver = false;
    this.dragType = null;
  }

  @Output() fileMove = new EventEmitter<{
    target: Abstract_File;
    items?: Abstract_File[];
    paths?: string[];
    source: 'desktop' | 'explorer';
    sourceParentId?: number;
  }>();

  onDrop(event: DragEvent, targetFolder?: Abstract_File) {
    event.preventDefault();
    event.stopPropagation();
    
    // 타겟 폴더 결정 (전달된 타겟 또는 현재 폴더)
    const target = targetFolder || this.selectedFolder;
    if (!target) return;

    // 1. 선택된 항목(내부/바탕화면) 드래그 드롭 처리
    if (this.isDraggingSelectedItems) {
      const dragPreview = this.desktopStateService.getDragPreview();
      const selectedItems = dragPreview.items;

      // 데스크탑에서 온 드래그인지 확인 (source === 'desktop') 
      // 또는 탐색기 내부 드래그 (source === 'explorer' - 기존 로직)
      if (selectedItems.length > 0) {
        const canDrop = this.canDropItemsToFolder(selectedItems, target);
        if (canDrop) {
          // 일관성을 위해 모든 이동을 부모(DesktopComponent)에게 위임하여 전역 동기화 보장
          const paths = selectedItems.map(f => f.file_path);
          this.fileMove.emit({
             target,
             items: selectedItems,
             paths,
             source: dragPreview.source || 'explorer',
             sourceParentId: dragPreview.sourceParentId
          });
        }
      }
      this.stopDraggingSelectedItems();
      return;
    }
    
    // 단일 파일 드래그 처리 초기화 (기존 로직 유지)
    this.isDragging = false;
    this.isDragOver = false;
    this.dragType = null;

    // 1-2. Desktop에서 드래그된 경우 (application/json) - isDraggingSelectedItems가 false일 때 대비
    const jsonStr = event.dataTransfer?.getData('application/json');
    if (jsonStr) {
      try {
        const paths = JSON.parse(jsonStr);
        this.fileMove.emit({
          target,
          paths,
          source: 'desktop'
        });
        
        // 현재 선택된 폴더가 대상 폴더인 경우 새로고침 (파일 이동 API 완료 후)
        if (this.selectedFolder && this.selectedFolder.uuid === target.uuid) {
          console.log('파일 이동 후 현재 폴더 새로고침 예약:', target.file_path);
          // 파일 이동 API 완료를 기다리기 위해 약간의 지연 추가
          setTimeout(() => {
            if (this.selectedFolder && this.selectedFolder.uuid === target.uuid) {
              console.log('파일 이동 후 현재 폴더 새로고침 실행:', target.file_path);
              this.selectedFolder.isLoaded = false;
              this.loadFolderContents(this.selectedFolder, true);
            }
          }, 500); // 500ms 지연
        }
      } catch (e) {
        console.error('Failed to parse drop data (json)', e);
      }
      return;
    }

    // 2. 다른 Explorer에서 드래그된 경우 (text/plain)
    const textStr = event.dataTransfer?.getData('text/plain');
    if (textStr) {
      try {
        const file = JSON.parse(textStr);
        this.fileMove.emit({
          target,
          items: [file],
          source: 'explorer'
        });
        
        // 현재 선택된 폴더가 대상 폴더인 경우 새로고침 (파일 이동 API 완료 후)
        if (this.selectedFolder && this.selectedFolder.uuid === target.uuid) {
          console.log('파일 이동 후 현재 폴더 새로고침 예약:', target.file_path);
          // 파일 이동 API 완료를 기다리기 위해 약간의 지연 추가
          setTimeout(() => {
            if (this.selectedFolder && this.selectedFolder.uuid === target.uuid) {
              console.log('파일 이동 후 현재 폴더 새로고침 실행:', target.file_path);
              this.selectedFolder.isLoaded = false;
              this.loadFolderContents(this.selectedFolder, true);
            }
          }, 500); // 500ms 지연
        }
      } catch (e) {
        console.error('Failed to parse drop data (text)', e);
      }
      this.draggedFile = null;
      return;
    }

    // 3. 외부 파일 업로드 처리 (OS에서 드래그한 파일)
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files);
      const folderId = target.folder_id || 0;
      this.fileUpload.emit({ files, folderId });
    }
  }

  /**
   * 마우스 다운 처리: 드래그 선택(Rubber Band) 시작 및 우클릭 드래그 감지
   */
  onMouseDown(event: MouseEvent) {
    // 이름 바꾸기 중이거나 컨텍스트 메뉴가 열려있으면 무시
    if (this.renamingFile || this.desktopStateService.isContextMenuOpen()) return;

    // 파일 아이콘 클릭 시 무시 (selectFolder에서 처리)
    if ((event.target as HTMLElement).closest('.file-item')) return;

    // 아이콘이 아닌 곳을 클릭한 경우 선택 해제 (Ctrl 키 없을 때)
    if (!event.ctrlKey && !event.metaKey) {
      this.clearSelection();
    }

    // 우클릭으로 시작된 드래그인지 확인
    this.isRightClickDrag = event.button === 2;
    this.isCtrlDrag = event.ctrlKey || event.metaKey;

    if (this.isCtrlDrag) {
      // Ctrl 드래그 시 시작 상태 저장
      this.initialSelectedFiles = [...this.selectedFiles];
    } else if (!this.isRightClickDrag) {
      // 일반 좌클릭 드래그 시 기존 선택 해제
      this.clearSelection();
      this.initialSelectedFiles = [];
    }

    const filePanel = event.currentTarget as HTMLElement;
    const fileList = filePanel.querySelector('.file-list') as HTMLElement;
    const sidebar = filePanel
      .closest('.explorer-content')
      ?.querySelector('.sidebar') as HTMLElement;

    if (!fileList || !sidebar) return;

    // .file-list의 위치를 기준으로 좌표 계산 (선택 박스가 .file-list 내부에 렌더링되므로)
    const fileListRect = fileList.getBoundingClientRect();

    // 우클릭으로 드래그를 시작하는 경우 우클릭 정보 저장
    if (this.isRightClickDrag) {
      const target = event.target as HTMLElement;
      const fileItem = target.closest('.file-item');
      let contextMenuTarget: Abstract_File | null = null;

      if (fileItem) {
        // 파일 아이템에서 우클릭한 경우 해당 파일 찾기
        const files = this.getCurrentFolderFiles();
        const index = Array.from(
          fileItem.parentElement?.children || []
        ).indexOf(fileItem as Element);
        if (index >= 0 && index < files.length) {
          contextMenuTarget = files[index];
        }
      }

      this.pendingRightClickInfo = {
        x: event.clientX,
        y: event.clientY,
        target: contextMenuTarget,
      };
    }

    this.isSelecting = true;
    // x 좌표: .file-list 기준 상대 좌표 (사이드바 너비는 이미 fileListRect.left에 포함되어 있음)
    // 하지만 마우스가 사이드바 영역에서 시작하면 음수가 될 수 있으므로 0으로 제한
    const x = event.clientX - fileListRect.left;
    this.selectionStartPos = {
      x: Math.max(0, x), // x 좌표가 0보다 작으면 0으로 제한
      y: event.clientY - fileListRect.top + fileList.scrollTop,
    };
    this.selectionBox = {
      x: this.selectionStartPos.x,
      y: this.selectionStartPos.y,
      width: 0,
      height: 0,
    };

    // 기존 선택 해제 (Ctrl 키 없을 때)
    if (!event.ctrlKey && !event.metaKey) {
      // this.clearSelection(); // TODO: 다중 선택 지원 시 사용
    }
  }

  /**
   * 마우스 이동 처리: 드래그 선택 박스 크기 업데이트 및 선택 영역 갱신
   */
  onMouseMove(event: MouseEvent) {
    if (!this.isSelecting) return;

    const filePanel = event.currentTarget as HTMLElement;
    const fileList = filePanel.querySelector('.file-list') as HTMLElement;
    if (!fileList) return;

    const fileListRect = fileList.getBoundingClientRect();
    // x 좌표: .file-list 기준 상대 좌표
    const currentX = Math.max(0, event.clientX - fileListRect.left); // x 좌표가 0보다 작으면 0으로 제한
    const currentY = event.clientY - fileListRect.top + fileList.scrollTop;

    this.selectionBox = {
      x: Math.min(this.selectionStartPos.x, currentX),
      y: Math.min(this.selectionStartPos.y, currentY),
      width: Math.abs(currentX - this.selectionStartPos.x),
      height: Math.abs(currentY - this.selectionStartPos.y),
    };

    // 드래그 중에도 선택 박스와 겹치는 파일 찾기
    this.updateSelection();
  }

  /**
   * 마우스 업 처리: 드래그 선택 완료 및 우클릭 컨텍스트 메뉴 표시
   */
  onMouseUp(event: MouseEvent) {
    // 우클릭 정보가 있으면 마우스업 시 컨텍스트 메뉴 표시
    if (this.pendingRightClickInfo) {
      // Legacy logic removed - handled in onRightClick/onBackgroundRightClick
      this.pendingRightClickInfo = null;
    }

    if (this.isSelecting) {
      this.isSelecting = false;
      this.isRightClickDrag = false;

      // 선택 박스가 너무 작으면 선택 해제
      if (this.selectionBox.width <= 5 && this.selectionBox.height <= 5) {
        // 선택 박스가 너무 작으면 선택 해제 (Ctrl 키 없을 때)
        if (!event.ctrlKey && !event.metaKey) {
          this.clearSelection();
        }
      } else {
        // 선택 박스가 충분히 크면 선택 업데이트
        this.updateSelection();
      }
      this.selectionBox = {
        x: _RESET_POSITION,
        y: _RESET_POSITION,
        width: 0,
        height: 0,
      };
    } else {
      // 드래그가 아닌 경우 아이콘이 아닌 곳을 클릭했을 때 선택 해제
      const target = event.target as HTMLElement;
      if (!target.closest('.file-item') && !event.ctrlKey && !event.metaKey) {
        this.clearSelection();
      }
    }
  }

  /**
   * 선택 영역 업데이트: 드래그 박스와 겹치는 파일들을 찾아 선택 상태 갱신
   */
  updateSelection() {
    // 실제 DOM 요소 위치 비교하여 선택 처리
    const fileItems = document.querySelectorAll('.file-list .file-item');
    const container = document.querySelector('.file-list');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;

    // 현재 프레임에서 박스 안에 있는 항목들 계산
    const currentInBox: string[] = [];
    fileItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemTop = rect.top - containerRect.top + scrollTop;
      const itemLeft = rect.left - containerRect.left;

      // 선택 박스와 겹치는지 확인
      const isIntersecting =
        itemLeft < this.selectionBox.x + this.selectionBox.width &&
        itemLeft + rect.width > this.selectionBox.x &&
        itemTop < this.selectionBox.y + this.selectionBox.height &&
        itemTop + rect.height > this.selectionBox.y;

      if (isIntersecting) {
        // 파일 UUID 찾기
        const fileUuid = item.getAttribute('data-file-uuid');
        if (fileUuid) {
          currentInBox.push(fileUuid);
        }
      }
    });

    if (this.isCtrlDrag) {
      // Ctrl 드래그: (시작 상태) XOR (현재 박스 안 항목)
      const initialSet = new Set(this.initialSelectedFiles);
      const inBoxSet = new Set(currentInBox);
      const newSelection = new Set(this.initialSelectedFiles);

      inBoxSet.forEach(path => {
        if (initialSet.has(path)) {
          newSelection.delete(path);
        } else {
          newSelection.add(path);
        }
      });
      this.selectedFiles = Array.from(newSelection);
    } else {
      // 일반 드래그: 현재 박스 안 항목만 선택
      this.replaceSelection(currentInBox);
    }

    // 드래그 박스로 선택된 항목 중 하나를 키보드 탐색의 기준점으로 설정
    if (this.selectedFiles.length > 0) {
      this.lastSelectedUuid = this.selectedFiles[this.selectedFiles.length - 1];
    } else {
      this.lastSelectedUuid = null;
    }
  }

  // 이름 바꾸기 관련
  @ViewChildren('renameInput') renameInputs!: QueryList<ElementRef>;
  startRename(file: Abstract_File) {
    this.renamingFile = file;
    this.renameText = file.file_name;
    
    // QueryList의 변경사항을 구독하여 input이 렌더링된 직후에 포커스 처리
    this.renameInputs.changes.pipe(take(1)).subscribe((list) => {
      const input = list.first;
      if (input) {
        const element = input.nativeElement as HTMLInputElement;
        element.focus();
        element.setSelectionRange(this.renameText.length, this.renameText.length);
      }
    });
  }

  finishRename() {
    if (!this.renamingFile) {
      return;
    }

    const originalName = this.renamingFile.file_name;
    const newName = this.renameText.trim();

    // 빈 텍스트이거나 공백만 있으면 원래 이름으로 복원하고 종료
    if (!newName) {
      this.renameText = originalName;
      this.renamingFile = null;
      this.renameText = '';
      return;
    }

    // 이름이 변경되지 않았으면 그냥 종료
    if (newName === originalName) {
      this.renamingFile = null;
      this.renameText = '';
      return;
    }

    // 중복 이름 체크
    const isDuplicate = (this.selectedFolder?.children || []).some(
      (f) => f.file_name === newName && f.uuid !== this.renamingFile!.uuid
    );
    if (isDuplicate) {
      this.toast.error('이미 같은 이름의 항목이 존재합니다.');
      return;
    }

    // 확장자 변경 확인 (파일인 경우)
    if (this.renamingFile.type === 'file') {
      const oldExtIndex = originalName.lastIndexOf('.');
      const newExtIndex = newName.lastIndexOf('.');
      
      const oldExt = oldExtIndex !== -1 ? originalName.substring(oldExtIndex) : '';
      const newExt = newExtIndex !== -1 ? newName.substring(newExtIndex) : '';

      if (oldExt.toLowerCase() !== newExt.toLowerCase()) {
        this.dAlert.yesNo('확장자를 변경할까요?\n파일을 사용할 수 없게 될 수도 있습니다.', () => {
          this.commitRenameRequest(originalName, newName);
        }, () => {
          this.renameText = originalName;
          this.renamingFile = null;
          this.renameText = '';
          this.cdr.detectChanges();
        });
        return;
      }
    }

    this.commitRenameRequest(originalName, newName);
  }

  private commitRenameRequest(originalName: string, newName: string) {
    if (!this.renamingFile) return;

    // 백엔드에 이름 변경 요청
    const params: Parameter = {
      type: 'PATCH',
      sendData: {
        type: this.renamingFile.type,
        uuid: this.renamingFile.uuid,
        name: newName,
      },
      route: `/drive/${this.workspaceUUID}/rename`,
    };

    this.apiService
      .api(params)
      .pipe(
        takeUntil(this.destroy$),
        first()
      )
      .subscribe(
        (res: any) => {
          if (res.status === 'success') {
            // 성공 시 로컬 모델 업데이트
            this.renamingFile!.file_name = newName;
            
            // 파일인 경우 확장자 모델 업데이트
            if (this.renamingFile!.type === 'file') {
              this.renamingFile!.extension_info = getExtensionModelByFileName(newName);
            }
            
            // 현재 폴더의 children 목록도 업데이트
            if (this.selectedFolder?.children) {
              const index = this.selectedFolder.children.findIndex(
                (f) => f.uuid === this.renamingFile!.uuid
              );
              if (index !== -1) {
                this.selectedFolder.children[index].file_name = newName;
                if (this.renamingFile!.type === 'file') {
                  this.selectedFolder.children[index].extension_info = getExtensionModelByFileName(newName);
                }
              }
            }
            
            // 폴더 내용 새로고침 (최신 데이터 반영)
            if (this.selectedFolder) {
              this.loadFolderContents(this.selectedFolder);
            }
          } else {
            // 실패 시 원래 이름으로 복원
            this.renameText = originalName;
          }
          // 이름 바꾸기 모드 종료
          this.renamingFile = null;
          this.renameText = '';
        },
        (err: any) => {
          console.error('이름 변경 에러:', err);
          // 에러 시 원래 이름으로 복원
          this.renameText = originalName;
          this.renamingFile = null;
          this.renameText = '';
        }
      );
  }

  /**
   * 새 폴더 생성: 중복되지 않는 이름으로 폴더를 생성하고 이름 바꾸기 모드로 전환
   */
  createNewFolder() {
    if (!this.selectedFolder) return;

    const existingNames = new Set(
      (this.selectedFolder.children || []).map((child) => child.file_name)
    );
    const baseName = '새 폴더';
    let folderName = baseName;
    let counter = 1;

    while (existingNames.has(folderName)) {
      counter++;
      folderName = `${baseName} ${counter}`;
    }

    const parentPath = this.selectedFolder.file_path;
    const separator = parentPath !== '/' ? '/' : '';
    const normalizedPath = `${parentPath}${separator}${folderName}`;
    
    const newFolder = new Model_Folder(
      `local-folder-${Date.now()}`,
      folderName,
      normalizedPath,
      0,
      'Y',
      new Date(),
      new Date(),
      [],
      Math.floor(Math.random() * 1000000)
    );

    if (!this.selectedFolder.children) this.selectedFolder.children = [];
    this.selectedFolder.children = [...this.selectedFolder.children, newFolder];
    this.selectedFolder.children_count = this.selectedFolder.children.length;

    this.selectOnly(newFolder.uuid);
    this.hideContextMenu();
    this.startRename(newFolder);
    
    this.newFolderCreated.emit({
      parentPath: parentPath,
      folder: newFolder,
    });
    
    this.toast.success('새 폴더가 생성되었습니다.');
    this.cdr.detectChanges();
  }

  onRenameKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.finishRename();
    } else if (event.key === 'Escape') {
      this.cancelRename();
    }
    event.stopPropagation();
  }

  cancelRename() {
    if (!this.renamingFile) {
      return;
    }

    const newName = this.renameText.trim();
    const originalName = this.renamingFile.file_name;

    // 포커스가 해제될 때(Blur) 이름이 중복이면 알림 제공 (사용자 요청)
    if (newName && newName !== originalName) {
      const isDuplicate = (this.selectedFolder?.children || []).some(
        (f) => f.file_name === newName && f.uuid !== this.renamingFile!.uuid
      );
      if (isDuplicate) {
        this.toast.error(`이미 같은 이름의 항목이 존재합니다: ${newName}`);
      }
    }

    this.renamingFile = null;
    this.renameText = '';
  }

  getCurrentFolderFiles(): Abstract_File[] {
    return this.selectedFolder?.children || [];
  }

  getFolderChildren(folder: Abstract_File): Abstract_File[] {
    if (!folder.children) return [];
    return folder.children.filter(child => child.type === 'folder');
  }


  isFileSelected(uuid: string): boolean {
    return this.selectedFiles.includes(uuid);
  }

  private selectOnly(uuid: string) {
    this.selectedFiles = [uuid];
  }

  private toggleFileSelection(uuid: string) {
    if (this.isFileSelected(uuid)) {
      this.selectedFiles = this.selectedFiles.filter(
        (id) => id !== uuid
      );
    } else {
      this.selectedFiles = [...this.selectedFiles, uuid];
    }
  }

  private replaceSelection(uuids: string[]) {
    if (uuids.length === 0) {
      this.clearSelection();
      return;
    }
    const unique = Array.from(new Set(uuids));
    this.selectedFiles = unique;
  }

  /**
   * 선택 해제
   */
  public clearSelection() {
    if (this.selectedFiles.length > 0) {
      this.selectedFiles = [];
    }
    this.lastSelectedUuid = null;
  }

  /**
   * 키보드 방향키를 통한 파일 탐색 처리
   */
  public handleKeyboardNavigation(key: string) {
    const files = this.selectedFolder?.children || [];
    if (files.length === 0) return;

    let currentIndex = -1;

    // 다중 선택 상태인 경우, 방향에 따라 기준점(minIndex 또는 maxIndex)을 다르게 설정
    if (this.selectedFiles.length > 1) {
      const selectedIndices = this.selectedFiles
        .map(uuid => files.findIndex(f => f.uuid === uuid))
        .filter(index => index !== -1)
        .sort((a, b) => a - b);
      
      if (selectedIndices.length > 0) {
        if (key === 'ArrowUp' || key === 'ArrowLeft') {
          currentIndex = selectedIndices[0]; // 가장 상단 아이템 기준
        } else {
          currentIndex = selectedIndices[selectedIndices.length - 1]; // 가장 하단 아이템 기준
        }
      }
    } else if (this.lastSelectedUuid) {
      currentIndex = files.findIndex(f => f.uuid === this.lastSelectedUuid);
    }

    // 현재 선택된 항목이나 기준점이 없으면 첫 번째 항목 선택
    if (currentIndex === -1) {
      const firstFile = files[0];
      this.selectedFiles = [firstFile.uuid];
      this.lastSelectedUuid = firstFile.uuid;
      this.cdr.detectChanges();
      return;
    }

    let newIndex = currentIndex;
    switch (key) {
      case 'ArrowDown':
        newIndex = currentIndex < files.length - 1 ? currentIndex + 1 : currentIndex;
        break;
      case 'ArrowUp':
        newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
        break;
    }

    if (newIndex !== currentIndex) {
      const nextFile = files[newIndex];
      this.selectedFiles = [nextFile.uuid];
      this.lastSelectedUuid = nextFile.uuid;
      this.cdr.detectChanges();
      
      this.scrollToSelectedFile(nextFile.uuid);
    }
  }

  /**
   * 전체 선택
   */
  public selectAll() {
    this.selectedFiles = (this.selectedFolder?.children || []).map(f => f.uuid);
    if (this.selectedFiles.length > 0) {
      this.lastSelectedUuid = this.selectedFiles[this.selectedFiles.length - 1];
    }
    this.cdr.detectChanges();
  }

  private scrollToSelectedFile(uuid: string) {
    const element = this.elementRef.nativeElement.querySelector(`[data-file-uuid="${uuid}"]`);
    if (element) {
      element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * 컨텍스트 메뉴 항목 열기
   */
  openContextMenuTarget() {
    if (!this.contextMenuTarget) return;
    const target = this.contextMenuTarget;
    this.hideContextMenu();
    this.selectFolder(target);
  }

  renameContextMenuTarget() {
    if (!this.contextMenuTarget) return;
    const target = this.contextMenuTarget;
    this.hideContextMenu();
    this.startRename(target);
  }

  onFilePanelClick(event: MouseEvent) {
    if (this.renamingFile) {
      const target = event.target as HTMLElement;
      if (!target.closest('.rename-input')) {
        this.cancelRename();
      }
    }
    this.hideContextMenu();
  }
  
  /**
   * 새 텍스트 파일 생성: 바탕화면에 중복되지 않는 이름으로 새 텍스트 파일 추가
   */
  createNewTextFile() {
    if (!this.selectedFolder) return;

    let fileNumber = 1;
    let fileName = '새 텍스트 문서.txt';
    const currentFiles = this.selectedFolder.children || [];

    while (currentFiles.some((f) => f.file_name === fileName)) {
      fileNumber++;
      fileName = `새 텍스트 문서 ${fileNumber}.txt`;
    }

    const parentPath = this.selectedFolder.file_path;
    const separator = parentPath !== '/' ? '/' : '';
    const filePath = `${parentPath}${separator}${fileName}`;

    const newTextFile = new Model_File(
      `local-file-${Date.now()}`,
      getExtensionModelByFileName(fileName),
      fileName,
      filePath,
      0,
      new Date(),
      new Date(),
      [],
      this.selectedFolder.folder_id || 0
    );

    this.selectedFolder.children = [...currentFiles, newTextFile];
    this.selectedFolder.children_count = this.selectedFolder.children.length;

    this.hideContextMenu();
    this.startRename(newTextFile);

    this.toast.success('새 텍스트 문서가 생성되었습니다.');
    this.cdr.detectChanges();
  }

  @Output() folderExpand = new EventEmitter<Abstract_File>();

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // 이름 바꾸기 중일 때 외부 클릭 시 취소 처리
    if (this.renamingFile) {
      if (!this.elementRef.nativeElement.contains(target)) {
        this.cancelRename();
      }
    }

    // 컨텍스트 메뉴가 열려있을 때 외부 클릭 시 닫기
    if (this.desktopStateService.isContextMenuOpen()) {
      // 컨텍스트 메뉴 내부 클릭이 아니면 닫기
      if (!target.closest('.context-menu')) {
        this.hideContextMenu();
      }
    }
  }

  @HostListener('document:dragend', ['$event'])
  onDocumentDragEnd(event: DragEvent) {
    if (!this.isDraggingSelectedItems) return;
    this.stopDraggingSelectedItems();
  }

  @HostListener('document:dragover', ['$event'])
  onDocumentDragOver(event: DragEvent) {
    if (this.isDraggingSelectedItems) {
      // 선택된 항목 드래그 중일 때 프리뷰 위치 업데이트
      if (event.clientX > 0 && event.clientY > 0) {
        this.desktopStateService.setDragPreview({
          x: event.clientX,
          y: event.clientY
        });
      }
      event.preventDefault();
    }
  }

  @HostListener('document:drop', ['$event'])
  onDocumentDrop(event: DragEvent) {
    if (!this.isDraggingSelectedItems) return;
    this.stopDraggingSelectedItems();
  }

  toggleFolder(folder: Abstract_File) {
    if (folder.type === 'folder') {
      if (folder.expanded === 'close') {
        folder.expanded = 'open';
        // 로드되지 않았거나 자식이 없는 경우 (로드 시도)
        if (!folder.isLoaded || !folder.children || folder.children.length === 0) {
          this.folderExpand.emit(folder);
        }
      } else {
        folder.expanded = 'close';
      }
    }
  }

  hasChildren(folder: Abstract_File): boolean {
    // children_count가 있으면 이를 우선 사용 (클릭 전에도 자식 개수를 알 수 있음)
    if (folder.children_count !== undefined && folder.children_count !== null) {
      return folder.children_count > 0;
    }
    
    // children이 아직 초기화되지 않았으면 화살표 표시 (lazy loading)
    if (folder.children === undefined || folder.children === null) {
      return true; // 아직 로드되지 않음
    }
    // children이 빈 배열이면 자식이 없음
    if (folder.children.length === 0) {
      return false;
    }
    // 폴더 타입의 자식이 있는지 확인
    return this.getFolderChildren(folder).length > 0;
  }


  /**
   * 선택된 항목 드래그 중
   */
  onSelectedItemsDrag(event: DragEvent) {
    if (
      this.isDraggingSelectedItems &&
      event.clientX > 0 &&
      event.clientY > 0
    ) {
      // Task 1: 전역 서비스의 프리뷰 좌표 실시간 업데이트
      this.desktopStateService.setDragPreview({
        x: event.clientX,
        y: event.clientY
      });
    }
  }

  /**
   * 선택된 항목 드래그 종료
   */
  onSelectedItemsDragEnd(event: DragEvent) {
    if (!this.isDraggingSelectedItems) return;
    this.stopDraggingSelectedItems();
  }

  /**
   * 사이드바 폴더 드래그 오버 (드롭 가능 영역)
   */
  onSidebarFolderDragOver(event: DragEvent, folder: Abstract_File) {
    if (folder.type !== 'folder') return;
    
    // 전역 드래그 상태 확인
    const dragPreview = this.desktopStateService.getDragPreview();
    
    if (this.isDraggingSelectedItems || dragPreview.visible) {
      const items = dragPreview.items;
      const canDrop = this.canDropItemsToFolder(items, folder);

      // 디버깅 로그 추가
      console.log(`[DEBUG_SIDEBAR] DragOver: ${folder.file_name} (${folder.uuid})`);
      console.log(`[DEBUG_SIDEBAR] Items:`, items.map(i => `${i.file_name} (pid:${i.folder_id}, uuid:${i.uuid})`));
      console.log(`[DEBUG_SIDEBAR] CanDrop: ${canDrop}`);
      
      event.preventDefault(); // 드롭 허용
      event.stopPropagation(); // 부모 요소로의 이벤트 전파 방지 (중요!)
      this.isDragOver = false; // 우측 패널 오버레이 숨기기

      if (!canDrop) {
        this.dragOverFolder = folder;
        this.dragOverFolderCanDrop = false;
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'none';
        }
        return;
      }

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }

      this.dragOverFolder = folder;
      this.dragOverFolderCanDrop = true;
    }
  }

  /**
   * 사이드바 폴더 드래그 리브 (드롭 영역 벗어남)
   */
  onSidebarFolderDragLeave(event: DragEvent) {
    // 자식 요소로 이동하는 경우는 무시
    const target = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;

    if (!currentTarget.contains(target)) {
      this.dragOverFolder = null;
      this.dragOverFolderCanDrop = false;
      // 우측 패널 오버레이도 숨기기
      this.isDragOver = false;
    }
  }

  /**
   * 사이드바 폴더 드롭 (선택된 항목들을 폴더로 이동)
   */
  onSidebarFolderDrop(event: DragEvent, targetFolder: Abstract_File) {
    if (this.isDraggingSelectedItems && targetFolder.type === 'folder') {
      event.preventDefault();
      event.stopPropagation();

      const dragPreview = this.desktopStateService.getDragPreview();
      const selectedItems = [...dragPreview.items];
      const sourceParentId = dragPreview.sourceParentId;

      // [Pre-Clear] 드롭 시점에 즉시 프리뷰 제거하여 시각적 반응성 확보
      this.stopDraggingSelectedItems();

      if (selectedItems.length > 0) {
        const canDrop = this.canDropItemsToFolder(selectedItems, targetFolder);
        
        if (!canDrop) {
          return;
        }

        this.fileMove.emit({
          target: targetFolder,
          items: selectedItems,
          source: dragPreview.source || 'explorer',
          sourceParentId: sourceParentId
        });
      }
    }
  }

  /**
   * 파일 아이템(폴더) 드래그 오버 (우측 패널 내에서)
   */
  onFileItemDragOver(event: DragEvent, file: Abstract_File) {
    if (file.type !== 'folder') return;
    
    // 외부 파일 업로드 드래그 오버 처리
    if (event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
      
      this.dragOverFolder = file;
      this.dragOverFolderCanDrop = true;
      this.isDragOver = false;
      this.dragType = 'upload';
      
      event.dataTransfer.dropEffect = 'copy';
      return;
    }

    // 전역 프리뷰 상태 또는 로컬 드래그 상태 확인
    const dragPreview = this.desktopStateService.getDragPreview();
    const items = dragPreview.items;
    
    if (items.length > 0 || this.isDraggingSelectedItems) {
      const canDrop = this.canDropItemsToFolder(items, file);
      
      event.preventDefault();
      event.stopPropagation();
      
      this.dragOverFolder = file;
      this.dragOverFolderCanDrop = canDrop;
      this.isDragOver = false; // 우측 패널 오버레이 숨기기
      this.dragType = 'move';

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
      }
    }
  }

  /**
   * 파일 아이템(폴더) 드래그 리브
   */
  onFileItemDragLeave(event: DragEvent) {
    const target = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;

    if (!currentTarget.contains(target)) {
      this.dragOverFolder = null;
      this.dragOverFolderCanDrop = false;
    }
  }

  /**
   * 파일 아이템(폴더) 드롭 (우측 패널 내에서 선택된 항목을 폴더로 이동)
   */
  onFileItemDrop(event: DragEvent, targetFolder: Abstract_File) {
    if (targetFolder.type !== 'folder') return;
    
    event.preventDefault();
    event.stopPropagation();

    const dragPreview = this.desktopStateService.getDragPreview();
    const selectedItems = [...dragPreview.items];
    const source = dragPreview.source;
    const sourceParentId = dragPreview.sourceParentId;

    // [Pre-Clear] 핸들러 진입 즉시 프리뷰 제거하여 지연 현상 차단
    this.stopDraggingSelectedItems();

    // 1. 외부 파일 업로드 처리
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files);
      const folderId = targetFolder.folder_id || 0;
      this.fileUpload.emit({ files, folderId });
      
      this.dragOverFolder = null;
      this.dragType = null;
      return;
    }

    if (selectedItems.length > 0) {
      const canDrop = this.canDropItemsToFolder(selectedItems, targetFolder);
      if (!canDrop) {
        return;
      }

      // 소스에 따라 다르게 처리
      if (source === 'desktop') {
        // 데스크탑 소스인 경우 이벤트를 상위로 올려서 처리
        this.fileMove.emit({
          target: targetFolder,
          items: selectedItems,
          source: 'desktop',
          sourceParentId: sourceParentId
        });
        
        // 이동 후 새로고침 예약
        this.refreshTargetFolderAfterMove(targetFolder);
      } else {
        // 탐색기(내부) 소스인 경우 이벤션을 상위로 올려서 처리 (일관성을 위해 emit 사용하도록 변경)
        this.fileMove.emit({
          target: targetFolder,
          items: selectedItems,
          source: 'explorer',
          sourceParentId: sourceParentId
        });
      }
    } else {
      // 선택된 항목이 없지만 데이터가 있는 경우 (fallback)
      const jsonStr = event.dataTransfer?.getData('application/json');
      if (jsonStr) {
        try {
          const paths = JSON.parse(jsonStr);
          this.fileMove.emit({
            target: targetFolder,
            paths,
            source: 'desktop'
          });
          this.refreshTargetFolderAfterMove(targetFolder);
        } catch (e) {
          console.error('Failed to parse desktop drop data on folder item', e);
        }
      }
    }
  }

  /**
   * 파일 이동 후 대상 폴더 새로고침 (API 완료 대기)
   */
  private refreshTargetFolderAfterMove(targetFolder: Abstract_File) {
    if (this.selectedFolder && this.selectedFolder.uuid === targetFolder.uuid) {
      setTimeout(() => {
        if (this.selectedFolder && this.selectedFolder.uuid === targetFolder.uuid) {
          this.selectedFolder.isLoaded = false;
          this.loadFolderContents(this.selectedFolder, true);
        }
      }, 500);
    }
  }

  /**
   * 항목들을 폴더에 드롭할 수 있는지 확인
   * 자기 자신을 자신의 폴더에 넣는 것을 방지
   * 이미 해당 폴더에 있는 파일을 넣는 것을 방지
   * 자식 폴더로의 이동을 방지 (순환 참조)
   */
  private canDropItemsToFolder(
    items: Abstract_File[],
    targetFolder: Abstract_File
  ): boolean {
    if (targetFolder.type !== 'folder') {
      return false;
    }

    const targetPath = targetFolder.file_path;
    
    for (const item of items) {
      // 1. 자기 자신을 자신의 폴더에 넣는 경우 방지
      if (item.uuid === targetFolder.uuid) {
        return false;
      }

      // 2. 이미 해당 폴더에 있는 파일을 해당 폴더로 이동시키는 경우 방지 (부모 폴더로 이동 금지)
      // 아이템의 진짜 부모 경로(마지막 슬래시 이전)를 추출하여 타겟 폴더의 경로와 비교
      const lastSlashIndex = item.file_path.lastIndexOf('/');
      const itemParentPath = lastSlashIndex !== -1 ? item.file_path.substring(0, lastSlashIndex) : '';
      const normalizedTargetPath = targetFolder.file_path.replace(/\/+$/, '');
      
      if (itemParentPath === normalizedTargetPath) {
        return false;
      }

      // 3. 자식 폴더를 부모 폴더에 넣는 경우 방지 (순환 참조 방지)
      if (item.type === 'folder') {
        const itemPath = item.file_path;
        
        // targetPath가 itemPath/ 로 시작하면, target은 item의 자손임 -> 이동 불가 (순환 참조 방지)
        const itemPathWithSeparator = itemPath.endsWith('/') ? itemPath : itemPath + '/';
        if (targetPath.startsWith(itemPathWithSeparator)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 선택된 항목들을 폴더로 이동
   */
  private moveItemsToFolder(
    items: Abstract_File[],
    targetFolder: Abstract_File
  ) {
    if (!targetFolder.folder_id && targetFolder.folder_id !== 0) {
      console.error('대상 폴더의 folder_id를 찾을 수 없습니다.');
      return;
    }

    const targetFolderId = targetFolder.folder_id || 0;

    // 각 항목을 순차적으로 이동
    const movePromises = items.map((item) => {
      const params: Parameter = {
        type: 'PATCH',
        sendData: {
          type: item.type,
          uuid: item.uuid,
          target_folder_id: targetFolderId,
        },
        route: `/drive/${this.workspaceUUID}/move`,
      };

      return this.apiService.api(params).pipe(first()).toPromise();
    });

    // 모든 이동 요청 실행
    Promise.all(movePromises)
      .then((results) => {
        console.log('파일 이동 완료:', results);
        
        // 현재 선택된 폴더가 대상 폴더인 경우 새로고침
        if (this.selectedFolder && this.selectedFolder.uuid === targetFolder.uuid) {
          this.selectedFolder.isLoaded = false;
          this.loadFolderContents(this.selectedFolder, true);
        }
        
        // 현재 선택된 폴더에서 이동된 항목 제거
        if (this.selectedFolder && this.selectedFolder.children) {
          this.selectedFolder.children = this.selectedFolder.children.filter(
            (child) => !items.some(item => item.uuid === child.uuid)
          );
        }
        
        // 선택 해제
        this.selectedFiles = [];
      })
      .catch((error) => {
        console.error('이동 중 오류 발생:', error);
        this.selectedFiles = [];
      });
  }

  @HostListener('window:mouseup')
  onWindowMouseUp() {
    if (this.isDraggingSelectedItems) {
      this.stopDraggingSelectedItems();
    }
  }

  /**
   * 선택된 항목 드래그 종료 처리
   */
  private stopDraggingSelectedItems() {
    this.isDraggingSelectedItems = false;
    
    // 즉시 프리뷰 숨김 (전역 상태 업데이트)
    this.desktopStateService.clearDragPreview();
    
    this.dragOverFolder = null;
    this.dragOverFolderCanDrop = false;
    
    // 단일 파일 드래그 상태도 초기화
    this.isDragging = false;
    this.draggedFile = null;
    this.isDragOver = false;
    this.dragType = null;
    
    this.cdr.detectChanges();
  }
}
