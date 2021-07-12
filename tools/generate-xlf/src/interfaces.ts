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

export interface Xliff {
  file: {
    body: {
      ['trans-unit']: Array<{
        '@_id': string;
        source: string;
        target: { ['#text']: string; '@_state': 'new' | 'final' | 'translated' | 'needs-translation' };
      }>;
    };
  };
}
