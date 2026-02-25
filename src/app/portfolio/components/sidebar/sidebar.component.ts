import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  isOpen = input.required<boolean>();
  sections = input.required<{ id: string, name: string }[]>();
  activeSectionId = input.required<string>();
  
  sectionNavigate = output<string>();
  closeSidebar = output<void>();

  onSectionClick(sectionId: string) {
    this.sectionNavigate.emit(sectionId);
    // On mobile, close sidebar after migration
    if (window.innerWidth < 1024) {
      this.closeSidebar.emit();
    }
  }
}
