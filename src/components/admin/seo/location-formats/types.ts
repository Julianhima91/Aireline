export interface Location {
  id?: string;
  type: 'city' | 'state';
  city: string | null;
  state: string;
  nga_format: string | null;
  per_format: string | null;
  status: 'ready' | 'pending' | 'disabled';
  template_created: boolean;
  template_url: string | null;
}

export type StatusFilter = 'all' | 'ready' | 'pending' | 'disabled';
export type TypeFilter = 'all' | 'city' | 'state';

export interface TemplateType {
  id: string;
  slug: string;
  template: {
    url_structure: string;
  };
}