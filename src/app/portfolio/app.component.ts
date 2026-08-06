
import { Component, ChangeDetectionStrategy, signal, ElementRef, viewChild, afterNextRender, inject, HostListener, NgZone } from '@angular/core';
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
  private ngZone = inject(NgZone);

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

        // Handle initial load with URL hash (e.g., localhost:4200/#blog)
        setTimeout(() => {
          const hash = window.location.hash.replace('#', '');
          if (hash) {
            // Find section by id or name
            const targetSection = this.sections.find(s => s.id === hash || s.name === hash);
            if (targetSection) {
              this.scrollToSection(targetSection.id);
            } else {
              this.scrollToSection(hash); // Fallback
            }
          }
        }, 100);
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(open => !open);
  }

  private scrollAnimationId: number | null = null;

  scrollToSection(id: string): void {
    const sectionElement = this.elementRef.nativeElement.querySelector(`#${id}`);
    const container = this.mainContainer()?.nativeElement;
    
    if (sectionElement && container) {
      if (window.location.hash !== `#${id}`) {
        window.history.pushState(null, '', `${window.location.pathname}#${id}`);
      }
      
      // Set scrolling state to prevent trackpad wheel events from interrupting
      this.isScrolling.set(true);

      // Temporarily disable scroll-snap and native smooth scrolling to prevent CSS conflicts
      container.style.scrollSnapType = 'none';
      container.style.scrollBehavior = 'auto';

      if (this.scrollAnimationId !== null) {
        cancelAnimationFrame(this.scrollAnimationId);
        this.scrollAnimationId = null;
      }
      
      const startPosition = container.scrollTop;
      const targetPosition = sectionElement.offsetTop;
      const distance = targetPosition - startPosition;
      const duration = 800; // 800ms for a slow, premium smooth transition
      let startTime: number | null = null;

      // easeInOutSine: most natural feeling curve, identical to standard CSS ease-in-out
      const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

      const animation = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        container.scrollTop = startPosition + distance * easeInOutSine(progress);

        if (timeElapsed < duration) {
          this.scrollAnimationId = requestAnimationFrame(animation);
        } else {
          // Re-enable scroll-snap and CSS smooth scrolling after animation finishes
          container.style.scrollSnapType = '';
          container.style.scrollBehavior = '';
          this.scrollAnimationId = null;
          
          // Add a 200ms cooldown before releasing the scroll lock to absorb any remaining trackpad momentum
          setTimeout(() => {
            this.ngZone.run(() => {
              this.isScrolling.set(false);
            });
          }, 200);
        }
      };

      this.ngZone.runOutsideAngular(() => {
        this.scrollAnimationId = requestAnimationFrame(animation);
      });
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
      this.scrollToSection(nextSection.id);
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

    // ALWAYS prevent default to stop native scroll from mixing with custom scroll
    event.preventDefault();

    // Ignore microscopic scroll movements (trackpad noise) but allow single mouse wheel notches (deltaY > 5)
    if (Math.abs(event.deltaY) < 5) {
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
      this.scrollToSection(nextSection.id);
    }
  }
}
