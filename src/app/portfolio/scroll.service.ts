
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
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          this.activeSection.set(id);
          if (id === 'home') {
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          } else {
            if (window.location.hash !== `#${id}`) {
               window.history.replaceState(null, '', `${window.location.pathname}#${id}`);
            }
          }
        }
      });
    }, options);

    sections.forEach(section => {
      this.observer?.observe(section);
    });
  }
}
