import { Component, HostListener, OnDestroy, OnInit, AfterViewChecked, AfterViewInit, ChangeDetectorRef, ViewChildren, QueryList, inject, Input, SimpleChanges, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Added DatePipe
// import { FormsModule } from '@angular/forms';
import { SHARED_MODULES } from '../../shared/shared-modules';

// import { PdfViewerModule } from 'ng2-pdf-viewer'; // SharedModule에 포함됨
import { WindowComponent } from '../../components/window/window';
import { FileExplorer } from '../../components/file-explorer/file-explorer';
import { Taskbar, TaskbarApp } from '../../components/taskbar/taskbar';
import { DropdownComponent } from '../../components/dropdown/dropdown';

import { DropdownItemComponent } from '../../components/dropdown/dropdown-item';
import { AppComponent as PortfolioComponent } from '../../portfolio/app.component';

import {
  Abstract_File,
  Model_Folder,
  Model_File,
  QuickLookInfo,
} from '../../components/directory/directory-model';
import { TextEditorComponent } from '../../components/text-editor/text-editor';
import {
  Model_Extension_IMAGE,
  Model_Extension_TXT,
  getExtensionModelByFileName,
} from '../../components/directory/file-extension-model';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ApiService, Parameter, UploadProgress } from '../../core/services/api.service';
import { DesktopStateService, ContextMenuItem } from '../../core/services/desktop-state.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { ToastService } from '../../core/services/toast.service';
import { first, firstValueFrom } from 'rxjs';
import { Subscription, Subject, takeUntil, map } from 'rxjs';
import { AudioPlayer } from '../../components/audio-player/audio-player';
import { MsgboxService } from '../../core/services/msgbox.service';
import { InputBoxService } from '../../core/services/inputbox.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import { FontDialogService } from '../../core/services/font-dialog.service';
import { AboutDialogService } from '../../core/services/about-dialog.service';
import { SafePipe } from "../../shared/pipes/safe.pipe";

import { WindowService, WindowInstance } from '../../core/services/window.service';

import Psd from '@webtoon/psd';
import * as XLSX from 'xlsx';
import { renderAsync } from 'docx-preview';

@Component({
  selector: 'app-desktop',
  imports: [
    SHARED_MODULES,
    // PdfViewerModule, // SharedModule에 포함됨
    WindowComponent,
    FileExplorer,
    AudioPlayer,
    AudioPlayer,
    SafePipe,
    DatePipe,

    TextEditorComponent,
    PortfolioComponent
  ],
  templateUrl: './desktop.html',
  styleUrls: [
    './desktop.scss',
    './files/hwp.scss'
  ],
})
export class Desktop implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit {

  @Input() workspaceUUID: string = '';


  @Input() mode: 'preview' | 'normal' = 'normal';

  private router = inject(Router);
  private subscriptions: Subscription[] = []; // 구목목록

  // private nextZIndex = 1100; // WindowService로 이동

  public bgImagePath = '/assets/desktop/background.png'; // 배경 이미지
  private transparentDragImage = new Image();

  /**
   * 독 바에 표시할 메뉴 아이템 (사이드바와 동일)
   */
  dockItems = [
    {
      route: '/drive',
      icon: '/assets/icons/primary/png/exec.png',
      label: '대시보드',
    },
  ];

  // 폴더 리스트
  // 바탕화면 폴더 및 파일들
  desktopFolders: Abstract_File[] = [];

  // 로컬 파일 시스템 시뮬레이션을 위한 데이터 (src/assets/desktop/files 기반)
  private initialFilesInitialized = false;

  // 드래그 선택 관련
  isDragging = false;
  isRightClickDrag = false;
  dragStartPos = { x: 0, y: 0 };

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  handleDockClick(item: any) {
    if (item.label === '데스크탑' && this.router.url === '/drive') {
      this.minimizeAllWindows();
      return;
    }
    this.navigateTo(item.route);
  }

  minimizeAllWindows() {
    this.windowService.minimizeAllWindows();
  }

  selectionBox = { x: 0, y: 0, width: 0, height: 0 };
  selectedFolders: Set<string> = new Set(); // UUID Set
  private desktopRect: DOMRect | null = null;
  pendingRightClickInfo: {
    x: number;
    y: number;
    target: Abstract_File | null;
  } | null = null;

  // 컨텍스트 메뉴 관련
  contextMenu = {
    visible: false,
    x: 0,
    y: 0,
  };
  showNewSubmenu = false;
  showSortSubmenu = false;
  contextMenuTarget: Abstract_File | null = null;

  // 이름 바꾸기 관련
  renamingFile: Abstract_File | null = null;
  renameText: string = '';
  private shouldFocusRenameInput = false;

  // 호버 딜레이 타이머
  private hoverTimeout: any = null;

  // 선택된 항목 드래그 관련
  isDraggingSelectedItems = false;
  dragPreview = {
    visible: false,
    fading: false,
    x: -500,
    y: -500,
    items: [] as Abstract_File[],
  };
  dragOverFolder: Abstract_File | null = null;
  dragOverFolderCanDrop: boolean = false; // 드롭 가능 여부
  isFileDragOver = false;
  propertiesOpen = false;
  propertiesTarget: Abstract_File | null = null;
  propertiesWindowSize = { width: 520, height: 420 };
  propertiesWindowPosition = { x: 0, y: 0 };
  propertiesWindowZIndex = 0;
  propertiesWindowIsActive = false;
  private readonly dragPreviewFadeMs = 0;
  private dragPreviewFadeTimeout: number | null = null;

  // 파일 업로드 상태 관련
  uploadWindowOpen = false;
  uploadWindowZIndex = 0;
  uploadWindowIsActive = false;
  uploadWindowPosition = { x: 0, y: 0 };
  uploadWindowSize = { width: 500, height: 300 };
  uploadFileList: Array<{
    file: File;
    progress: number;
    loaded: number; // 실제 업로드된 바이트 수
    total: number; // 전체 파일 크기 (바이트)
    s3Progress: number; // S3 업로드 진행률
    s3Loaded: number; // S3 업로드된 바이트 수
    status: 'uploading' | 'processing' | 'completed' | 'error';
    error?: string;
    uploadId?: string; // SSE 추적을 위한 업로드 ID
    folderId?: number; // 폴더 ID (폴더 업로드 시)
    path?: string; // 파일 경로 (폴더 업로드 시)
  }> = [];
  uploadProgressSubject: Subject<UploadProgress> | null = null;
  private sseConnections: Map<string, EventSource> = new Map();
  private destroy$ = new Subject<void>();
  lastSelectedUuid: string | null = null; // 키보드 탐색을 위한 마지막 선택 항목 추적

  // Quick Look 관련
  quickLook: QuickLookInfo = {
    visible: false,
    file: null,
    loading: false,
    x: 0,
    y: 0,
    type: ''
  };

  // Quick Look 고정 크기 (300x250 기준)
  quickLookWidth = 300;
  quickLookHeight = 250;

  // windows: WindowInstance[] = []; // WindowService로 이동
  get windows() { return this.windowService.windows; }
  taskbarApps: TaskbarApp[] = [];

  // 파일 탐색기 인스턴스들 소집
  @ViewChildren(FileExplorer) fileExplorers!: QueryList<FileExplorer>;

  // 단축키 액션 참조 저장
  private shortcutActions: { key: string; action: () => void }[] = [];

  // 드래그 선택 시작 시의 선택 상태 저장
  private initialSelectedFolders: Set<string> = new Set(); // UUID Set
  private isCtrlDrag = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    private desktopStateService: DesktopStateService,
    private workspaceService: WorkspaceService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private inputboxService: InputBoxService,
    private msgboxService: MsgboxService,
    private shortcutService: ShortcutService,
    private http: HttpClient,
    public windowService: WindowService,
    private elementRef: ElementRef
  ) {
    // this.toast.error('파일을 삭제할 수 없습니다.');
    // this.toast.warn('파일을 삭제하시겠습니까?');
    // this.toast.info('파일명이 변경되었습니다.파일명이 변경되었습니다.파일명이 변경되었습니다.');
    // this.toast.success('파일이 저장되었습니다.');
  }

  // 시계 관련
  currentTime: Date = new Date();
  private clockInterval: any;

  private startClock() {
    this.updateClock();
    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);
  }

  private updateClock() {
    this.currentTime = new Date();
    this.cdr.detectChanges();
  }

  // 텍스트 변경 감지
  // 텍스트 변경 감지 (TextEditorComponent에서 호출 가능하도록 남겨둠)
  onTextChange(window: WindowInstance) {
    if (!window.isDirty) {
      window.isDirty = true;
    }
  }

  // 창 닫기 시도 (저장 확인)
  async tryCloseWindow(id: string) {
    const window = this.windowService.windows.find(w => w.id === id);
    if (window && window.isDirty && window.type === 'text') {
      const result = await firstValueFrom(this.msgboxService.custom({
        title: '메모장',
        message: `변경 내용을 ${window.file?.file_name || '제목 없음'}에 저장하시겠습니까?`,
        icon: 'info',
        buttons: [
          { label: '저장', type: 'primary', value: true, shortcut: 'S' },
          { label: '저장 안 함', type: 'secondary', value: false, shortcut: 'N' },
          { label: '취소', type: 'secondary', value: null }
        ]
      }));

      if (result === true) {
        // 저장 (S)
        this.saveTextFile(window);
        this.closeWindow(id);
      } else if (result === false) {
        // 저장 안 함 (N)
        this.closeWindow(id);
      } else {
        // 취소 (null) - 아무것도 하지 않음
      }
    } else {
      this.closeWindow(id);
    }
  }

  // 텍스트 파일 저장 (Overwrite)
  saveTextFile(windowInstance: WindowInstance) {
    if (!windowInstance.file) return;

    // 원본 파일 찾기 (재귀적으로 검색)
    const originalFile = this.findFileById(windowInstance.file.uuid, this.desktopFolders);

    if (originalFile) {
      // 텍스트 내용 추출 (TextEditorComponent가 windowInstance.file.extension_info.text를 업데이트했다고 가정)
      const textContent = (windowInstance.file!.extension_info as any).text || '';

      // 로컬 참조들 업데이트
      if (originalFile.extension_info.extension_name === '.txt') {
        (originalFile.extension_info as any).text = textContent;
      }

      originalFile.file_updated_at = new Date();

      console.log('Save successful (Local):', windowInstance);
      this.toast.success('파일이 저장되었습니다.');
      windowInstance.isDirty = false;
      windowInstance.showFileMenu = false;
      this.cdr.detectChanges();
    } else {
      console.error('Original file not found for saving.');
      this.toast.error('원본 파일을 찾을 수 없어 저장에 실패했습니다.');
    }
  }

  // 텍스트 파일 다른 이름으로 저장 (Save As)
  async saveAsTextFile(windowInstance: WindowInstance) {
    if (!windowInstance.file) return;

    const oldName = windowInstance.file.file_name;
    const dotIndex = oldName.lastIndexOf('.');
    const baseName = dotIndex !== -1 ? oldName.substring(0, dotIndex) : oldName;
    const extension = dotIndex !== -1 ? oldName.substring(dotIndex) : '';

    this.inputboxService.okCancel(
      '다른 이름으로 저장할 파일 이름을 입력하세요:',
      '다른 이름으로 저장',
      baseName + '_사본' + extension
    ).subscribe(newName => {
      if (!newName) return;

      // 새로운 파일 객체 생성 (깊은 복사)
      const newFile = JSON.parse(JSON.stringify(windowInstance.file)) as Abstract_File;
      newFile.uuid = this.generateId(); // 새로운 UUID 생성
      newFile.file_name = newName;
      newFile.file_path = windowInstance.file!.file_path.replace(oldName, newName);
      newFile.file_created_at = new Date();
      newFile.file_updated_at = new Date();

      // 바탕화면에 추가
      this.desktopFolders.push(newFile);

      this.toast.success(`'${newName}'으로 저장되었습니다.`);
      windowInstance.showFileMenu = false;
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  // 컨텍스트 메뉴 아이템
  contextMenuItems: ContextMenuItem[] = [];
  hoveredContextItem: ContextMenuItem | null = null;

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      if (params?.['workspaceUUID']) {
        this.workspaceUUID = params?.['workspaceUUID'];
      }

      if (!this.initialFilesInitialized) {
        this.initLocalFiles();
        this.initialFilesInitialized = true;

        // 소개글.html 자동 열기
        setTimeout(() => {
          const aboutFile = this.desktopFolders.find(f => f.file_name === '포트폴리오.html');
          if (aboutFile) {
            this.openFolderWindow(aboutFile, { isMaximized: true });
          }
        }, 500);
      } else {
        this.getData();
      }

      // this.getData();
      // this.loadWorkspaceInfo();

      this.transparentDragImage.src =
        'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

      this.desktopStateService.isModalOpen$.pipe(takeUntil(this.destroy$)).subscribe(isOpen => {
        if (isOpen) {
          this.blurAllWindows();
        }
      });

      // 배경 변경 이벤트 구독 (자신의 workspaceUUID와 일치하는 경우에만 업데이트)
      this.workspaceService.backgroundChange$.pipe(takeUntil(this.destroy$)).subscribe(({ workspaceUUID, bgId }) => {
        if (workspaceUUID === this.workspaceUUID) {
          this.setBackgroundImage(bgId);
        }
      });

      // Task 1: 전역 드래그 프리뷰 상태 구독 (탐색기 드래그 대응)
      this.desktopStateService.dragPreview$.pipe(takeUntil(this.destroy$)).subscribe(state => {
        this.dragPreview = {
          ...this.dragPreview, // 기존 구조 유지
          ...state
        };
        this.isDraggingSelectedItems = state.visible;
        this.cdr.detectChanges();
      });

      // Task 2: 전역 컨텍스트 메뉴 상태 구독
      this.desktopStateService.contextMenu$.pipe(takeUntil(this.destroy$)).subscribe(state => {
        this.contextMenu = {
          visible: state.visible,
          x: state.x,
          y: state.y
        };
        this.contextMenuItems = state.items;
        this.cdr.detectChanges();
      });

      this.registerShortcuts();

      // 복사/붙여넣기 단축키 등록
      this.shortcutService.register({
        key: 'c',
        ctrl: true,
        action: () => this.onCopy(),
        description: '복사'
      });
      this.shortcutService.register({
        key: 'v',
        ctrl: true,
        action: () => this.onPaste(),
        description: '붙여넣기'
      });
    });

    // Quick Look 상태 구독
    this.desktopStateService.quickLook$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.quickLook.visible = state.visible;
        if (state.visible && state.file) {
          this.quickLook.file = state.file;
          this.quickLook.type = state.type;

          // 화면 경계 체크 및 좌표 보정 (300x250 고정 크기 기준)
          const panelWidth = this.quickLookWidth;
          const panelHeight = this.quickLookHeight;
          const padding = 20;

          let newX = state.x;
          let newY = state.y;

          // 가로 경계 보정 (오른쪽으로 넘어가면 안쪽으로 Shift)
          if (newX + panelWidth + padding > window.innerWidth) {
            newX = window.innerWidth - panelWidth - padding;
          }
          if (newX < padding) newX = padding;

          // 세로 경계 보정 (아래로 넘어가면 안쪽으로 Shift)
          if (newY + panelHeight + padding > window.innerHeight) {
            newY = window.innerHeight - panelHeight - padding;
          }
          if (newY < padding) newY = padding;

          this.quickLook.x = newX;
          this.quickLook.y = newY;
          this.quickLook.loading = true;

          // 데이터 로드 시작
          this.loadQuickLookData(state.file);
        } else {
          // 닫힐 때 초기화
          this.quickLook.file = null;
          this.quickLook.content = null;
          this.quickLook.sheets = [];
          this.quickLook.children = [];
        }
        this.cdr.detectChanges();
      });

    // 초기 스케일 계산
    this.calculatePreviewScale();

    // 시계 시작
    this.startClock();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['workspaceUUID']) {
      // this.getData();
      // this.loadWorkspaceInfo();
    }
  }

  // 단축키 등록 처리
  private registerShortcuts() {
    const actions = [
      {
        key: 'delete',
        action: () => {
          if (this.windows.some(w => w.isActive)) return;
          this.remove();
        }
      },
      {
        key: 'f2',
        action: () => {
          if (this.selectedFolders.size === 1) {
            const fileUuid = Array.from(this.selectedFolders)[0];
            const file = this.desktopFolders.find(f => f.uuid === fileUuid);
            if (file) this.startRename(file);
          }
        }
      },
      {
        key: 'a',
        ctrl: true,
        action: () => {
          // 활성화된 탐색기 창이 있는지 확인
          const activeExplorer = this.fileExplorers.find(fe => fe.isActive);
          if (activeExplorer) {
            activeExplorer.selectAll();
            return;
          }
          this.selectAllFiles();
        }
      },
      {
        key: 'escape',
        action: () => {
          // 활성화된 탐색기 창 선택 해제
          const activeWindow = this.windows.find(w => w.isActive && w.type === 'explorer');
          if (activeWindow) {
            const explorer = this.fileExplorers.find(fe => fe.rootFolder?.uuid === activeWindow.folder?.uuid);
            if (explorer) {
              explorer.clearSelection();
              explorer.hideContextMenu();
              return;
            }
          }
          this.selectedFolders.clear();
          this.hideContextMenu();
        }
      },
      {
        key: 'h',
        ctrl: true,
        action: () => {
          // 활성화된 창 최소화
          const activeWindow = this.windows.find(w => w.isActive) ||
            [...this.windows].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))[0];
          if (activeWindow) {
            this.minimizeWindow(activeWindow.id);
          }
        }
      },
      { key: 'arrowup', action: () => this.handleKeyboardNavigation('ArrowUp') },
      { key: 'arrowdown', action: () => this.handleKeyboardNavigation('ArrowDown') },
      { key: 'arrowleft', action: () => this.handleKeyboardNavigation('ArrowLeft') },
      { key: 'arrowright', action: () => this.handleKeyboardNavigation('ArrowRight') },
    ];

    actions.forEach(a => {
      this.shortcutService.register(a);
      this.shortcutActions.push({ key: a.key, action: a.action });
    });
  }

  // 바탕화면 모든 파일 선택
  private selectAllFiles() {
    this.selectedFolders.clear();
    this.desktopFolders.forEach(file => {
      this.selectedFolders.add(file.uuid);
    });
  }

  // 프리뷰 모드일 때 크기 변경 감지 (ResizeObserver 사용)
  ngAfterViewInit() {
    if (this.mode === 'preview') {
      this.resizeObserver = new ResizeObserver(() => {
        this.calculatePreviewScale();
      });
      this.resizeObserver.observe(this.elementRef.nativeElement);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // SSE 연결 모두 종료
    this.sseConnections.forEach((eventSource, uploadId) => {
      console.log('Component destruction: Closing SSE connection:', uploadId);
      eventSource.close();
    });
    this.sseConnections.clear();

    // 등록된 단축키 모두 해제
    this.shortcutActions.forEach(a => {
      this.shortcutService.unregister(a.key, a.action);
    });

    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked() {
    // 뷰 체크 후 rename 입력 필드에 포커스
    if (this.shouldFocusRenameInput) {
      this.shouldFocusRenameInput = false;
      setTimeout(() => {
        const renameInput = document.querySelector('.rename-input') as HTMLInputElement;
        if (renameInput) {
          renameInput.focus();
          renameInput.select();
        }
      }, 0);
    }
  }

  // ------------------------------------------------------------
  // 트랙 바이 함수
  // ------------------------------------------------------------
  trackByWindowId(index: number, window: WindowInstance): string {
    return window.id;
  }
  trackByFilePath(index: number, file: Abstract_File): string {
    return file.file_path;
  }

  // ------------------------------------------------------------
  // 헬퍼 함수
  // ------------------------------------------------------------
  private findFileById(uuid: string, folders: Abstract_File[]): Abstract_File | null {
    for (const file of folders) {
      if (file.uuid === uuid) {
        return file;
      }
      if (file.children && file.children.length > 0) {
        const found = this.findFileById(uuid, file.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  private findFolderByFolderId(folderId: number, folders: Abstract_File[]): Abstract_File | null {
    for (const file of folders) {
      if (file.folder_id === folderId) {
        return file;
      }
      if (file.children && file.children.length > 0) {
        const found = this.findFolderByFolderId(folderId, file.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }


  // ------------------------------------------------------------
  // 바탕화면 클릭 이벤트 처리
  // ------------------------------------------------------------
  // 바탕화면 문서 클릭
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // 이름 바꾸기 모드일 때 rename 입력 필드 외부 클릭 시 취소
    if (this.renamingFile) {
      if (!target.closest('.rename-input')) {
        this.cancelRename();
      }
    }

    if (this.contextMenu.visible) {
      if (!target.closest('.context-menu')) {
        this.hideContextMenu();
      }
    }
  }

  // 바탕화면 마우스 다운
  onDesktopMouseDown(event: MouseEvent) {
    this.hideContextMenu();

    const target = event.target as HTMLElement;
    if (
      target.closest('.desktop-icon') ||
      target.closest('.window-container')
    ) {
      return;
    }

    // 빈 공간 클릭 시 모든 윈도우 포커스 해제
    this.deactivateAllWindows();

    this.isRightClickDrag = event.button === 2;
    const desktopContent = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();
    this.desktopRect = desktopContent;

    if (this.isRightClickDrag) {
      const iconElement = target.closest('.desktop-icon');
      let contextMenuTarget: Abstract_File | null = null;

      if (iconElement) {
        const folderUuid = iconElement.getAttribute('data-folder-uuid');
        if (folderUuid) {
          const foundFile = this.desktopFolders.find(
            (f) => f.uuid === folderUuid
          );
          contextMenuTarget = foundFile || null;
        }
      }

      this.pendingRightClickInfo = {
        x: event.clientX - desktopContent.left,
        y: event.clientY - desktopContent.top,
        target: contextMenuTarget,
      };
    }

    this.isCtrlDrag = event.ctrlKey || event.metaKey;
    if (this.isCtrlDrag) {
      // Ctrl 드래그 시 시작 상태 저장
      this.initialSelectedFolders = new Set(this.selectedFolders);
    } else {
      // 일반 드래그 시 기존 선택 해제
      this.selectedFolders.clear();
      this.initialSelectedFolders.clear();
    }

    // 좌클릭일 경우에만 드래그(선택 박스) 시작
    if (event.button === 0) {
      this.isDragging = true;
      this.desktopStateService.setIsDragging(true);
      this.dragStartPos = {
        x: event.clientX - desktopContent.left,
        y: event.clientY - desktopContent.top,
      };
      this.selectionBox = {
        x: this.dragStartPos.x,
        y: this.dragStartPos.y,
        width: 0,
        height: 0,
      };
    }
    event.preventDefault();
  }

  /**
   * 바탕화면 마우스 이동: 드래그 선택 박스 크기 업데이트
   */
  @HostListener('document:mousemove', ['$event'])
  onDesktopMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const desktopContent = this.desktopRect ?? this.getDesktopRect();
    if (!desktopContent) return;

    const currentX = event.clientX - desktopContent.left;
    const currentY = event.clientY - desktopContent.top;

    this.selectionBox = {
      x: Math.min(this.dragStartPos.x, currentX),
      y: Math.min(this.dragStartPos.y, currentY),
      width: Math.abs(currentX - this.dragStartPos.x),
      height: Math.abs(currentY - this.dragStartPos.y),
    };

    this.updateSelectedFolders();
  }

  /**
   * 바탕화면 마우스 업: 드래그 선택 완료
   */
  @HostListener('document:mouseup', ['$event'])
  @HostListener('window:mouseup', ['$event'])
  onDesktopMouseUp(event: MouseEvent) {
    if (this.isDraggingSelectedItems) {
      this.stopDraggingSelectedItems();
    }
    this.endDesktopDrag(true);
  }

  @HostListener('document:mouseleave')
  @HostListener('window:blur')
  onWindowBlur() {
    // iframe 내부 클릭 시 blur 이벤트가 발생하지만, 이는 앱 이탈이 아니므로 무시
    if (document.activeElement instanceof HTMLIFrameElement) {
      return;
    }

    this.endDesktopDrag(false);
    this.deactivateAllWindows();
    this.closeQuickLook();
  }

  // @HostListener('window:keydown', ['$event'])
  // onKeyDown(event: KeyboardEvent) {
  //   if (event.code === 'Space' && !event.repeat) {
  //     // 입력창 체크
  //     const target = event.target as HTMLElement;
  //     if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
  //       return;
  //     }

  //     // 모달 활성화 체크
  //     if (this.desktopStateService.getIsModalOpen()) {
  //       return;
  //     }

  //     // 이름 바꾸기 중 체크
  //     if (this.renamingFile) {
  //       return;
  //     }

  //     if (this.selectedFolders.size === 1) {
  //       // 활성화된 창이 있으면 그 창의 탐색기에서 처리하도록 양보 (우선순위)
  //       const activeExplorer = this.windows.find(w => w.isActive && w.type === 'explorer');
  //       if (activeExplorer) {
  //         return;
  //       }

  //       event.preventDefault();
  //       const uuid = Array.from(this.selectedFolders)[0];
  //       const file = this.desktopFolders.find(f => f.uuid === uuid);
  //       if (file) {
  //         const folderElement = document.querySelector(`[data-folder-uuid="${file.uuid}"]`);
  //         let x = 0, y = 0;
  //         if (folderElement) {
  //           // 아이콘 래퍼(.icon-wrapper)를 찾아서 기준점으로 사용
  //           const iconWrapper = folderElement.querySelector('.icon-wrapper');
  //           const rect = (iconWrapper || folderElement).getBoundingClientRect();

  //           x = rect.right + 10;
  //           y = rect.top;
  //         }
  //         this.desktopStateService.openQuickLook(file, x, y);
  //       }
  //     }
  //   }
  // }

  // @HostListener('window:keyup', ['$event'])
  // onKeyUp(event: KeyboardEvent) {
  //   if (event.code === 'Space') {
  //     this.desktopStateService.closeQuickLook();
  //   }
  // }



  async loadQuickLookData(file: Abstract_File) {
    const viewType = file.extension_info.view_type;
    const url = this.getFileUrl(file);

    // 안전 장치: 5초 후에는 무조건 로딩 종료 (무한 스핀 방지)
    const safetyTimeout = setTimeout(() => {
      if (this.quickLook.loading) {
        console.warn('QuickLook 로딩 타임아웃 발생');
        this.quickLook.loading = false;
        this.cdr.detectChanges();
      }
    }, 5000);

    try {
      if (viewType === 'image') {
        this.quickLook.content = url;
        this.quickLook.loading = false;
      } else if (viewType === 'psd') {
        // PSD 파일 파싱 및 미리보기 생성
        try {
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();
          const psd = Psd.parse(buffer);
          const compositeBuffer = await psd.composite();

          const canvas = document.createElement('canvas');
          canvas.width = psd.width;
          canvas.height = psd.height;
          const ctx = canvas.getContext('2d')!;
          const imageData = new ImageData(
            new Uint8ClampedArray(compositeBuffer),
            psd.width,
            psd.height
          );
          ctx.putImageData(imageData, 0, 0);

          this.quickLook.content = canvas.toDataURL('image/png');
        } catch (err) {
          console.error('PSD 미리보기 생성 실패:', err);
          this.quickLook.content = '';
        }
        this.quickLook.loading = false;
      } else if (viewType === 'ai') {
        // AI 파일은 PDF 미리보기 URL 사용 (변환된 이미지)
        // file.file_path가 /desktop/uuid 형태일 수 있으므로 uuid 기반으로 미리보기 경로 유추 필요
        // 하지만 현재 구조상 정확한 미리보기 URL을 알기 어려우므로, 
        // WindowComponent에서 사용하는 방식 참고: getFileProxyUrl은 원본 URL을 반환함.
        // AI 파일의 경우 브라우저에서 직접 표시가 어려우므로, PDF 변환된 url이나 썸네일을 보여줘야 함.
        // 임시로 썸네일 이미지를 보여주거나, PDF 뷰어로 연결 시도.
        // 여기서는 PSD와 유사하게 처리하되, AI 파일은 보통 변환이 필요함. 
        // 만약 서버에서 변환된 미리보기를 제공한다면 그 URL을 써야 함.
        // 현재 로직상 AI 파일 뷰어(window type 'ai')는 pdf-viewer를 사용함.
        // 따라서 quickLook에서도 pdf-viewer를 사용하거나, 
        // 단순히 썸네일을 보여주는 방식으로 처리.
        this.quickLook.content = url;
        this.quickLook.loading = false;
      } else if (viewType === 'html' || viewType === 'code' || viewType === 'text') {
        if (!url) {
          this.quickLook.content = '';
          this.quickLook.loading = false;
          return;
        }
        try {
          const textRes = await fetch(url);
          if (!textRes.ok) throw new Error(textRes.statusText);
          let content = await textRes.text();

          // HTML 파일인 경우 base URL 주입하여 상대 경로 리소스(이미지, CSS 등) 해결
          if (viewType === 'html') {
            const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
            const baseTag = `<base href="${baseUrl}">`;

            // <head>가 있으면 그 안에, 없으면 <html> 안에, 그것도 없으면 맨 앞에 추가
            if (content.includes('<head>')) {
              content = content.replace('<head>', `<head>${baseTag}`);
            } else if (content.includes('<html>')) {
              content = content.replace('<html>', `<html><head>${baseTag}</head>`);
            } else {
              content = `${baseTag}${content}`;
            }
          }

          this.quickLook.content = content;
        } catch (err) {
          console.warn('텍스트 파일 로드 실패 (빈 파일일 수 있음):', err);
          this.quickLook.content = ''; // 빈 내용으로 처리
        }
        this.quickLook.loading = false;
      } else if (viewType === 'excel') {
        const excelRes = await fetch(url);
        const buffer = await excelRes.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheets = workbook.SheetNames.map(name => ({
          name: name,
          content: XLSX.utils.sheet_to_html(workbook.Sheets[name])
        }));
        this.quickLook.sheets = sheets;
        this.quickLook.activeSheetIndex = 0;
        this.quickLook.content = sheets[0]?.content;

        // 엑셀 스케일링 적용 (비동기 렌더링 대기)
        setTimeout(() => this.formatExcelScaling(), 0);
      } else if (viewType === 'hwp' || viewType === 'word') {
        this.quickLook.content = url;
        // Word의 경우 컨테이너가 렌더링된 후 처리해야 하므로 약간의 지연 필요
        if (viewType === 'word') {
          setTimeout(() => this.renderWordInQuickLook(), 100);
        } else {
          this.quickLook.loading = false;
        }
      } else if (viewType === 'folder') {
        // 폴더 내용 조회 로직 복구
        const params: Parameter = {
          type: 'GET',
          sendData: {
            parent_id: file.folder_id || 0,
          },
          route: `/drive/${this.workspaceUUID}/list`,
        };

        this.apiService.api(params).pipe(first()).subscribe({
          next: (res: any) => {
            if (res.status === 'success') {
              const folders = (res.data['folders'] || []).map((item: any) =>
                new Model_Folder(
                  item.uuid,
                  item.folder_name,
                  `${file.file_path}/${item.folder_name}`,
                  item.folder_size || 0,
                  item.folder_color,
                  item.created_at ? new Date(item.created_at) : undefined,
                  item.updated_at ? new Date(item.updated_at) : undefined,
                  undefined,
                  item.folder_id
                )
              );

              const files = (res.data['files'] || []).map((item: any) =>
                new Model_File(
                  item.uuid || '',
                  getExtensionModelByFileName(item.file_name || ''),
                  item.file_name,
                  item.file_path,
                  item.file_size || 0,
                  item.file_created_at ? new Date(item.file_created_at) : undefined,
                  item.file_updated_at ? new Date(item.file_updated_at) : undefined,
                  undefined,
                  item.folder_id
                )
              );

              this.quickLook.children = [...folders, ...files];
            } else {
              this.quickLook.children = [];
            }
            this.quickLook.loading = false;
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            console.error('Quick Look 폴더 내용 로드 실패:', err);
            this.quickLook.children = [];
            this.quickLook.loading = false;
            this.cdr.detectChanges();
          }
        });
        return;
      } else {
        this.quickLook.loading = false;
      }
    } catch (e) {
      console.error('Quick Look 데이터 로드 실패:', e);
      this.quickLook.loading = false;
    } finally {
      // 비동기 처리가 있는 타입들을 제외하고는 여기서 로딩 종료 확인
      if (viewType !== 'word' && viewType !== 'excel' && viewType !== 'hwp' && viewType !== 'folder') {
        this.quickLook.loading = false;
      }
      clearTimeout(safetyTimeout);
      this.cdr.detectChanges();
    }
  }

  loadHwpInQuickLook() {
    if (!this.quickLook.file || !this.quickLook.content) return;

    const iframe = document.querySelector('.preview-hwp-iframe iframe') as HTMLIFrameElement;
    if (!iframe || !iframe.contentWindow) return;

    const messageHandler = (event: MessageEvent) => {
      // 뷰어 준비 완료 시 렌더링 요청
      if (event.data && event.data.type === 'VIEWER_READY') {
        fetch(this.quickLook.content!)
          .then(res => res.arrayBuffer())
          .then(buffer => {
            iframe.contentWindow?.postMessage({
              type: 'RENDER_HWP',
              buffer: buffer
            }, '*', [buffer]);
          })
          .catch(err => {
            console.error('HWP QuickLook 데이터 로드 실패:', err);
            this.quickLook.loading = false;
            this.cdr.detectChanges();
          });
      }

      // 뷰어 스케일링 완료 시 로딩 종료
      if (event.data && event.data.type === 'HWP_SCALED') {
        this.quickLook.loading = false;
        this.cdr.detectChanges();
        window.removeEventListener('message', messageHandler);
      }
    };

    window.addEventListener('message', messageHandler);

    // 컴포넌트 파괴나 다른 파일 선택 시 리스너 제거가 필요할 수 있으나, 
    // 여기서는 HWP_SCALED 수신 시 제거되도록 처리함.
  }

  async renderWordInQuickLook(retryCount = 0) {
    if (!this.quickLook.file || !this.quickLook.content) return;

    const container = document.getElementById('quick-look-word-container');
    if (!container) {
      if (retryCount < 10) {
        setTimeout(() => this.renderWordInQuickLook(retryCount + 1), 50);
      }
      return;
    }

    try {
      const res = await fetch(this.quickLook.content);
      const buffer = await res.arrayBuffer();
      container.innerHTML = '';

      await renderAsync(buffer, container, undefined, {
        inWrapper: false,
        ignoreHeight: false,
        ignoreWidth: false,
      });

      // 표준 A4 너비(816px) 기준으로 고정 스케일 적용 (300 / 816 ≈ 0.367)
      const targetWidth = 300;
      const baseWidth = 816;
      const scale = targetWidth / baseWidth;

      container.style.transform = `scale(${scale})`;
      container.style.transformOrigin = 'top left';
      container.style.width = `${baseWidth}px`; // 명시적 너비 지정
      container.style.minWidth = `${baseWidth}px`;

      // 스케일링 완료 후 로딩 종료 및 감지
      this.quickLook.loading = false;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Word QuickLook 렌더링 실패:', err);
    } finally {
      this.quickLook.loading = false;
      this.cdr.detectChanges();
    }
  }

  // 엑셀 스케일링 처리 (너비가 300px를 넘을 경우 비례 축소)
  formatExcelScaling() {
    const container = document.querySelector('.preview-excel') as HTMLElement;
    if (!container) return;

    const table = container.querySelector('table');
    if (!table) {
      // 최대 10번까지만 재시도 (약 0.5초)
      const retryCount = (container as any)._retryCount || 0;
      if (retryCount < 10) {
        (container as any)._retryCount = retryCount + 1;
        setTimeout(() => this.formatExcelScaling(), 50);
      } else {
        this.quickLook.loading = false;
        this.cdr.detectChanges();
      }
      return;
    }

    const targetWidth = 300;
    const currentWidth = table.offsetWidth;

    if (currentWidth > targetWidth) {
      const scale = targetWidth / currentWidth;
      container.style.transform = `scale(${scale})`;
      container.style.transformOrigin = 'top left';
      container.style.width = `${100 / scale}%`;
    }

    // 로딩 종료
    this.quickLook.loading = false;
    this.cdr.detectChanges();
  }

  closeQuickLook() {
    this.quickLook.visible = false;
    this.quickLook.file = null;
    this.quickLook.content = null;
    this.quickLook.sheets = [];
  }

  private endDesktopDrag(allowContextMenu: boolean) {
    if (!this.isDragging) return;

    const wasRightClickDrag = this.isRightClickDrag;
    this.isDragging = false;
    this.desktopStateService.setIsDragging(false);
    this.isRightClickDrag = false;
    this.desktopRect = null;

    // 우클릭으로 컨텍스트 메뉴를 열 때는 선택을 유지
    if (this.selectionBox.width < 10 && this.selectionBox.height < 10 && !wasRightClickDrag) {
      this.selectedFolders.clear();
    }

    if (allowContextMenu && wasRightClickDrag && this.pendingRightClickInfo) {
      const desktopContent = this.desktopRect ?? this.getDesktopRect();
      if (!desktopContent) return;

      this.contextMenuTarget = this.pendingRightClickInfo.target;
      // 우클릭한 항목이 선택되어 있지 않으면 선택에 추가
      if (this.contextMenuTarget && !this.selectedFolders.has(this.contextMenuTarget.uuid)) {
        this.selectedFolders.add(this.contextMenuTarget.uuid);
      }
      this.contextMenu = {
        visible: true,
        x: this.pendingRightClickInfo.x,
        y: this.pendingRightClickInfo.y,
      };
      this.pendingRightClickInfo = null;
    } else if (!allowContextMenu) {
      this.pendingRightClickInfo = null;
    }
  }

  /**
   * 아이콘 마우스 다운: 파일/폴더 선택 처리
   */
  onIconMouseDown(event: MouseEvent, file: Abstract_File) {
    event.stopPropagation();

    // 바탕화면 아이콘 클릭 시 모든 창 포커스 해제
    this.deactivateAllWindows();

    if (event.ctrlKey || event.metaKey) {
      // 다중 선택
      if (this.selectedFolders.has(file.uuid)) {
        this.selectedFolders.delete(file.uuid);
      } else {
        this.selectedFolders.add(file.uuid);
      }
    } else if (
      this.selectedFolders.has(file.uuid) &&
      this.selectedFolders.size > 1
    ) {
      // 다중 선택된 상태에서 클릭한 항목이 포함되어 있으면 선택 유지
      return;
    } else {
      // 단일 선택
      this.selectedFolders.clear();
      this.selectedFolders.add(file.uuid);
    }

    // 키보드 탐색을 위해 마지막 선택 항목 정보 업데이트
    this.lastSelectedUuid = file.uuid;
  }

  onIconMouseEnter(file: Abstract_File) {
    if (this.isDragging || this.isDraggingSelectedItems || this.renamingFile) return;

    // 키보드로 열린 Quick Look이 있으면 호버 무시
    if (this.desktopStateService.isKeyboardQuickLookActive()) return;

    // 폴더는 호버 시 Quick Look 표시 안 함
    if (file.type === 'folder') return;

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    this.hoverTimeout = setTimeout(() => {
      const folderElement = document.querySelector(`[data-folder-uuid="${file.uuid}"]`);
      let x = 0, y = 0;
      if (folderElement) {
        const iconWrapper = folderElement.querySelector('.icon-wrapper');
        const rect = (iconWrapper || folderElement).getBoundingClientRect();
        x = rect.right + 10;
        y = rect.top;
      }
      this.desktopStateService.openQuickLook(file, x, y, 'hover');
    }, 0);
  }

  onIconMouseLeave(file: Abstract_File) {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.desktopStateService.closeQuickLook();
  }

  /**
   * 선택된 폴더 업데이트: 드래그 박스와 겹치는 아이콘들을 선택 상태로 변경
   */
  updateSelectedFolders() {
    const desktopIcons = document.querySelectorAll('.desktop-icon');
    const desktopContent = document.querySelector('.desktop-content');

    if (!desktopContent) return;

    const desktopRect = desktopContent.getBoundingClientRect();

    // 현재 프레임에서 박스 안에 있는 항목들 계산
    const currentInBox = new Set<string>();

    // 여유 공간 설정
    const paddingX = 0; // 좌우 각 40px
    const paddingY = 0; // 상하 각 50px

    desktopIcons.forEach((icon) => {
      const rect = icon.getBoundingClientRect();

      // 아이콘의 경계를 데스크탑 좌표계로 변환
      const iconLeft = rect.left - desktopRect.left;
      const iconRight = rect.right - desktopRect.left;
      const iconTop = rect.top - desktopRect.top;
      const iconBottom = rect.bottom - desktopRect.top;

      // 여유 공간을 추가한 확장 영역 계산
      const expandedLeft = iconLeft - paddingX;
      const expandedRight = iconRight + paddingX;
      const expandedTop = iconTop - paddingY;
      const expandedBottom = iconBottom + paddingY;

      // selectionBox의 경계
      const boxLeft = this.selectionBox.x;
      const boxRight = this.selectionBox.x + this.selectionBox.width;
      const boxTop = this.selectionBox.y;
      const boxBottom = this.selectionBox.y + this.selectionBox.height;

      // 확장된 아이콘 영역과 selectionBox가 겹치는지 확인
      if (
        boxLeft <= expandedRight &&
        boxRight >= expandedLeft &&
        boxTop <= expandedBottom &&
        boxBottom >= expandedTop
      ) {
        const folderUuid = icon.getAttribute('data-folder-uuid');
        if (folderUuid) {
          currentInBox.add(folderUuid);
        }
      }
    });

    if (this.isCtrlDrag) {
      // Ctrl 드래그: (시작 상태) XOR (현재 박스 안 항목)
      // 1. 모든 항목을 시작 상태로 초기화
      this.selectedFolders = new Set(this.initialSelectedFolders);

      // 2. 박스 안에 있는 항목들은 반전(Toggle)
      currentInBox.forEach(uuid => {
        if (this.initialSelectedFolders.has(uuid)) {
          this.selectedFolders.delete(uuid);
        } else {
          this.selectedFolders.add(uuid);
        }
      });
    } else {
      // 일반 드래그: 현재 박스 안 항목만 선택
      this.selectedFolders = currentInBox;
    }

    // 드래그 박스로 선택된 항목 중 하나를 키보드 탐색의 기준점으로 설정
    if (this.selectedFolders.size > 0) {
      const selectedList = Array.from(this.selectedFolders);
      this.lastSelectedUuid = selectedList[selectedList.length - 1];
    } else {
      this.lastSelectedUuid = null;
    }
  }

  /**
   * 폴더 선택 여부 확인
   */
  isFolderSelected(file: Abstract_File): boolean {
    return this.selectedFolders.has(file.uuid);
  }

  /**
   * 선택된 항목 드래그 시작
   */
  onSelectedItemsDragStart(event: DragEvent, file: Abstract_File) {
    if (this.renamingFile?.uuid === file.uuid) {
      event.preventDefault();
      return;
    }
    if (this.dragPreviewFadeTimeout !== null) {
      window.clearTimeout(this.dragPreviewFadeTimeout);
      this.dragPreviewFadeTimeout = null;
    }

    if (this.selectedFolders.size === 0) {
      this.selectedFolders.add(file.uuid);
    } else if (!this.selectedFolders.has(file.uuid)) {
      if (event.ctrlKey || event.metaKey) {
        this.selectedFolders.add(file.uuid);
        this.lastSelectedUuid = file.uuid;
      } else {
        this.selectedFolders.clear();
        this.selectedFolders.add(file.uuid);
        this.lastSelectedUuid = file.uuid;
      }
    }

    // 선택된 항목들 가져오기
    const selectedItems = this.desktopFolders.filter((file) =>
      this.selectedFolders.has(file.uuid)
    );

    if (selectedItems.length === 0) {
      event.preventDefault();
      return;
    }

    this.isDraggingSelectedItems = true;
    this.dragPreview.items = selectedItems;
    this.dragPreview.fading = false;
    this.dragPreview.visible = true;

    // Task 1: 전역 서비스에 드래그 아이템 및 소스 정보 주입 (바탕화면 프리뷰 공유)
    this.desktopStateService.setDragPreview({
      items: selectedItems,
      fading: false,
      visible: true,
      source: 'desktop'
    });

    // 드래그 데이터 설정
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      // 선택된 항목들의 경로를 전달 (JSON)
      const paths = selectedItems.map((f) => f.file_path);
      event.dataTransfer.setData('application/json', JSON.stringify(paths));

      // 브라우저 기본 드래그 이미지를 숨김
      event.dataTransfer.setDragImage(this.transparentDragImage, 0, 0);
    }
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
      // 유효한 좌표일 때만 업데이트 (0, 0은 무시)
      // 프리뷰 위치 업데이트 (마우스를 따라다니는 커스텀 프리뷰)
      this.dragPreview.x = event.clientX;
      this.dragPreview.y = event.clientY;
    }
  }

  /**
   * 선택된 항목 드래그 종료
   */
  onSelectedItemsDragEnd(event: DragEvent) {
    if (!this.isDraggingSelectedItems) return;
    console.log('onSelectedItemsDragEnd');
    this.stopDraggingSelectedItems();
  }

  /**
   * 키보드 방향키를 통한 아이콘 탐색 처리
   */
  private handleKeyboardNavigation(key: string) {
    // 1. 활성화된 탐색기 창이 있는지 확인하여 이벤트 위임
    const activeExplorer = this.fileExplorers.find(fe => fe.isActive);
    if (activeExplorer) {
      activeExplorer.handleKeyboardNavigation(key);
      return;
    }

    // 2. 바탕화면 아이콘 탐색
    if (this.desktopFolders.length === 0) return;

    let currentIndex = -1;

    // 다중 선택 상태인 경우, 방향에 따라 기준점(minIndex 또는 maxIndex)을 다르게 설정
    if (this.selectedFolders.size > 1) {
      const selectedIndices = Array.from(this.selectedFolders)
        .map(uuid => this.desktopFolders.findIndex(f => f.uuid === uuid))
        .filter(index => index !== -1)
        .sort((a, b) => a - b);

      if (selectedIndices.length > 0) {
        if (key === 'ArrowUp' || key === 'ArrowLeft') {
          currentIndex = selectedIndices[0]; // 가장 상단/좌측 아이템 기준
        } else {
          currentIndex = selectedIndices[selectedIndices.length - 1]; // 가장 하단/우측 아이템 기준
        }
      }
    } else if (this.lastSelectedUuid) {
      currentIndex = this.desktopFolders.findIndex(f => f.uuid === this.lastSelectedUuid);
    }

    // 현재 인덱스를 찾을 수 없으면 첫 번째 항목 선택
    if (currentIndex === -1) {
      const firstFile = this.desktopFolders[0];
      this.selectedFolders.clear();
      this.selectedFolders.add(firstFile.uuid);
      this.lastSelectedUuid = firstFile.uuid;
      this.cdr.detectChanges();
      return;
    }

    let newIndex = currentIndex;
    const itemsPerColumn = this.calculateItemsPerColumn();

    switch (key) {
      case 'ArrowDown':
        newIndex = currentIndex < this.desktopFolders.length - 1 ? currentIndex + 1 : currentIndex;
        break;
      case 'ArrowUp':
        newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
        break;
      case 'ArrowRight':
        if (itemsPerColumn > 0) {
          const target = currentIndex + itemsPerColumn;
          if (target < this.desktopFolders.length) {
            newIndex = target;
          }
        }
        break;
      case 'ArrowLeft':
        if (itemsPerColumn > 0) {
          const target = currentIndex - itemsPerColumn;
          if (target >= 0) {
            newIndex = target;
          }
        }
        break;
    }

    if (newIndex !== currentIndex) {
      const nextFile = this.desktopFolders[newIndex];
      this.selectedFolders.clear();
      this.selectedFolders.add(nextFile.uuid);
      this.lastSelectedUuid = nextFile.uuid;
      this.cdr.detectChanges();
    }
  }

  /**
   * 데스크탑 아이콘의 열 당 아이템 개수 계산
   * flex-direction: column wrap 레이아웃 기준
   */
  private calculateItemsPerColumn(): number {
    const iconElements = document.querySelectorAll('.desktop-icon');
    if (iconElements.length < 2) return 0;

    const firstIcon = iconElements[0] as HTMLElement;
    const firstLeft = firstIcon.offsetLeft;

    for (let i = 1; i < iconElements.length; i++) {
      const icon = iconElements[i] as HTMLElement;
      if (icon.offsetLeft > firstLeft) {
        return i; // 첫 번째 열의 아이템 개수
      }
    }

    // 모든 아이콘이 한 열에 있는 경우
    return iconElements.length;
  }

  /**
   * 폴더 아이콘 드래그 오버 (드롭 가능 영역)
   */
  onFolderIconDragOver(event: DragEvent, folder: Abstract_File) {
    if (folder.type !== 'folder') return;

    event.preventDefault();
    event.stopPropagation();

    // 전역 상태 서비스에서 드래그 중인 아이템들 가져오기 (Desktop/Explorer 공용)
    const dragPreview = this.desktopStateService.getDragPreview();
    const draggedItems = dragPreview.items;

    if (draggedItems.length > 0) {
      const canDrop = this.canDropItemsToFolder(draggedItems, folder);

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
      }

      this.dragOverFolder = folder;
      this.dragOverFolderCanDrop = canDrop;
      return;
    }

    // 전역 상태가 없는데 application/json은 있는 경우 (외부 앱 등에서의 드래그 대비 fallback)
    const hasApplicationJson = event.dataTransfer?.types?.includes('application/json');
    if (hasApplicationJson) {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
      this.dragOverFolder = folder;
      this.dragOverFolderCanDrop = true;
      return;
    }
  }

  /**
   * 폴더 아이콘 드래그 리브 (드롭 영역 벗어남)
   */
  onFolderIconDragLeave(event: DragEvent) {
    // 자식 요소로 이동하는 경우는 무시
    const target = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;

    if (!currentTarget.contains(target)) {
      this.dragOverFolder = null;
      this.dragOverFolderCanDrop = false;
    }
  }

  /**
   * 폴더 아이콘 드롭 (선택된 항목들을 폴더에 넣기)
   */
  onFolderIconDrop(event: DragEvent, targetFolder: Abstract_File) {
    event.preventDefault();
    event.stopPropagation();

    // File Explorer에서 드래그된 경우 (application/json)
    const jsonStr = event.dataTransfer?.getData('application/json');
    if (jsonStr && targetFolder.type === 'folder') {
      try {
        const paths = JSON.parse(jsonStr);
        console.log('File Explorer에서 드래그된 항목들:', paths);

        // paths를 사용하여 파일을 찾아서 이동
        const itemsToMove: Abstract_File[] = [];

        // 1. 먼저 desktopFolders에서 찾기 (바탕화면 폴더인 경우)
        paths.forEach((path: string) => {
          const file = this.desktopFolders.find(f => f.file_path === path);
          if (file && !itemsToMove.find(f => f.uuid === file.uuid)) {
            itemsToMove.push(file);
          }
        });

        // 2. 모든 file-explorer에서 파일 찾기
        this.fileExplorers.forEach(explorer => {
          // selectedFolder의 children에서 직접 찾기 (더 정확함)
          const selectedFolder = explorer.selectedFolder;
          if (selectedFolder && selectedFolder.children) {
            paths.forEach((path: string) => {
              const file = selectedFolder.children.find((f: Abstract_File) => f.file_path === path);
              if (file && !itemsToMove.find(f => f.uuid === file.uuid)) {
                itemsToMove.push(file);
              }
            });
          }

          // getAllFilesFromExplorer로도 시도 (재귀적으로 모든 파일 검색)
          const allFiles = this.getAllFilesFromExplorer(explorer);
          paths.forEach((path: string) => {
            const file = allFiles.find(f => f.file_path === path);
            if (file && !itemsToMove.find(f => f.uuid === file.uuid)) {
              itemsToMove.push(file);
            }
          });
        });

        console.log('찾은 항목들:', itemsToMove);

        if (itemsToMove.length > 0) {
          const canDrop = this.canDropItemsToFolder(itemsToMove, targetFolder);
          console.log('드롭 가능 여부:', canDrop);
          if (canDrop) {
            this.moveItemsToFolder(itemsToMove, targetFolder);
          }
        } else {
          console.warn('이동할 항목을 찾을 수 없습니다:', paths);
        }
      } catch (e) {
        console.error('Failed to parse drop data (json)', e);
      }
      return;
    }

    // Desktop에서 선택된 항목을 드래그하는 경우
    if (this.isDraggingSelectedItems && targetFolder.type === 'folder') {
      const selectedItems = this.dragPreview.items;

      if (selectedItems.length > 0) {
        // 자기 자신을 자신의 폴더에 넣는 것 방지
        const canDrop = this.canDropItemsToFolder(selectedItems, targetFolder);

        if (!canDrop) {
          this.stopDraggingSelectedItems();
          return;
        }

        // 선택된 항목들을 대상 폴더로 이동
        this.moveItemsToFolder(selectedItems, targetFolder);
      }

      this.stopDraggingSelectedItems();
    }
  }

  /**
   * File Explorer에서 모든 파일 가져오기 (재귀적으로)
   */
  private getAllFilesFromExplorer(explorer: any): Abstract_File[] {
    const files: Abstract_File[] = [];

    const collectFiles = (folder: Abstract_File) => {
      if (folder.children) {
        folder.children.forEach(child => {
          files.push(child);
          if (child.type === 'folder' && child.children) {
            collectFiles(child);
          }
        });
      }
    };

    if (explorer.selectedFolder) {
      collectFiles(explorer.selectedFolder);
    }
    if (explorer.rootFolder) {
      collectFiles(explorer.rootFolder);
    }

    return files;
  }

  /**
   * FileExplorer에서 발생한 파일 이동 이벤트 처리
   */
  onExplorerFileMove(event: { target: Abstract_File; items?: Abstract_File[]; paths?: string[]; source: 'desktop' | 'explorer'; sourceParentId?: number }) {
    // Desktop에서 드래그된 경우
    if (event.source === 'desktop' && this.isDraggingSelectedItems) {
      const selectedItems = this.dragPreview.items;
      if (selectedItems.length > 0) {
        const canDrop = this.canDropItemsToFolder(selectedItems, event.target);
        if (canDrop) {
          this.moveItemsToFolder(selectedItems, event.target, event.sourceParentId);
        }
      }
      this.stopDraggingSelectedItems();
    }
    // 다른 Explorer나 내부에서 드래그된 경우
    else if (event.source === 'explorer' && event.items && event.items.length > 0) {
      const canDrop = this.canDropItemsToFolder(event.items, event.target);
      if (canDrop) {
        this.moveItemsToFolder(event.items, event.target, event.sourceParentId);
      }
    }
  }

  /**
   * FileExplorer에서 발생한 파일 업로드 이벤트 처리 (OS에서 드래그 앤 드롭)
   */
  onExplorerFileUpload(event: { files: File[]; folderId: number }) {
    this.uploadFiles(event.files, event.folderId);
  }

  @HostListener('document:dragend', ['$event'])
  onDocumentDragEnd(event: DragEvent) {
    if (!this.isDraggingSelectedItems) return;
    this.stopDraggingSelectedItems();
  }

  @HostListener('document:dragover', ['$event'])
  onDocumentDragOver(event: DragEvent) {
    if (this.isDraggingSelectedItems) {
      event.preventDefault();
    }
  }

  @HostListener('document:drop', ['$event'])
  onDocumentDrop(event: DragEvent) {
    if (!this.isDraggingSelectedItems) return;
    this.stopDraggingSelectedItems();
  }

  private stopDraggingSelectedItems() {
    this.isDraggingSelectedItems = false;

    // 즉시 프리뷰 초기화 (지연 시간 0ms)
    this.dragPreview.items = [];
    this.dragPreview.visible = false;
    this.dragPreview.fading = false;
    this.dragPreview.x = -500;
    this.dragPreview.y = -500;

    // 예약된 타이머가 있다면 취소
    if (this.dragPreviewFadeTimeout) {
      window.clearTimeout(this.dragPreviewFadeTimeout);
      this.dragPreviewFadeTimeout = null;
    }

    this.dragOverFolder = null;
    this.dragOverFolderCanDrop = false;

    this.cdr.detectChanges();
  }

  /**
   * 항목들을 폴더에 드롭할 수 있는지 확인
   * 자기 자신을 자신의 폴더에 넣는 것을 방지
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
      // 1. 자기 자신을 자신의 폴더에 넣는 경우 방지 (Self Move)
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
      // 이 경우에만 경로 비교가 효율적이므로 유지
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
   * 선택된 항목들을 폴더로 이동 (Desktop 및 FileExplorer 공용)
   */
  moveItemsToFolder(
    items: Abstract_File[],
    targetFolder: Abstract_File,
    sourceParentId?: number
  ) {
    if (!targetFolder.uuid && targetFolder.uuid !== '') {
      console.error('대상 폴더의 UUID를 찾을 수 없습니다.');
      return;
    }

    const targetFolderId = targetFolder.folder_id || 0;

    // 로컬 이동 시뮬레이션
    items.forEach(item => {
      // 1. 기존 부모에서 제거 (바탕화면인 경우)
      this.desktopFolders = this.desktopFolders.filter(f => f.uuid !== item.uuid);

      // 2. 다른 폴더 검색 및 제거 (필요시)
      // 실제로는 tree 구조이므로 재귀적으로 제거가 필요할 수 있음

      // 3. 대상 폴더에 추가
      if (!targetFolder.children) targetFolder.children = [];

      // 중복 체크
      if (!targetFolder.children.some(c => c.uuid === item.uuid)) {
        item.folder_id = targetFolderId;
        // 경로 업데이트
        const oldPath = item.file_path;
        const newPath = `${targetFolder.file_path}/${item.file_name}`;
        item.file_path = newPath;

        targetFolder.children.push(item);
      }
    });

    // 바탕화면에 드롭된 경우
    if (targetFolder.file_path === '/desktop') {
      items.forEach(item => {
        if (!this.desktopFolders.some(f => f.uuid === item.uuid)) {
          this.desktopFolders.push(item);
        }
      });
    }

    this.initializeIconCoordinates(true);
    this.selectedFolders.clear();
    this.desktopStateService.clearDragPreview();
    this.toast.success(`${items.length}개 항목이 이동되었습니다.`);
    this.cdr.detectChanges();
  }

  /**
   * 선택된 항목들을 폴더로 복사 (Desktop 및 FileExplorer 공용)
   */
  copyItemsToFolder(
    items: Abstract_File[],
    targetFolder: Abstract_File
  ) {
    if (!targetFolder.uuid && targetFolder.uuid !== '') {
      console.error('대상 폴더의 UUID를 찾을 수 없습니다.');
      return;
    }

    const targetFolderId = targetFolder.folder_id || 0;

    // 로컬 복사 시뮬레이션
    items.forEach(item => {
      // 깊은 복사
      const clonedItem = JSON.parse(JSON.stringify(item)) as Abstract_File;
      clonedItem.uuid = `local-copy-${Date.now()}-${Math.random()}`;
      clonedItem.file_name = `사본 - ${item.file_name}`;
      clonedItem.file_path = `${targetFolder.file_path}/${clonedItem.file_name}`;
      clonedItem.folder_id = targetFolderId;
      clonedItem.file_created_at = new Date();
      clonedItem.file_updated_at = new Date();

      if (!targetFolder.children) targetFolder.children = [];
      targetFolder.children.push(clonedItem);

      if (targetFolder.file_path === '/desktop') {
        this.desktopFolders.push(clonedItem);
      }
    });

    this.initializeIconCoordinates(true);
    this.toast.success(`${items.length}개 항목이 복사되었습니다.`);
    this.cdr.detectChanges();
  }

  /**
   * 다음 z-index 값 반환
   */
  getNextZIndex(): number {
    return this.windowService.getNextZIndex();
  }

  /**
   * 기본 윈도우 너비 계산 (화면 너비의 60%)
   */
  getDefaultWindowWidth(): number {
    const desktopContent = document.querySelector('.desktop-content');
    if (desktopContent) {
      return Math.floor(desktopContent.clientWidth * 0.6);
    }
    return 1000;
  }

  /**
   * 기본 윈도우 높이 계산 (화면 높이의 60%)
   */
  getDefaultWindowHeight(): number {
    return Math.floor(window.innerHeight * 0.6);
  }

  /**
   * 작업 표시줄 앱 클릭 처리
   */
  onAppClick(appId: string) {
    this.taskbarApps = this.taskbarApps.map((app) => ({
      ...app,
      isActive: app.id === appId,
    }));

    if (appId === 'explorer') {
      this.openFileExplorer();
    }
  }

  /**
   * 시작 메뉴 앱 클릭 처리
   */
  onStartMenuAppClick(appId: string) {
    if (appId === 'explorer') {
      this.openFileExplorer();
    } else {
      this.openNewWindow({
        id: `window-${Date.now()}`,
        title: appId,
        color: '#FBBF24',
        type: 'default',
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width: this.getDefaultWindowWidth(),
        height: this.getDefaultWindowHeight(),
        zIndex: this.getNextZIndex(),
      });
    }
  }

  /**
   * 텍스트 윈도우 열기
   */
  private openTextWindow(file: Abstract_File) {
    this.openNewWindow({
      id: `text-${Date.now()}`,
      title: file.file_name,
      color: '#FBBF24',
      type: 'text',
      file: file,
      x: 200 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: this.getDefaultWindowWidth(),
      height: this.getDefaultWindowHeight(),
      wordWrap: true,
      fontFamily: 'Consolas',
      fontSize: 14,
      fontWeight: 'normal',
      fontStyle: 'normal',
      zoomLevel: 1.0,
      showStatusBar: true,
      cursorPos: { ln: 1, col: 1 },
      zIndex: this.getNextZIndex(),
      icon: '/assets/icons/primary/png/text.png',
    });
  }

  /**
   * 폴더/파일 윈도우 열기
   */
  openFolderWindow(file: Abstract_File, options?: { isMaximized?: boolean }) {
    this.hideContextMenu();

    // 중복 체크: 이미 열린 창이 있는지 확인
    const existingWindow = this.windows.find(w =>
      (w.file?.uuid === file.uuid) ||
      (w.folder?.uuid === file.uuid && file.type === 'folder')
    );

    if (existingWindow) {
      this.focusWindow(existingWindow.id);
      return;
    }

    if (file.type === 'folder') {
      // 폴더 내용 로드 (창 열 때 최신 데이터 가져오기)
      this.refreshFolder(file);

      this.openNewWindow({
        id: `explorer-${Date.now()}`,
        title: file.file_name,
        color: file.extension_info.getColorCode() || '#FBBF24',
        type: 'explorer',
        folder: file,
        x: 200 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width: this.getDefaultWindowWidth(),
        height: this.getDefaultWindowHeight(),
        zIndex: this.getNextZIndex(),
      });
      return;
    }

    // 지원하지 않는 파일 형식 체크 (이미지, 텍스트, PDF, 오디오, 비디오, psd, ai, office, code, excel, hwp 등은 제외)
    // 단, 포트폴리오.html은 예외 처리
    if (file.file_name === '포트폴리오.html') {
      this.openNewWindow({
        id: `portfolio-${Date.now()}`,
        title: '포트폴리오',
        color: '#FBBF24',
        type: 'portfolio',
        file: file,
        icon: '/assets/icons/files/png/html.png',
        x: 100,
        y: 50,
        width: 1200,
        height: 800,
        zIndex: this.getNextZIndex(),
        isMaximized: options?.isMaximized,
      });
      return;
    }

    const viewType = file.extension_info.view_type;
    const color = file.extension_info.getColorCode() || '#FBBF24';
    const icon = file.extension_info.img_path;

    switch (viewType) {
      case 'image':
        this.openNewWindow({
          id: `image-${Date.now()}`,
          title: file.file_name,
          color,
          type: 'image',
          file,
          icon: '/assets/icons/primary/png/image.png',
          x: 200 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          width: this.getDefaultWindowWidth(),
          height: this.getDefaultWindowHeight(),
          zIndex: this.getNextZIndex(),
        });
        break;

      case 'psd':
      case 'ai':
        this.openNewWindow({
          id: `${viewType}-${Date.now()}`,
          title: file.file_name,
          color,
          type: viewType as any,
          file,
          icon,
          x: 200 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          width: this.getDefaultWindowWidth(),
          height: this.getDefaultWindowHeight(),
          zIndex: this.getNextZIndex(),
        });
        if (viewType === 'psd') {
          setTimeout(() => {
            const win = this.windows.find(w => w.file?.uuid === file.uuid && w.type === 'psd');
            if (win) this.loadPSDPreview(win);
          }, 100);
        }
        break;

      case 'excel':
        this.openNewWindow({
          id: `excel-${Date.now()}`,
          title: file.file_name,
          color: color || '#217346',
          type: 'excel',
          file,
          icon,
          x: 200 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          width: this.getDefaultWindowWidth(),
          height: this.getDefaultWindowHeight(),
          zIndex: this.getNextZIndex(),
        });
        setTimeout(() => {
          const win = this.windows.find(w => w.file?.uuid === file.uuid && w.type === 'excel');
          if (win) this.loadExcelPreview(win);
        }, 100);
        break;

      case 'word':
        this.openNewWindow({
          id: `word-${Date.now()}`,
          title: file.file_name,
          color: color || '#2b579a',
          type: 'word',
          file,
          icon,
          x: 200 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          width: this.getDefaultWindowWidth(),
          height: this.getDefaultWindowHeight(),
          zIndex: this.getNextZIndex(),
        });
        setTimeout(() => {
          const win = this.windows.find(w => w.file?.uuid === file.uuid && w.type === 'word');
          if (win) this.loadWordPreview(win);
        }, 100);
        break;

      case 'hwp':
        this.openNewWindow({
          id: `hwp-${Date.now()}`,
          title: file.file_name,
          color: '#3182f5',
          type: 'hwp',
          file,
          icon,
          x: 200 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          width: this.getDefaultWindowWidth(),
          height: this.getDefaultWindowHeight(),
          zIndex: this.getNextZIndex(),
        });
        setTimeout(() => {
          const win = this.windows.find(w => w.file?.uuid === file.uuid && w.type === 'hwp');
          if (win) this.loadHwpPreview(win);
        }, 100);
        break;

      case 'code':
      case 'html':
      case 'text':
        // 클릭 즉시 창을 먼저 띄워 사용자 피드백 제공 (선 오픈 후 로드)
        const windowId = `${viewType}-${Date.now()}`;
        const initialClonedFile = {
          ...file,
          extension_info: { ...file.extension_info }
        } as Abstract_File;

        if (viewType === 'text') {
          this.openTextWindow(initialClonedFile);
        } else {
          this.openNewWindow({
            id: windowId,
            title: file.file_name,
            color: viewType === 'html' ? '#E44D26' : '#34495e',
            type: viewType as any,
            file: initialClonedFile,
            icon: viewType === 'html' ? '/assets/icons/files/png/빈문서.png' : icon,
            x: 200 + Math.random() * 200,
            y: 100 + Math.random() * 200,
            width: this.getDefaultWindowWidth(),
            height: this.getDefaultWindowHeight(),
            zIndex: this.getNextZIndex(),
            isMaximized: options?.isMaximized,
          });
        }

        // 비동기 내용 로드
        if (file.file_path) {
          const url = this.getFileUrl(file);
          this.http.get(url, { responseType: 'text' }).pipe(first()).subscribe({
            next: (content) => {
              // HTML 파일인 경우 base URL 주입 (상대 경로 리소스 지원)
              if (viewType === 'html') {
                const relativePath = url.substring(0, url.lastIndexOf('/') + 1);
                // iframe srcdoc 환경에서도 정확한 경로를 찾을 수 있도록 Origin을 포함한 절대 경로 사용
                const origin = window.location.origin;
                const absoluteBaseUrl = `${origin}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
                const baseTag = `<base href="${absoluteBaseUrl}">`;

                if (content.includes('<head>')) {
                  content = content.replace('<head>', `<head>${baseTag}`);
                } else if (content.includes('<html>')) {
                  content = content.replace('<html>', `<html><head>${baseTag}</head>`);
                } else {
                  content = `${baseTag}${content}`;
                }

                // <title> 태그 추출하여 윈도우 제목 업데이트
                const titleMatch = content.match(/<title>(.*?)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                  const tempTitle = titleMatch[1].trim();
                  // HTML 엔티티 디코딩을 위해 DOMParser 사용
                  const doc = new DOMParser().parseFromString(tempTitle, 'text/html');
                  const decodedTitle = doc.body.textContent || tempTitle;

                  // 윈도우 찾아서 제목 업데이트
                  const win = this.windows.find(w => w.id === windowId);
                  if (win) {
                    win.title = decodedTitle;
                  }
                }
              }
              // 윈도우 인스턴스 찾아서 내용 업데이트
              const targetWinId = viewType === 'text' ? this.windows.find(w => w.file?.uuid === file.uuid && w.type === 'text')?.id : windowId;
              if (targetWinId) {
                const updateData: any = {};
                // file 객체 내부의 text 프로퍼티 업데이트
                const win = this.windows.find(w => w.id === targetWinId);
                if (win && win.file) {
                  win.file.extension_info.text = content;
                  // UI 업데이트 트리거 (필요시)
                  this.cdr.markForCheck();
                }
              }
            },
            error: (err) => {
              console.error(`${viewType} 내용 로드 오류:`, err);
              this.toast.error('파일 내용을 불러올 수 없습니다.');
            }
          });
        }
        break;

      case 'pdf':
        this.openNewWindow({
          id: `pdf-${Date.now()}`,
          title: file.file_name,
          color: '#D91E18',
          type: 'pdf',
          file,
          x: 200 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          width: this.getDefaultWindowWidth(),
          height: this.getDefaultWindowHeight(),
          zIndex: this.getNextZIndex(),
        });
        break;

      case 'audio':
        this.openNewWindow({
          id: `audio-${Date.now()}`,
          title: file.file_name,
          color: '#8B5CF6',
          type: 'audio',
          file,
          icon: '/assets/icons/primary/png/audio.png',
          x: 200 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          width: 400,
          height: 450,
          zIndex: this.getNextZIndex(),
        });
        break;

      default:
        this.openNewWindow({
          id: `unsupported-${Date.now()}`,
          title: file.file_name,
          color: '#999',
          type: 'unsupported',
          file,
          x: 200 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          width: this.getDefaultWindowWidth(),
          height: this.getDefaultWindowHeight(),
          zIndex: this.getNextZIndex(),
        });
    }
  }

  /**
   * 파일 탐색기 열기
   */
  openFileExplorer() {
    const desktopFolder = new Model_Folder('', '바탕 화면', '/desktop', 0);
    desktopFolder.folder_id = 0;
    desktopFolder.children = [...this.desktopFolders];
    this.openFolderWindow(desktopFolder);
  }

  /**
   * 타일 클릭 처리
   */
  onTileClick(tileId: string) {
    // TODO: 타일 클릭 로직 구현
  }

  /**
   * 새 윈도우 열기
   */
  openNewWindow(window: WindowInstance) {
    window.isActive = true;
    window.isNew = true;
    this.windows.forEach((w) => (w.isActive = false));
    this.windows.push(window);

    // 바탕화면 아이콘 선택 해제
    this.selectedFolders.clear();

    // 애니메이션 완료 후 isNew 플래그 제거
    setTimeout(() => {
      const w = this.windows.find((w) => w.id === window.id);
      if (w) {
        w.isNew = false;
      }
    }, 300);
  }

  /**
   * 윈도우 포커스
   */
  focusWindow(windowId: string) {
    this.windowService.focusWindow(windowId);
    this.propertiesWindowIsActive = false;

    // 바탕화면 아이콘 선택 해제
    this.selectedFolders.clear();
    this.lastSelectedUuid = null;
  }

  /**
   * 모든 윈도우 포커스 해제
   */
  deactivateAllWindows() {
    this.windowService.deactivateAllWindows();
    this.propertiesWindowIsActive = false;
  }

  blurAllWindows() {
    this.windowService.deactivateAllWindows();
    this.propertiesWindowIsActive = false;
  }

  /**
   * 윈도우 닫기
   */
  closeWindow(windowId: string) {
    this.windowService.closeWindow(windowId);
  }

  /**
   * 윈도우 최소화
   */
  minimizeWindow(windowId: string) {
    const window = this.windows.find((w) => w.id === windowId);
    if (window) {
      window.isMinimizing = true;
      setTimeout(() => {
        window.isMinimizing = false;
        window.isMinimized = true;
      }, 500); // 0.5s 애니메이션 시간과 일치
    }
  }

  /**
   * 윈도우 최대화/복원
   */
  maximizeWindow(windowId: string, isMaximized: boolean) {
    const window = this.windows.find((w) => w.id === windowId);
    if (window && isMaximized) {
      window.zIndex = this.getNextZIndex();
    }
  }

  /**
   * 폴더 변경 처리
   */
  onFolderChange(windowId: string, folder: Abstract_File) {
    // 폴더 내용 로드
    this.refreshFolder(folder);

    this.windowService.updateWindow(windowId, {
      title: folder.file_name,
      folder: folder,
      color: folder.extension_info.getColorCode() || '#FBBF24',
    });
  }

  /**
   * 파일 경로 반환
   */
  getFileProxyUrl(file: Abstract_File): any {
    return this.getFileUrl(file);
  }

  /**
   * 로컬 에셋 파일인지 판별하여 적절한 URL 반환
   * 로컬 파일: /assets/... 경로 그대로 반환
   * 서버 파일: apiService.getFileProxyUrl 사용
   */
  private getFileUrl(file: Abstract_File): string {
    if (file.file_path && file.file_path.startsWith('/desktop-files/')) {
      return file.file_path;
    }
    return this.apiService.getFileProxyUrl(file.file_path);
  }

  /**
   * PSD 파일을 파싱하여 브라우저에서 볼 수 있는 이미지를 생성 (@webtoon/psd 활용)
   */
  async loadPSDPreview(win: WindowInstance) {
    if (!win.file || !win.file.file_path) return;

    const url = this.getFileUrl(win.file);
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const psd = Psd.parse(buffer);

      // composite()는 RGBA 픽셀 데이터를 반환
      const compositeBuffer = await psd.composite();
      const canvas = document.createElement('canvas');
      canvas.width = psd.width;
      canvas.height = psd.height;
      const ctx = canvas.getContext('2d')!;
      const imageData = new ImageData(
        new Uint8ClampedArray(compositeBuffer),
        psd.width,
        psd.height
      );
      ctx.putImageData(imageData, 0, 0);

      const previewUrl = canvas.toDataURL('image/png');
      this.windowService.updateWindow(win.id, { previewUrl });
    } catch (err) {
      console.error('PSD 파일 로드/파싱 실패:', err);
    }
  }

  /**
   * 엑셀 파일 로드 및 HTML 변환 (xlsx 라이브러리 활용)
   */
  async loadExcelPreview(win: WindowInstance) {
    if (!win.file || !win.file.file_path) return;

    const url = this.getFileUrl(win.file);
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();

      const workbook = XLSX.read(buffer, { type: 'array' });
      if (workbook.SheetNames.length === 0) return;

      // 모든 시트 파싱
      const sheets = workbook.SheetNames.map(name => {
        const worksheet = workbook.Sheets[name];
        return {
          name: name,
          content: XLSX.utils.sheet_to_html(worksheet)
        };
      });

      // 첫 번째 시트 기본 활성화
      if (sheets.length > 0) {
        this.windowService.updateWindow(win.id, {
          sheets: sheets,
          activeSheetIndex: 0,
          content: sheets[0].content // 하위 호환성 유지
        });
      }
    } catch (err) {
      console.error('Excel 파일 로드/파싱 실패:', err);
    }
  }

  /**
   * 엑셀 시트 변경
   */
  selectExcelSheet(win: WindowInstance, index: number) {
    if (!win.sheets || !win.sheets[index]) return;

    this.windowService.updateWindow(win.id, {
      activeSheetIndex: index,
      content: win.sheets[index].content
    });
  }

  /**
   * HWP 파일 미리보기 로드 (Iframe 격리 방식)
   */
  async loadHwpPreview(win: WindowInstance) {
    if (!win.file || !win.file.file_path) return;

    // Iframe URL 설정 (src/assets/hwp/viewer.html)
    const viewerUrl = '/assets/hwp/viewer.html';

    // 윈도우 콘텐츠를 Iframe으로 설정
    this.windowService.updateWindow(win.id, {
      content: `<iframe id="hwp-viewer-${win.id}" src="${viewerUrl}" style="width:100%; height:100%; border:none;"></iframe>`
    });

    const fileUrl = this.getFileUrl(win.file);

    try {
      const response = await fetch(fileUrl);
      const buffer = await response.arrayBuffer();

      // Iframe이 로드될 때까지 기다렸다가 메시지 전송
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === 'VIEWER_READY') {
          const iframe = document.getElementById(`hwp-viewer-${win.id}`) as HTMLIFrameElement;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'RENDER_HWP',
              buffer: buffer
            }, '*', [buffer]); // 전송 가능 객체(Transferable)로 전송하여 효율성 증대

            window.removeEventListener('message', messageHandler);
          }
        }
      };

      window.addEventListener('message', messageHandler);

    } catch (err) {
      console.error('HWP 파일 로딩 실패:', err);
      this.toast.error('HWP 파일을 로드할 수 없습니다.');
    }
  }

  async loadWordPreview(win: WindowInstance) {
    if (!win.file || !win.file.file_path) return;

    const fileUrl = this.getFileUrl(win.file);

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const buffer = await response.arrayBuffer();

      const container = document.getElementById(`word-container-${win.id}`);
      if (container) {
        container.innerHTML = '';
        await renderAsync(buffer, container, undefined, {
          inWrapper: false,
          ignoreHeight: false,
          ignoreWidth: false,
        });
      }
    } catch (err) {
      console.error('워드 파일 로딩 실패:', err);
      if (win.file.file_name.toLowerCase().endsWith('.doc')) {
        this.toast.error('이 .doc 형식은 미리보기를 지원하지 않을 수 있습니다.');
      } else {
        this.toast.error('워드 문서를 로드할 수 없습니다.');
      }
    }
  }

  /**
   * 클립보드 복사 (Ctrl+C)
   */
  onCopy() {
    console.log('onCopy Triggered');
    // 1. 활성화된 파일 탐색기가 있는지 확인
    const activeExplorer = this.fileExplorers.find(explorer => explorer.isActive);
    let selectedItems: Abstract_File[] = [];

    if (activeExplorer) {
      console.log('Active Explorer found', activeExplorer);
      // 탐색기 내 선택된 파일들 조회
      const currentFolder = activeExplorer.selectedFolder;
      if (currentFolder && currentFolder.children) {
        selectedItems = currentFolder.children.filter(child =>
          activeExplorer.selectedFiles.includes(child.uuid)
        );
      }
    } else {
      console.log('No active explorer, checking desktop selection');
      // 바탕화면 선택된 파일들 조회
      selectedItems = this.desktopFolders.filter(file =>
        this.selectedFolders.has(file.uuid)
      );
    }

    console.log('Selected items for copy:', selectedItems);

    if (selectedItems.length === 0) {
      console.log('No items selected to copy');
      return;
    }

    // 클립보드에 저장
    this.desktopStateService.setClipboard(selectedItems, 'copy');
    this.toast.success(`클립보드에 ${selectedItems.length}개 항목이 복사되었습니다.`);
  }

  /**
   * 붙여넣기 (Ctrl+V)
   */
  onPaste() {
    console.log('onPaste Triggered');
    const clipboard = this.desktopStateService.getClipboard();
    console.log('Current clipboard state:', clipboard);

    if (clipboard.items.length === 0) {
      console.log('Clipboard is empty');
      return;
    }

    let targetFolder: Abstract_File;

    // 1. 활성화된 파일 탐색기가 있는지 확인 -> 해당 폴더가 타겟
    const activeExplorer = this.fileExplorers.find(explorer => explorer.isActive);
    if (activeExplorer && activeExplorer.selectedFolder) {
      console.log('Pasting into active explorer folder:', activeExplorer.selectedFolder);
      targetFolder = activeExplorer.selectedFolder;
    } else {
      console.log('Pasting into desktop (root)');
      // 없으면 바탕화면이 타겟 (Root Folder as defined in openFileExplorer)
      targetFolder = new Model_Folder('', '바탕 화면', '/desktop', 0);
      targetFolder.folder_id = 0;
    }

    // 복사 실행
    if (clipboard.op === 'copy') {
      console.log('Executing copyItemsToFolder with items:', clipboard.items, 'target:', targetFolder);
      this.copyItemsToFolder(clipboard.items, targetFolder);
    }
  }


  /**
   * 바탕화면 우클릭: 컨텍스트 메뉴 표시
   */
  onDesktopRightClick(event: MouseEvent) {
    event.preventDefault();
    const target = event.target as HTMLElement;

    if (target.closest('.window-container')) {
      return;
    }

    const iconElement = target.closest('.desktop-icon');
    let contextMenuTarget: Abstract_File | null = null;

    if (iconElement) {
      const folderUuid = iconElement.getAttribute('data-folder-uuid');
      if (folderUuid) {
        const foundFile = this.desktopFolders.find(
          (f) => f.uuid === folderUuid
        );
        contextMenuTarget = foundFile || null;

        if (foundFile) {
          // Ctrl/Cmd 키가 눌려있지 않고, 이미 선택된 항목이 있으면 선택 유지
          if (!event.ctrlKey && !event.metaKey && this.selectedFolders.size === 0) {
            this.selectedFolders.clear();
            this.selectedFolders.add(foundFile.uuid);
          } else if (!this.selectedFolders.has(foundFile.uuid)) {
            // 선택된 항목이 있으면 추가만 하고 클리어하지 않음
            this.selectedFolders.add(foundFile.uuid);
          }
        }
      }
    }

    // 드래그 중이거나 기타 조건 확인
    if (this.isDragging) {
      // 드래그였는지 확인 (정말 드래그인지, 클릭인지 - 미세 움직임 허용)
      if (this.selectionBox.width < 5 && this.selectionBox.height < 5) {
        this.isDragging = false;
        this.desktopStateService.setIsDragging(false);
      } else {
        // 실제 드래그 중 우클릭은 나중에 처리하도록 저장
        // const desktopContent = (event.currentTarget as HTMLElement).getBoundingClientRect();
        this.pendingRightClickInfo = {
          x: event.clientX, // Fixed position uses viewport coordinates
          y: event.clientY,
          target: contextMenuTarget,
        };
        return;
      }
    }

    this.contextMenuTarget = contextMenuTarget; // 호환성 유지

    // 메뉴 아이템 구성
    let items: ContextMenuItem[] = [];

    if (contextMenuTarget) {
      // 파일/폴더 우클릭
      items = [
        {
          label: '열기(O)',
          action: () => this.openFolderWindow(contextMenuTarget!)
        },
        { separator: true, label: '' },
        {
          label: this.selectedFolders.size > 1 ? `다운로드 (${this.selectedFolders.size}개)` : '다운로드',
          action: () => {
            this.desktopStateService.closeContextMenu();
            this.downloadFile();
          }
        },
        { separator: true, label: '' },
        {
          label: this.selectedFolders.size > 1 ? `삭제(D) (${this.selectedFolders.size}개)` : '삭제(D)',
          icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>',
          action: () => this.remove()
        },
        { separator: true, label: '' },
        {
          label: '이름 바꾸기(M)',
          action: () => this.startRename(contextMenuTarget!)
        },
        { separator: true, label: '' },
        {
          label: '속성(R)',
          icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v9A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-9ZM3.5 3a.5.5 0 0 0-.5.5V12.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-9Z"/><path d="M5 6.5A.5.5 0 0 1 5.5 6h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 5 6.5ZM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Z"/></svg>',
          action: () => this.openProperties(contextMenuTarget!)
        }
      ];
    } else {
      // 바탕화면 빈 공간 우클릭 - 공통 로직 사용
      items = this.desktopStateService.getCommonContextMenuItems({
        createNewFolder: () => this.createNewFolder(),
        refresh: () => this.refreshDesktop(),
        sortBy: (criteria: any) => this.sortBy(criteria),
        createNewTextFile: () => this.createNewTextFile()
      });
    }

    this.desktopStateService.openContextMenu(event.clientX, event.clientY, items);
  }

  /**
   * 컨텍스트 메뉴 숨기기
   */
  hideContextMenu() {
    this.contextMenu.visible = false;
    this.showNewSubmenu = false;
    this.showSortSubmenu = false;
  }

  openProperties(file: Abstract_File) {
    this.hideContextMenu();
    this.propertiesTarget = file;
    const width = this.propertiesWindowSize.width;
    const height = this.propertiesWindowSize.height;
    this.propertiesWindowPosition = {
      x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
      y: Math.max(16, Math.round((window.innerHeight - height) / 2)),
    };
    this.propertiesWindowZIndex = this.getNextZIndex();
    this.propertiesWindowIsActive = true;
    this.windowService.deactivateAllWindows();
    this.propertiesOpen = true;
  }

  closeProperties() {
    this.propertiesOpen = false;
    this.propertiesTarget = null;
    this.propertiesWindowIsActive = false;
  }

  downloadFile() {
    if (this.selectedFolders.size === 0 && !this.contextMenuTarget) return;

    const targetFiles: Abstract_File[] = [];
    // desktopFolders는 Abstract_File[]

    if (this.selectedFolders.size > 0) {
      this.selectedFolders.forEach(uuid => {
        const file = this.desktopFolders.find(f => f.uuid === uuid);
        if (file && file.type !== 'folder') targetFiles.push(file);
      });
    } else if (this.contextMenuTarget && this.contextMenuTarget.type !== 'folder') {
      targetFiles.push(this.contextMenuTarget);
    }

    if (targetFiles.length === 0) return;

    targetFiles.forEach(file => {
      const link = document.createElement('a');
      link.href = file.file_path;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  getFileExtensionDisplay(file: Abstract_File): string {
    if (file.type === 'folder') return '-';
    const ext = file.extension_info.extension_name || '';
    return ext ? `*${ext}` : '-';
  }

  getFileTypeLabel(file: Abstract_File): string {
    if (file.type === 'folder') return '폴더';
    const ext = file.extension_info.extension_name.toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

    if (ext === '.exe') return '실행 파일';
    if (ext === '.pdf') return 'PDF 문서';
    if (ext === '.txt') return '텍스트 문서';
    if (imageExts.includes(ext)) return '이미지 파일';
    return '파일';
  }

  formatDate(value: Date | string | undefined): string {
    if (!value) return '-';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '-';

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  formatFileSize(file: Abstract_File): string {
    if (file.type === 'folder') return '-';
    const size = typeof file.file_size === 'number' ? file.file_size : 0;
    if (size < 1024) return `${size} B`;

    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = size / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    const decimals = value < 10 ? 1 : 0;
    return `${value.toFixed(decimals)} ${units[unitIndex]}`;
  }

  getPropertiesWindowColor(file: Abstract_File): string {
    if (file.type === 'folder') {
      return file.extension_info.getColorCode() || '#FBBF24';
    }
    return '#6b7280';
  }

  focusPropertiesWindow() {
    if (!this.propertiesOpen) return;
    this.propertiesWindowZIndex = this.getNextZIndex();
    this.propertiesWindowIsActive = true;
    this.windowService.deactivateAllWindows();
  }

  private getDesktopRect(): DOMRect | null {
    const desktopContent = document.querySelector(
      '.desktop-content'
    ) as HTMLElement | null;
    return desktopContent ? desktopContent.getBoundingClientRect() : null;
  }


  /**
   * 새 텍스트 파일 생성
   */
  createNewTextFile() {
    let fileNumber = 1;
    let fileName = '새 텍스트 문서.txt';

    while (this.desktopFolders.some((f) => f.file_name === fileName)) {
      fileNumber++;
      fileName = `새 텍스트 문서 ${fileNumber}.txt`;
    }

    this.hideContextMenu();

    const newFile = new Model_File(
      `local-${Date.now()}`,
      getExtensionModelByFileName(fileName),
      fileName,
      `/desktop-files/${fileName}`,
      0,
      new Date(),
      new Date(),
      [],
      0
    );

    this.desktopFolders = [...this.desktopFolders, newFile];
    this.initializeIconCoordinates(true);
    this.toast.success('새 텍스트 문서가 생성되었습니다.');
    this.cdr.detectChanges();
  }


  /**
   * 파일 탐색기에서 새 폴더 생성 이벤트 처리: 바탕화면 폴더에 동기화
   */
  onExplorerNewFolder(event: { parentPath: string; folder: Abstract_File }) {
    if (event.parentPath === '/desktop') {
      this.desktopFolders = [...this.desktopFolders, event.folder];
    }
  }

  /**
   * 파일 탐색기에서 파일 삭제 이벤트 처리: 바탕화면 폴더에서도 제거하여 동기화
   */
  onExplorerFileDelete(event: { parentPath: string; filePath: string }) {
    if (event.parentPath === '/desktop') {
      this.desktopFolders = this.desktopFolders.filter(
        (f) => f.file_path !== event.filePath
      );
    }
  }

  // ------------------------------------------------------------
  // 데스크탑 목록
  // ------------------------------------------------------------
  // 바탕화면 폴더 목록 조회
  /**
   * 바탕화면 새로고침 (웹 페이지 전체 새로고침)
   */
  refreshDesktop() {
    window.location.reload();
  }

  /**
   * 바탕화면 아이콘 정렬
   */
  sortBy(criteria: string) {
    this.desktopFolders = [...this.desktopFolders].sort((a, b) => {
      switch (criteria) {
        case 'name':
          // 이름순 (오름차순)
          return a.file_name.localeCompare(b.file_name, undefined, { numeric: true, sensitivity: 'base' });
        case 'size':
          // 크기순 (내림차순)
          return b.file_size - a.file_size;
        case 'type':
          // 항목 유형 (폴더 우선 -> 확장자순)
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          const extA = a.extension_info.extension_name || '';
          const extB = b.extension_info.extension_name || '';
          return extA.localeCompare(extB);
        case 'modified':
          // 수정한 날짜 (내림차순 - 최신순)
          return new Date(b.file_updated_at).getTime() - new Date(a.file_updated_at).getTime();
        default:
          return 0;
      }
    });

    this.hideContextMenu();
  }

  /**
   * 워크스페이스 배경 이미지 불러오기
   */
  private loadWorkspaceInfo() {
    // API 호출 대신 기본 배경 이미지 설정
    this.setBackgroundImage(1);
    this.cdr.detectChanges();
  }

  /**
   * 배경 이미지 ID에 따라 배경 이미지 경로 설정
   */
  private setBackgroundImage(bgId: number) {
    this.bgImagePath = this.workspaceService.getBackgroundPath(bgId);
  }

  /**
   * 로컬 파일 시스템 초기화 (public/desktop-files 기반)
   */
  private initLocalFiles() {
    const basePath = '/desktop-files';
    const now = new Date();

    const makeFile = (name: string, size: number, path: string) =>
      new Model_File(`f-${Date.now()}-${Math.random()}`, getExtensionModelByFileName(name), name, path, size, now, now, [], 0);

    const makeFolder = (name: string, path: string, children: Abstract_File[]) =>
      new Model_Folder(`d-${Date.now()}-${Math.random()}`, name, path, 0, 'Y', now, now, children);

    // 바탕화면 구조 정의
    this.desktopFolders = [
      makeFile('소개글.html', 18391, `${basePath}/index.html`),
      makeFile('포트폴리오.html', 18391, `${basePath}/portfolio.html`),
      makeFolder('포트폴리오 작업물', `${basePath}/포트폴리오 작업물`, [
        makeFolder('작업 과정', `${basePath}/포트폴리오 작업물/작업 과정`, [
          makeFile('코드구성.html', 18391, `${basePath}/포트폴리오 작업물/작업 과정/코드구성.html`),
        ]),
        makeFolder('파일뷰어 샘플', `${basePath}/포트폴리오 작업물/파일뷰어 샘플`, [
          makeFile('Goodbye in Slow Motion.mp3', 4701947, `${basePath}/포트폴리오 작업물/파일뷰어 샘플/Goodbye in Slow Motion.mp3`),
          makeFile('[붙임2]목업제작_사업계획서양식.hwp', 61440, `${basePath}/포트폴리오 작업물/파일뷰어 샘플/[붙임2]목업제작_사업계획서양식.hwp`),
          makeFile('index.html', 18391, `${basePath}/포트폴리오 작업물/파일뷰어 샘플/index.html`),
          makeFile('가로형 89x58.psd', 2500303, `${basePath}/포트폴리오 작업물/파일뷰어 샘플/가로형 89x58.psd`),
          makeFile('삼강오륜.hwp', 10240, `${basePath}/포트폴리오 작업물/파일뷰어 샘플/삼강오륜.hwp`),
          makeFile('세로형_시안 56x89.ai', 1569117, `${basePath}/포트폴리오 작업물/파일뷰어 샘플/세로형_시안 56x89.ai`),
          makeFile('요양보호사_기출문제_업로드_양식.xlsx', 4398106, `${basePath}/포트폴리오 작업물/파일뷰어 샘플/요양보호사_기출문제_업로드_양식.xlsx`),
          makeFile('편집할내용.xlsx', 13368, `${basePath}/포트폴리오 작업물/파일뷰어 샘플/편집할내용.xlsx`),
          makeFile('이웃집토토로 배경.jpg', 146890, `${basePath}/포트폴리오 작업물/파일뷰어 샘플/이웃집토토로 배경.jpg`),
          makeFile('이웃집토토로.webp', 179822, `${basePath}/포트폴리오 작업물/파일뷰어 샘플/이웃집토토로.webp`),
        ]),
      ]),
      makeFolder('프로젝트', `${basePath}/프로젝트`, []),
    ];

    this.initializeIconCoordinates();
    this.cdr.detectChanges();
  }

  getData() {
    // API 호출 대신 로컬 데이터 정렬 및 이니셜라이즈
    this.initializeIconCoordinates();
    this.cdr.detectChanges();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // 디바운싱: 리사이즈 이벤트가 빈번하게 발생하므로 일정 시간 후 실행
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      this.initializeIconCoordinates(true); // 강제 재배치
      this.calculatePreviewScale(); // 스케일 재계산
    }, 200);
  }
  private resizeTimeout: any = null;

  previewScale: number = 1;

  private calculatePreviewScale() {
    console.log('calculatePreviewScale mode:', this.mode);
    if (this.mode === 'preview') {

      // 렌더링 후 실행을 위해 setTimeout 사용
      setTimeout(() => {
        const hostElement = this.elementRef.nativeElement;
        const hostWidth = hostElement.clientWidth;
        const hostHeight = hostElement.clientHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        console.log('calculatePreviewScale dims:', hostWidth, hostHeight, windowWidth, windowHeight);

        // 가로/세로 비율 중 더 작은 쪽을 기준으로 축소 (화면에 꽉 차게 보임, 잘림 방지)
        if (windowWidth > 0 && windowHeight > 0) {
          const scaleX = hostWidth / windowWidth;
          const scaleY = hostHeight / windowHeight;
          this.previewScale = Math.min(scaleX, scaleY);
          // 최소 스케일 제한 (너무 작아지지 않도록)
          this.previewScale = Math.max(this.previewScale, 0.1);

          console.log('calculatePreviewScale new scale (X, Y, Final):', scaleX, scaleY, this.previewScale);
        }
        this.cdr.detectChanges();
      }, 0);
    } else {
      this.previewScale = 1;
    }
  }

  /**
   * 바탕화면 아이콘 초기 좌표 계산 (그리드 배치)
   * @param force 이미 좌표가 있어도 강제로 재계산할지 여부
   */
  private initializeIconCoordinates(force: boolean = false) {
    const iconWidth = 80;
    const iconHeight = 100;
    const gap = 10;
    const padding = 20;

    const gridX = iconWidth + gap;
    const gridY = iconHeight + gap;

    // 바탕화면 높이 (작업표시줄 등 고려하여 하단 여백 제외)
    // 최소 높이 보장 (오류 방지)

    // 바탕화면 높이 (작업표시줄 등 고려하여 하단 여백 제외)
    // 최소 높이 보장 (오류 방지)

    let availableHeight = window.innerHeight - 100;

    // 프리뷰 모드여도 아이콘 배치는 전체 화면 기준(window.innerHeight)으로 계산
    // 대신 calculatePreviewScale()에서 전체를 축소(scale)함

    availableHeight = Math.max(availableHeight, 200);

    let currentX = padding;
    let currentY = padding;

    this.desktopFolders.forEach(file => {
      // 강제 재배치이거나 좌표가 없는 경우 계산
      if (force || file.x === undefined || file.y === undefined) {
        file.x = currentX;
        file.y = currentY;

        // 세로 방향으로 먼저 쌓음 (Windows 스타일)
        currentY += gridY;

        // 화면 높이를 넘어가면 다음 열로 이동
        if (currentY + iconHeight > availableHeight) {
          currentY = padding;
          currentX += gridX;
        }
      }
    });

    this.cdr.detectChanges();
  }

  // 데스크탑 폴더 배열을 비교하여 변경된 항목만 업데이트
  private updateDesktopFolders(newFolders: Abstract_File[]) {
    // 기존 폴더를 Map으로 변환 (file_path를 키로 사용)
    const existingMap = new Map<string, Abstract_File>();
    this.desktopFolders.forEach((folder) => {
      existingMap.set(folder.file_path, folder);
    });

    // 새 폴더를 Map으로 변환
    const newMap = new Map<string, Abstract_File>();
    newFolders.forEach((folder) => {
      newMap.set(folder.file_path, folder);
    });

    // 업데이트된 폴더 배열 생성
    const updatedFolders: Abstract_File[] = [];

    // 1. 새 폴더 배열을 순회하며 추가/업데이트
    newFolders.forEach((newFolder) => {
      const existingFolder = existingMap.get(newFolder.file_path);

      if (existingFolder) {
        // 기존 폴더가 있으면 속성만 업데이트 (위치 등 유지)
        existingFolder.file_name = newFolder.file_name;
        existingFolder.file_size = newFolder.file_size;
        existingFolder.extension_info = newFolder.extension_info;
        // gridX, gridY 등은 유지 (기존 객체의 속성 유지)
        updatedFolders.push(existingFolder);
      } else {
        // 새 폴더는 추가
        updatedFolders.push(newFolder);
      }
    });

    // 2. 기존 폴더 중 새 배열에 없는 항목은 제거 (자동으로 제외됨)

    // 배열 업데이트 (참조 변경으로 Angular change detection 트리거)
    this.desktopFolders = updatedFolders;
  }

  // ------------------------------------------------------------
  // 폴더 및 파일 제어
  // ------------------------------------------------------------
  /**
   * 특정 폴더의 내용만 새로고침 (창 열기 또는 이동 후 호출)
   * 기존 getData() 로직을 건드리지 않고 필요한 폴더만 부분 업데이트
   */
  refreshFolder(folder: Abstract_File | null) {
    // API 호출 대신 로컬 자식 노드 반환
    if (folder) {
      if (!folder.children) folder.children = [];
      folder.isLoaded = true;
      folder.children_count = folder.children.length;
    } else {
      // 바탕화면
      this.getData();
    }
    this.cdr.detectChanges();
  }

  // 새 폴더 생성
  createNewFolder() {
    this.hideContextMenu();

    let folderNumber = 1;
    let folderName = '새 폴더';
    while (this.desktopFolders.some((f) => f.file_name === folderName)) {
      folderName = `새 폴더 ${++folderNumber}`;
    }

    const newFolder = new Model_Folder(
      `local-${Date.now()}`,
      folderName,
      `/desktop-files/${folderName}`,
      0,
      'Y', // Yellow default
      new Date(),
      new Date(),
      [],
      Math.floor(Math.random() * 1000000) // Mock folder_id
    );

    this.desktopFolders = [...this.desktopFolders, newFolder];
    this.initializeIconCoordinates(true);
    this.toast.success('새 폴더가 생성되었습니다.');
    this.cdr.detectChanges();
  }
  // 삭제 (폴더/파일 공통)
  remove() {
    this.hideContextMenu();

    // 선택된 항목이 있으면 모두 삭제
    const itemsToDelete: string[] = [];

    if (this.selectedFolders.size > 0) {
      this.selectedFolders.forEach((uuid) => itemsToDelete.push(uuid));
    } else if (this.contextMenuTarget) {
      itemsToDelete.push(this.contextMenuTarget.uuid);
    }

    if (itemsToDelete.length === 0) {
      return;
    }

    // 로컬 상태에서 삭제
    this.desktopFolders = this.desktopFolders.filter(f => !itemsToDelete.includes(f.uuid));
    this.selectedFolders.clear();
    this.initializeIconCoordinates(true);
    this.toast.success(`${itemsToDelete.length}개 항목이 삭제되었습니다.`);
    this.cdr.detectChanges();
  }

  // ------------------------------------------------------------
  // 이름 바꾸기 관련
  // ------------------------------------------------------------
  // 이름 바꾸기 키 이벤트 처리
  onRenameKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.finishRename();
    } else if (event.key === 'Escape') {
      this.cancelRename();
    }
    event.stopPropagation();
  }

  onRenameBlur(event: FocusEvent, input: HTMLInputElement) {
    if (this.renamingFile) {
      event.preventDefault();
      setTimeout(() => input.focus(), 0);
    }
  }

  // 이름 바꾸기 시작: 편집 모드로 전환
  startRename(file: Abstract_File) {
    this.renamingFile = file;
    this.renameText = file.file_name;
    this.shouldFocusRenameInput = true;
    this.hideContextMenu();
  }
  // 이름 바꾸기 완료
  finishRename() {
    if (!this.renamingFile) {
      return;
    }

    const originalName = this.renamingFile.file_name;
    const newName = this.renameText.trim();

    // 빈 텍스트이거나 공백만 있으면 원래 이름으로 복원하고 종료
    if (!newName) {
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

    // 중복 이름 체크 (바탕화면)
    const isDuplicate = this.desktopFolders.some(f => f.file_name === newName && f.uuid !== this.renamingFile!.uuid);
    if (isDuplicate) {
      this.toast.error('이미 같은 이름의 항목이 존재합니다.');
      return;
    }

    // 로컬 상태 업데이트
    const targetFile = this.desktopFolders.find(f => f.uuid === this.renamingFile!.uuid);
    if (targetFile) {
      targetFile.file_name = newName;
      targetFile.file_path = targetFile.file_path.replace(originalName, newName);
      targetFile.file_updated_at = new Date();
    }

    this.renamingFile = null;
    this.renameText = '';
    this.toast.success('이름이 변경되었습니다.');
    this.cdr.detectChanges();
  }

  // 이름 바꾸기 취소
  cancelRename() {
    if (!this.renamingFile) {
      return;
    }

    const newName = this.renameText.trim();
    const originalName = this.renamingFile.file_name;

    // 포커스가 해제될 때(Blur) 이름이 중복이면 알림 제공 (사용자 요청)
    if (newName && newName !== originalName) {
      const isDuplicate = this.desktopFolders.some(f => f.file_name === newName && f.uuid !== this.renamingFile!.uuid);
      if (isDuplicate) {
        this.toast.error(`이미 같은 이름의 항목이 존재합니다: ${newName}`);
      }
    }

    this.renamingFile = null;
    this.renameText = '';
  }

  /**
   * 바탕화면 파일 드래그 오버 (외부 파일 드래그)
   */
  onDesktopDragOver(event: DragEvent) {
    // 1. 내부 아이템 드래그 중인지 확인
    const dragPreview = this.desktopStateService.getDragPreview();
    if (dragPreview.visible && dragPreview.items.length > 0) {
      const desktopRoot = new Model_Folder('', '바탕 화면', '/desktop', 0);
      desktopRoot.folder_id = 0;

      if (this.canDropItemsToFolder(dragPreview.items, desktopRoot)) {
        event.preventDefault();
        event.stopPropagation();
        this.dragOverFolder = desktopRoot;
        this.dragOverFolderCanDrop = true;
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'move';
        }
        return;
      }
    }

    // 2. 외부 파일 드래그 확인 (브라우저 외부에서 드래그)
    if (event.dataTransfer && event.dataTransfer.types.includes('Files')) {
      // 선택된 항목 드래그가 아닌 경우에만 처리
      if (!this.isDraggingSelectedItems) {
        event.preventDefault();
        event.stopPropagation();
        this.isFileDragOver = true;
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'copy';
        }
      }
    }
  }

  /**
   * 바탕화면 파일 드래그 리브 (외부 파일 드래그)
   */
  onDesktopDragLeave(event: DragEvent) {
    // 자식 요소로 이동하는 경우는 무시
    const target = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;

    if (!currentTarget.contains(target)) {
      this.isFileDragOver = false;
    }
  }

  /**
   * 바탕화면 파일 드롭 (외부 파일 업로드)
   */
  onDesktopDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isFileDragOver = false;
    this.dragOverFolder = null;

    // 1. 내부 아이템 드래그 처리
    const dragPreview = this.desktopStateService.getDragPreview();
    if (dragPreview.visible && dragPreview.items.length > 0) {
      const desktopRoot = new Model_Folder('', '바탕 화면', '/desktop', 0);
      desktopRoot.folder_id = 0;

      if (this.canDropItemsToFolder(dragPreview.items, desktopRoot)) {
        this.moveItemsToFolder(dragPreview.items, desktopRoot);
        this.desktopStateService.clearDragPreview();
        return;
      }
    }

    // 2. 외부 파일 업로드 처리
    // DataTransferItemList를 사용하여 폴더 구조 감지
    if (event.dataTransfer && event.dataTransfer.items) {
      const items = Array.from(event.dataTransfer.items);

      // 폴더가 포함되어 있는지 확인
      const hasDirectory = items.some(item => {
        const entry = (item as any).webkitGetAsEntry?.();
        return entry && entry.isDirectory;
      });

      if (hasDirectory) {
        // 폴더 업로드 처리
        this.uploadFolderStructure(items, 0);
        return;
      }
    }

    // 파일 드래그인지 확인
    if (!event.dataTransfer || !event.dataTransfer.files) {
      return;
    }

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) {
      return;
    }

    // 파일 업로드
    this.uploadFiles(files);
  }

  /**
   * 파일 업로드 (스트리밍 업로드)
   */
  private uploadFiles(files: File[], folderId: number = 0) {
    // 로컬 업로드 시뮬레이션
    files.forEach((file, index) => {
      const fileName = file.name;
      const extension_info = getExtensionModelByFileName(fileName);

      const newFile = new Model_File(
        `local-upload-${Date.now()}-${index}`,
        extension_info,
        fileName,
        URL.createObjectURL(file), // Blob URL for preview
        file.size,
        new Date(),
        new Date(),
        [],
        folderId
      );

      if (folderId === 0) {
        // 바탕화면
        // 중복 이름 체크 및 이름 변경 (자동 피하기)
        let finalName = fileName;
        let count = 1;
        while (this.desktopFolders.some(f => f.file_name === finalName)) {
          const dotIndex = fileName.lastIndexOf('.');
          const base = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
          const ext = dotIndex !== -1 ? fileName.substring(dotIndex) : '';
          finalName = `${base} (${count++})${ext}`;
        }
        newFile.file_name = finalName;
        this.desktopFolders = [...this.desktopFolders, newFile];
      } else {
        // 특정 폴더 내부에 업로드
        const targetFolder = this.findFileById(folderId.toString(), this.desktopFolders) ||
          this.findFolderByFolderId(folderId, this.desktopFolders);
        if (targetFolder) {
          if (!targetFolder.children) targetFolder.children = [];

          let finalName = fileName;
          let count = 1;
          while (targetFolder.children.some((f: Abstract_File) => f.file_name === finalName)) {
            const dotIndex = fileName.lastIndexOf('.');
            const base = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
            const ext = dotIndex !== -1 ? fileName.substring(dotIndex) : '';
            finalName = `${base} (${count++})${ext}`;
          }
          newFile.file_name = finalName;

          targetFolder.children.push(newFile);
          targetFolder.isLoaded = true;
          targetFolder.children_count = targetFolder.children.length;
        }
      }
    });

    this.initializeIconCoordinates(true);
    this.toast.success(`${files.length}개 파일 업로드 완료(로컬)`);
    this.cdr.detectChanges();
  }

  /**
   * SSE 연결 (S3 업로드 진행률 추적)
   * @returns Promise - 연결 성공 시 resolve
   */
  private connectSSE(uploadId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // ApiService의 fileUploadWithProgress에서 사용하는 URL과 동일하게 구성
      const baseUrl = 'http://localhost:3010/api/portfolio';
      const url = `${baseUrl}/upload/progress?uploadId=${uploadId}`;

      console.log('SSE 연결 시도:', url);

      const eventSource = new EventSource(url);
      let isResolved = false;
      const timeout = setTimeout(() => {
        if (!isResolved) {
          console.warn('SSE 연결 타임아웃:', uploadId);
          reject(new Error('SSE 연결 타임아웃'));
        }
      }, 5000); // 5초 타임아웃

      eventSource.onopen = () => {
        console.log('SSE 연결 성공:', uploadId, 'readyState:', eventSource.readyState);
      };

      eventSource.onmessage = (event) => {
        try {
          // 빈 메시지나 heartbeat는 무시
          if (!event.data || event.data.trim() === '' || event.data.startsWith(':')) {
            return;
          }

          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('SSE 연결됨:', uploadId);
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              resolve();
            }
            return;
          }

          // S3 업로드 진행률 업데이트
          if (data.fileIndex !== undefined && this.uploadFileList[data.fileIndex]) {
            console.log('S3 진행률 업데이트:', {
              fileIndex: data.fileIndex,
              fileName: this.uploadFileList[data.fileIndex].file.name,
              percentage: data.percentage,
              loaded: data.loaded,
              total: data.total,
              rawData: data,
            });

            // 데이터 유효성 검사
            const loaded = Number(data.loaded) || 0;
            const total = Number(data.total) || this.uploadFileList[data.fileIndex].total || 0;
            const percentage = Number(data.percentage) || 0;

            // Angular change detection을 위해 새 객체로 업데이트
            const updatedFile = { ...this.uploadFileList[data.fileIndex] };
            updatedFile.s3Progress = percentage;
            updatedFile.s3Loaded = loaded;
            // total도 업데이트 (없을 경우)
            if (total > 0) {
              updatedFile.total = total;
            }

            console.log('업데이트된 파일 정보:', {
              s3Progress: updatedFile.s3Progress,
              s3Loaded: updatedFile.s3Loaded,
              total: updatedFile.total,
            });

            // 배열 참조 변경으로 change detection 트리거
            this.uploadFileList = [
              ...this.uploadFileList.slice(0, data.fileIndex),
              updatedFile,
              ...this.uploadFileList.slice(data.fileIndex + 1),
            ];

            // 수동으로 change detection 트리거 (SSE는 zone 밖에서 실행됨)
            this.cdr.detectChanges();
          } else {
            console.warn('S3 진행률 업데이트 실패:', {
              fileIndex: data.fileIndex,
              uploadFileListLength: this.uploadFileList.length,
              data,
            });
          }
        } catch (error) {
          console.error('SSE 데이터 파싱 오류:', error, event.data);
        }
      };

      eventSource.onerror = (error) => {
        const readyState = eventSource.readyState;
        // readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED

        if (readyState === EventSource.OPEN) {
          // 연결이 열려있으면 에러가 아닐 수 있음
          return;
        }

        console.error('SSE 연결 오류:', {
          uploadId,
          readyState,
          error,
          url,
        });

        if (readyState === EventSource.CLOSED) {
          console.log('SSE 연결 종료:', uploadId);
          eventSource.close();
          this.sseConnections.delete(uploadId);
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            reject(new Error('SSE 연결 종료'));
          }
        } else if (readyState === EventSource.CONNECTING) {
          // 재연결 시도 중
          console.log('SSE 재연결 시도 중:', uploadId);
        }
      };

      this.sseConnections.set(uploadId, eventSource);
    });
  }

  /**
   * 단일 파일 업로드
   */
  private uploadSingleFile(file: File, index: number, uploadId: string, folderId: number = 0) {
    // 엑셀(.xlsx) 파일의 MIME 타입이 DB 컬럼(file_type) 길이를 초과하는 문제 해결 (varchar(50) 제한 등)
    // application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (65자) -> application/vnd.ms-excel (24자)
    let uploadFile = file;
    if (file.type && file.type.length > 50) {
      const blob = file.slice(0, file.size, 'application/vnd.ms-excel');
      uploadFile = new File([blob], file.name, { type: 'application/vnd.ms-excel' });
    }

    const formData = new FormData();
    formData.append('files', uploadFile);
    formData.append('folder_id', folderId.toString());
    formData.append('workspace_uuid', this.workspaceUUID);
    formData.append('bucket', 'portfolio-files');
    formData.append('table', 'FILE');
    formData.append('column', 'file');
    formData.append('uploadId', uploadId); // SSE 추적을 위한 업로드 ID
    formData.append('fileIndex', index.toString()); // 프론트엔드의 실제 파일 인덱스 전달

    // 진행률 추적을 위한 Subject 생성
    const progressSubject = new Subject<UploadProgress>();

    // 진행률 구독
    const progressSubscription = progressSubject.pipe(first()).subscribe((progress) => {
      if (this.uploadFileList[index]) {
        this.uploadFileList[index].progress = progress.percentage;
        this.uploadFileList[index].loaded = progress.loaded;
        this.uploadFileList[index].total = progress.total;

        // 100% 도달 시 서버 처리 중 상태로 변경
        if (progress.percentage >= 100) {
          this.uploadFileList[index].status = 'processing';
        }
      }
    });

    // 업로드 실행
    const uploadSubscription = this.apiService
      .fileUploadWithProgress(formData, { route: '/upload/file' }, progressSubject)
      .pipe(first())
      .subscribe(
        (res: any) => {
          progressSubscription.unsubscribe();
          if (this.uploadFileList[index]) {
            if (res.status === 'success') {
              this.uploadFileList[index].status = 'completed';
              this.uploadFileList[index].progress = 100;
              this.uploadFileList[index].loaded = this.uploadFileList[index].total;

              // 모든 파일 업로드 완료 확인
              const allCompleted = this.uploadFileList.every(
                (uf) => uf.status === 'completed' || uf.status === 'error'
              );
              if (allCompleted) {
                // SSE 연결 종료 (모든 업로드 완료 시)
                const eventSource = this.sseConnections.get(uploadId);
                if (eventSource) {
                  console.log('All uploads completed: Closing SSE connection:', uploadId);
                  eventSource.close();
                  this.sseConnections.delete(uploadId);
                }

                // 모든 업로드 완료 후 목록 새로고침
                setTimeout(() => {
                  if (folderId > 0) {
                    // 폴더에 업로드한 경우 해당 폴더만 새로고침
                    const targetFolder = this.findFolderByFolderId(folderId, this.desktopFolders);
                    if (targetFolder) {
                      this.refreshFolder(targetFolder);
                    }
                  } else {
                    // 바탕화면에 업로드한 경우
                    this.getData();
                  }
                  // 2초 후 업로드 창 자동 닫기
                  setTimeout(() => {
                    this.closeUploadWindow();
                  }, 2000);
                }, 500);
              }
            } else {
              this.uploadFileList[index].status = 'error';
              this.uploadFileList[index].error = res.message || '업로드 실패';
            }
          }
        },
        (err: any) => {
          progressSubscription.unsubscribe();
          console.error('파일 업로드 에러:', err);
          if (this.uploadFileList[index]) {
            this.uploadFileList[index].status = 'error';
            this.uploadFileList[index].error = err.message || '업로드 중 오류가 발생했습니다.';
          }
        }
      );

    this.subscriptions.push(uploadSubscription);
  }

  /**
   * 업로드 창 열기
   */
  openUploadWindow() {
    this.uploadWindowOpen = true;
    const width = this.uploadWindowSize.width;
    const height = this.uploadWindowSize.height;
    this.uploadWindowPosition = {
      x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
      y: Math.max(16, Math.round((window.innerHeight - height) / 2)),
    };
    this.uploadWindowZIndex = this.getNextZIndex();
    this.uploadWindowIsActive = true;
    this.windowService.deactivateAllWindows();
    this.propertiesWindowIsActive = false;
  }

  /**
   * 업로드 창 닫기
   */
  closeUploadWindow() {
    // 모든 SSE 연결 종료
    this.sseConnections.forEach((eventSource, uploadId) => {
      eventSource.close();
    });
    this.sseConnections.clear();

    this.uploadWindowOpen = false;
    this.uploadFileList = [];
    this.uploadWindowIsActive = false;
  }

  /**
   * 업로드 창 포커스
   */
  focusUploadWindow() {
    if (!this.uploadWindowOpen) return;
    this.uploadWindowZIndex = this.getNextZIndex();
    this.uploadWindowIsActive = true;
    this.windowService.deactivateAllWindows();
    this.propertiesWindowIsActive = false;
  }

  /**
   * 파일 크기 포맷팅
   */
  formatUploadFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    const decimals = value < 10 ? 1 : 0;
    return `${value.toFixed(decimals)} ${units[unitIndex]}`;
  }

  /**
   * 폴더 구조 업로드 (재귀적)
   */
  private async uploadFolderStructure(items: DataTransferItem[], parentFolderId: number) {
    // 업로드 ID 생성
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 모든 파일과 폴더를 수집
    const allFiles: Array<{ file: File; folderId: number; path: string }> = [];
    const folderMap = new Map<string, number>(); // 경로 -> folder_id 매핑

    // 루트 경로는 parentFolderId
    folderMap.set('', parentFolderId);

    // 업로드 창 열기
    this.openUploadWindow();

    // 디렉토리 엔트리 읽기 (모든 항목을 재귀적으로 읽기)
    const readDirectoryEntries = (reader: any, folderPath: string, folderId: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        const processBatch = async (): Promise<void> => {
          return new Promise((resolveBatch, rejectBatch) => {
            reader.readEntries(async (entries: any[]) => {
              if (entries.length === 0) {
                resolveBatch();
                return;
              }

              // 모든 항목 처리
              const promises: Promise<void>[] = [];

              for (const entry of entries) {
                if (entry.isDirectory) {
                  // 하위 폴더인 경우
                  const folderName = entry.name;
                  const newFolderPath = folderPath ? `${folderPath}/${folderName}` : folderName;

                  // 폴더 생성
                  try {
                    const newFolderId = await this.createFolder(folderName, folderId);
                    folderMap.set(newFolderPath, newFolderId);

                    // 하위 폴더 내용 읽기
                    const subReader = entry.createReader();
                    promises.push(readDirectoryEntries(subReader, newFolderPath, newFolderId));
                  } catch (error) {
                    console.error('폴더 생성 실패:', folderName, error);
                  }
                } else {
                  // 파일인 경우
                  promises.push(
                    new Promise<void>((resolveFile) => {
                      entry.file((file: File) => {
                        allFiles.push({
                          file,
                          folderId,
                          path: folderPath ? `${folderPath}/${file.name}` : file.name,
                        });
                        resolveFile();
                      });
                    })
                  );
                }
              }

              // 모든 항목 처리 완료 대기
              await Promise.all(promises);

              // 더 많은 항목이 있는지 확인 (readEntries는 한 번에 모든 항목을 반환하지 않을 수 있음)
              processBatch().then(resolveBatch).catch(rejectBatch);
            }, rejectBatch);
          });
        };

        processBatch().then(resolve).catch(reject);
      });
    };

    // 모든 항목을 재귀적으로 처리
    const processItems = async (items: DataTransferItem[], currentPath: string, currentFolderId: number) => {
      const promises: Promise<void>[] = [];

      for (const item of items) {
        const entry = (item as any).webkitGetAsEntry?.();
        if (!entry) continue;

        if (entry.isDirectory) {
          // 폴더인 경우
          const folderName = entry.name;
          const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;

          // 폴더 생성
          try {
            const newFolderId = await this.createFolder(folderName, currentFolderId);
            folderMap.set(folderPath, newFolderId);

            // 폴더 내용 읽기
            const reader = entry.createReader();
            promises.push(readDirectoryEntries(reader, folderPath, newFolderId));
          } catch (error) {
            console.error('폴더 생성 실패:', folderName, error);
          }
        } else {
          // 파일인 경우
          promises.push(
            new Promise<void>((resolve) => {
              entry.file((file: File) => {
                allFiles.push({
                  file,
                  folderId: currentFolderId,
                  path: currentPath ? `${currentPath}/${file.name}` : file.name,
                });
                resolve();
              });
            })
          );
        }
      }

      // 모든 항목 처리 완료 대기
      await Promise.all(promises);
    };

    // 모든 항목 처리
    try {
      await processItems(items, '', parentFolderId);

      // 모든 파일을 업로드 목록에 추가
      this.uploadFileList = allFiles.map((item) => ({
        file: item.file,
        progress: 0,
        loaded: 0,
        total: item.file.size,
        s3Progress: 0,
        s3Loaded: 0,
        status: 'uploading' as const,
        uploadId,
        folderId: item.folderId,
        path: item.path,
      }));

      // SSE 연결 시작
      const sseConnected = this.connectSSE(uploadId);

      // SSE 연결 후 파일 업로드 시작
      sseConnected.then(() => {
        console.log('SSE 연결 완료, 폴더 구조 업로드 시작:', uploadId);
        allFiles.forEach((item, index) => {
          this.uploadSingleFile(item.file, index, uploadId, item.folderId);
        });
      }).catch((error) => {
        console.error('SSE 연결 실패, 폴더 구조 업로드 계속 진행:', error);
        allFiles.forEach((item, index) => {
          this.uploadSingleFile(item.file, index, uploadId, item.folderId);
        });
      });
    } catch (error) {
      console.error('폴더 구조 업로드 중 오류:', error);
      this.toast.error('폴더 업로드 중 오류가 발생했습니다.');
      this.closeUploadWindow();
    }
  }

  /**
   * 폴더 생성
   */
  private async createFolder(folderName: string, parentId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const params: Parameter = {
        type: 'POST',
        sendData: {
          folder_name: folderName,
          parent_id: parentId,
          name: folderName,
        },
        route: `/drive/${this.workspaceUUID}/folder`,
      };

      this.apiService
        .api(params)
        .pipe(first())
        .subscribe(
          (res: any) => {
            if (res.status === 'success' && res.data && res.data.folder_id) {
              resolve(res.data.folder_id);
            } else {
              reject(new Error('폴더 생성 실패'));
            }
          },
          (err: any) => {
            console.error('폴더 생성 에러:', err);
            reject(err);
          }
        );
    });
  }

}
