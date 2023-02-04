import {
  ChainableEvents,
  Log,
  LogConfigurationParameters,
  LogFunctions,
  LogMethod,
  Map,
  WithHelpFunction
} from './types';
import { downloadReport } from './util';

export default class Logger {
  private _config: LogConfigurationParameters;

  private logs: Log[] = [];

  constructor(
    consoleMethods?: Partial<LogFunctions>,
    config?: Partial<LogConfigurationParameters>
  ) {
    const persistObjectName = config?.persistObjectName ?? 'loggerPersist';
    const storedConfig = localStorage.getItem(persistObjectName);
    const nonStoredConfig: LogConfigurationParameters = {
      consoleEnabled: true,
      consoleLevel: 2,
      defaultMethod: 'log',
      defaultName: 'report.txt',
      levelNames: {
        0: 'CRITICAL',
        1: 'ERROR',
        2: 'WARNING',
        3: 'INFO'
      },
      persistConfiguration: true,
      persistObjectName,
      reportEnabled: true,
      reportLevel: Infinity,
      template: '[{{LEVEL}}]: {{BODY}}',
      ...config
    };
    this._config = storedConfig
      ? (JSON.parse(storedConfig) as LogConfigurationParameters)
      : nonStoredConfig;
    this.#persistConfiguration();

    if (consoleMethods) {
      Object.entries(consoleMethods).forEach(([key, value]) => {
        switch (key as keyof LogFunctions) {
          case 'consoleConfig': {
            const consoleConfig: WithHelpFunction<
              LogConfigurationParameters
            > = (newConfig) => {
              this.config(newConfig);
            };
            consoleConfig.help = () => {
              console.log(`With the method window.${value} you can configure this logger. The argument must be {
  enabled: boolean;
  logLevel: number;
}`);
            };
            (window as unknown as Map<WithHelpFunction>)[value] = consoleConfig;
            break;
          }
          case 'consoleLog': {
            const consoleLog: WithHelpFunction<unknown[]> = (...args) =>
              this.log(...args);
            consoleLog.help = () => {
              console.log(
                `With the method window.${value} adds a log to the report.`
              );
            };
            (window as unknown as Map<WithHelpFunction>)[value] = consoleLog;

            break;
          }
          case 'getReport': {
            const getReport: WithHelpFunction = () => {
              this.getReport();
            };
            getReport.help = () => {
              console.log(
                `With the method window.${value} get a report about the logs made through this logger.`
              );
            };
            (window as unknown as Map<WithHelpFunction>)[value] = getReport;

            break;
          }
          case 'shoutConfiguration': {
            const shoutConfiguration: WithHelpFunction = () => {
              console.log({ ...this._config });
            };
            shoutConfiguration.help = () => {
              console.log(
                `With the method window.${value} the reporter logs to the console its current configuration.`
              );
            };
            (window as unknown as Map<WithHelpFunction>)[value] =
              shoutConfiguration;

            break;
          }

          default:
            break;
        }
      });
    }
  }

  #formatReport(log: Log) {
    return log.what.map((current) => {
      const level =
        log.level !== Infinity
          ? this._config.levelNames[log.level] ?? log.level
          : '';
      return this._config.template
        .replace('{{LEVEL}}', String(level))
        .replace('{{BODY}}', JSON.stringify(current));
    });
  }

  #getChainable(handler: ChainableEvents) {
    return {
      force: () => {
        handler.onForced();
        return this.#getChainable(handler);
      },
      error: () => {
        handler.onMethod('error');
        return this.#getChainable(handler);
      },
      info: () => {
        handler.onMethod('info');
        return this.#getChainable(handler);
      },
      level: (logLevel: number) => {
        handler.onSetLevel(logLevel);
        return this.#getChainable(handler);
      },
      method: (newMethod: LogMethod) => {
        handler.onMethod(newMethod);
        return this.#getChainable(handler);
      },
      warn: () => {
        handler.onMethod('warn');
        return this.#getChainable(handler);
      }
    };
  }

  #persistConfiguration() {
    if (this._config.persistConfiguration)
      localStorage.setItem(
        this._config.persistObjectName,
        JSON.stringify(this._config)
      );
    else localStorage.removeItem(this._config.persistObjectName);
  }

  public config(newConfig: Partial<LogConfigurationParameters>) {
    Object.assign(this._config, newConfig);

    this.#persistConfiguration();
  }

  /**
   * Erases all the records stored in the inner buffer.
   */
  public erase() {
    this.logs = [];
  }

  /**
   * Will download a document with all reports made since the last erase or since it started.
   */
  public getReport(reportName = this._config.defaultName) {
    downloadReport(
      this.logs
        .map((current) => this.#formatReport(current).join('\n'))
        .join('\n'),
      reportName
    );
  }

  /**
   * @param what Whatever you want to throw to the console (or the report)
   */
  public log(...what: unknown[]) {
    let level = Infinity;
    let forced = false;
    let method: LogMethod = this._config.defaultMethod;

    setTimeout(() => {
      if (
        forced ||
        (this._config.reportEnabled && this._config.reportLevel >= level)
      ) {
        this.logs.push({ level, what });
      }
      if (
        forced ||
        (this._config.consoleEnabled && this._config.consoleLevel >= level)
      ) {
        console[method](this.#formatReport({ level, what }));
      }
    }, 0);

    return this.#getChainable({
      onForced() {
        forced = true;
      },
      onMethod(newMethod) {
        method = newMethod;
      },
      onSetLevel(newLevel) {
        level = newLevel;
      }
    });
  }
}
