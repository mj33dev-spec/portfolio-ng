export interface ProjectLink {
  type: 'ios' | 'android' | 'web' | 'admin' | 'github' | 'figma' | 'document' | 'other';
  label: string;
  url: string;
}

export interface ProjectPlatform {
  id?: string;
  project_id?: string;
  type: string;
  status: string;
  is_visible: boolean;
  role_tags: string[];
  development_environment?: string[];
  development_language?: string[];
  platform_images?: {
    pc: string;
    tablet: string;
    mobile: string;
  };
  sort_order: number;
  links?: { label: string; url: string; }[];
  created_at?: string;
}

export interface Project {
  id?: string;
  title: string;
  logo: string;
  status: string;
  description: string;
  affiliation: string;
  imageUrl: string;
  serviceTags: string[];
  roleTags?: string[];
  workPeriod?: string;
  url: string;
  links?: ProjectLink[];
  color?: string;
  scopeAndContribution?: string;
  retrospective?: string;
  retrospective_link?: string;
  developmentEnvironment?: string[];
  developmentLanguage?: string[];
  platformImages: {
    pc: string;
    tablet: string;
    mobile: string;
  };
  is_visible?: boolean;
  platforms?: ProjectPlatform[];
}
