/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable prefer-spread */
/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const nodemiral = require('nodemiral');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const uuid = require('uuid');
const _ = require('underscore');
const async = require('async');
const os = require('os');
const buildApp = require('./build.js');
require('colors');

function hasSummaryMapErrors(summaryMap) {
  return _.some(summaryMap, (summary) => summary.error);
}

function haveSummaryMapsErrors(summaryMaps) {
  return _.some(summaryMaps, hasSummaryMapErrors);
}

function whenAfterCompleted(error, summaryMaps) {
  const errorCode = error || haveSummaryMapsErrors(summaryMaps) ? 1 : 0;
  process.exit(errorCode);
}

function whenAfterDeployed(buildLocation) {
  // eslint-disable-next-line func-names
  return function (error, summaryMaps) {
    rimraf.sync(buildLocation);
    whenAfterCompleted(error, summaryMaps);
  };
}

function Actions(config, cwd) {
  this.cwd = cwd;
  this.config = config;
  this.sessionsMap = this._createSessionsMap(config);

  // get settings.json into env
  const setttingsJsonPath = path.resolve(this.cwd, 'settings.json');
  if (fs.existsSync(setttingsJsonPath)) {
    this.config.env.METEOR_SETTINGS = JSON.stringify(require(setttingsJsonPath));
  }
}

module.exports = Actions;

Actions.prototype._createSessionsMap = function _createSessionsMap(config) {
  const sessionsMap = {};

  config.servers.forEach((server) => {
    const { host } = server;
    const auth = { username: server.username };

    if (server.pem) {
      auth.pem = fs.readFileSync(path.resolve(server.pem), 'utf8');
    } else {
      auth.password = server.password;
    }

    const nodemiralOptions = {
      ssh: server.sshOptions,
      keepAlive: true,
    };

    if (!sessionsMap[server.os]) {
      sessionsMap[server.os] = {
        sessions: [],
        taskListsBuilder: require('./taskLists')(server.os),
      };
    }

    const session = nodemiral.session(host, auth, nodemiralOptions);
    session._serverConfig = server;
    sessionsMap[server.os].sessions.push(session);
  });

  return sessionsMap;
};

Actions.prototype._executePararell = function _executePararell(actionName, args) {
  const self = this;
  const sessionInfoList = _.values(self.sessionsMap);
  async.map(
    sessionInfoList,
    (sessionsInfo, callback) => {
      const taskList = sessionsInfo.taskListsBuilder[actionName]
        .apply(sessionsInfo.taskListsBuilder, args);
      taskList.run(sessionsInfo.sessions, (summaryMap) => {
        callback(null, summaryMap);
      });
    },
    whenAfterCompleted,
  );
};

Actions.prototype.setup = function setup() {
  this._executePararell('setup', [this.config]);
};

Actions.prototype.deploy = function deploy() {
  const self = this;

  const buildLocation = path.resolve(os.tmpdir(), uuid.v4());
  const bundlePath = path.resolve(buildLocation, 'bundle.tar.gz');

  // spawn inherits env vars from process.env
  // so we can simply set them like this
  process.env.BUILD_LOCATION = buildLocation;

  const { deployCheckWaitTime } = this.config;
  const { appName } = this.config;
  const appPath = this.config.app;
  const { enableUploadProgressBar } = this.config;
  const { meteorBinary } = this.config;

  console.log(`Building Started: ${this.config.app}`);
  buildApp(appPath, meteorBinary, buildLocation, (err) => {
    if (err) {
      process.exit(1);
    } else {
      const sessionsData = [];
      _.forEach(self.sessionsMap, (sessionsInfo) => {
        const { taskListsBuilder } = sessionsInfo;
        _.forEach(sessionsInfo.sessions, (session) => {
          sessionsData.push({ taskListsBuilder, session });
        });
      });

      async.mapSeries(
        sessionsData,
        (sessionData, callback) => {
          const { session } = sessionData;
          const { taskListsBuilder } = sessionData;
          const env = _.extend({}, self.config.env, session._serverConfig.env);
          const taskList = taskListsBuilder.deploy(
            bundlePath, env,
            deployCheckWaitTime, appName, enableUploadProgressBar,
          );
          taskList.run(session, (summaryMap) => {
            callback(null, summaryMap);
          });
        },
        whenAfterDeployed(buildLocation),
      );
    }
  });
};

Actions.prototype.reconfig = function reconfig() {
  const self = this;
  const sessionInfoList = [];
  Object.keys(self.sessionsMap).forEach((ops) => {
    const sessionsInfo = self.sessionsMap[ops];
    sessionsInfo.sessions.forEach((session) => {
      const env = _.extend({}, self.config.env, session._serverConfig.env);
      sessionsInfo.taskListsBuilder.reconfig(
        env, self.config.appName,
      );
      sessionInfoList.push({ taskList: session });
    });
  });

  async.mapSeries(
    sessionInfoList,
    (sessionInfo, callback) => {
      sessionInfo.taskList.run(sessionInfo.session, (summaryMap) => {
        callback(null, summaryMap);
      });
    },
    whenAfterCompleted,
  );
};

Actions.prototype.restart = function restart() {
  this._executePararell('restart', [this.config.appName]);
};

Actions.prototype.stop = function stop() {
  this._executePararell('stop', [this.config.appName]);
};

Actions.prototype.start = function start() {
  this._executePararell('start', [this.config.appName]);
};

Actions.prototype.logs = function logs() {
  const self = this;
  const tailOptions = process.argv.slice(3).join(' ');

  Object.keys(self.sessionsMap).forEach((ops) => {
    const sessionsInfo = self.sessionsMap[ops];
    sessionsInfo.sessions.forEach((session) => {
      const hostPrefix = `[${session._host}] `;
      const options = {
        onStdout: (data) => {
          process.stdout.write(hostPrefix + data.toString());
        },
        onStderr: (data) => {
          process.stderr.write(hostPrefix + data.toString());
        },
      };
      session.execute('lsb_release -a 2> /dev/null', {}, (erro, code, loggs) => {
        if (/Release:.*1[6|8]\./.test(loggs.stdout)) {
          const command = `sudo tail ${tailOptions} /var/log/syslog | grep ${self.config.appName}`;
          session.execute(command, options);
        } else {
          const command = `sudo tail ${tailOptions} /var/log/upstart/${self.config.appName}.log`;
          session.execute(command, options);
        }
      });
    });
  });
};

Actions.init = function init() {
  const destMupJson = path.resolve('yamup.json');
  const destSettingsJson = path.resolve('settings.json');

  if (fs.existsSync(destMupJson) || fs.existsSync(destSettingsJson)) {
    console.error('A Project Already Exists'.bold.red);
    process.exit(1);
  }

  const exampleMupJson = path.resolve(__dirname, '../example/yamup.json');
  const exampleSettingsJson = path.resolve(__dirname, '../example/settings.json');

  function copyFile(src, dest) {
    const content = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, content);
  }

  copyFile(exampleMupJson, destMupJson);
  copyFile(exampleSettingsJson, destSettingsJson);

  console.log('Empty Project Initialized!'.bold.green);
};
