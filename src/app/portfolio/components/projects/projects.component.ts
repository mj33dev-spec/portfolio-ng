import { Component, ChangeDetectionStrategy, signal, computed, HostListener, output, input, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../project.model';
import { ProjectDetailModalComponent } from './project-detail-modal/project-detail-modal.component';
import { CBadgeComponent } from '../c-badge/c-badge.component';
import { ScrollService } from '../../scroll.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProjectDetailModalComponent, CBadgeComponent],
})
export class ProjectsComponent {
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

  projects = signal<Project[]>([
    {
      title: '아이앰히어',
      logo: 'assets/portfolio/iamhere.png',
      status: '유지보수 중단된 플랫폼입니다',
      description: '온라인 가구 쇼핑몰 커머스',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      affiliation: '앨리스래빗',
      serviceTags: ['App', 'Web'],
      roleTags: ['Frontend', 'Publishing'],
      workPeriod: '21년1월18일 ~ 진행중',
      url: '',
      links: [
        { type: 'ios', label: 'iOS 앱', url: 'https://apps.apple.com/kr/app/아이앰히어-k-디자인-리빙-편집샵/id1581543574' },
        { type: 'android', label: 'Android 앱', url: 'https://play.google.com/store/apps/details?id=com.iamhereshop.app&hl=ko' },
        { type: 'web', label: '웹사이트', url: 'https://www.iamhereshop.com' }
      ],
      color: '#292929',
      scopeAndContribution: '앱 프로젝트 생성 및 세팅, 스타일가이드/모든 컴포넌트 모듈화, 앱 UI/동작 구현, iOS 배포, 반응형 웹 퍼블리싱',
      retrospective: '플러터 버전이 오래되어 출시 중단 및 비용 문제로 앱 유지보수 일시 중단',
      developmentEnvironment: ['Flutter', 'node.js', 'Vue'],
      developmentLanguage: ['Dart', 'HTML', 'CSS', 'Javascript'],
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '세컨드트랙',
      logo: 'assets/portfolio/secondtrack.png',
      status: '서비스 중단',
      description: 'LP 중고거래 플랫폼',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      affiliation: '앨리스래빗',
      serviceTags: ['App', 'Web'],
      roleTags: ['Frontend', 'Publishing'],
      workPeriod: '21년12월8일 ~ 22년3월29일',
      url: '',
      links: [
        { type: 'ios', label: 'iOS 앱', url: '#' },
        { type: 'android', label: 'Android 앱', url: '#' }
      ],
      color: 'orange',
      scopeAndContribution: '앱/웹 프로젝트 생성 및 세팅, 스타일가이드/모든 컴포넌트 모듈화, 앱 UI/동작 구현',
      retrospective: '서비스 중단 예정',
      developmentEnvironment: ['Flutter', 'node.js', 'React'],
      developmentLanguage: ['Dart', 'HTML', 'CSS', 'Javascript'],
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '패스트포워드',
      logo: 'assets/portfolio/fastforward.png',
      status: '진행 보류',
      description: '프로틴 쇼핑몰 커머스',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      affiliation: '앨리스래빗',
      serviceTags: ['App', 'Web', 'Admin'],
      roleTags: ['Frontend', 'Publishing'],
      workPeriod: '23년10월17일 ~ 25년3월4일',
      url: '',
      color: 'orange',
      scopeAndContribution: '앱 프로젝트 생성/세팅, 스타일가이드 모듈화, 관리자페이지 프론트엔드 개발',
      retrospective: '계약 문제로 진행 보류',
      developmentEnvironment: ['Flutter', 'Angular', 'node.js'],
      developmentLanguage: ['Dart', 'HTML', 'CSS', 'Typescript'],
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '서한그룹-B2B',
      logo: 'assets/portfolio/seohan.png',
      status: '운영중',
      description: 'B2B 기업 관리 시스템',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      affiliation: '앨리스래빗',
      serviceTags: ['Web', 'Admin'],
      roleTags: ['Frontend', 'Publishing'],
      workPeriod: '24년4월29일 ~ 진행중',
      url: '',
      color: 'orange',
      scopeAndContribution: '프로젝트 세팅, 스타일가이드/모든 CSS 모듈화, 모든 UI 동작 구현',
      retrospective: '유지보수 진행중',
      developmentEnvironment: ['Angular', 'node.js'],
      developmentLanguage: ['HTML', 'CSS', 'Typescript'],
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '서한그룹-안전관리시스템',
      logo: 'assets/portfolio/seohan.png',
      status: '운영중',
      description: '기업 통합 안전관리 시스템',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      affiliation: '앨리스래빗',
      serviceTags: ['Web', 'Admin'],
      roleTags: ['Frontend', 'Publishing'],
      workPeriod: '24년9월6일 ~ 진행중',
      url: '',
      color: 'orange',
      scopeAndContribution: '프로젝트 세팅, 스타일가이드/모든 CSS 모듈화, 모든 UI 동작 구현',
      retrospective: '유지보수 진행중',
      developmentEnvironment: ['Angular', 'node.js'],
      developmentLanguage: ['HTML', 'CSS', 'Typescript'],
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '하이럭스',
      logo: 'assets/portfolio/hilux.png',
      status: '운영중',
      description: '명품 거래 커머스 플랫폼',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      affiliation: '개인 외주',
      serviceTags: ['App', 'Landing', 'Admin'],
      roleTags: ['Frontend', 'Publishing'],
      workPeriod: '24년4월10일 ~ 25년8월1일',
      url: '',
      links: [
        { type: 'ios', label: 'iOS 앱', url: '#' },
        { type: 'android', label: 'Android 앱', url: '#' },
        { type: 'admin', label: '관리자페이지', url: '#' },
        { type: 'web', label: '랜딩페이지', url: '#' }
      ],
      color: 'orange',
      scopeAndContribution: '앱 프로젝트 생성/세팅, 관리자페이지 웹퍼블리싱 일부/개발, 랜딩페이지 개발/배포',
      retrospective: '유지보수 진행중',
      developmentEnvironment: ['Flutter', 'Angular', 'node.js'],
      developmentLanguage: ['Dart', 'HTML', 'CSS', 'Typescript'],
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '뮤키(Mukii)',
      logo: '',
      status: '개발중',
      description: '마산대학교 학생 커뮤니티 플랫폼',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      affiliation: '개인 외주',
      serviceTags: ['App'],
      roleTags: ['Frontend'],
      workPeriod: '25년2월12일 ~ 25년9월3일',
      url: '',
      color: 'orange',
      scopeAndContribution: '앱 스타일가이드/모든 컴포넌트 모듈화, 앱 UI 로직 설계 고도화',
      retrospective: '2차 개발 준비중',
      developmentEnvironment: ['Flutter', 'Angular', 'node.js'],
      developmentLanguage: ['Dart', 'Typescript'],
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: 'P002-태그잇',
      logo: '',
      status: '개발중',
      description: 'NFC 기반 태그잇 서비스',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      affiliation: '팀 프로젝트',
      serviceTags: ['App', 'Admin', 'Demo'],
      roleTags: ['기획', 'Frontend'],
      workPeriod: '25년1월9일 ~ 진행중',
      url: '',
      color: 'orange',
      scopeAndContribution: '데모 앱/정식 앱 생성 및 세팅, 관리자페이지 기획 및 설계/생성/세팅, UI 동작 구현',
      retrospective: '앱, 관리자페이지 프론트엔드 개발 진행중',
      developmentEnvironment: ['Flutter', 'Angular', 'node.js'],
      developmentLanguage: ['Dart', 'HTML', 'CSS', 'Typescript'],
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: 'P004-앨리스메모',
      logo: '',
      status: '개발중',
      description: '유틸리티 메모 앱 서비스',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      affiliation: '개인 프로젝트',
      serviceTags: ['App', 'Landing'],
      roleTags: ['Frontend', 'Publishing'],
      workPeriod: '25년7월6일 ~ 25년8월18일',
      url: '',
      color: '#292929',
      scopeAndContribution: '앱 모든 UI 작업 및 개발, 관리자페이지 웹 퍼블리싱 및 배포',
      retrospective: '2차 개발 및 마케팅 전략 고민중, 랜딩페이지 작업중',
      developmentEnvironment: ['Flutter'],
      developmentLanguage: ['Dart', 'HTML', 'CSS'],
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    }
  ]);

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

    // Prevent the main page from scrolling while we handle project card switching.
    event.preventDefault();

    this.isThrottled = true;

    const isScrollingDown = event.deltaY > 0;
    const isAtFirst = this.currentProjectIndex() === 0;
    const isAtLast = this.currentProjectIndex() === this.projects().length - 1;

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
