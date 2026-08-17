import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CBadgeComponent, BadgeSize } from '../c-badge/c-badge.component';

interface CategoryConfig {
  iconUrl?: string;
  customColor?: string;
  customBgColor?: string;
  variant?: string;
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  'Flutter': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flutter/flutter-original.svg',
    customColor: '#38bdf8', // Sky blue
    customBgColor: 'rgba(56, 189, 248, 0.15)',
  },
  'Angular': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angular/angular-original.svg',
    customColor: '#ef4444',
    customBgColor: 'rgba(239, 68, 68, 0.15)',
  },
  'React': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
    customColor: '#61dafb',
    customBgColor: 'rgba(97, 218, 251, 0.15)',
  },
  'Vue': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg',
    customColor: '#4ade80',
    customBgColor: 'rgba(74, 222, 128, 0.15)',
  },
  'HTML': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
    customColor: '#f97316',
    customBgColor: 'rgba(249, 115, 22, 0.15)',
  },
  'CSS': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg',
    customColor: '#3b82f6',
    customBgColor: 'rgba(59, 130, 246, 0.15)',
  },
  'Javascript': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
    customColor: '#facc15',
    customBgColor: 'rgba(250, 204, 21, 0.15)',
  },
  'Typescript': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
    customColor: '#60a5fa',
    customBgColor: 'rgba(96, 165, 250, 0.15)',
  },
  'node.js': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg',
    customColor: '#4ade80',
    customBgColor: 'rgba(74, 222, 128, 0.15)',
  },
  'Nest.js': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nestjs/nestjs-original.svg',
    customColor: '#E0234E',
    customBgColor: 'rgba(224, 35, 78, 0.15)',
  },
  'Next.js': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg',
    customColor: '#ffffff',
    customBgColor: 'rgba(107, 114, 128, 0.5)',
  },
  'Nuxt.js': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nuxtjs/nuxtjs-original.svg',
    customColor: '#00C58E',
    customBgColor: 'rgba(0, 197, 142, 0.15)',
  },
  'Spring Boot': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg',
    customColor: '#6db33f',
    customBgColor: 'rgba(109, 179, 63, 0.15)',
  },
  'MySQL': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg',
    customColor: '#4479a1',
    customBgColor: 'rgba(68, 121, 161, 0.15)',
  },
  'MariaDB': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mariadb/mariadb-original.svg',
    customColor: '#003545',
    customBgColor: 'rgba(0, 53, 69, 0.15)',
  },
  'PostgreSQL': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg',
    customColor: '#336791',
    customBgColor: 'rgba(51, 103, 145, 0.15)',
  },
  'Firebase': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg',
    customColor: '#ffca28',
    customBgColor: 'rgba(255, 202, 40, 0.15)',
  },
  'Dart': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg',
    customColor: '#0175C2',
    customBgColor: 'rgba(1, 117, 194, 0.15)',
  },
  'SCSS': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sass/sass-original.svg',
    customColor: '#cc6699',
    customBgColor: 'rgba(204, 102, 153, 0.15)',
  },
  'Java': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg',
    customColor: '#b07219',
    customBgColor: 'rgba(176, 114, 25, 0.15)',
  },
  'Database': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azuresqldatabase/azuresqldatabase-original.svg',
    customColor: '#9ca3af',
    customBgColor: 'rgba(156, 163, 175, 0.15)',
  }
};

@Component({
  selector: 'c-category-badge',
  standalone: true,
  imports: [CommonModule, CBadgeComponent],
  template: `
    <c-badge
      [label]="category"
      [size]="size"
      [variant]="$any(config().variant || 'warning')"
      [iconUrl]="config().iconUrl"
      [customColor]="config().customColor"
      [customBgColor]="config().customBgColor"
    ></c-badge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBadgeComponent {
  @Input() set category(val: string) {
    this._category.set(val);
  }
  get category() {
    return this._category();
  }
  
  @Input() size: BadgeSize = 'sm';

  private _category = signal<string>('');

  config = computed(() => {
    const target = this._category().toLowerCase();
    const key = Object.keys(CATEGORY_MAP).find(k => k.toLowerCase() === target);
    return key ? CATEGORY_MAP[key] : { variant: 'warning' };
  });
}
