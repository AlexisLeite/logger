import { LogMethod } from './types';

export interface ChainableEvents {
  callback: () => { willLog: boolean; log: () => unknown[] };
  onForced: () => void;
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
