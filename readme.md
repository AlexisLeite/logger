# Logger

- [Logger](#logger)
  - [Basic usage](#basic-usage)
    - [Important](#important)
  - [Fork](#fork)
    - [Example](#example)
  - [Api](#api)
    - [config](#config)
    - [getReport](#getreport)
  - [Log methods](#log-methods)
  - [Chaining methods](#chaining-methods)
    - [Example](#example-1)
  - [Configurations](#configurations)
  - [Templating](#templating)
    - [Default template:](#default-template)
  - [window.console methods](#windowconsole-methods)


Offers a very simple way to log a component actions to a file, which could be downloaded through logger.getReport() and optionally to the console too.

Its logic is very simple: all logs have a level associated. If the log's level is greater than or equal to the configured level, it will be shouted.

Every log's level is queried two times, one time in order to determine if it must be logged to the report and a second time in order to determine if it must be shouted to the console.

It is also **forkable**, which means you can multiple loggers with absolutely different configurations working over the same report file.

```typescript
<Button onClick={
  React.useCallback(()=>{
    logger.getReport();
  },[])
}>Download report</Button>
```

## Basic usage

### Important

Due to console.log cannot be wrapped keeping the original file and line number, there is a workaround which forces to return a function which may be called in order to keep the correct line number.

Example:

```typescript

mainLogger.critical('Critical error: users database failure')(); // <-- VERY IMPORTANT, CALL THE RETURNED FUNCTION
/**
 * Notice that a function call has been added at the end of the expression, now the file and line printed are those where the .log method was called.
 * */

```

Logger is a class that must be instantiated in order to put it to work like the following example, which will be used through the whole readme file to give examples:

```typescript

const basicLogger = newLogger(); // No customizations

// All customizations
const mainLogger = new Logger(
  {
    consoleEnabled: true,
    consoleLevel: 2, // Critical, errors and warnings (hide info and upper levels)
    defaultMethod: 'info',
    defaultReportName: 'report.txt', // The name of the file that will be downloaded when the report is generated
    levelNames: {
      0: 'CRITICAL',
      1: 'ERROR',
      2: 'WARNING',
      3: 'INFO',
      4: 'DEBUG'
    }, // Exactly the same than default
    reportEnabled: true, // Wether to store the logs as to allow the download of a report file
    reportLevel: 0, // Everything (default)
    reporterName:: 'users', // Add the reporterName to the template
    template: '[{{REPORTERNAME}}][{{LEVEL}}]: {{BODY}}' // The whay that each log is generated
  },
  {
    consoleConfig: 'configReport',
    consoleLog: 'log',
    eraseConfig: 'erase',
    getReport: 'report',
    shoutConfiguration: 'shout',
  },);

```

## Fork

The documentation is not ready, but it's possible to use mainLogger.fork() which returns a chainable that can be used to make a personalized fork of the logger, allowing to use unlimited different configurations over the same logger.

While the most methods of the fork works exactly the same as the original methods, there are some slightly differences that will be explained when I have more time to dedicate to this readme.

### Example

```typescript

const usersLogger = mainLogger
  .fork()
  .config({ consoleLevel: 4 })
  .changeReporterName('usersLogger');

mainLogger.log('A log that wont be shouted to the console')();
usersLogger('A log that WILL be shouted to the console!!').log()();
usersLogger('CRITICAL TO THE CONSOLE BUT NOT TO THE REPORT')
  .disableReport()
  .critical()();

/**
 * Console:
 * [usersLogger][INFO]: A log that WILL be shouted to the console!!
 * [usersLogger][CRITICAL]: CRITICAL TO THE CONSOLE BUT NOT TO THE REPORT

mainLogger.report();
/**
 * Downloaded file:
 * [mainLogger][INFO]: A log that wont be shouted to the console
 * [usersLogger][INFO]: A log that WILL be shouted to the console!!
 * */

```

## Api

### config

Allows to override the current configuration.

```typescript

config(newConfig: Partial<LogConfigurationParameters>)

```

### getReport

**Parameters:** 
 - (Optional) reportName: the downloaded's file name.

```typescript

public getReport(reportName?: string)

```

## Log methods

The logger offers the same methods than console plus **critical**: dir, error, group, info, log, table, warn. Example: 

```typescript 

mainLogger.config({
  consoleEnabled: true,
  consoleLevel: 2,
  reportEnabled: true,
  reportLevel: 3,
  reporterName: 'mainLogger',
  template: '[{{REPORTERNAME}}][{{LEVEL}}]: {{BODY}}'
})
mainLogger.log('A debug purpose log')();
/**
 * output: [mainLogger][DEBUG]: A debug purpose log
 * 
 * The above method tries to push a level 4 log. However the reportLevel is 3 so it wont be added to the report, and the consoleLevel is 2 and it wont be thrown to the console either. Notice that if consoleLevel were 4, it would have used the console.log method.
*/
mainLogger.log('A debug purpose log').config({
  consoleLevel: 4
}).changeReporterName('TEMPORAL_NAME');
/**
 * output: [TEMPORAL_NAME][DEBUG]: A debug purpose log
 * 
 * The above method tries to push a level 4 log and shouts it to the console due to this log has a different consoleLevel (because of the config).
*/
mainLogger.info('An informational log')();
/**
 * output: [mainLogger][INFO]: An informational log
 * 
 * The above method pushes a log with level 3 to the report. No output in the console since the consoleLevel is 2.
*/
mainLogger.warn('A warning log')();
/**
 * output: [mainLogger][WARNING]: A warning log
 * 
 * The above method pushes a level 2 log to the report and shouts the log with console.warn
*/
mainLogger.error('An error log')();
/**
 * output: [mainLogger][ERROR]: An error log
 * 
 * The above method pushes a level 1 log to the report and shouts the log with console.error
*/
mainLogger.critical('A critical error')();
/**
 * output: [mainLogger][CRITICAL]: A critical error
 * 
 * The above method pushes a level 0 log to the report and shouts the log with console.error
*/

```

**critical** behaves as console.error on the console but logs the messages with level 0.

Notice that methods **can be chained** in order to alter the behavior of any log method.

## Chaining methods

All the log methods are chainable with configuration methods in order to alter the behavior of the log that is being emitted. The chain methods are: 

 - **forceConsole**: Forces the output to the console removing the level restrictions for the current log.
 - **forceReport**: Forces the output to the report removing the level restrictions for the current log.

 - **changeReporterName**: Changes the displayed reporter's name for this log only.
 - **config**: Passes a configuration object that will affect this log only.
 - **dir**: Shouts if corresponds the log to the console with the dir method.
 - **error**: Shouts if corresponds the log to the console with the error method.
 - **group**: Shouts if corresponds the log to the console with the group method.
 - **info**: Shouts if corresponds the log to the console with the info method.
 - **level**: Sets the level of the current log, no matter which method is being used.
 - **method**: Shouts if corresponds the log to the console with the specified method.
 - **table**: Shouts if corresponds the log to the console with the table method.
 - **template**: Allows to change the template for the current log.
 - **warn**: Shouts if corresponds the log to the console with the warn method.

### Example

```typescript

mainLogger.log('This error must be shown, no matter the configuration. Its level should be 0. The console method must be console.table. It should use a custom template')
  .forceConsole()
  .forceReport()
  .level(0)
  .table()
  .template('{{REPORTERNAME}} says: {{BODY}} with level {{LEVEL}}')() 
  // The last call (the two empty parenthesis), bind the log to the current file

```

## Configurations

You can pass a configuration object on the constructor or through the config method which will be merged with the current configuartions.

```typescript 

type LogMethod = 'dir' | 'error' | 'group' | 'info' | 'log' | 'table' | 'warn';

export interface LogConfigurationParameters {
  consoleEnabled: boolean; // Defaults to true
  consoleLevel: number; // Defaults to 2 (critical, errors and warnings)
  defaultMethod: LogMethod; // Defaults to 'log' which states for console.log
  defaultReportName: string; // Defaults to 'report.txt'
  levelNames: Record<number, string>; 
  /* Defaults to 
  {
    0: 'CRITICAL',
    1: 'ERROR',
    2: 'WARNING',
    3: 'INFO',
    4: 'DEBUG'
  }*/
  reportEnabled: boolean; // Defaults to true
  reportLevel: number; // Defaults to Infinity (everything)
  reporterName?: string; // Defaults to 'logger'
  template: string; // Defaults to '[{{LEVEL}}]: {{BODY}}' (Does not show reporterName by default)
}

```

 - **consoleEnabled**: Whether to console.log or not.
 - **consoleLevel**: Which is the maximum level reported to the console, pass Infinity to allow all.
 - **defaultMethod**: The method the logger will use to log to the console by default.
 - **defaultReportName**: The default fileName the reporter will use when downloading.
 - **levelNames**: An object with numeric entries, indicating the name of each log. Defaults are:

```typescript

const levelNames = {
  0: 'CRITICAL',
  1: 'ERROR',
  2: 'WARNING',
  3: 'INFO'
  4: 'DEBUG'
}

```

 - **reportEnabled**: Whether to print to report or not.
 - **reportLevel**: Which is the maximum level reported to the report, pass Infinity to allow all.
 - **reporterName**: If you include the placeholder {{REPORTERNAME}} in a custom passed template, it will be replaced by the content of this property.
 - **template**: Allows to modify the way each line of the report is shown.

## Templating

The template passed through configuration or by chain, allows to use the following placeholders:

 - **{{hh}}**: Puts the hour
 - **{{mm}}**: Puts the minutes
 - **{{ss}}**: Puts the seconds
 - **{{ms}}**: Puts the milliseconds
 - **{{DD}}**: Puts the day
 - **{{MM}}**: Puts the month
 - **{{YYYY}}**: Puts the year
 - **{{LEVEL}}**: Puts the current level name (or the number if it doesn't exist)
 - **{{REPORTERNAME}}**: Puts the reporter name
 - **{{BODY}}**: Puts the message
 - **{{MESSAGE}}**: Puts the message

### Default template:

```typescript
'[{{DD}}/{{MM}}/{{YYYY}}]:[{{hh}}:{{mm}}:{{ss}}:{{ms}}][{{REPORTERNAME}}][{{LEVEL}}]: {{BODY}}'
```

## window.console methods

When creating the reporter, an optional consoleMethods object can be passed to the constructor, with the following signature:

```typescript
Record<
   'config' | 'eraseConfiguration' | 'getReport' | 'log' | 'shoutConfiguration',
  string
>
```

It allows the user to pass custom method names, which will be used to generate functions in the window object. This way, it will be possible to run the logger methods from the console of the browser. Example, if you instantiate the logger like the following example:

```typescript
new Logger({ /** Empty configuration object */ }, {
  config: 'mainLoggerConfig',
  eraseConfiguration: 'mainLoggerEraseConfiguration',
  getReport: 'mainLoggerGetReport',
  log: 'mainLoggerLog',
  shoutConfiguration: 'mainLoggerShoutConfiguration'
});
```

Then, in the console you can run the following methods:

```javascript
mainLoggerLog('Put this log please', { status: 'success' });
mainLoggerConfig({
  consoleLevel: 1, // Only CRITICAL and ERROR
  reportLevel: Infinity, // Everything
})
```

And all the methods declared in the constructor. Notice that it is not mandatory to pass any method at all.