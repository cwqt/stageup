export interface WorkspaceProject {
  root: string;
  sourceRoot: string;
  projectType: 'application' | 'library';
  i18n: {
    preRun?: string;
    sources: string[];
    path?: string;
    locales: string[];
  };
  prefix: string;
  targets: any;
}
