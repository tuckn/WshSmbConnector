/**
 * @file The main script of WshCore for WSH (Windows Script Host {@link https://docs.microsoft.com/en-us/previous-versions//9bbdkx3k(v=vs.85)|Microsoft Docs}). I recommend that JScript File Encoding is UTF-8[BOM, dos]
 * @requires wscript.exe/cscript.exe
 * @requires JScriptExtension.js
 * @requires Util.js
 * @requires ConstJscript.js
 * @requires Path.js
 * @requires OS.js
 * @requires Process.js
 * @requires Commander.js
 * @requires ConfigStore.js
 * @requires Net.js
 * @author Tuckn <tuckn333+github@gmail.com>
 * @license MIT
 * @see {@link https://github.com/tuckn/WshCore|GitHub}
 */

/* globals Wsh: false */
/* globals process: false */

// Shorthands
var util = Wsh.Util;
var CD = Wsh.Constants;
var cli = Wsh.Commander;
var ConfigStore = Wsh.ConfigStore;
var net = Wsh.Net;

var isSolidArray = util.isSolidArray;
var isSolidString = util.isSolidString;

/** @constant {string} */
var ERR_TITLE = 'Error in WshCore/run.js';

cli.addProgram({
  command: 'smbConnect <compName>',
  description: 'The command to connect your PC to the resource',
  version: '1.0.0',
  options: [
    ['-S, --shared <name>', 'A shared name of the resource. Default: "IPC$"'],
    ['-D, --domain <name>', 'A domain of the user'],
    ['-U, --user <name>', 'A user name to log on'],
    ['-P, --pwd <password>', 'A password of the user'],
    ['-L, --logger <val>', '<level>/<transportaion> (e.g. "warn/popup"). ', 'info/console'],
    ['-H, --has-result', 'Show a result(net use)']
  ],
  action: function (compName, opt) {
    if (!isSolidString(compName)) {
      cli.help(function () {
        throw new Error(ERR_TITLE + '(smbConnect)\n'
            + '  The essential parameter is empty.');
      });
    }

    net.SMB.connectSyncSurelyUsingLog(
      compName, opt.shared, opt.domain, opt.user, opt.pwd,
      { logger: opt.logger, showsResult: opt.hasResult });

    process.exit(CD.runOk);
  }
});

cli.addProgram({
  command: 'smbDisconnect [compName]',
  description: 'The command to connect your PC to the resource',
  version: '1.0.0',
  options: [
    ['-S, --shared <name>', 'A shared name of the resource. Default: "IPC$"'],
    ['-H, --has-result', 'Show a result(net use)']
  ],
  action: function (compName, opt) {
    var result = net.SMB.disconnectSync(compName, opt.shared);

    if (opt.hasResult) {
      console.log(result);
      net.SMB.showCurrentConnections();
    }

    process.exit(CD.runOk);
  }
});

cli.addProgram({
  command: 'smbConnectSchema [overwriteKey:val...]',
  description: 'The command to connect your PC to resources',
  version: '1.0.0',
  options: [
    ['-C, --config <name>', 'A configure name. If no specifying, use "%CD%\\.wsh\\setting.json"'],
    ['-N, --prop-name <name>', 'A property name of the connection schema.'],
    ['-D, --dir-path <path>', '"portable"(Default), "userProfile", <Directory Path>'],
    ['-E, --encoding <code>', 'Default: "utf-8"', CD.UTF8],
    ['-L, --logger <val>', '<level>/<transportaion> (e.g. "warn/popup"). ', 'info/console'],
    ['-H, --has-result', 'Show a result(net use)']
  ],
  requiredOptions: [
    ['-r, --resource <path>', 'A resource path. (e.g. "taskName/nickName")']
  ],
  action: function (overwrites, opt) {
    if (!isSolidString(opt.resource)) {
      cli.help(function () {
        throw new Error(ERR_TITLE + '(smbConnectSchema)\n'
            + '  The essential parameter is empty.');
      });
    }

    var overwritesObj = {};

    if (isSolidArray(overwrites)) {
      overwrites.forEach(function (setStr) {
        var strs = setStr.split(':');
        if (strs.length > 1) overwritesObj[strs[0]] = strs[1];
      });
    }

    var conf = new ConfigStore(opt.fileName, {
      dirPath: opt.dirPath,
      fileOptions: { encoding: opt.encoding }
    });
    var schema = conf.get('connectSchema'); // @TODO

    net.SMB.connectSyncUsingSchema(schema, opt.resource, {
      overwrites: overwritesObj,
      logger: opt.logger,
      showsResult: opt.hasResult
    });

    process.exit(CD.runOk);
  }
});

cli.parse(process.argv);

