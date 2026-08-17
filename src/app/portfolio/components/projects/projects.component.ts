import { Component, ChangeDetectionStrategy, signal, computed, HostListener, output, input, inject, effect, untracked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Project } from '../../project.model';
import { ProjectDetailPageComponent } from './project-detail-page/project-detail-page.component';
import { CBadgeComponent } from '../c-badge/c-badge.component';
import { ScrollService } from '../../scroll.service';
import { ProjectService } from '../../project.service';
import { AuthService } from '../../auth.service';
import { ProjectFormPageComponent } from './project-form-page/project-form-page.component';
import { DAlertService } from '../d-alert/d-alert.service';
import { BadgeConfig } from '../../utils/badge.config';

const SCROLL__WHEEL_RANGE: number = 3;

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProjectDetailPageComponent, CBadgeComponent, ProjectFormPageComponent],
})
export class ProjectsComponent implements OnInit {
  authService = inject(AuthService);
  private scrollService = inject(ScrollService);
  private projectService = inject(ProjectService);
  private dAlert = inject(DAlertService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isPageScrolling = input<boolean>(false);
  private isThrottled = false;
  currentProjectIndex = signal(0);
  selectedProject = signal<Project | null>(null);

  scrollThrough = output<'up' | 'down'>();

  constructor() {
    effect(() => {
      // Close modal when active section changes
      this.scrollService.activeSection();
      untracked(() => {
        if (this.selectedProject()) {
          this.closeModal();
        }
      });
    });
  }

  selectProjectIndex(index: number): void {
    this.currentProjectIndex.set(index);
    this.closeModal();
  }

  projects = signal<Project[]>([]);
  isLoading = signal<boolean>(true);

  async ngOnInit() {
    await this.loadProjects();

    this.route.queryParams.subscribe(params => {
      const projectId = params['projectId'];
      const projectEdit = params['projectEdit'];

      if (projectEdit) {
        if (projectEdit === 'new') {
          this.projectToEdit.set(null);
        } else {
          const found = this.projects().find(p => (p as any).id === projectEdit);
          this.projectToEdit.set(found || null);
        }
        this.isFormModalOpen.set(true);
        this.selectedProject.set(null);
      } else if (projectId) {
        const found = this.projects().find(p => (p as any).id === projectId);
        if (found) {
          this.selectedProject.set(found);
          const idx = this.projects().findIndex(p => (p as any).id === projectId);
          if (idx !== -1) {
            this.currentProjectIndex.set(idx);
          }
        } else {
          this.selectedProject.set(null);
        }
        this.isFormModalOpen.set(false);
        this.projectToEdit.set(null);
      } else {
        this.selectedProject.set(null);
        this.isFormModalOpen.set(false);
        this.projectToEdit.set(null);
      }
    });
  }

  loadProjects(): Promise<void> {
    this.isLoading.set(true);
    return this.projectService.fetchProjects().then(data => {
      const visibleProjects = this.authService.isLoggedIn() 
        ? data 
        : data.filter(p => p.is_visible !== false);
        
      this.projects.set(visibleProjects);
      this.isLoading.set(false);
    }).catch(err => {
      console.error('Failed to load projects', err);
      this.isLoading.set(false);
    });
  }

  // Admin CRUD state
  isFormModalOpen = signal<boolean>(false);
  projectToEdit = signal<Project | null>(null);

  openAddModal() {
    this.router.navigate([], { queryParams: { projectEdit: 'new' } });
  }

  openEditModal(project: Project) {
    this.router.navigate([], { queryParams: { projectEdit: (project as any).id } });
  }

  closeFormModal() {
    this.router.navigate([], { queryParams: { projectEdit: null } });
  }

  onSaveComplete() {
    this.loadProjects();
    this.closeModal(); // 상세 시트 닫기
  }

  async deleteProject(project: Project, event?: Event) {
    event?.stopPropagation();
    this.dAlert.yesNo(
      `'${project.title}' 프로젝트를 정말 삭제하시겠습니까?`,
      async () => {
        try {
          await this.projectService.deleteProject((project as any).id);
          this.loadProjects();
          this.closeModal();
          this.dAlert.success('성공적으로 삭제되었습니다.');
        } catch (err) {
          this.dAlert.error('삭제에 실패했습니다.');
        }
      },
      undefined,
      '프로젝트 삭제'
    );
  }

  currentProject = computed(() => this.projects()[this.currentProjectIndex()]);

  selectProject(project: Project): void {
    if (this.projects()[this.currentProjectIndex()] === project) {
      this.router.navigate([], { queryParams: { projectId: (project as any).id } });
    }
  }

  closeModal(): void {
    this.router.navigate([], { queryParams: { projectId: null, projectEdit: null } });
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    // If the modal is open, do not interfere with the native scroll behavior.
    // This allows scrolling within the modal content.
    if (this.selectedProject() || this.isFormModalOpen()) {
      return;
    }

    // If page is scrolling or the project switching is throttled, prevent default.
    if (this.isThrottled || this.isPageScrolling()) {
      event.preventDefault();
      return;
    }

    // Prevent the main page from native scrolling to avoid mixing with JS logic
    event.preventDefault();

    // Ignore microscopic scroll movements (trackpad noise)
    if (Math.abs(event.deltaY) < SCROLL__WHEEL_RANGE) {
      return;
    }

    this.isThrottled = true;

    const isScrollingDown = event.deltaY > 0;
    const projectCount = this.projects().length;

    // If there are no projects loaded yet, just let the scroll pass through immediately
    if (projectCount === 0) {
      this.isThrottled = false;
      this.scrollThrough.emit(isScrollingDown ? 'down' : 'up');
      return;
    }

    const isAtFirst = this.currentProjectIndex() === 0;
    const isAtLast = this.currentProjectIndex() === projectCount - 1;

    if (isScrollingDown) {
      if (!isAtLast) {
        this.currentProjectIndex.update(i => i + 1);
      } else {
        this.scrollThrough.emit('down');
      }
    } else { // Scrolling up
      if (!isAtFirst) {
        this.currentProjectIndex.update(i => i - 1);
      } else {
        this.scrollThrough.emit('up');
      }
    }

    setTimeout(() => {
      this.isThrottled = false;
    }, 800);
  }

  BadgeConfig = BadgeConfig;
}
