import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../project.model';
import { SidePanelComponent } from '../../side-panel/side-panel.component';
import { CBadgeComponent } from '../../c-badge/c-badge.component';
import { CategoryBadgeComponent } from '../../category-badge/category-badge.component';
import { inject } from '@angular/core';
import { AuthService } from '../../../auth.service';
import { BadgeConfig } from '../../../utils/badge.config';

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

  expandedPlatforms: Record<number, boolean> = { 0: true };

  togglePlatform(index: number) {
    this.expandedPlatforms[index] = !this.expandedPlatforms[index];
  }

  BadgeConfig = BadgeConfig;
}
