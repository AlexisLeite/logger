export type TMap<
  T = unknown,
  S extends string | number | symbol = string,
> = Record<S, T>;

export interface WithHelp {
  help: () => void;
}
