import { Component, ChangeDetectionStrategy, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../project.model';
import { SidePanelComponent } from '../../side-panel/side-panel.component';
import { CBadgeComponent } from '../../c-badge/c-badge.component';
import { CategoryBadgeComponent } from '../../category-badge/category-badge.component';
import { inject } from '@angular/core';
import { AuthService } from '../../../auth.service';
import { BadgeConfig } from '../../../utils/badge.config';

@Component({
  selector: 'app-project-detail-page',
  standalone: true,
  templateUrl: './project-detail-page.component.html',
  styleUrls: ['./project-detail-page.component.scss'],
  imports: [CommonModule, SidePanelComponent, CBadgeComponent, CategoryBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailPageComponent {
  authService = inject(AuthService);
  project = input.required<Project>();
  closeModal = output();
  editProject = output<Project>();
  deleteProject = output<Project>();

  expandedPlatforms: Record<number, boolean> = {};

  constructor() {
    effect(() => {
      const p = this.project();
      if (p && p.platforms) {
        const expanded: Record<number, boolean> = {};
        p.platforms.forEach((_, i) => expanded[i] = true);
        this.expandedPlatforms = expanded;
      }
    });
  }

  togglePlatform(index: number) {
    this.expandedPlatforms[index] = !this.expandedPlatforms[index];
  }

  BadgeConfig = BadgeConfig;
}
