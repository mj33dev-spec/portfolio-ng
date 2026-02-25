
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  activeSection = signal('home');
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
          this.activeSection.set(entry.target.id);
        }
      });
    }, options);

    sections.forEach(section => {
      this.observer?.observe(section);
    });
  }
}
