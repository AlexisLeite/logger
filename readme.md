# Logger

Offers a very simple way to log a component actions to a file, which could be downloaded through logger.getReport() and optionally to the console too.

## Uso

```typescript

const usersLogger = new Logger({
  enabled: true,
  level: 3 // This is arbitrary
}, {
  consoleConfig: 'configUsersLogger',
  getReport: 'getUsersLoggerReport'
});

usersLogger.log(1, 'Hello', 'world'); // This will go to the console and to the report
usersLogger.log(4, 'Hello', 'report'); // This will go only to the report because of its level is greater than configured level.
usersLogger.log('Another to report'); // When no level is passed, Infinity is asumed.

/**
 * Set new configuration
 * */
usersLogger.config({
  level: Infinity
})
usersLogger.log('A log to the report and the console'); // As the config is now level=Infinity, every log will go to both the console and the report.
usersLogger.getReport(); // It will download a report document

/**
 * Erase the report
 * */
usersLogger.erase();
usersLogger.log('Hello', 'world'); // This will go to the console and to the report
usersLogger.getReport(); // Will print a report with only the last .log made:
// []: Hello
// []: world

```