
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  activeSection = signal('home');
  isPanelOpen = signal(false);
  private observer: IntersectionObserver | undefined;

  observeSections(sections: HTMLElement[]): void {
    this.observer?.disconnect();

    const options = {
      root: sections[0]?.parentElement || null,
      rootMargin: '0px',
      threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    };

    this.observer = new IntersectionObserver((entries) => {
      let mostVisibleSection = '';
      let maxRatio = 0;

      // Find the currently intersecting element with the highest ratio
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          mostVisibleSection = entry.target.id;
        }
      });

      // Also reset maxRatio periodically to allow other sections to become active
      // when we actually scroll to them
      if (mostVisibleSection) {
        this.activeSection.set(mostVisibleSection);

        if (mostVisibleSection === 'home') {
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          if (window.location.hash !== `#${mostVisibleSection}`) {
             window.history.replaceState(null, '', `${window.location.pathname}#${mostVisibleSection}`);
          }
        }
      }
    }, options);

    sections.forEach(section => {
      this.observer?.observe(section);
    });
  }
}
