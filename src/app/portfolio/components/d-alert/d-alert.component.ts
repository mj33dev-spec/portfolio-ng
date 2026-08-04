import { Component, ChangeDetectionStrategy, effect, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DAlertService } from './d-alert.service';

@Component({
  selector: 'app-d-alert',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './d-alert.component.html',
  styleUrls: ['./d-alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DAlertComponent {
  alertService = inject(DAlertService);
  state = this.alertService.alertState;
  
  inputValue = signal('');
  isRetained = signal(false);
  hasEntered = signal(false);
  
  @ViewChild('promptInput') promptInput?: ElementRef<HTMLInputElement>;
  
  private timerId: any;
  private readonly ALERT_TRANSITION_DURATION_MS = 250;

  constructor() {
    effect(() => {
      const isOpen = this.state().isOpen;
      
      if (isOpen) {
        clearTimeout(this.timerId);
        this.inputValue.set('');
        this.isRetained.set(true);
        setTimeout(() => {
          this.hasEntered.set(true);
          if (this.state().isPrompt && this.promptInput) {
            setTimeout(() => this.promptInput!.nativeElement.focus(), 50);
          }
        }, 10);
      } else {
        this.hasEntered.set(false);
        this.timerId = setTimeout(() => {
          this.isRetained.set(false);
        }, this.ALERT_TRANSITION_DURATION_MS);
      }
    });
  }

  handleConfirm() {
    const s = this.state();
    if (s.isPrompt && s.onPromptSubmit) {
      s.onPromptSubmit(this.inputValue());
    } else if (s.onConfirm) {
      s.onConfirm();
    }
    this.alertService.close();
  }

  handleCancel() {
    const s = this.state();
    if (s.onCancel) {
      s.onCancel();
    }
    this.alertService.close();
  }

  handleOverlayClick() {
    this.handleCancel();
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }
  
  getConfirmButtonClass() {
    switch (this.state().type) {
      case 'error': return 'btn-danger';
      case 'success': 
      case 'warn': 
      case 'info':
      default: return 'btn-primary_portfolio';
    }
  }
}
