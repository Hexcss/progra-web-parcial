export type LazyRouteModule = {
  Component: React.ComponentType;
  loadingMessage?: string;
};

export const routeIds = {
  login: 'login',
  signup: 'signup',
  unauthorized: 'unauthorized',
} as const;

export interface DrawerItem {
  text: string;
  icon: React.ElementType;
  path: string;
  disabled?: boolean;
  scope?: string;
  selectedPaths: string[];
  openInNewTab?: boolean;
  conditionalRender?: (context: Record<string, unknown>) => boolean;
  getPath?: (context: Record<string, unknown>) => string | undefined | null;
}

export interface DrawerSection {
  title?: string;
  showTitle?: boolean;
  items: DrawerItem[];
  conditionalRender?: (context: Record<string, unknown>) => boolean;
}

export type DrawerRenderContext = {
  [key: string]: unknown;
};