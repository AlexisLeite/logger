import {
  Chain,
  ChainableBind,
  ChainableEvents,
  ForkCallee,
  Log,
  LogConfigurationParameters,
  LogFunctions,
  LogMethod,
  Map,
  WithHelpFunction
} from './types';
import { downloadReport } from './util';

export default class Logger {
  #config: LogConfigurationParameters = {} as LogConfigurationParameters;

  #logs: Log[] = [];

  get logs() {
    return this.#logs.map((current) => Object.assign({}, current));
  }

  constructor(
    private initialConfig?: Partial<LogConfigurationParameters>,
    consoleMethods?: Partial<LogFunctions>
  ) {
    this.#loadConfiguration(initialConfig);
    this.#setConsoleMethods(consoleMethods);
  }

  #formatReport(log: Log) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const level = this.#config.levelNames[log.level] ?? log.level ?? '';
    const date = new Date();
    return log.what.map((current) =>
      (log.template ?? this.#config.template)
        .replace('{{hh}}', String(date.getHours()))
        .replace('{{mm}}', String(date.getMinutes()))
        .replace('{{ss}}', String(date.getSeconds()))
        .replace('{{ms}}', String(date.getMilliseconds()))
        .replace('{{DD}}', String(date.getDay()))
        .replace('{{MM}}', String(date.getMonth()))
        .replace('{{YYYY}}', String(date.getFullYear()))
        .replace('{{LEVEL}}', String(level))
        .replace(
          '{{REPORTERNAME}}',
          String(log.reporterName ?? this.#config.reporterName ?? '')
        )
        .replace('{{BODY}}', JSON.stringify(current))
        .replace('{{MESSAGE}}', JSON.stringify(current))
    );
  }

  #getChainable<ReturnType = void>(
    method: LogMethod,
    handler: ChainableEvents<ReturnType>,
    bind = true
  ): Chain<ReturnType> {
    let actualMethod = method;

    let assignMethod: (...args: unknown[]) => ReturnType = handler.callback;
    if (bind) {
      const result = (handler.callback as () => ChainableBind)();
      const consoleMethod = console[
        actualMethod === 'shout' ? 'log' : actualMethod
      ] as typeof console.log;
      assignMethod = (
        result.willLog
          ? consoleMethod.bind(consoleMethod, ...result.log())
          : () => {}
      ) as (...args: unknown[]) => ReturnType;
    }

    return Object.assign(assignMethod, {
      config: (newConfig: Partial<LogConfigurationParameters>) => {
        handler.onConfig(newConfig);
        return this.#getChainable(actualMethod, handler, bind);
      },
      disableConsole: () => {
        handler.onForcedConsole(false);
        return this.#getChainable(actualMethod, handler, bind);
      },
      disableReport: () => {
        handler.onForcedReport(false);
        return this.#getChainable(actualMethod, handler, bind);
      },
      forceConsole: () => {
        handler.onForcedConsole(true);
        return this.#getChainable(actualMethod, handler, bind);
      },
      forceReport: () => {
        handler.onForcedConsole(true);
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

  #Log(...what: unknown[]) {
    let level = Infinity;
    let forcedConsole: boolean | undefined;
    let forcedReport: boolean | undefined;
    let method: LogMethod = this.#config.defaultMethod;
    let reporterName: string | undefined;
    let template: string | undefined;
    let config: Partial<LogConfigurationParameters> = {};

    setTimeout(() => {
      const log: Log = { level, reporterName, template, what };
      if (
        forcedReport === true ||
        (forcedReport === undefined &&
          this.#shouldLog(
            config.reportEnabled ?? this.#config.reportEnabled,
            level,
            config.reportLevel ?? this.#config.reportLevel
          ))
      ) {
        this.#logs.push(log);
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
          (forcedConsole === undefined &&
            this.#shouldLog(
              config.consoleEnabled ?? this.#config.consoleEnabled,
              level,
              config.consoleLevel ?? this.#config.consoleLevel
            ));
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
        if (newConfig.defaultMethod !== undefined)
          method = newConfig.defaultMethod;
        if (newConfig.reporterName !== undefined)
          reporterName = newConfig.reporterName;
        if (newConfig.template !== undefined) template = newConfig.template;
      },
      onForcedConsole(shouldShout: boolean) {
        forcedConsole = shouldShout;
      },
      onForcedReport(shouldShout: boolean) {
        forcedReport = shouldShout;
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

  #loadConfiguration(
    config: Partial<LogConfigurationParameters> | undefined = this.initialConfig
  ) {
    if (!config) return;

    const nonStoredConfig: LogConfigurationParameters = {
      consoleEnabled: true,
      consoleLevel: 2,
      defaultMethod: 'log',
      defaultReportFilename: 'report.txt',
      levelNames: {
        0: 'CRITICAL',
        1: 'ERROR',
        2: 'WARNING',
        3: 'INFO',
        4: 'DEBUG'
      },
      reportEnabled: true,
      reportLevel: Infinity,
      reporterName: 'logger',
      template:
        '[{{DD}}/{{MM}}/{{YYYY}}]:[{{hh}}:{{mm}}:{{ss}}:{{ms}}][{{REPORTERNAME}}][{{LEVEL}}]: {{BODY}}',
      ...config
    };
    this.#config = nonStoredConfig;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.#config.reportLevel === null) this.#config.reportLevel = Infinity;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.#config.consoleLevel === null)
      this.#config.consoleLevel = Infinity;
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
              this[this.#config.defaultMethod](...args);
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
              console.log({ ...this.#config });
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
    Object.assign(this.#config, newConfig);
  }

  /**
   * Erases all the records stored in the inner buffer.
   */
  public erase() {
    this.#logs = [];
  }

  fork(): Chain<ForkCallee> {
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
          const returnObject: Record<
            'critical' | LogMethod,
            () => Chain<ForkCallee>
          > = {} as Record<'critical' | LogMethod, () => Chain<ForkCallee>>;
          const methods: ('critical' | LogMethod)[] = [
            'critical',
            'dir',
            'error',
            'info',
            'log',
            'shout',
            'table',
            'warn'
          ];
          methods.forEach((current) => {
            returnObject[current] = () => {
              let callMethod: Chain<ForkCallee> = this.#Log(
                ...what
              ) as unknown as Chain<ForkCallee>;

              if (level !== undefined)
                callMethod = callMethod.level(level) as Chain<ForkCallee>;
              if (current === 'critical')
                callMethod = callMethod.level(0) as Chain<ForkCallee>;
              else if (current === 'error')
                callMethod = callMethod.level(1) as Chain<ForkCallee>;
              else if (current === 'warn')
                callMethod = callMethod.level(2) as Chain<ForkCallee>;
              else if (current === 'info')
                callMethod = callMethod.level(3) as Chain<ForkCallee>;
              else if (current !== 'shout')
                callMethod = callMethod.level(4) as Chain<ForkCallee>;

              const currentMethod =
                current === 'shout' ? logMethod ?? 'log' : current;
              callMethod = callMethod.method(
                currentMethod === 'critical' ? 'error' : currentMethod
              ) as Chain<ForkCallee>;

              if (template !== undefined)
                callMethod = callMethod.template(template) as Chain<ForkCallee>;
              if (forcedConsole !== undefined)
                callMethod = (
                  forcedConsole
                    ? callMethod.forceConsole()
                    : callMethod.disableConsole()
                ) as Chain<ForkCallee>;
              if (forcedReport !== undefined)
                callMethod = (
                  forcedReport
                    ? callMethod.forceReport()
                    : callMethod.disableReport()
                ) as Chain<ForkCallee>;
              if (name !== undefined)
                callMethod = callMethod.changeReporterName(
                  name
                ) as Chain<ForkCallee>;
              if (config !== undefined)
                callMethod = callMethod.config(config) as Chain<ForkCallee>;

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
        onForcedConsole: (shouldShout) => {
          forcedConsole = shouldShout;
        },
        onForcedReport: (shouldShout) => {
          forcedReport = shouldShout;
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
  public getReport(reportName = this.#config.defaultReportFilename) {
    downloadReport(
      this.#logs
        .map((current) => this.#formatReport(current).join('\n'))
        .join('\n'),
      reportName
    );
  }

  public critical(...what: unknown[]) {
    return this.#Log(...what)
      .error()
      .level(0);
  }

  public dir(...what: unknown[]) {
    return this.#Log(...what)
      .dir()
      .level(3);
  }

  public error(...what: unknown[]) {
    return this.#Log(...what)
      .level(1)
      .error();
  }

  public info(...what: unknown[]) {
    return this.#Log(...what)
      .level(3)
      .info();
  }

  public log(...what: unknown[]) {
    return this.#Log(...what)
      .level(3)
      .method('log');
  }

  public table(...what: unknown[]) {
    return this.#Log(...what).table();
  }

  public warn(...what: unknown[]) {
    return this.#Log(...what)
      .level(2)
      .warn();
  }
}
