
import { Component, ChangeDetectionStrategy, signal, ElementRef, viewChild, afterNextRender, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HomeComponent } from './components/home/home.component';
import { PhilosophyComponent } from './components/philosophy/philosophy.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { CareerComponent } from './components/career/career.component';
import { BoardComponent } from './components/board/board.component';
import { ContactComponent } from './components/contact/contact.component';
import { DAlertComponent } from './components/d-alert/d-alert.component';
import { ScrollService } from './scroll.service';

@Component({
  selector: 'app-portfolio-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SidebarComponent,
    HomeComponent,
    PhilosophyComponent,
    ProjectsComponent,
    CareerComponent,
    BoardComponent,
    ContactComponent,
    DAlertComponent
  ],
})
export class AppComponent {
  private scrollService = inject(ScrollService);
  private elementRef = inject(ElementRef);

  mainContainer = viewChild<ElementRef<HTMLElement>>('mainContainer');

  isSidebarOpen = signal(false);
  activeSection = this.scrollService.activeSection;
  isScrolling = signal(false);

  sections = [
    { id: 'home', name: 'Home' },
    { id: 'philosophy', name: 'Philosophy' },
    { id: 'projects', name: 'Projects' },
    { id: 'career', name: 'Career' },
    { id: 'board', name: 'blog' },
    { id: 'contact', name: 'Contact' }
  ];

  constructor() {
    afterNextRender(() => {
      const container = this.mainContainer()?.nativeElement;
      if (container) {
        this.scrollService.observeSections(
          Array.from(container.children) as HTMLElement[]
        );
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(open => !open);
  }

  scrollToSection(id: string): void {
    const sectionElement = this.elementRef.nativeElement.querySelector(`#${id}`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
    this.isSidebarOpen.set(false);
  }

  handleScrollThrough(direction: 'up' | 'down'): void {
    if (this.isScrolling()) {
      return;
    }

    const currentIdx = this.sections.findIndex(s => s.id === 'projects');
    let nextSection: { id: string, name: string } | undefined;

    if (direction === 'down' && currentIdx < this.sections.length - 1) {
      nextSection = this.sections[currentIdx + 1];
    } else if (direction === 'up' && currentIdx > 0) {
      nextSection = this.sections[currentIdx - 1];
    }

    if (nextSection) {
      this.isScrolling.set(true);
      this.scrollToSection(nextSection.id);
      setTimeout(() => {
        this.isScrolling.set(false);
      }, 1000);
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    const target = event.target as HTMLElement;
    
    // If a panel is open, strictly lock global one-sheet scrolling
    if (this.scrollService.isPanelOpen()) {
      // Allow native scrolling ONLY inside the panel's scrollable body
      if (!target.closest('.panel-body')) {
        event.preventDefault();
      }
      return;
    }

    if (target.closest('app-projects')) {
      return;
    }

    if (this.isScrolling()) {
      event.preventDefault();
      return;
    }

    const currentSectionId = this.activeSection();
    const currentIdx = this.sections.findIndex(s => s.id === currentSectionId);
    if (currentIdx === -1) return;

    const isScrollingDown = event.deltaY > 0;
    let nextSection: { id: string, name: string } | undefined;

    if (isScrollingDown && currentIdx < this.sections.length - 1) {
      nextSection = this.sections[currentIdx + 1];
    } else if (!isScrollingDown && currentIdx > 0) {
      nextSection = this.sections[currentIdx - 1];
    }

    if (nextSection) {
      event.preventDefault();
      this.isScrolling.set(true);
      this.scrollToSection(nextSection.id);
      setTimeout(() => {
        this.isScrolling.set(false);
      }, 1000);
    }
  }
}
