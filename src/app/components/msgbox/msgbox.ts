import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowComponent } from '../window/window';
import { DesktopStateService } from '../../core/services/desktop-state.service';

export interface MsgboxButton {
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  value: any;
  shortcut?: string; // e.g., 'S', 'N'
}

@Component({
  selector: 'app-msgbox',
  standalone: true,
  imports: [CommonModule, WindowComponent],
  templateUrl: './msgbox.html',
  styleUrl: './msgbox.scss'
})
export class MsgboxComponent implements OnInit, OnDestroy {
  @Input() title: string = '알림';
  @Input() message: string = '';
  @Input() buttons: MsgboxButton[] = [
    { label: '확인', type: 'primary', value: true }
  ];
  @Input() icon?: 'success' | 'info' | 'warn' | 'error';

  @Output() action = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  constructor(private desktopStateService: DesktopStateService) {}

  ngOnInit() {
    this.desktopStateService.pushModal();
  }

  ngOnDestroy() {
    this.desktopStateService.popModal();
  }

  onButtonClick(value: any) {
    this.action.emit(value);
  }

  onClose() {
    this.close.emit();
  }
}
