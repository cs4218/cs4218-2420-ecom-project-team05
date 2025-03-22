module.exports = {
    mongodbMemoryServerOptions: {
      binary: {
        version: '6.0.6',
        skipMD5: true
      },
      instance: {
        dbName: 'jest'
      },
      replSet: {
        name: 'rs0'
      },
      autoStart: false
    },
    useSharedDBForAllJestWorkers: false
  };