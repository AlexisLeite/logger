export type Map<
  T = unknown,
  S extends string | number | symbol = string
> = Record<S, T>;

export type LogFunctions = Record<
  'config' | 'eraseConfiguration' | 'getReport' | 'log' | 'shoutConfiguration',
  string
>;

export type LogMethod = keyof Pick<
  typeof console,
  'dir' | 'error' | 'info' | 'log' | 'table' | 'warn'
>;

export interface LogConfigurationParameters {
  consoleEnabled: boolean;
  consoleLevel: number;
  defaultMethod: LogMethod;
  defaultReportName: string;
  levelNames: Record<number, string>;
  persistConfiguration: boolean;
  persistObjectName: string;
  reportEnabled: boolean;
  reportLevel: number;
  reporterName?: string;
  /**
   * Available placeholders:
   * {{REPORTERNAME}}
   * {{LEVEL}}
   * {{BODY}}
   */
  template: string;
}

export interface Log {
  level: number;
  reporterName?: string;
  template?: string;
  what: unknown[];
}
