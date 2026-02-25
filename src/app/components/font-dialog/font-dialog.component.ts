import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WindowComponent } from '../window/window';
import { DesktopStateService } from '../../core/services/desktop-state.service';

export interface FontConfig {
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  fontSize: number;
}

@Component({
  selector: 'app-font-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, WindowComponent],
  templateUrl: './font-dialog.component.html',
  styleUrl: './font-dialog.component.scss'
})
export class FontDialogComponent implements OnInit, OnDestroy {
  @Input() initialConfig: FontConfig = {
    fontFamily: 'Consolas',
    fontWeight: 'normal',
    fontStyle: 'normal',
    fontSize: 14
  };

  @Output() ok = new EventEmitter<FontConfig>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private desktopStateService: DesktopStateService) {}

  fontFamilies = [
    'Consolas', 'Gulim', 'Dotum', 'Batang', 'Gungsuh', 'Malgun Gothic',
    'Arial', 'Courier New', 'Georgia', 'Lucida Console', 'Tahoma', 'Times New Roman', 'Verdana'
  ];

  fontStyles = [
    { label: '보통', weight: 'normal', style: 'normal' },
    { label: '기울임꼴', weight: 'normal', style: 'italic' },
    { label: '굵게', weight: 'bold', style: 'normal' },
    { label: '굵은 기울임꼴', weight: 'bold', style: 'italic' }
  ];

  fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

  selectedFamily: string = '';
  selectedStyleIdx: number = 0;
  selectedSize: number = 14;

  ngOnInit() {
    this.selectedFamily = this.initialConfig.fontFamily;
    this.selectedSize = this.initialConfig.fontSize;
    
    const idx = this.fontStyles.findIndex(s => s.weight === this.initialConfig.fontWeight && s.style === this.initialConfig.fontStyle);
    this.selectedStyleIdx = idx >= 0 ? idx : 0;

    this.desktopStateService.pushModal();
  }

  ngOnDestroy() {
    this.desktopStateService.popModal();
  }

  get selectedStyle() {
    return this.fontStyles[this.selectedStyleIdx];
  }

  onOk() {
    const config = {
      fontFamily: this.selectedFamily,
      fontWeight: this.selectedStyle.weight,
      fontStyle: this.selectedStyle.style,
      fontSize: this.selectedSize
    };
    console.log('[FontDialogComponent] Emitting config:', config);
    this.ok.emit(config);
  }

  onCancel() {
    this.cancel.emit();
  }
}
