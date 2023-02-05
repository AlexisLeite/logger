# Logger

- [Logger](#logger)
  - [Basic usage](#basic-usage)
    - [Important](#important)
  - [Api](#api)
    - [config](#config)
    - [erase](#erase)
    - [erasePersistedConfiguration](#erasepersistedconfiguration)
    - [getReport](#getreport)
  - [Log methods](#log-methods)
  - [Chaining methods](#chaining-methods)
    - [Example](#example)
  - [Configurations](#configurations)
  - [window.console methods](#windowconsole-methods)


Offers a very simple way to log a component actions to a file, which could be downloaded through logger.getReport() and optionally to the console too.

Its logic is very simple: all logs have a level associated. If the log's level is greater than or equal to the configured level, it will be shouted.

Every log's level is queried two times, one time in order to determine if it must be logged to the report and a second time in order to determine if it must be shouted to the console.

```typescript
<Button onClick={
  React.useCallback(()=>{
    logger.getReport();
  },[])
}>Download report</Button>
```

## Basic usage

Logger is a class that must be instantiated in order to put it to work like the following example, which will be used through the whole readme file to give examples:

```typescript

const basicLogger = newLogger(); // No customizations

// All customizations
const usersLogger = new Logger(
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
    persistConfiguration: true, // Whether to save the configuration on the localStorage (when changed through parameters)
    persistObjectName: 'usersLoggerConfig', // The name used to persist on the localStorage, it's important to pass this option if you are using more than one logger
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

### Important

Due to console.log cannot be wrapped keeping the original file and line number, there is a workaround which forces to return a function which may be called in order to keep the correct line number.

Example:

```typescript

usersLogger.critical('Critical error: users database failure');
// The above line will console.log with fileName index.js (the index.js of the logger library)

// To avoid this error, it is possible to call the method like this:
usersLogger.critical('Critical error: users database failure')();
/**
 * Note that a function call has been added at the end of the expression, now the file and line printed are those where the .log method was called.

```

## Api

### config

Allows to override the current configuration. If persistConfiguration is enabled, the config passed will be used next time the app runs, even if this method is not called anymore.

```typescript

config(newConfig: Partial<LogConfigurationParameters>)

```
### erase

Deletes the report logs, then, all logs made before this point wont be print to the report file.

```typescript

erase()

```

### erasePersistedConfiguration

Deletes the stored configuration.

```typescript

erasePersistedConfiguration()

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

usersLogger.config({
  consoleEnabled: true,
  consoleLevel: 2,
  reportEnabled: true,
  reportLevel: 3,
  reporterName: 'usersLogger',
  template: '[{{REPORTERNAME}}][{{LEVEL}}]: {{BODY}}'
})
usersLogger.log('A debug purpose log');
/**
 * output: [usersLogger][DEBUG]: A debug purpose log
 * 
 * The above method tries to push a level 4 log. However the reportLevel is 3 so it wont be added to the report, and the consoleLevel is 2 and it wont be thrown to the console either. Notice that if consoleLevel were 4, it would have used the console.log method.
*/
usersLogger.info('An informational log');
/**
 * output: [usersLogger][INFO]: An informational log
 * 
 * The above method pushes a log with level 3 to the report. No output in the console since the consoleLevel is 2.
*/
usersLogger.warn('A warning log');
/**
 * output: [usersLogger][WARNING]: A warning log
 * 
 * The above method pushes a level 2 log to the report and shouts the log with console.warn
*/
usersLogger.error('An error log');
/**
 * output: [usersLogger][ERROR]: An error log
 * 
 * The above method pushes a level 1 log to the report and shouts the log with console.error
*/
usersLogger.critical('A critical error');
/**
 * output: [usersLogger][CRITICAL]: A critical error
 * 
 * The above method pushes a level 0 log to the report and shouts the log with console.error
*/

```

**critical** behaves as console.error on the console but logs the messages with level 0.

Notice that methods **can be chained** in order to alter the behavior of any log method.

## Chaining methods

All the log methods are chainable with configuration methods in order to alter the behavior of the log that is being emitted. The chain methods are: 
 - **forceConsole**: Forces the output to the console removing the level restrictions for the current log.
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

usersLogger.log('This error must be shown, no matter the configuration. Its level should be 0. The console method must be console.table. It should use a custom template')
  .forceConsole()
  .level(0)
  .table()
  .template('{{REPORTERNAME}} says: {{BODY}} with level {{LEVEL}}')
  
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
  persistConfiguration: boolean; // Defaults to true
  persistObjectName: string; // Defaults to 'loggerPersist
  reportEnabled: boolean; // Defaults to true
  reportLevel: number; // Defaults to Infinity (everything)
  reporterName?: string; // Defaults to 'logger'
  template: string; // Defaults to '[{{LEVEL}}]: {{BODY}}' (Does not show reporterName by default)
}

```

**consoleEnabled**: Whether to console.log or not.
**consoleLevel**: Which is the maximum level reported to the console, pass Infinity to allow all.
**defaultMethod**: The method the logger will use to log to the console by default.
**defaultReportName**: The default fileName the reporter will use when downloading.
**levelNames**: An object with numeric entries, indicating the name of each log. Defaults are:

```typescript

const levelNames = {
  0: 'CRITICAL',
  1: 'ERROR',
  2: 'WARNING',
  3: 'INFO'
  4: 'DEBUG'
}

```

**persistConfiguration**: Whether to persist the configuration to the localStorage or not.
**persistObjectName**: The name that will be used in the localStorage to keep the configuration.
**reportEnabled**: Whether to print to report or not.
**reportLevel**: Which is the maximum level reported to the report, pass Infinity to allow all.
**reporterName**: If you include the placeholder {{REPORTERNAME}} in a custom passed template, it will be replaced by the content of this property.
**template**: Allows to modify the way each line of the report is shown.

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
  config: 'usersLoggerConfig',
  eraseConfiguration: 'usersLoggerEraseConfiguration',
  getReport: 'usersLoggerGetReport',
  log: 'usersLoggerLog',
  shoutConfiguration: 'usersLoggerShoutConfiguration'
});
```

Then, in the console you can run the following methods:

```javascript
usersLoggerLog('Put this log please', { status: 'success' });
usersLoggerConfig({
  consoleLevel: 1, // Only CRITICAL and ERROR
  reportLevel: Infinity, // Everything
})
```

And all the methods declared in the constructor. Notice that it is not mandatory to pass any method at all.