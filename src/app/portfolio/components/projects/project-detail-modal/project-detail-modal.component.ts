import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../project.model';
import { SidePanelComponent } from '../../side-panel/side-panel.component';
import { CBadgeComponent } from '../../c-badge/c-badge.component';
import { CategoryBadgeComponent } from '../../category-badge/category-badge.component';
import { inject } from '@angular/core';
import { AuthService } from '../../../auth.service';

@Component({
  selector: 'app-project-detail-modal',
  standalone: true,
  templateUrl: './project-detail-modal.component.html',
  styleUrls: ['./project-detail-modal.component.scss'],
  imports: [CommonModule, SidePanelComponent, CBadgeComponent, CategoryBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailModalComponent {
  authService = inject(AuthService);
  project = input.required<Project>();
  closeModal = output();
  editProject = output<Project>();
  deleteProject = output<Project>();

  getTagColor(tag: string): string {
    const lowerTag = tag.toLowerCase();
    if (lowerTag.includes('app')) {
      return '#02569B'; // Flutter sky blue / blue
    } else if (lowerTag.includes('web')) {
      return '#4caf50'; // Green
    } else if (lowerTag.includes('cms') || lowerTag.includes('admin')) {
      return '#2196f3'; // Blue
    } else if (lowerTag.includes('landing')) {
      return '#8b5cf6'; // Violet
    } else if (lowerTag.includes('demo')) {
      return '#6b7280'; // Gray
    } else if (lowerTag.includes('frontend')) {
      return '#ff9800'; // Orange
    } else if (lowerTag.includes('publishing')) {
      return '#e91e63'; // Pink
    } else if (lowerTag.includes('기획') || lowerTag.includes('design')) {
      return '#14b8a6'; // Teal
    } else if (lowerTag.includes('앨리스래빗')) {
      return '#ffffff'; // Alice Rabbit custom text color
    } else if (lowerTag.includes('개인 프로젝트')) {
      return '#8b5cf6'; // Violet
    } else if (lowerTag.includes('팀 프로젝트')) {
      return '#10b981'; // Emerald
    } else if (lowerTag.includes('외주')) {
      return '#f59e0b'; // Amber
    }
    return '#6b7280'; // Default gray
  }

  hexToRgba(hex: string, alpha: number): string {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getTagBgColor(tag: string): string {
    const lowerTag = tag.toLowerCase();
    if (lowerTag.includes('앨리스래빗')) {
      return '#3b3362'; // Alice Rabbit custom solid background
    }
    const hex = this.getTagColor(tag);
    return this.hexToRgba(hex, 0.15);
  }

  getTagIcon(tag: string): string {
    const lowerTag = tag.toLowerCase();
    if (lowerTag.includes('앨리스래빗')) return 'assets/portfolio/alicerabbit.png';
    return '';
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-pending';
    if (status.includes('운영중') || status.includes('진행중')) return 'status-active';
    if (status.includes('중단') || status.includes('보류')) return 'status-inactive';
    return 'status-pending';
  }
}
