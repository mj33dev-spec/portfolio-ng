import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconFolder } from '../icon-folder/icon-folder';

export interface WindowConfig {
  title?: string;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  showMinimize?: boolean;
  showMaximize?: boolean;
  showClose?: boolean;
}

@Component({
  selector: 'app-window',
  imports: [CommonModule, IconFolder],
  templateUrl: './window.html',
  styleUrl: './window.scss',
})
export class WindowComponent implements OnInit, OnDestroy {
  @Input() title: string = '윈도우';
  @Input() initialX?: number;
  @Input() initialY?: number;
  @Input() initialWidth: number = 800;
  @Input() initialHeight: number = 600;
  @Input() color: string = '#FBBF24';
  @Input() minWidth: number = 400;
  @Input() minHeight: number = 300;
  @Input() showMinimize: boolean = true;
  @Input() showMaximize: boolean = true;
  @Input() showClose: boolean = true;
  @Input() isActive: boolean = false;
  @Input() isMinimizing: boolean = false;
  @Input() zIndex: number = 1000;
  @Input() resizable: boolean = true;
  @Input() showIcon: boolean = true;
  @Input() windowIcon?: string;
  @Input() autoHeight: boolean = false;

  @Output() closeEvent = new EventEmitter<void>();
  @Output() minimizeEvent = new EventEmitter<void>();
  @Output() maximizeEvent = new EventEmitter<boolean>();
  @Output() focusEvent = new EventEmitter<void>();

  @Input() isMaximized = false;
  isMinimized = false;
  isAnimating = false;

  windowPosition = {
    x: 0,
    y: 0,
  };

  windowSize = {
    width: this.initialWidth,
    height: this.initialHeight,
  };

  private isDragging = false;
  private isResizing = false;
  private resizeDirection: string = '';
  private dragStartPos = { x: 0, y: 0 };
  private windowStartPos = { x: 0, y: 0 };
  private windowStartSize = { width: 0, height: 0 };

  /** 드래그/리사이즈 중 iframe 이벤트 가로채기 방지용 */
  get isDraggingOrResizing(): boolean {
    return this.isDragging || this.isResizing;
  }

  ngOnInit() {
    this.windowPosition = {
      x: this.initialX ?? (window.innerWidth - this.initialWidth) / 2,
      y: this.initialY ?? (window.innerHeight - this.initialHeight) / 2,
    };
    this.windowSize = {
      width: this.initialWidth,
      height: this.initialHeight,
    };

    if (this.isMaximized) {
      this.preMaximizeState = {
        x: this.windowPosition.x,
        y: this.windowPosition.y,
        width: this.windowSize.width,
        height: this.windowSize.height,
      };
      
      this.windowPosition = { x: 0, y: 0 };
      this.windowSize = {
        width: window.innerWidth,
        height: window.innerHeight - 85,
      };
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging && !this.isMaximized) {
      const deltaX = event.clientX - this.dragStartPos.x;
      const deltaY = event.clientY - this.dragStartPos.y;
      this.windowPosition.x = this.windowStartPos.x + deltaX;
      this.windowPosition.y = this.windowStartPos.y + deltaY;
    }

    if (this.isResizing && !this.isMaximized) {
      this.handleResize(event);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  startDrag(event: MouseEvent) {
    if (this.isMaximized) return;
    // 타이틀 바를 클릭하면 창을 맨 위로 가져옴
    this.focusEvent.emit();
    this.isDragging = true;
    this.dragStartPos = { x: event.clientX, y: event.clientY };
    this.windowStartPos = { ...this.windowPosition };
    document.body.style.userSelect = 'none';
  }

  startResize(event: MouseEvent, direction: string) {
    event.stopPropagation();
    this.focusEvent.emit();

    if (this.isMaximized) {
      // 전체화면 모드에서 리사이즈 시작 시: 최대화 해제하되 현재 최대화 크기(x:0, y:0, w:innerWidth, h:innerHeight-85)를 출발 사이즈로 유지
      this.isMaximized = false;
      this.maximizeEvent.emit(false);

      this.windowPosition = { x: 0, y: 0 };
      this.windowSize = {
        width: window.innerWidth,
        height: window.innerHeight - 85,
      };
    }

    this.isResizing = true;
    this.resizeDirection = direction;
    this.dragStartPos = { x: event.clientX, y: event.clientY };
    this.windowStartPos = { ...this.windowPosition };
    this.windowStartSize = { ...this.windowSize };
    document.body.style.userSelect = 'none';

    // 커서 스타일 설정
    const cursorMap: Record<string, string> = {
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
      ne: 'nesw-resize',
      nw: 'nwse-resize',
      se: 'nwse-resize',
      sw: 'nesw-resize',
    };
    document.body.style.cursor = cursorMap[direction] || 'default';
  }

  private handleResize(event: MouseEvent) {
    const deltaX = event.clientX - this.dragStartPos.x;
    const deltaY = event.clientY - this.dragStartPos.y;

    if (this.resizeDirection.includes('e')) {
      this.windowSize.width = Math.max(
        this.minWidth,
        this.windowStartSize.width + deltaX
      );
    }
    if (this.resizeDirection.includes('w')) {
      const newWidth = Math.max(
        this.minWidth,
        this.windowStartSize.width - deltaX
      );
      this.windowPosition.x =
        this.windowStartPos.x + (this.windowStartSize.width - newWidth);
      this.windowSize.width = newWidth;
    }
    if (this.resizeDirection.includes('s')) {
      this.windowSize.height = Math.max(
        this.minHeight,
        this.windowStartSize.height + deltaY
      );
    }
    if (this.resizeDirection.includes('n')) {
      const newHeight = Math.max(
        this.minHeight,
        this.windowStartSize.height - deltaY
      );
      this.windowPosition.y =
        this.windowStartPos.y + (this.windowStartSize.height - newHeight);
      this.windowSize.height = newHeight;
    }
  }

  minimize() {
    this.isMinimized = true;
    this.minimizeEvent.emit();
  }

  private preMaximizeState = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  onTitleBarDblClick() {
    if (this.showMaximize) {
      this.maximize();
    }
  }

  maximize() {
    this.isAnimating = true;

    if (this.isMaximized) {
      // 복원
      this.windowPosition = { x: this.preMaximizeState.x, y: this.preMaximizeState.y };
      this.windowSize = {
        width: this.preMaximizeState.width,
        height: this.preMaximizeState.height,
      };
      this.isMaximized = false;
    } else {
      // 최대화 전 상태 저장
      this.preMaximizeState = {
        x: this.windowPosition.x,
        y: this.windowPosition.y,
        width: this.windowSize.width,
        height: this.windowSize.height,
      };
      
      this.windowPosition = { x: 0, y: 0 };
      this.windowSize = {
        width: window.innerWidth,
        height: window.innerHeight - 85,
      };
      this.isMaximized = true;
    }
    this.maximizeEvent.emit(this.isMaximized);

    // 애니메이션이 끝난 후 (0.3s) 플래그 해제
    setTimeout(() => {
      this.isAnimating = false;
    }, 300);
  }

  close() {
    this.closeEvent.emit();
  }

  onWindowClick() {
    // 창을 클릭하면 항상 포커스를 받아 z-index를 최상위로 올림
    this.focusEvent.emit();
  }

  ngOnDestroy() {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
}
