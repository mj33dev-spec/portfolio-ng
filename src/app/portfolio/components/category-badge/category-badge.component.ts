import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CBadgeComponent, BadgeSize } from '../c-badge/c-badge.component';
import { BadgeConfig } from '../../utils/badge.config';

@Component({
  selector: 'c-category-badge',
  standalone: true,
  imports: [CommonModule, CBadgeComponent],
  template: `
    <c-badge
      [label]="category"
      [size]="size"
      [variant]="'neutral'"
      [iconUrl]="config().iconUrl"
      [customColor]="config().customColor"
      [customBgColor]="config().customBgColor"
    ></c-badge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBadgeComponent {
  @Input() set category(val: string) {
    this._category.set(val);
  }
  get category() {
    return this._category();
  }
  
  @Input() size: BadgeSize = 'sm';

  private _category = signal<string>('');

  config = computed(() => {
    const label = this._category();
    const style = BadgeConfig.get(label);
    return {
      customColor: style.customColor,
      customBgColor: style.customBgColor,
      iconUrl: style.iconUrl
    };
  });
}
