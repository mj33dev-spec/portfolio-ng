import { Component, ChangeDetectionStrategy, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../project.model';
import { SidePanelComponent } from '../../side-panel/side-panel.component';
import { CBadgeComponent } from '../../c-badge/c-badge.component';
import { CategoryBadgeComponent } from '../../category-badge/category-badge.component';
import { inject } from '@angular/core';
import { AuthService } from '../../../auth.service';
import { BadgeConfig } from '../../../utils/badge.config';
import { Router } from '@angular/router';

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
  private router = inject(Router);
  project = input.required<Project>();
  closeModal = output();
  editProject = output<Project>();
  deleteProject = output<Project>();

  expandedPlatforms: Record<number, boolean> = {};

  // UUID 정규식 패턴
  private readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  /** retrospective_link가 외부 URL인지 여부 */
  isExternalLink(link: string): boolean {
    return link.startsWith('http://') || link.startsWith('https://');
  }

  /** retrospective_link가 UUID인지 여부 */
  isUuidLink(link: string): boolean {
    return this.UUID_REGEX.test(link.trim());
  }

  /** UUID 링크 클릭 시 블로그 게시물 queryParam으로 이동 */
  navigateToBlogPost(uuid: string): void {
    // 1. 먼저 블로그 섹션으로 스크롤
    const blogSection = document.getElementById('blog');
    if (blogSection) {
      blogSection.scrollIntoView({ behavior: 'smooth' });
    }
    // 2. 스크롤 애니메이션(약 0.75초) 완료 후 blogId 설정 → 시트 오픈
    setTimeout(() => {
      this.router.navigate([], {
        queryParams: { blogId: uuid.trim() }
      });
    }, 750);
  }

  BadgeConfig = BadgeConfig;
}
