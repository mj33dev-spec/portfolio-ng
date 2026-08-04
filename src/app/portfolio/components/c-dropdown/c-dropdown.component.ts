import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  HostListener,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CDropdownOption {
  label?: string;
  icon?: string;
  disabled?: boolean;
  type?: 'divider' | 'item';
  value?: any;
}

@Component({
  selector: 'c-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './c-dropdown.component.html',
  styleUrl: './c-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CDropdownComponent implements OnDestroy {
  @Input() variant: 'outlined' | 'fill' | 'more' | 'multi' = 'outlined';
  @Input() options: CDropdownOption[] = [];
  @Input() value: any;
  @Input() width?: string;
  @Input() direction: 'up' | 'down' = 'down';
  @Input() align: 'left' | 'right' = 'left';
  @Input() disabledList: string[] = [];
  @Input() selectedValues: string[] = [];
  
  @Output() valueChange = new EventEmitter<any>();
  @Output() optionClick = new EventEmitter<CDropdownOption>();
  @Output() removeValue = new EventEmitter<string>();

  @ViewChild('anchorRef') anchorRef!: ElementRef<HTMLDivElement>;
  @ViewChild('menuRef') menuRef?: ElementRef<HTMLDivElement>;

  isOpen = signal(false);
  
  menuTop = signal('auto');
  menuBottom = signal('auto');
  menuLeft = signal('auto');
  menuRight = signal('auto');
  menuWidth = signal('auto');

  private scrollListener: (e: Event) => void;

  constructor() {
    // Bind scroll listener for capture phase to detect scrolls on any parent container
    this.scrollListener = this.onScrollOrResize.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.scrollListener, true);
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.scrollListener, true);
    }
  }

  toggleOpen(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      setTimeout(() => this.updatePosition(), 0);
    }
  }

  close() {
    this.isOpen.set(false);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isOpen()) return;
    
    const isOutsideAnchor = this.anchorRef && !this.anchorRef.nativeElement.contains(event.target as Node);
    const isOutsideMenu = this.menuRef && !this.menuRef.nativeElement.contains(event.target as Node);
    
    if (isOutsideAnchor && isOutsideMenu) {
      this.close();
    }
  }

  @HostListener('window:resize')
  onScrollOrResize() {
    if (this.isOpen()) {
      this.updatePosition();
    }
  }

  updatePosition() {
    if (!this.anchorRef || typeof window === 'undefined') return;
    const rect = this.anchorRef.nativeElement.getBoundingClientRect();
    
    // Width logic
    if (this.variant === 'more') {
      this.menuWidth.set(this.width || 'max-content');
    } else {
      this.menuWidth.set(`${rect.width}px`);
    }

    // Vertical positioning
    if (this.direction === 'up') {
      this.menuBottom.set(`${window.innerHeight - rect.top + 8}px`);
      this.menuTop.set('auto');
    } else {
      this.menuTop.set(`${rect.bottom + 8}px`);
      this.menuBottom.set('auto');
    }

    // Horizontal positioning
    if (this.align === 'right') {
      this.menuRight.set(`${window.innerWidth - rect.right}px`);
      this.menuLeft.set('auto');
    } else {
      this.menuLeft.set(`${rect.left}px`);
      this.menuRight.set('auto');
    }
  }

  handleItemClick(e: MouseEvent, option: CDropdownOption) {
    e.stopPropagation();
    
    const labelStr = String(option.label || '');
    const disabled = option.disabled || this.disabledList.includes(labelStr);
    
    if (disabled) return;

    if (option.value !== undefined) {
      this.valueChange.emit(option.value);
    }
    this.optionClick.emit(option);
    
    if (this.variant !== 'multi') {
      this.close();
    }
  }

  removeMultiValue(e: MouseEvent, val: string) {
    e.stopPropagation();
    this.removeValue.emit(val);
  }
}
