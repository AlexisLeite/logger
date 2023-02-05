import { ChainableEvents, WithHelpFunction } from './privateTypes';
import {
  Log,
  LogConfigurationParameters,
  LogFunctions,
  LogMethod,
  Map
} from './types';
import { downloadReport } from './util';

export default class Logger {
  private _config: LogConfigurationParameters =
    {} as LogConfigurationParameters;

  private logs: Log[] = [];

  constructor(
    private initialConfig?: Partial<LogConfigurationParameters>,
    consoleMethods?: Partial<LogFunctions>
  ) {
    this.#loadConfiguration(initialConfig);
    this.#persistConfiguration();
    this.#setConsoleMethods(consoleMethods);
  }

  #formatReport(log: Log) {
    return log.what.map((current) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const level = this._config.levelNames[log.level] ?? log.level ?? '';
      return (log.template ?? this._config.template)
        .replace('{{LEVEL}}', String(level))
        .replace('{{REPORTERNAME}}', String(this._config.reporterName ?? ''))
        .replace('{{BODY}}', JSON.stringify(current));
    });
  }

  #getChainable(method: LogMethod, handler: ChainableEvents) {
    let actualMethod = method;
    const result = handler.callback();
    const consoleLog = (console[method] as typeof console.log).bind(
      console[method] as typeof console.log,
      ...result.log()
    );
    // eslint-disable-next-line prettier/prettier
    return Object.assign(result.willLog ? consoleLog : () => { }, {
      forceConsole: () => {
        handler.onForcedConsole();
        return this.#getChainable(actualMethod, handler);
      },
      forceReport: () => {
        handler.onForcedConsole();
        return this.#getChainable(actualMethod, handler);
      },
      dir: () => {
        actualMethod = 'dir';
        handler.onMethod('dir');
        return this.#getChainable(actualMethod, handler);
      },
      error: () => {
        actualMethod = 'error';
        handler.onMethod('error');
        return this.#getChainable(actualMethod, handler);
      },
      group: () => {
        actualMethod = 'group';
        handler.onMethod('group');
        return this.#getChainable(actualMethod, handler);
      },
      info: () => {
        actualMethod = 'info';
        handler.onMethod('info');
        return this.#getChainable(actualMethod, handler);
      },
      level: (logLevel: number) => {
        handler.onSetLevel(logLevel);
        return this.#getChainable(actualMethod, handler);
      },
      method: (newMethod: LogMethod) => {
        actualMethod = newMethod;
        handler.onMethod(newMethod);
        return this.#getChainable(actualMethod, handler);
      },
      table: () => {
        actualMethod = 'table';
        handler.onMethod('table');
        return this.#getChainable(actualMethod, handler);
      },
      template: (newTemplate: string) => {
        handler.onTemplate(newTemplate);
        return this.#getChainable(actualMethod, handler);
      },
      warn: () => {
        actualMethod = 'warn';
        handler.onMethod('warn');
        return this.#getChainable(actualMethod, handler);
      }
    });
  }

  #loadConfiguration(
    config: Partial<LogConfigurationParameters> | undefined = this.initialConfig
  ) {
    if (!config) return;

    const persistObjectName = config.persistObjectName ?? 'loggerPersist';
    const storedConfig = localStorage.getItem(persistObjectName);
    const nonStoredConfig: LogConfigurationParameters = {
      consoleEnabled: true,
      consoleLevel: 2,
      defaultMethod: 'log',
      defaultReportName: 'report.txt',
      levelNames: {
        0: 'CRITICAL',
        1: 'ERROR',
        2: 'WARNING',
        3: 'INFO',
        4: 'DEBUG'
      },
      persistConfiguration: true,
      persistObjectName,
      reportEnabled: true,
      reportLevel: Infinity,
      reporterName: 'logger',
      template: '[{{LEVEL}}]: {{BODY}}',
      ...config
    };
    this._config = storedConfig
      ? (JSON.parse(storedConfig) as LogConfigurationParameters)
      : nonStoredConfig;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this._config.reportLevel === null) this._config.reportLevel = Infinity;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this._config.consoleLevel === null)
      this._config.consoleLevel = Infinity;
  }

  #persistConfiguration() {
    if (this._config.persistConfiguration)
      localStorage.setItem(
        this._config.persistObjectName,
        JSON.stringify(this._config)
      );
    else this.erasePersistedConfiguration();
  }

  #setConsoleMethods(consoleMethods?: Partial<LogFunctions>) {
    if (consoleMethods) {
      Object.entries(consoleMethods).forEach(([key, value]) => {
        switch (key as keyof LogFunctions) {
          case 'config': {
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
          case 'eraseConfiguration': {
            const shoutConfiguration: WithHelpFunction = () => {
              this.erasePersistedConfiguration();
            };
            shoutConfiguration.help = () => {
              console.log(
                `With the method window.${value} it is possible to erase the set configuration on the store.`
              );
            };
            (window as unknown as Map<WithHelpFunction>)[value] =
              shoutConfiguration;

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
          case 'log': {
            const consoleLog: WithHelpFunction<unknown[]> = (...args) =>
              this[this._config.defaultMethod](...args);
            consoleLog.help = () => {
              console.log(
                `With the method window.${value} adds a log to the report.`
              );
            };

            (window as unknown as Map<WithHelpFunction>)[value] = consoleLog;

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

  #shouldLog(enabled: boolean, logLevel: number, configurationLevel: number) {
    return configurationLevel >= logLevel;
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

  erasePersistedConfiguration() {
    localStorage.removeItem(this._config.persistObjectName);
    this.#loadConfiguration();
  }

  /**
   * Will download a document with all reports made since the last erase or since it started.
   */
  public getReport(reportName = this._config.defaultReportName) {
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
  public Log(...what: unknown[]) {
    let level = Infinity;
    let forcedConsole = false;
    let forcedReport = false;
    let method: LogMethod = this._config.defaultMethod;
    let template: string | undefined;
    let consoleLogged = false;

    setTimeout(() => {
      const log = { level, template, what };
      if (
        forcedReport ||
        this.#shouldLog(
          this._config.reportEnabled,
          level,
          this._config.reportLevel
        )
      ) {
        this.logs.push(log);
      }
      if (
        !consoleLogged &&
        (forcedConsole ||
          this.#shouldLog(
            this._config.consoleEnabled,
            level,
            this._config.consoleLevel
          ))
      ) {
        console[method](this.#formatReport(log));
      }
    }, 0);

    return this.#getChainable(method, {
      callback: () => {
        const willLog =
          forcedConsole ||
          (this._config.consoleEnabled && this._config.consoleLevel >= level);
        return {
          willLog,
          log: () => {
            consoleLogged = true;
            return what;
          }
        };
      },
      onForcedConsole() {
        forcedConsole = true;
      },
      onForcedReport() {
        forcedReport = true;
      },
      onMethod(newMethod) {
        method = newMethod;
      },
      onSetLevel(newLevel) {
        level = newLevel;
      },
      onTemplate(newTemplate) {
        template = newTemplate;
      }
    });
  }

  public critical(...what: unknown[]) {
    return this.Log(...what)
      .error()
      .level(0);
  }

  public dir(...what: unknown[]) {
    return this.Log(...what)
      .dir()
      .level(3);
  }

  public error(...what: unknown[]) {
    return this.Log(...what)
      .level(1)
      .error();
  }

  public group(...what: unknown[]) {
    return this.Log(...what).group();
  }

  public info(...what: unknown[]) {
    return this.Log(...what)
      .level(3)
      .info();
  }

  public log(...what: unknown[]) {
    return this.Log(...what)
      .level(3)
      .info();
  }

  public table(...what: unknown[]) {
    return this.Log(...what).table();
  }

  public warn(...what: unknown[]) {
    return this.Log(...what)
      .level(2)
      .warn();
  }
}
