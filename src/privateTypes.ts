import { LogConfigurationParameters, LogMethod } from './types';

export interface ChainableBind {
  willLog: boolean;
  log: () => unknown[];
}

export interface ChainableEvents {
  /**
   * Este método es muy importante ya que es el que permite redefinir el comportamiento de #getChainable.
   *
   * Al ser llamado deve en realidad devolver una función, que es la que llamará el chainable al ser ejecutado.
   */
  callback: () => ChainableBind | unknown;
  onConfig: (config: Partial<LogConfigurationParameters>) => void;
  onChangeName: (newName: string) => void;
  onForcedConsole: () => void;
  onForcedReport: () => void;
  onMethod: (method: LogMethod) => void;
  onTemplate: (template: string) => void;
  onSetLevel: (level: number) => void;
}

export interface WithHelp {
  help?: () => void;
}

export interface WithHelpFunction<ArgumentsType = never, ReturnType = void>
  extends WithHelp {
  (args: ArgumentsType): ReturnType;
}
