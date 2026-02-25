
import { Component, ChangeDetectionStrategy, signal, computed, HostListener, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../project.model';
import { ProjectDetailModalComponent } from './project-detail-modal/project-detail-modal.component';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ProjectDetailModalComponent],
})
export class ProjectsComponent {
  isPageScrolling = input<boolean>(false);
  private isThrottled = false;
  currentProjectIndex = signal(0);
  selectedProject = signal<Project | null>(null);

  scrollThrough = output<'up' | 'down'>();

  projects = signal<Project[]>([
    {
      title: '케어패스프로',
      logo: '',
      description: '요양보호사 CBT 문제풀이 및 시험 관리 플랫폼입니다.',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      tags: ['Web', 'CMS'],
      workPeriod: '2024-04-10 ~ 2025-08-01',
      url: 'https://www.google.com',
      color: 'orange',
      scopeAndContribution: 'Design, Publish, Frontend, Backend',
      retrospective: '자격증 시험을 모의로 응시할 수 있도록 모든 개발을 진행하였습니다.',
      developmentEnvironment: 'Angular, Nest.js',
      developmentLanguage: 'HTML5, CSS3, SCSS, TypeScript',
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '하이럭스',
      logo: '',
      description: '명품거래 플랫폼',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      tags: ['App', 'CMS', 'Landing Page'],
      workPeriod: '2024-04-10 ~ 2025-08-01',
      url: 'https://www.google.com',
      color: 'orange',
      scopeAndContribution: 'Publish, Frontend, Backend, DevOps',
      retrospective: '앱과 관리자페이지, 랜딩페이지를 퍼블리싱하고 프론트엔드 개발을 주도하여 진행하였습니다. 간단한 쿼리는 커스텀하여 구현하였습니다. 안드로이드와 iOS 앱 출시 및 유지보수를 진행하였습니다.',
      developmentEnvironment: 'Figma, Flutter, Angular, Node.js',
      developmentLanguage: 'HTML5, CSS3, SCSS, Dart, JavaScript, TypeScript, Nest.js',
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '패스트포워드',
      logo: '',
      description: '프로틴 쇼핑몰 앱',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      tags: ['App', 'CMS', 'Landing Page'],
      workPeriod: '2024-04-10 ~ 2025-08-01',
      url: 'https://www.google.com',
      color: 'orange',
      scopeAndContribution: 'Publish, Frontend, DevOps',
      retrospective: '앱과 관리자페이지, 랜딩페이지를 퍼블리싱하고 프론트엔드 개발을 주도하여 진행하였습니다. 간단한 쿼리는 커스텀하여 구현하였습니다. 안드로이드와 iOS 앱 출시 및 유지보수를 진행하였습니다.',
      developmentEnvironment: 'Figma, Flutter, Angular',
      developmentLanguage: 'HTML5, CSS3, SCSS, Dart, JavaScript, TypeScript',
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '뮤키',
      logo: '',
      description: '마산대학교 커뮤니티 앱',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      tags: ['App', 'CMS'],
      workPeriod: '2025.02.12 ~ 2025.09.03',
      url: 'https://www.google.com',
      color: 'orange',
      scopeAndContribution: 'Publish, Frontend',
      retrospective: '앱과 관리자페이지를 퍼블리싱하고 프론트엔드 개발을 주도하여 진행하였습니다.',
      developmentEnvironment: 'Figma, Flutter, Angular',
      developmentLanguage: 'HTML5, CSS3, SCSS, Dart, JavaScript, TypeScript',
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '서한그룹-안전관리시스템',
      logo: '',
      description: '기업 안전관리시스템',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      tags: ['Web'],
      workPeriod: '2024-09-06 ~ 2024-10-06',
      url: 'https://www.google.com',
      color: 'orange',
      scopeAndContribution: 'Web Publish',
      retrospective: '웹퍼블리싱 작업을 진행하였습니다. \n대기업 특성상 유지보수성을 고려하였고, 개발 코드조각과 혼선이 없도록 UI 설계에 특히 신경을 기울여 작업하였습니다. 반복적인 스타일은 공통으로 분리하고 scss 사용으로 재사용성 코드를 모듈화 하였습니다.',
      developmentEnvironment: 'Angular, Figma',
      developmentLanguage: 'HTML5, CSS3, SCSS, TypeScript',
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '서한그룹-B2B',
      logo: '',
      description: 'B2B 관리시스템',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      tags: ['Web'],
      workPeriod: '2024-04-29 ~ 2024-05-29',
      url: 'https://www.google.com',
      color: 'orange',
      scopeAndContribution: 'Web Publish',
      retrospective: '웹퍼블리싱 작업을 진행하였습니다. \n대기업 특성상 유지보수성을 고려하였고, 개발 코드조각과 혼선이 없도록 UI 설계에 특히 신경을 기울여 작업하였습니다. 반복적인 스타일은 공통으로 분리하고 scss 사용으로 재사용성 코드를 모듈화 하였습니다.',
      developmentEnvironment: 'Angular, Figma',
      developmentLanguage: 'HTML5, CSS3, SCSS, TypeScript',
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '세컨드트랙',
      logo: '',
      description: 'LP 중고거래 플랫폼',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      tags: ['App', 'Web'],
      workPeriod: '2021.12.08 ~ 2022.03.29',
      url: 'https://www.google.com',
      color: 'orange',
      scopeAndContribution: 'App, Web Publish',
      retrospective: '앱, 웹 프론트엔드 개발을 경험할 수 있었습니다.',
      developmentEnvironment: 'Figma, Flutter',
      developmentLanguage: 'Dart',
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '아이앰히어',
      logo: '',
      description: '온라인 가구 쇼핑몰',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      tags: ['App'],
      workPeriod: '2021.01.18 ~',
      url: 'https://www.iamhereshop.com',
      color: '#292929',
      scopeAndContribution: '앱 UI 및 프론트엔드 개발 & 앱 유지보수',
      retrospective: '가장 인상 깊었던 첫 프로젝트 였습니다. 이 프로젝트를 통해 앱 개발의 전반적인 과정을 경험할 수 있었습니다.',
      developmentEnvironment: 'Photoshop, Ilustrator, Zeplin, Flutter',
      developmentLanguage: 'Dart',
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
    {
      title: '앨리스메모',
      logo: '',
      description: '유틸리티 메모 앱',
      imageUrl: 'https://picsum.photos/seed/project2/800/600',
      tags: ['App'],
      workPeriod: '2025.07.06 ~ 2025.08.18',
      url: 'https://www.iamhereshop.com',
      color: '#292929',
      scopeAndContribution: 'Frontend, DevOps',
      retrospective: '앱을 직접 개발하였으며 광고를 연동하여 수익을 창출하였습니다.',
      developmentEnvironment: 'Figma, Flutter',
      developmentLanguage: 'Dart',
      platformImages: {
        pc: 'https://picsum.photos/seed/dashboard-pc/1024/640',
        tablet: 'https://picsum.photos/seed/dashboard-tablet/768/1024',
        mobile: 'https://picsum.photos/seed/dashboard-mobile/375/667'
      }
    },
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
}
