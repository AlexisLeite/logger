# Logger

Offers a very simple way to log a component actions to a file, which could be downloaded through logger.getReport() and optionally to the console too.

## Basic usage

```typescript

const usersLogger = new Logger({
  enabled: true,
  level: 3 // This is arbitrary
}, {
  consoleConfig: 'configUsersLogger',
  getReport: 'getUsersLoggerReport'
});

usersLogger.config({
  consoleEnabled: true,
  consoleLevel: 1, // Errors and criticals only
  defaultMethod: 'dir' // Uses console.dir by default
  reportEnabled: true,
  reportLevel: 0, // Everything
  template: 'LEVEL: {{LEVEL}}, MESSAGE: {{BODY}}' // The template used to build the messages
})
usersLogger.log("The user has logged in").level(3).info() // Log as information in the report and use the console.info method
usersLogger.log("The connection has been lost").level(0).error() // Log as critical and error on the console
usersLogger.log("The limit of users is about to be reached").method("warn").level(2) // Log as warning in the console and in the report
usersLogger.getReport('users.txt'); // Downloads a file with all the reports made

```

## Configurations

You can pass a configuration object on the constructor or through the config method which will be merged with the current configuartions.

```typescript 

type LogMethod = 'dir' | 'error' | 'group' | 'info' | 'log' | 'table' | 'warn';

export interface LogConfigurationParameters {
  consoleEnabled: boolean;
  consoleLevel: number;
  defaultMethod: LogMethod;
  defaultName: string;
  levelNames: Record<number, string>;
  persistConfiguration: boolean;
      persistObjectName: 'loggerPersist',
  reportEnabled: boolean;
  reportLevel: number;
  template: string;
}

```

**consoleEnabled**: Whether to console.log or not.
**consoleLevel**: Which is the maximum level reported to the console, pass Infinity to allow all.
**defaultMethod**: The method the logger will use to log to the console by default.
**defaultName**: The default fileName the reporter will use when downloading.
**levelNames**: An object with numeric entries, indicating the name of each log. Defaults are:

```typescript

const levelNames = {
  0: 'CRITICAL',
  1: 'ERROR',
  2: 'WARNING',
  3: 'INFO'
}

```

**persistConfiguration**: Whether to persist the configuration to the localStorage or not.
**persistObjectName**: The name that will be used in the localStorage to keep the configuration.
**reportEnabled**: Whether to print to report or not.
**reportLevel**: Which is the maximum level reported to the report, pass Infinity to allow all.
**template**: Allows to modify the way each line of the report is shown.

## Console methods

When creating the reporter, an optional consoleMethods object can be passed to the constructor, with the following signature:

```typescript
Record<
  'consoleLog' | 'consoleConfig' | 'getReport' | 'shoutConfiguration',
  string
>
```

It allows the user to pass custom method names, which will be used to generate functions in the window object. This way, it will be possible to run the logger methods from the console of the browser, allowing the user to debug easily. Example, if you instantiate the logger like the following example:

```typescript
new Logger({
  consoleLog: 'loggerLog',
  consoleConfig: 'configLogger',
  getReport: 'downloadReport',
  shoutConfiguration: 'shoutConfig'
});
```

Then, in the console you can run the following methods:

```javascript
loggerLog('Put this log please', { status: 'success' });
loggerConfig({
  consoleLevel: 1, // Only CRITICAL and ERROR
  reportLevel: Infinity, // Everything
})
```