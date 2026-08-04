import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'c-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="c-badge"
      [attr.data-size]="size"
      [attr.data-variant]="variant"
      [style.color]="customColor"
      [style.background-color]="customBgColor"
    >
      <img *ngIf="iconUrl" [src]="iconUrl" class="badge-icon" alt="icon">
      {{ label }}
    </span>
  `,
  styleUrls: ['./c-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CBadgeComponent {
  @Input() label: string = '';
  @Input() variant: BadgeVariant = 'neutral';
  @Input() size: BadgeSize = 'md';
  @Input() iconUrl?: string;
  @Input() customColor?: string;
  @Input() customBgColor?: string;
}
