import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'info' | 'warn' | 'error';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() message: string = '';
  @Input() type: ToastType = 'info';
  // @Input() duration: number = 5000;
  @Input() duration: number = 50000;
  
  @Output() closed = new EventEmitter<void>();

  fadingOut = false;
  private autoCloseTimeout: any;

  ngOnInit() {
    if (this.duration > 0) {
      this.autoCloseTimeout = setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }

  ngOnDestroy() {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
    }
  }

  close() {
    this.fadingOut = true;
    setTimeout(() => {
      this.closed.emit();
    }, 300); // Animation duration
  }
}
