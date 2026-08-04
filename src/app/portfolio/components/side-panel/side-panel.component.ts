import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollService } from '../../scroll.service';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidePanelComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Output() back = new EventEmitter<void>();

  private scrollService = inject(ScrollService);

  ngOnInit() {
    this.scrollService.isPanelOpen.set(true);
  }

  ngOnDestroy() {
    this.scrollService.isPanelOpen.set(false);
  }

  onBack() {
    this.back.emit();
  }
}
