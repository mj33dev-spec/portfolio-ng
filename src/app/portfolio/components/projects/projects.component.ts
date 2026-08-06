import { Component, ChangeDetectionStrategy, signal, computed, HostListener, output, input, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../project.model';
import { ProjectDetailModalComponent } from './project-detail-modal/project-detail-modal.component';
import { CBadgeComponent } from '../c-badge/c-badge.component';
import { ScrollService } from '../../scroll.service';
import { ProjectService } from '../../project.service';
import { AuthService } from '../../auth.service';
import { ProjectFormModalComponent } from './project-form-modal/project-form-modal';

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

  private projectService = inject(ProjectService);

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.isLoading.set(true);
    this.projectService.fetchProjects().then(data => {
      this.projects.set(data);
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

  async deleteProject(project: Project, event: Event) {
    event.stopPropagation();
    if (confirm(`'${project.title}' 프로젝트를 정말 삭제하시겠습니까?`)) {
      try {
        await this.projectService.deleteProject((project as any).id);
        this.loadProjects();
      } catch (err) {
        alert('삭제에 실패했습니다.');
      }
    }
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
    if (this.selectedProject()) {
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
      return '#3B3362'; // Alice Rabbit custom solid background
    }
    const hex = this.getTagColor(tag);
    return this.hexToRgba(hex, 0.15);
  }

  getTagIcon(tag: string): string | undefined {
    if (!tag) return undefined;
    const lowerTag = tag.toLowerCase();
    if (lowerTag.includes('앨리스래빗')) {
      return 'assets/portfolio/alicerabbit.png';
    }
    // Generic icons using devicons if possible, or just return undefined
    return undefined;
  }
}
