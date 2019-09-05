/* eslint-disable no-console */
const { spawn } = require('child_process');
const archiver = require('archiver');
const fs = require('fs');
const pathResolve = require('path').resolve;
const _ = require('underscore');

function buildMeteorApp(appPath, meteorBinary, buildLocaltion, callback) {
  let executable = meteorBinary;
  let args = [
    'build', '--directory', buildLocaltion,
    '--architecture', 'os.linux.x86_64',
    '--server', 'http://localhost:3000',
  ];
  const isWin = /^win/.test(process.platform);
  if (isWin) {
    // Sometimes cmd.exe not available in the path
    // See: http://goo.gl/ADmzoD
    executable = process.env.comspec || 'cmd.exe';
    args = ['/c', 'meteor'].concat(args);
  }

  const options = { cwd: appPath };
  const meteor = spawn(executable, args, options);

  meteor.stdout.pipe(process.stdout, { end: false });
  meteor.stderr.pipe(process.stderr, { end: false });

  meteor.on('close', callback);
}

function archiveIt(buildLocaltion, callback) {
  const callbck = _.once(callback);
  const bundlePath = pathResolve(buildLocaltion, 'bundle.tar.gz');
  const sourceDir = pathResolve(buildLocaltion, 'bundle');

  const output = fs.createWriteStream(bundlePath);
  const archive = archiver('tar', {
    gzip: true,
    gzipOptions: { level: 6 },
  });

  archive.pipe(output);
  output.once('close', callbck);

  archive.once('error', (err) => {
    console.log('=> Archiving failed:', err.message);
    callbck(err);
  });

  archive.directory(sourceDir, 'bundle').finalize();
}

function buildApp(appPath, meteorBinary, buildLocaltion, callback) {
  buildMeteorApp(appPath, meteorBinary, buildLocaltion, (code) => {
    if (code === 0) {
      archiveIt(buildLocaltion, callback);
    } else {
      console.log('\n=> Build Error. Check the logs printed above.');
      callback(new Error('build-error'));
    }
  });
}

module.exports = buildApp;
