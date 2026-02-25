import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowComponent } from '../window/window';
import { DesktopStateService } from '../../core/services/desktop-state.service';

@Component({
  selector: 'app-about-dialog',
  standalone: true,
  imports: [CommonModule, WindowComponent],
  templateUrl: './about-dialog.component.html',
  styleUrl: './about-dialog.component.scss'
})
export class AboutDialogComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  constructor(private desktopStateService: DesktopStateService) {}

  ngOnInit() {
    this.desktopStateService.pushModal();
  }

  ngOnDestroy() {
    this.desktopStateService.popModal();
  }

  onOk() {
    this.close.emit();
  }
}
