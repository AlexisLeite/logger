import {
  ChainableBind,
  ChainableEvents,
  WithHelpFunction
} from './privateTypes';
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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const level = this._config.levelNames[log.level] ?? log.level ?? '';
    return log.what.map((current) =>
      (log.template ?? this._config.template)
        .replace('{{LEVEL}}', String(level))
        .replace(
          '{{REPORTERNAME}}',
          String(log.reporterName ?? this._config.reporterName ?? '')
        )
        .replace('{{BODY}}', JSON.stringify(current))
    );
  }

  #getChainable(method: LogMethod, handler: ChainableEvents, bind = true) {
    let actualMethod = method;

    let assignMethod: (...args: unknown[]) => void = handler.callback;
    if (bind) {
      const result = (handler.callback as () => ChainableBind)();
      const consoleMethod = console[actualMethod] as typeof console.log;
      assignMethod = result.willLog
        ? consoleMethod.bind(consoleMethod, ...result.log())
        : () => {};
    }

    return Object.assign(assignMethod, {
      config: (newConfig: Partial<LogConfigurationParameters>) => {
        handler.onConfig(newConfig);
        return this.#getChainable(actualMethod, handler, bind);
      },
      forceConsole: () => {
        handler.onForcedConsole();
        return this.#getChainable(actualMethod, handler, bind);
      },
      forceReport: () => {
        handler.onForcedConsole();
        return this.#getChainable(actualMethod, handler, bind);
      },
      changeReporterName: (newName: string) => {
        handler.onChangeName(newName);
        return this.#getChainable(actualMethod, handler, bind);
      },
      critical: () => {
        actualMethod = 'error';
        handler.onMethod('error');
        handler.onSetLevel(0);
        return this.#getChainable(actualMethod, handler, bind);
      },
      dir: () => {
        actualMethod = 'dir';
        handler.onMethod('dir');
        return this.#getChainable(actualMethod, handler, bind);
      },
      error: () => {
        actualMethod = 'error';
        handler.onMethod('error');
        return this.#getChainable(actualMethod, handler, bind);
      },
      info: () => {
        actualMethod = 'info';
        handler.onMethod('info');
        return this.#getChainable(actualMethod, handler, bind);
      },
      level: (logLevel: number) => {
        handler.onSetLevel(logLevel);
        return this.#getChainable(actualMethod, handler, bind);
      },
      method: (newMethod: LogMethod) => {
        actualMethod = newMethod;
        handler.onMethod(newMethod);
        return this.#getChainable(actualMethod, handler, bind);
      },
      table: () => {
        actualMethod = 'table';
        handler.onMethod('table');
        return this.#getChainable(actualMethod, handler, bind);
      },
      template: (newTemplate: string) => {
        handler.onTemplate(newTemplate);
        return this.#getChainable(actualMethod, handler, bind);
      },
      warn: () => {
        actualMethod = 'warn';
        handler.onMethod('warn');
        return this.#getChainable(actualMethod, handler, bind);
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
      template: '[{{REPORTERNAME}}][{{LEVEL}}]: {{BODY}}',
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
    return enabled && configurationLevel >= logLevel;
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

  fork() {
    let template: string | undefined;
    let level: number | undefined;
    let logMethod: LogMethod | undefined;
    let forcedConsole: boolean | undefined;
    let forcedReport: boolean | undefined;
    let name: string | undefined;
    let config: undefined | Partial<LogConfigurationParameters>;

    const forkedObject = this.#getChainable(
      'log',
      {
        callback: (...what: unknown[]) => {
          const returnObject: Record<'critical' | LogMethod, () => unknown> =
            {} as Record<'critical' | LogMethod, () => unknown>;
          const methods: ('critical' | LogMethod)[] = [
            'critical',
            'dir',
            'error',
            'info',
            'log',
            'table',
            'warn'
          ];
          methods.forEach((current) => {
            returnObject[current] = () => {
              let callMethod = this.Log(...what);

              if (level !== undefined) callMethod = callMethod.level(level);
              else if (current === 'critical') callMethod.level(0);
              else if (current === 'error') callMethod.level(1);
              else if (current === 'warn') callMethod.level(2);
              else callMethod.level(3);

              const currentMethod = logMethod ?? current;
              callMethod = callMethod.method(
                currentMethod === 'critical' ? 'error' : currentMethod
              );

              if (template !== undefined)
                callMethod = callMethod.template(template);
              if (forcedConsole) callMethod = callMethod.forceConsole();
              if (forcedReport) callMethod = callMethod.forceReport();
              if (name !== undefined)
                callMethod = callMethod.changeReporterName(name);
              if (config !== undefined) callMethod = callMethod.config(config);

              return callMethod;
            };
          });
          return returnObject;
        },
        onChangeName: (newName) => {
          name = newName;
        },
        onConfig: (newConfig) => {
          config = newConfig;
        },
        onForcedConsole: () => {
          forcedConsole = true;
        },
        onForcedReport: () => {
          forcedReport = true;
        },
        onMethod: (newLogMethod) => {
          logMethod = newLogMethod;
        },
        onSetLevel: (newLevel) => {
          level = newLevel;
        },
        onTemplate: (newTemplate) => {
          template = newTemplate;
        }
      },
      false
    );

    return forkedObject;
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
    let reporterName: string | undefined;
    let template: string | undefined;
    let config: Partial<LogConfigurationParameters> = {};

    setTimeout(() => {
      const log: Log = { level, reporterName, template, what };
      if (
        forcedReport ||
        this.#shouldLog(
          config.reportEnabled ?? this._config.reportEnabled,
          level,
          config.reportLevel ?? this._config.reportLevel
        )
      ) {
        this.logs.push(log);
      }
    }, 0);

    let hasShoutedName = false;

    return this.#getChainable(method, {
      callback: () => {
        const log = { level, reporterName, template, what };

        if (method === 'table' && !hasShoutedName) {
          hasShoutedName = true;
          console.log(log.reporterName);
        }

        const willLog =
          forcedConsole ||
          this.#shouldLog(
            config.consoleEnabled ?? this._config.consoleEnabled,
            level,
            config.consoleLevel ?? this._config.consoleLevel
          );
        return {
          log: () => (method === 'table' ? what : this.#formatReport(log)),
          willLog
        };
      },
      onChangeName: (newName) => {
        reporterName = newName;
      },
      onConfig: (newConfig) => {
        config = newConfig;
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

  public info(...what: unknown[]) {
    return this.Log(...what)
      .level(3)
      .info();
  }

  public log(...what: unknown[]) {
    return this.Log(...what)
      .level(3)
      .method('log');
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
