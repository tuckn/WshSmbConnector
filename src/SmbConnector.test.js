/* globals Wsh: false */
/* globals __filename: false */
/* globals process: false */

/* globals describe: false */
/* globals test: false */
/* globals expect: false */

// Shorthand
var util = Wsh.Util;
var path = Wsh.Path;
var os = Wsh.OS;
var fs = Wsh.FileSystem;
var fse = Wsh.FileSystemExtra;
var child_process = Wsh.ChildProcess;
var net = Wsh.Net;
var logger = Wsh.Logger;

var includes = util.includes;
var srr = os.surroundPath;
var CMD = os.exefiles.cmd;
var CSCRIPT = os.exefiles.cscript;
var NET = os.exefiles.net;
var execSync = child_process.execSync;

var noneStrVals = [true, false, undefined, null, 0, 1, NaN, Infinity, [], {}];
var noneObjVals = [true, false, undefined, null, 0, 1, NaN, Infinity, [], ''];
var testCmd = srr(CSCRIPT) + ' ' + srr(__filename) + ' //job:test:SMB';

var _cb = function (fn/* , args */) {
  var args = Array.from(arguments).slice(1);
  return function () { fn.apply(null, args); };
};

var _getCmdNetDel = function (comp, share) {
  return 'dry-run [_shRun]: ' + CMD + ' /S /C"'
      + NET + ' use ' + '\\\\' + comp + '\\' + share
      + ' /delete /yes 1> ';
};

var _getCmdNetCn = function (comp, share, domain, user, pwd) {
  var domainStr = domain ? domain + '\\' : '';

  return 'dry-run [_shRun]: ' + CMD + ' /S /C"'
    + NET + ' use ' + '\\\\' + comp + '\\' + share
    + ' ' + pwd + ' /user:' + domainStr + user + ' /persistent:no 1> ';
};

describe('SmbConnector', function () {
  var testName;

  testName = 'connectSyncSurely_dryRun';
  test(testName, function () {
    var comp = '11.22.33.44';
    var shareName = 'public';
    var domain = 'PCNAME';
    var user = 'UserId';
    var pwd = 'usrP@ss';
    var retVal;

    var logFile = os.makeTmpPath() + '.log';
    var lggr = logger.create('info/' + logFile);

    // dry-run
    retVal = net.SMB.connectSyncSurelyUsingLog(
      comp, shareName, domain, user, pwd, {
        logger: lggr,
        isDryRun: true
      }
    );
    // console.log(retVal);
    expect(retVal).toContain('dry-run [net.SMB.connectSyncSurelyUsingLog]: ');
    expect(retVal).toContain('dry-run [net.SMB.connectSyncSurely]: ');
    expect(retVal).toContain('dry-run [net.SMB.disconnectSync]: ');
    expect(retVal).toContain('dry-run [_shRun]: ' + CMD + ' /S /C"'
      + NET + ' use ' + '\\\\' + comp + '\\' + shareName + ' /delete /yes 1> ');
    expect(retVal).toContain('dry-run [_shRun]: ' + CMD + ' /S /C"'
      + NET + ' use ' + '\\\\' + comp + '\\' + shareName
      + ' ' + pwd + ' /user:' + domain + '\\' + user + ' /persistent:no 1> ');

    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);
    expect(logStr).toContain(' info    Start the function net.SMB.connectSyncSurelyUsingLog');
    expect(logStr).toContain(' info    Connecting to "' + comp + '"');
    expect(logStr).toContain(' info    shareName: "' + shareName + '"');
    expect(logStr).toContain(' info    domain: "' + domain + '", user: "' + user + '"');
    expect(logStr).toContain(' info    password: "****"');
    expect(logStr).toContain(' info    throws: false');
    expect(logStr).toContain(' success Succeeded the connecting!');
    expect(logStr).toContain(' info    Finished the function net.SMB.connectSyncSurelyUsingLog');

    // Cleans
    fse.removeSync(logFile);
    expect(fs.existsSync(logFile)).toBe(false);
  });

  testName = 'connectSyncSurely';
  test(testName, function () {
    expect('@TODO').toBe('PASS');
  });

  var schema = {
    components: {
      ipc: 'IPC$',
      homeNasIP: '127.0.0.10',
      workNetDomain: 'mycompany.local',
      workUsername: 'ID123456',
      anyVal1: null, // Overwrites with options.overwrites.anyVal1
      anyVal2: null // Overwrites with options.overwrites.anyVal2
    },
    resources: {
      home: {
        comp: '${homeNasIP}',
        share: '${ipc}',
        user: 'tuckn',
        pwd: '${anyVal1}'
      },
      'work:office': {
        available: false,
        comp: 'SV12345',
        share: '${ipc}',
        domain: '${workNetDomain}',
        user: '${workUsername}',
        pwd: '${anyVal2}'
      },
      'work:labo': {
        description: 'Test Server (Windows Server2008)',
        available: true,
        comp: 'PC67890',
        share: 'C$',
        domain: 'PC67890',
        user: '${workUsername}',
        pwd: '${anyVal2}'
      }
    }
  };

  testName = 'connectSyncUsingSchema_dryRun_noVar';
  test(testName, function () {
    var logFile = os.makeTmpPath() + '.log';
    var lggr = logger.create('info/' + logFile);
    var retVal;
    var comp;
    var share;
    var domain;
    var user;
    var pwd;

    retVal = net.SMB.connectSyncUsingSchema(schema, '*', {
      logger: lggr,
      isDryRun: true
    });
    // console.log(retVal);
    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);

    expect(logStr).toContain(' info    Start the function net.SMB.connectSyncSurelyUsingLog');
    expect(logStr).toContain(' info    query: "*"');

    expect(retVal).toContain('dry-run [net.SMB.connectSyncUsingSchema]:');
    expect(retVal).toContain('dry-run [net.SMB.connectSyncSurelyUsingLog]:');

    expect(retVal).toContain('dry-run [net.SMB.connectSyncSurely]:');
    expect(retVal).toContain('dry-run [net.SMB.disconnectSync]:');

    expect(logStr).toContain(' info    Finished the function net.SMB.connectSyncSurelyUsingLog');

    comp = schema.components.homeNasIP;
    share = schema.components.ipc;
    domain = '';
    user = schema.resources.home.user;
    pwd = 'null';
    expect(retVal).toContain(_getCmdNetDel(comp, share));
    expect(retVal).toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    expect(logStr).toContain(' info    Connecting to "' + comp + '"');
    expect(logStr).toContain(' info    shareName: "' + share + '"');
    expect(logStr).toContain(' info    domain: "' + domain + '", user: "' + user + '"');
    expect(logStr).toContain(' info    password: "****"');
    expect(logStr).toContain(' info    throws: false');
    expect(logStr).toContain(' success Succeeded the connecting!');

    comp = schema.resources['work:office'].comp;
    share = schema.components.ipc;
    domain = schema.components.workNetDomain;
    user = schema.components.workUsername;
    pwd = 'null';
    expect(retVal).not.toContain(_getCmdNetDel(comp, share));
    expect(retVal).not.toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    expect(logStr).not.toContain(' info    Connecting to "' + comp + '"');

    comp = schema.resources['work:labo'].comp;
    share = schema.resources['work:labo'].share;
    domain = schema.resources['work:labo'].domain;
    user = schema.components.workUsername;
    pwd = 'null';
    expect(retVal).toContain(_getCmdNetDel(comp, share));
    expect(retVal).toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    expect(logStr).toContain(' info    Connecting to "' + comp + '"');
    expect(logStr).toContain(' info    shareName: "' + share + '"');
    expect(logStr).toContain(' info    domain: "' + domain + '", user: "' + user + '"');
    expect(logStr).toContain(' info    password: "****"');
    expect(logStr).toContain(' info    throws: false');
    expect(logStr).toContain(' success Succeeded the connecting!');

    // Cleans
    fse.removeSync(logFile);
    expect(fs.existsSync(logFile)).toBe(false);
  });

  testName = 'connectSyncUsingSchema_dryRun_home';
  test(testName, function () {
    var logFile = os.makeTmpPath() + '.log';
    var lggr = logger.create('info/' + logFile);
    var retVal;
    var comp;
    var share;
    var domain;
    var user;
    var pwd;

    var anyVal1 = 'myHomeP@ss';

    retVal = net.SMB.connectSyncUsingSchema(schema, 'home', {
      logger: lggr,
      overwrites: { anyVal1: anyVal1 },
      isDryRun: true
    });
    // console.log(retVal);
    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);

    expect(logStr).toContain(' info    Start the function net.SMB.connectSyncSurelyUsingLog');
    expect(logStr).toContain(' info    query: "home"');

    expect(retVal).toContain('dry-run [net.SMB.connectSyncUsingSchema]:');
    expect(retVal).toContain('dry-run [net.SMB.connectSyncSurelyUsingLog]:');

    expect(retVal).toContain('dry-run [net.SMB.connectSyncSurely]:');
    expect(retVal).toContain('dry-run [net.SMB.disconnectSync]:');

    expect(logStr).toContain(' info    Finished the function net.SMB.connectSyncSurelyUsingLog');

    comp = schema.components.homeNasIP;
    share = schema.components.ipc;
    domain = '';
    user = schema.resources.home.user;
    pwd = anyVal1;
    expect(retVal).toContain(_getCmdNetDel(comp, share));
    expect(retVal).toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    expect(logStr).toContain(' info    Connecting to "' + comp + '"');
    expect(logStr).toContain(' info    shareName: "' + share + '"');
    expect(logStr).toContain(' info    domain: "' + domain + '", user: "' + user + '"');
    expect(logStr).toContain(' info    password: "****"');
    expect(logStr).toContain(' info    throws: false');
    expect(logStr).toContain(' success Succeeded the connecting!');

    comp = schema.resources['work:office'].comp;
    share = schema.components.ipc;
    domain = schema.components.workNetDomain;
    user = schema.components.workUsername;
    pwd = 'null';
    expect(retVal).not.toContain(_getCmdNetDel(comp, share));
    expect(retVal).not.toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    expect(logStr).not.toContain(' info    Connecting to "' + comp + '"');

    comp = schema.resources['work:labo'].comp;
    share = schema.resources['work:labo'].share;
    domain = schema.resources['work:labo'].domain;
    user = schema.components.workUsername;
    pwd = 'null';
    expect(retVal).not.toContain(_getCmdNetDel(comp, share));
    expect(retVal).not.toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    expect(logStr).not.toContain(' info    Connecting to "' + comp + '"');

    // Cleans
    fse.removeSync(logFile);
    expect(fs.existsSync(logFile)).toBe(false);
  });

  testName = 'connectSyncUsingSchema';
  test(testName, function () {
    expect('@TODO').toBe('PASS');

    var options = { throws: false, showResult: true };

    net.SMB.connectSyncUsingSchema(schema, '*', options);

    noneObjVals.forEach(function (val) {
      expect(_cb(net.SMB.connectSyncUsingSchema, val)).toThrowError();
    });

    noneStrVals.forEach(function (val) {
      expect(_cb(net.SMB.connectSyncUsingSchema, schema, val)).toThrowError();
    });
  });
});
