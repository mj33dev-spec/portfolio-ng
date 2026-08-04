import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, ChangeDetectionStrategy, effect, untracked } from '@angular/core';
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
  private initialSection = '';

  constructor() {
    effect(() => {
      // 사이드바를 통해 다른 섹션으로 이동 시 자동으로 시트를 닫기 위한 감지 로직
      const currentSection = this.scrollService.activeSection();
      
      untracked(() => {
        if (this.initialSection && currentSection !== this.initialSection) {
          this.onBack();
        }
      });
    });
  }

  ngOnInit() {
    this.initialSection = this.scrollService.activeSection();
    this.scrollService.isPanelOpen.set(true);
  }

  ngOnDestroy() {
    this.scrollService.isPanelOpen.set(false);
  }

  onBack() {
    this.back.emit();
  }
}
