import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-item.html',
  styleUrl: './dropdown-item.scss'
})
export class DropdownItemComponent {
  @Input() label: string = '';
  @Input() shortcut?: string;
  @Input() checked: boolean = false;
  @Input() isDivider: boolean = false;
}
