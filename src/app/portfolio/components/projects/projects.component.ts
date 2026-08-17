import { Component, ChangeDetectionStrategy, signal, computed, HostListener, output, input, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../project.model';
import { ProjectDetailModalComponent } from './project-detail-modal/project-detail-modal.component';
import { CBadgeComponent } from '../c-badge/c-badge.component';
import { ScrollService } from '../../scroll.service';
import { ProjectService } from '../../project.service';
import { AuthService } from '../../auth.service';
import { ProjectFormModalComponent } from './project-form-modal/project-form-modal';
import { DAlertService } from '../d-alert/d-alert.service';
import { BadgeConfig } from '../../utils/badge.config';

const SCROLL__WHEEL_RANGE: number = 3;

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProjectDetailModalComponent, CBadgeComponent, ProjectFormModalComponent],
})
export class ProjectsComponent {
  authService = inject(AuthService);
  private scrollService = inject(ScrollService);
  private projectService = inject(ProjectService);
  private dAlert = inject(DAlertService);

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

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.isLoading.set(true);
    this.projectService.fetchProjects().then(data => {
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
    this.projectToEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(project: Project) {
    this.projectToEdit.set(project);
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.projectToEdit.set(null);
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
      this.selectedProject.set(project);
    }
  }

  closeModal(): void {
    this.selectedProject.set(null);
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
