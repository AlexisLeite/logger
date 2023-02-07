export type Fun<Args, Ret> = (args: Args) => Ret;

export type Map<
  T = unknown,
  S extends string | number | symbol = string
> = Record<S, T>;

export type LogFunctions = Record<
  'config' | 'eraseConfiguration' | 'getReport' | 'log' | 'shoutConfiguration',
  string
>;

export type LogMethod =
  | keyof Pick<
      typeof console,
      'dir' | 'error' | 'info' | 'log' | 'table' | 'warn'
    >
  | 'shout';

export interface LogConfigurationParameters {
  consoleEnabled: boolean;
  consoleLevel: number;
  defaultMethod: Exclude<LogMethod, 'shout'>;
  defaultReportFilename: string;
  levelNames: Record<number, string>;
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

export interface ChainableBind {
  willLog: boolean;
  log: () => unknown[];
}

export interface ChainableEvents<CallbackReturn = ChainableBind | unknown> {
  callback: () => CallbackReturn;
  onConfig: (config: Partial<LogConfigurationParameters>) => void;
  onChangeName: (newName: string) => void;
  onForcedConsole: (shouldShout: boolean) => void;
  onForcedReport: (shouldShout: boolean) => void;
  onMethod: (method: LogMethod) => void;
  onTemplate: (template: string) => void;
  onSetLevel: (level: number) => void;
}

export interface Chain<ReturnType = void> {
  (...args: unknown[]): ReturnType;
  /**
   * When called from fork, changes permanently the default configuration of the fork.
   *
   * When called from a log function, changes the configuration of the current log. Notice that only the following props will be considereed:
      - consoleEnabled
      - consoleLevel
      - defaultMethod (as method)
      - reportEnabled
      - reportLevel
      - reporterName
      - template
   *
   * @param newConfig
   */
  config(newConfig: Partial<LogConfigurationParameters>): Chain<ReturnType>;
  /**
   * When called from a fork, disables console by default for the fork.
   *
   * When called from a log function, disables the console for this log.
   */
  disableConsole(): Chain<ReturnType>;
  /**
   * When called from a fork, disables report log by default for the fork.
   *
   * When called from a log function, disables the report log for it.
   */
  disableReport(): Chain<ReturnType>;
  /**
   * When called from a fork, forces the console by default for the fork.
   *
   * When called from a log function, forces the console for this log.
   */
  forceConsole(): Chain<ReturnType>;
  /**
   * When called from a fork, forces the report log by default for the fork.
   *
   * When called from a log function, forces the report log for it.
   */
  forceReport(): Chain<ReturnType>;
  /**
   * When called from a fork, changes the fork reporterName. This is a very userful characteristic to be able to have multiple reporter names joined in a single report file.
   */
  changeReporterName(newName: string): Chain<ReturnType>;
  /**
   * When called from a fork, by default all logs called on it will use met
   *
   * When called from a log function, forces the console for this log.
   */
  critical(): Chain<ReturnType>;
  dir(): Chain<ReturnType>;
  error(): Chain<ReturnType>;
  info(): Chain<ReturnType>;
  level(newLevel: number): Chain<ReturnType>;
  method(newMethod: LogMethod): Chain<ReturnType>;
  table(): Chain<ReturnType>;
  template(newTemplate: string): Chain<ReturnType>;
  warn(): Chain<ReturnType>;
}

export interface ForkCallee {
  critical: () => Chain;
  dir: () => Chain;
  error: () => Chain;
  info: () => Chain;
  log: () => Chain;
  table: () => Chain;
  warn: () => Chain;
  /**
   * Shout is a special method used to say, shout the log with the current log method. It is specially useful when making forges.
   *
   * @example
   * const fork = logger.fork().critical();
   * fork('Critical error that must be thrown as critical').shout()()
   * fork('A warning').warn()();
   */
  shout: () => Chain;
}

export interface WithHelp {
  help?: () => void;
}

export interface WithHelpFunction<ArgumentsType = never, ReturnType = void>
  extends WithHelp {
  (args: ArgumentsType): ReturnType;
}
