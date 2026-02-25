import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { SHARED_MODULES } from '../../shared/shared-modules';
import { WindowInstance, WindowService } from '../../core/services/window.service';
import { Abstract_File } from '../directory/directory-model';
import { FontDialogService } from '../../core/services/font-dialog.service';
import { AboutDialogService } from '../../core/services/about-dialog.service';
import { ToastService } from '../../core/services/toast.service';
import { DropdownComponent } from '../dropdown/dropdown';
import { DropdownItemComponent } from '../dropdown/dropdown-item';

@Component({
  selector: 'app-text-editor',
  standalone: true,
  imports: [SHARED_MODULES, DropdownComponent, DropdownItemComponent],
  templateUrl: './text-editor.html',
  styleUrl: './text-editor.scss'
})
export class TextEditorComponent implements OnInit {
  @Input() window!: WindowInstance;
  
  @Output() save = new EventEmitter<WindowInstance>();
  @Output() saveAs = new EventEmitter<WindowInstance>();
  @Output() close = new EventEmitter<string>();

  private fontDialogService = inject(FontDialogService);
  private aboutDialogService = inject(AboutDialogService);
  private cdr = inject(ChangeDetectorRef);
  private windowService = inject(WindowService);

  ngOnInit() {
    if (this.window && !this.window.cursorPos) {
      this.window.cursorPos = { ln: 1, col: 1 };
    }
  }

  onTextChange() {
    if (!this.window.isDirty) {
      this.window.isDirty = true;
    }
  }

  saveTextFile() {
    this.save.emit(this.window);
  }

  saveAsTextFile() {
    this.saveAs.emit(this.window);
  }

  closeWindow() {
    this.close.emit(this.window.id);
  }

  toggleWordWrap() {
    this.window.wordWrap = !this.window.wordWrap;
    this.window.showFormatMenu = false;
  }

  async executeEditAction(action: string) {
    const textarea = document.getElementById(`textarea-${this.window.id}`) as HTMLTextAreaElement;
    if (!textarea) return;

    textarea.focus();

    try {
      switch (action) {
        case 'undo':
          document.execCommand('undo');
          break;
        case 'cut':
          document.execCommand('cut');
          break;
        case 'copy':
          document.execCommand('copy');
          break;
        case 'paste':
          try {
            const text = await navigator.clipboard.readText();
            if (document.queryCommandSupported('insertText')) {
              document.execCommand('insertText', false, text);
            } else {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const content = textarea.value;
              textarea.value = content.substring(0, start) + text + content.substring(end);
              textarea.selectionStart = textarea.selectionEnd = start + text.length;
              textarea.dispatchEvent(new Event('input'));
            }
          } catch (e) {
            document.execCommand('paste');
          }
          break;
        case 'delete':
          if (textarea.selectionStart !== textarea.selectionEnd) {
            document.execCommand('delete');
          } else {
            const start = textarea.selectionStart;
            textarea.setSelectionRange(start, start + 1);
            document.execCommand('delete');
          }
          break;
      }
    } catch (err) {
      console.error('편집 액션 실행 실패:', err);
    }

    this.window.showEditMenu = false;
  }

  openFontDialog() {
    const initialConfig = {
      fontFamily: this.window.fontFamily || 'Consolas',
      fontSize: this.window.fontSize || 14,
      fontWeight: this.window.fontWeight || 'normal',
      fontStyle: this.window.fontStyle || 'normal',
    };

    this.fontDialogService.open(initialConfig).subscribe((config: any) => {
      if (config) {
        this.window.fontFamily = config.fontFamily;
        this.window.fontSize = config.fontSize;
        this.window.fontWeight = config.fontWeight;
        this.window.fontStyle = config.fontStyle;
        
        this.windowService.focusWindow(this.window.id);
        
        setTimeout(() => {
          const textarea = document.getElementById('textarea-' + this.window.id) as HTMLTextAreaElement;
          if (textarea) {
            textarea.style.fontFamily = `'${config.fontFamily}', 'Malgun Gothic', 'Apple SD Gothic Neo', monospace`;
            textarea.style.fontSize = `${config.fontSize}px`;
            textarea.style.fontWeight = config.fontWeight;
            textarea.style.fontStyle = config.fontStyle;
            textarea.focus();
          }
          this.cdr.detectChanges();
        }, 50);
      }
      this.window.showFormatMenu = false;
    });
  }

  getFontStyles() {
    const family = this.window.fontFamily || 'Consolas';
    const size = this.window.fontSize || 14;
    
    return {
      'font-family': `'${family}', 'Malgun Gothic', 'Apple SD Gothic Neo', monospace`,
      'font-size': `${size}px`,
      'font-weight': this.window.fontWeight || 'normal',
      'font-style': this.window.fontStyle || 'normal'
    };
  }

  toggleFileMenu(event: MouseEvent) {
    event.stopPropagation();
    const currentState = this.window.showFileMenu;
    this.closeAllMenus();
    this.window.showFileMenu = !currentState;
  }

  toggleEditMenu(event: MouseEvent) {
    event.stopPropagation();
    const currentState = this.window.showEditMenu;
    this.closeAllMenus();
    this.window.showEditMenu = !currentState;
  }

  toggleFormatMenu(event: MouseEvent) {
    event.stopPropagation();
    const currentState = this.window.showFormatMenu;
    this.closeAllMenus();
    this.window.showFormatMenu = !currentState;
  }

  toggleViewMenu(event: MouseEvent) {
    event.stopPropagation();
    const currentState = this.window.showViewMenu;
    this.closeAllMenus();
    this.window.showViewMenu = !currentState;
  }

  toggleHelpMenu(event: MouseEvent) {
    event.stopPropagation();
    const currentState = this.window.showHelpMenu;
    this.closeAllMenus();
    this.window.showHelpMenu = !currentState;
  }

  closeAllMenus() {
    this.window.showFileMenu = false;
    this.window.showEditMenu = false;
    this.window.showFormatMenu = false;
    this.window.showViewMenu = false;
    this.window.showHelpMenu = false;
  }

  zoomIn() {
    this.window.zoomLevel = (this.window.zoomLevel || 1) + 0.1;
    this.window.showViewMenu = false;
  }

  zoomOut() {
    const current = this.window.zoomLevel || 1;
    if (current > 0.2) {
      this.window.zoomLevel = current - 0.1;
    }
    this.window.showViewMenu = false;
  }

  resetZoom() {
    this.window.zoomLevel = 1.0;
    this.window.showViewMenu = false;
  }

  toggleStatusBar() {
    this.window.showStatusBar = !this.window.showStatusBar;
    this.window.showViewMenu = false;
  }

  updateCursorPos(event?: any) {
    const textarea = (event?.target || document.getElementById(`textarea-${this.window.id}`)) as HTMLTextAreaElement;
    if (!textarea) return;

    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    const lines = textBeforeCursor.split('\n');
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;

    this.window.cursorPos = { ln, col };
  }

  openAboutDialog() {
    this.aboutDialogService.open();
    this.window.showHelpMenu = false;
  }
}
