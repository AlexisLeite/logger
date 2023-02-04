import { TMap, WithHelp } from './types';

type LogFunctions = 'consoleConfig' | 'getReport';

interface LogConfigurationParameters {
  enabled: boolean;
  level: number;
}

interface LogConfigurationFunction extends WithHelp {
  (config: LogConfigurationParameters): void;
}

interface Log {
  level: number;
  what: unknown[];
}

function downloadReport(report: string, filename = 'report.txt') {
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    `data:text/plain;charset=utf-8,${encodeURIComponent(report)}`,
  );
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export default class Logger {
  constructor(
    private _config: LogConfigurationParameters,
    consoleMethods: { [key in LogFunctions]: string },
  ) {
    Object.entries(consoleMethods).forEach(([key, value]) => {
      switch (key as LogFunctions) {
        case 'consoleConfig': {
          const consoleConfig: LogConfigurationFunction = Object.assign(
            {
              help: () => {
                console.log(`With the method window.${value} you can configure this logger. The argument must be {
  enabled: boolean;
  logLevel: number;
}`);
              },
            },
            (newConfig: LogConfigurationParameters) => {
              this.config(newConfig);
            },
          );
          (window as unknown as TMap<LogConfigurationFunction>)[value] =
            consoleConfig;
          break;
        }
        case 'getReport': {
          const getReport: LogConfigurationFunction = Object.assign(
            {
              help: () => {
                console.log(
                  `With the method window.${value} get a report about the logs made through this logger.`,
                );
              },
            },
            () => this.getReport(),
          );
          (window as unknown as TMap<LogConfigurationFunction>)[value] =
            getReport;

          break;
        }

        default:
          break;
      }
    });
  }

  /**
   * Erases all the records stored in the inner buffer.
   */
  erase() {
    this.logs = [];
  }

  #formatReport(log: Log) {
    return log.what.map(
      (current) =>
        `${log.level !== Infinity ? `[${log.level}]` : '[]'}: ${(
          current as string
        ).toString()}\n\r`,
    );
  }

  /**
   * Will download a document with all reports made since the last erase or since it started.
   */
  getReport() {
    downloadReport(
      this.logs.map((current) => this.#formatReport(current)).join(''),
    );
  }

  private logs: Log[] = [];

  /**
   * @param what Whatever you want to throw to the console (or the report)
   */
  public log(...what: unknown[]): void;

  /**
   * @param level The level of the log, if any level is configured (through constructor or through logger.config). It will show the log on the console only if the log level matches the configuration. The log will be added to the report always.
   * @param what Whatever you want to throw to the console (or the report)
   */
  public log(level: number, ...what: unknown[]): void;

  public log(
    par1: unknown[] | number,
    par2?: unknown[],
    ...r: unknown[]
  ): void {
    const what = Array.isArray(par1)
      ? [par1, par2, ...r]
      : [par2 as unknown[], ...r];
    const level = typeof par1 === 'number' ? par1 : Infinity;
    this.logs.push({ level, what });

    if (this._config.enabled && this._config.level <= level) {
      console.log(this.#formatReport({ level, what }));
    }
  }

  public config(newConfig: Partial<LogConfigurationParameters>) {
    Object.assign(this._config, newConfig);
  }
}
