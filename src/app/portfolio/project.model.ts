export interface ProjectLink {
  type: 'ios' | 'android' | 'web' | 'admin' | 'github' | 'figma' | 'document' | 'other';
  label: string;
  url: string;
}

export interface Project {
  title: string;
  logo: string;
  status: string;
  description: string;
  affiliation: string;
  imageUrl: string;
  serviceTags: string[];
  roleTags: string[];
  workPeriod: string;
  url: string;
  links?: ProjectLink[];
  color: string;
  scopeAndContribution: string;
  retrospective: string;
  developmentEnvironment: string[];
  developmentLanguage: string[];
  platformImages: {
    pc: string;
    tablet: string;
    mobile: string;
  };
}
