import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WindowComponent } from '../window/window';
import { DesktopStateService } from '../../core/services/desktop-state.service';

@Component({
  selector: 'app-inputbox',
  standalone: true,
  imports: [CommonModule, FormsModule, WindowComponent],
  templateUrl: './inputbox.html',
  styleUrl: './inputbox.scss'
})
export class InputBox implements OnInit, OnDestroy {
  @Input() title: string = '입력';
  @Input() message: string = '';
  @Input() defaultValue: string = '';
  @Input() type: 'okOnly' | 'okCancel' = 'okCancel';

  @Output() action = new EventEmitter<string | null>();
  @Output() close = new EventEmitter<void>();

  inputValue: string = '';

  constructor(private desktopStateService: DesktopStateService) {}

  ngOnInit() {
    this.inputValue = this.defaultValue;
    this.desktopStateService.pushModal();
  }

  ngOnDestroy() {
    this.desktopStateService.popModal();
  }

  onOk() {
    this.action.emit(this.inputValue);
  }

  onCancel() {
    this.action.emit(null);
  }

  onClose() {
    this.close.emit();
  }
}
