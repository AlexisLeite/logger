export type Map<
  T = unknown,
  S extends string | number | symbol = string
> = Record<S, T>;

export interface WithHelp {
  help?: () => void;
}

export interface WithHelpFunction<ArgumentsType = never, ReturnType = void>
  extends WithHelp {
  (args: ArgumentsType): ReturnType;
}

export type LogFunctions = Record<
  'consoleLog' | 'consoleConfig' | 'getReport' | 'shoutConfiguration',
  string
>;

export type LogMethod = keyof Pick<
  typeof console,
  'dir' | 'error' | 'group' | 'info' | 'log' | 'table' | 'warn'
>;

export interface LogConfigurationParameters {
  consoleEnabled: boolean;
  consoleLevel: number;
  defaultMethod: LogMethod;
  defaultName: string;
  levelNames: Record<number, string>;
  persistConfiguration: boolean;
  persistObjectName: string;
  reportEnabled: boolean;
  reportLevel: number;
  /**
   * Available placeholders:
   * {{LEVEL}}
   * {{BODY}}
   */
  template: string;
}

export interface Log {
  level: number;
  what: unknown[];
}

export interface ChainableEvents {
  onForced: () => void;
  onMethod: (method: LogMethod) => void;
  onSetLevel: (level: number) => void;
}
