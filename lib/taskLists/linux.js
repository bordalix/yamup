var nodemiral = require('nodemiral');
var fs = require('fs');
var path = require('path');
var util = require('util');

var SCRIPT_DIR = path.resolve(__dirname, '../../scripts/linux');
var TEMPLATES_DIR = path.resolve(__dirname, '../../templates/linux');

exports.setup = function(config) {
  var taskList = nodemiral.taskList('Setup (linux)');

  // Installation
  if(config.setupNode) {
    taskList.executeScript('Installing Node.js', {
      script: path.resolve(SCRIPT_DIR, 'install-node.sh'),
      vars: {
        nodeVersion: config.nodeVersion
      }
    });
  }

  if(config.setupPhantom) {
    taskList.executeScript('Installing PhantomJS', {
      script: path.resolve(SCRIPT_DIR, 'install-phantomjs.sh')
    });
  }

  taskList.executeScript('Setting up Environment', {
    script: path.resolve(SCRIPT_DIR, 'setup-env.sh'),
    vars: {
      appName: config.appName
    }
  });

  if(config.setupMongo) {
    taskList.copy('Copying MongoDB configuration', {
      src: path.resolve(TEMPLATES_DIR, 'mongodb.conf'),
      dest: '/etc/mongodb.conf'
    });

    taskList.executeScript('Installing MongoDB', {
      script: path.resolve(SCRIPT_DIR, 'install-mongodb.sh')
    });
  }

  if(config.ssl) {
    installStud(taskList);
    configureStud(taskList, config.ssl.pem, config.ssl.backendPort);
  }

  //Configurations
  taskList.executeScript('Verifying upstart or systemd', {
    script: path.resolve(SCRIPT_DIR, 'upstartORsystemd.sh')
  }, function (val) {
    if (val === 'systemd') {
      taskList.copy('Configuring systemd', {
        src: path.resolve(TEMPLATES_DIR, 'meteor.systemd.conf'),
        dest: '/etc/systemd/system/' + config.appName + '.service',
        vars: { appName: config.appName }
      },
      function (err, code, logs) {
        taskList.executeScript('Wrapping all up', {
          script: path.resolve(SCRIPT_DIR, 'wrap-up.sh')
        })
      });
    } else {
      taskList.copy('Configuring upstart', {
        src: path.resolve(TEMPLATES_DIR, 'meteor.upstart.conf'),
        dest: '/etc/init/' + config.appName + '.conf',
        vars: { appName: config.appName },
      },
      function (err, code, logs) {
        taskList.executeScript('Wrapping all up', {
          script: path.resolve(SCRIPT_DIR, 'wrap-up.sh')
        });
      });
    }
  });

  return taskList;
};

exports.deploy = function(bundlePath, env, deployCheckWaitTime, appName, enableUploadProgressBar) {
  var taskList = nodemiral.taskList("Deploy app '" + appName + "' (linux)");

  taskList.copy('Uploading bundle', {
    src: bundlePath,
    dest: '/opt/' + appName + '/tmp/bundle.tar.gz',
    progressBar: enableUploadProgressBar
  });

  taskList.copy('Setting up Environment Variables', {
    src: path.resolve(TEMPLATES_DIR, 'env.sh'),
    dest: '/opt/' + appName + '/config/env.sh',
    vars: {
      env: env || {},
      appName: appName
    }
  });

  taskList.copy('Setting up start script for systemd', {
    src: path.resolve(TEMPLATES_DIR, 'start.sh'),
    dest: '/opt/' + appName + '/start.sh',
    vars: {
      env: env || {},
      appName: appName
    }
  });

  // deploying
  taskList.executeScript('Invoking deployment process', {
    script: path.resolve(TEMPLATES_DIR, 'deploy.sh'),
    vars: {
      deployCheckWaitTime: deployCheckWaitTime || 10,
      appName: appName
    }
  });

  return taskList;
};

exports.reconfig = function(env, appName) {
  var taskList = nodemiral.taskList("Updating configurations (linux)");

  taskList.copy('Setting up Environment Variables', {
    src: path.resolve(TEMPLATES_DIR, 'env.sh'),
    dest: '/opt/' + appName + '/config/env.sh',
    vars: {
      env: env || {},
      appName: appName
    }
  });
  
  taskList.copy('Setting up start script for systemd', {
    src: path.resolve(TEMPLATES_DIR, 'start.sh'),
    dest: '/opt/' + appName + '/start.sh',
    vars: {
      env: env || {},
      appName: appName
    }
  });

  //restarting
  taskList.executeScript('Restarting app', {
    script: path.resolve(SCRIPT_DIR, 'restart.sh'),
    vars: { appName: appName }
  });

  return taskList;
};

exports.restart = function(appName) {
  var taskList = nodemiral.taskList("Restarting Application (linux)");

  //restarting
  taskList.executeScript('Restarting app', {
    script: path.resolve(SCRIPT_DIR, 'restart.sh'),
    vars: { appName: appName }
  });

  return taskList;
};

exports.stop = function(appName) {
  var taskList = nodemiral.taskList("Stopping Application (linux)");

  //stopping
  taskList.executeScript('Stopping app', {
    script: path.resolve(SCRIPT_DIR, 'stop.sh'),
    vars: { appName: appName }
  });

  return taskList;
};

exports.start = function(appName) {
  var taskList = nodemiral.taskList("Starting Application (linux)");

  //starting
  taskList.executeScript('Starting app', {
    script: path.resolve(SCRIPT_DIR, 'start.sh'),
    vars: { appName: appName }
  });

  return taskList;
};

function installStud(taskList) {
  taskList.executeScript('Installing Stud', {
    script: path.resolve(SCRIPT_DIR, 'install-stud.sh')
  });
}

function configureStud(taskList, pemFilePath, port) {
  var backend = {host: '127.0.0.1', port: port};

  taskList.copy('Configuring Stud for Upstart', {
    src: path.resolve(TEMPLATES_DIR, 'stud.init.conf'),
    dest: '/etc/init/stud.conf'
  });

  taskList.copy('Configuring SSL', {
    src: pemFilePath,
    dest: '/opt/stud/ssl.pem'
  });


  taskList.copy('Configuring Stud', {
    src: path.resolve(TEMPLATES_DIR, 'stud.conf'),
    dest: '/opt/stud/stud.conf',
    vars: {
      backend: util.format('[%s]:%d', backend.host, backend.port)
    }
  });

  taskList.execute('Verifying SSL Configurations (ssl.pem)', {
    command: 'stud --test --config=/opt/stud/stud.conf'
  });

  //restart stud
  taskList.execute('Starting Stud', {
    command: '(sudo stop stud || :) && (sudo start stud || :)'
  });
}
