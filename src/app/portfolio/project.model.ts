
export interface Project {
  title: string;
  logo: string;
  description: string;
  imageUrl: string;
  tags: string[];
  workPeriod: string;
  url: string;
  color: string;
  scopeAndContribution: string;
  retrospective: string;
  developmentEnvironment: string;
  developmentLanguage: string;
  platformImages: {
    pc: string;
    tablet: string;
    mobile: string;
  };
}
