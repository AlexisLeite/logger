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
  what: string[];
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
    private config: LogConfigurationParameters,
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
              Object.assign(this, newConfig);
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
            () => {
              downloadReport(
                this.logs
                  .map((current) =>
                    current.what.map((log) => `[${current.level}]: ${log}\n\r`),
                  )
                  .join(''),
              );
            },
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

  private logs: Log[] = [];

  public log(what: string[]): void;

  public log(logLevel: number, what: string[]): void;

  public log(par1: string[] | number, par2?: string[]): void {
    const what = Array.isArray(par1) ? par1 : (par2 as string[]);
    const level = typeof par1 === 'number' ? par1 : Infinity;
    this.logs.push({ level, what });

    if (this.config.enabled && this.config.level <= level) {
      console.log(...what);
    }
  }
}
