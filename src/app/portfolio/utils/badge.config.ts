import { CDropdownOption } from '../components/c-dropdown/c-dropdown.component';

export interface BadgeStyle {
  customColor: string;
  customBgColor: string;
  iconUrl?: string;
}

export interface BadgeDef {
  type: string;
  color: string;
  bgColor?: string;
  icon?: string;
}

export class BadgeConfig {
  static hexToRgba(hex: string, alpha: number): string {
    if (!hex) return '';
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

  static readonly BADGE_LIST: BadgeDef[] = [
    // Services
    { type: 'app', color: '#ef4444' },
    { type: 'web', color: '#4caf50' },
    { type: 'cms', color: '#2196f3' },
    { type: 'admin', color: '#2196f3' },
    { type: 'landing', color: '#8b5cf6' },
    { type: 'batch', color: '#6b7280' },
    { type: 'demo', color: '#6b7280' },
    
    // Roles
    { type: 'frontend', color: '#ff9800' },
    { type: 'publishing', color: '#e91e63' },
    { type: 'backend', color: '#6b7280' },
    { type: 'api', color: '#6b7280' },
    { type: '기획', color: '#14b8a6' },
    { type: 'design', color: '#14b8a6' },
    
    // Status
    { type: '운영중', color: '#10b981' },
    { type: '진행중', color: '#10b981' },
    { type: '중단', color: '#ef4444' },
    { type: '보류', color: '#ef4444' },
    { type: '대기', color: '#f59e0b' },
    
    // Affiliation
    { type: '앨리스래빗', color: '#ffffff', bgColor: '#3b3362', icon: 'assets/portfolio/alicerabbit.png' },
    { type: '개인 프로젝트', color: '#10b981' },
    { type: '개인프로젝트', color: '#10b981' },
    { type: '프리랜서', color: '#f59e0b' },
    
    // Frameworks & Langs
    { type: 'flutter', color: '#38bdf8', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flutter/flutter-original.svg' },
    { type: 'angular', color: '#ef4444', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angular/angular-original.svg' },
    { type: 'react', color: '#61dafb', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
    { type: 'vue', color: '#4ade80', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg' },
    { type: 'next.js', color: '#ffffff', bgColor: 'rgba(107, 114, 128, 0.5)', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg' },
    { type: 'nuxt.js', color: '#00C58E', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nuxtjs/nuxtjs-original.svg' },
    { type: 'nest.js', color: '#E0234E', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nestjs/nestjs-original.svg' },
    { type: 'node.js', color: '#4ade80', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
    { type: 'spring boot', color: '#6db33f', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg' },
    { type: 'mysql', color: '#4479a1', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg' },
    { type: 'mariadb', color: '#003545', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mariadb/mariadb-original.svg' },
    { type: 'postgresql', color: '#336791', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg' },
    { type: 'firebase', color: '#ffca28', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg' },
    { type: 'supabase', color: '#3FCF8E', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg' },
    { type: 'dart', color: '#0175C2', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg' },
    { type: 'typescript', color: '#60a5fa', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg' },
    { type: 'javascript', color: '#facc15', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg' },
    { type: 'html', color: '#f97316', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg' },
    { type: 'css', color: '#3b82f6', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg' },
    { type: 'scss', color: '#cc6699', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sass/sass-original.svg' },
    { type: 'java', color: '#b07219', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg' },
    { type: 'python', color: '#3776ab', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
    { type: 'c#', color: '#178600', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg' }
  ];

  static get(badge: string): BadgeStyle {
    if (!badge) {
      return {
        customColor: '#9ca3af',
        customBgColor: this.hexToRgba('#9ca3af', 0.15)
      };
    }

    const lowerBadge = badge.toLowerCase();
    
    // Find matching badge definition
    let config = this.BADGE_LIST.find(b => b.type === lowerBadge);
    
    if (!config) {
      // Fallback for partial matches
      config = this.BADGE_LIST.find(b => lowerBadge.includes(b.type));
    }

    const color = config?.color || '#9ca3af';
    const bgColor = config?.bgColor || this.hexToRgba(color, 0.15);
    const iconUrl = config?.icon;

    return { customColor: color, customBgColor: bgColor, iconUrl };
  }

  static getStatusClass(status: string): string {
    if (!status) return 'status-pending';
    if (status.includes('운영중') || status.includes('진행중')) return 'status-active';
    if (status.includes('중단') || status.includes('보류')) return 'status-inactive';
    return 'status-pending';
  }

  private static createOption(label: string, value?: string): CDropdownOption {
    const val = value !== undefined ? value : label;
    const style = this.get(label);
    return {
      label,
      value: val,
      customColor: style.customColor,
      customBgColor: style.customBgColor,
      image: style.iconUrl
    };
  }

  static readonly AFFILIATION_OPTIONS: CDropdownOption[] = [
    BadgeConfig.createOption('앨리스래빗'),
    BadgeConfig.createOption('개인프로젝트'),
    BadgeConfig.createOption('프리랜서'),
    BadgeConfig.createOption('기타')
  ];

  static readonly STATUS_OPTIONS: CDropdownOption[] = [
    BadgeConfig.createOption('운영중'),
    BadgeConfig.createOption('운영중단됨')
  ];

  static readonly VISIBILITY_OPTIONS: CDropdownOption[] = [
    { label: '노출', value: true },
    { label: '비노출', value: false }
  ];

  static readonly SERVICE_OPTIONS: CDropdownOption[] = [
    BadgeConfig.createOption('App'),
    BadgeConfig.createOption('Web'),
    BadgeConfig.createOption('Admin'),
    BadgeConfig.createOption('Landing'),
    BadgeConfig.createOption('API'),
    BadgeConfig.createOption('Batch'),
    BadgeConfig.createOption('기타')
  ];

  static readonly ROLE_OPTIONS: CDropdownOption[] = [
    BadgeConfig.createOption('Frontend'),
    BadgeConfig.createOption('Publishing'),
    BadgeConfig.createOption('Backend'),
    BadgeConfig.createOption('Design')
  ];

  static readonly ENV_OPTIONS: CDropdownOption[] = [
    BadgeConfig.createOption('Flutter'),
    BadgeConfig.createOption('Angular'),
    BadgeConfig.createOption('React'),
    BadgeConfig.createOption('Vue'),
    BadgeConfig.createOption('Next.js'),
    BadgeConfig.createOption('Nuxt.js'),
    BadgeConfig.createOption('Nest.js'),
    BadgeConfig.createOption('node.js'),
    BadgeConfig.createOption('Spring Boot'),
    BadgeConfig.createOption('MySQL'),
    BadgeConfig.createOption('MariaDB'),
    BadgeConfig.createOption('PostgreSQL'),
    BadgeConfig.createOption('Firebase'),
    BadgeConfig.createOption('Supabase'),
    BadgeConfig.createOption('기타')
  ];

  static readonly LANG_OPTIONS: CDropdownOption[] = [
    BadgeConfig.createOption('Dart'),
    BadgeConfig.createOption('Typescript'),
    BadgeConfig.createOption('Javascript'),
    BadgeConfig.createOption('HTML'),
    BadgeConfig.createOption('CSS'),
    BadgeConfig.createOption('SCSS'),
    BadgeConfig.createOption('Java'),
    BadgeConfig.createOption('Python'),
    BadgeConfig.createOption('C#'),
    BadgeConfig.createOption('기타')
  ];
}
