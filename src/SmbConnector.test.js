/* globals Wsh: false */

/* globals describe: false */
/* globals test: false */
/* globals expect: false */

// Shorthand
var os = Wsh.OS;
var fs = Wsh.FileSystem;
var fse = Wsh.FileSystemExtra;
var logger = Wsh.Logger;
var smbcn = Wsh.SmbConnector;

var srrd = os.surroundCmdArg;
var escapeForCmd = os.escapeForCmd;
var CMD = os.exefiles.cmd;
var NET = os.exefiles.net;

var noneStrVals = [true, false, undefined, null, 0, 1, NaN, Infinity, [], {}];
var noneObjVals = [true, false, undefined, null, 0, 1, NaN, Infinity, [], ''];

var _cb = function (fn/* , args */) {
  var args = Array.from(arguments).slice(1);
  return function () { fn.apply(null, args); };
};

var _getCmdNetDel = function (comp, share) {
  return 'dry-run [_shRun]: ' + CMD + ' /S /C"'
      + NET + ' use ' + '\\\\' + comp + '\\' + share + ' /delete /yes 1>';
};

var _getCmdNetCn = function (comp, share, domain, user, pwd) {
  var domainStr = domain ? domain + '\\' : '';

  return 'dry-run [_shRun]: ' + CMD + ' /S /C"'
    + NET + ' use ' + '\\\\' + comp + '\\' + share
    + ' ' + srrd(escapeForCmd(pwd)) + ' /user:' + domainStr + user + ' /persistent:no 1>';
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

    var logFile = os.makeTmpPath() + '.log';
    var lggr = logger.create('info/' + logFile);

    // dry-run
    var retVal = smbcn.connectSyncSurelyUsingLog(
      comp, shareName, domain, user, pwd, {
        logger: lggr,
        isDryRun: true
      }
    );
    expect(retVal).toBeUndefined();

    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);
    var expC = expect(logStr).toContain; // Shorthand
    expC('dry-run [smbcn.connectSyncSurelyUsingLog]: ');
    expC('dry-run [net.SMB.connectSyncSurely]: ');
    expC('dry-run [net.SMB.disconnectSync]: ');
    expC('dry-run [_shRun]: ' + CMD + ' /S /C"'
      + NET + ' use ' + '\\\\' + comp + '\\' + shareName + ' /delete /yes 1>');
    expC('dry-run [_shRun]: ' + CMD + ' /S /C"'
      + NET + ' use ' + '\\\\' + comp + '\\' + shareName
      + ' ' + pwd + ' /user:' + domain + '\\' + user + ' /persistent:no 1>');

    expC('Start the function smbcn.connectSyncSurelyUsingLog');
    expC('Connecting to "' + comp + '"');
    expC('shareName: "' + shareName + '"');
    expC('domain: "' + domain + '", user: "' + user + '"');
    expC('password: "****"');
    expC('throws: false');
    expC('Succeeded the connecting!');
    expC('Finished the function smbcn.connectSyncSurelyUsingLog');

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
    tasks: {
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

    var retVal = smbcn.connectSyncUsingSchema(schema, '*', {
      logger: lggr,
      isDryRun: true
    });
    expect(retVal).toBeUndefined();

    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);

    var expC = expect(logStr).toContain; // Shorthand
    expC('Start the function smbcn.connectSyncSurelyUsingLog');
    expC('taskName: "*"');
    expC('dry-run [smbcn.connectSyncUsingSchema]:');
    expC('dry-run [smbcn.connectSyncSurelyUsingLog]:');
    expC('dry-run [net.SMB.connectSyncSurely]:');
    expC('dry-run [net.SMB.disconnectSync]:');

    (function () {
      var comp = schema.components.homeNasIP;
      var share = schema.components.ipc;
      var domain = '';
      var user = schema.tasks.home.user;
      var pwd = 'null';
      expC('Start the task: home');
      expC('Connecting to "' + comp + '"');
      expC('shareName: "' + share + '"');
      expC('domain: "' + domain + '", user: "' + user + '"');
      expC('password: "****"');
      expC('throws: false');
      expC(_getCmdNetDel(comp, share));
      expC(_getCmdNetCn(comp, share, domain, user, pwd));
      expC('Succeeded the connecting!');
    })();

    (function () {
      var comp = schema.tasks['work:office'].comp;
      var share = schema.components.ipc;
      var domain = schema.components.workNetDomain;
      var user = schema.components.workUsername;
      var pwd = 'null';
      expC('Start the task: work:office');
      expC('available: false => Skip this task');
      expect(logStr).not.toContain('Connecting to "' + comp + '"');
      expect(logStr).not.toContain(_getCmdNetDel(comp, share));
      expect(logStr).not.toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    })();

    (function () {
      var comp = schema.tasks['work:labo'].comp;
      var share = schema.tasks['work:labo'].share;
      var domain = schema.tasks['work:labo'].domain;
      var user = schema.components.workUsername;
      var pwd = 'null';
      expC('Start the task: work:labo');
      expC('Connecting to "' + comp + '"');
      expC('shareName: "' + share + '"');
      expC('domain: "' + domain + '", user: "' + user + '"');
      expC('password: "****"');
      expC('throws: false');
      expC(_getCmdNetDel(comp, share));
      expC(_getCmdNetCn(comp, share, domain, user, pwd));
      expC('Succeeded the connecting!');
    })();

    expC('Finished the function smbcn.connectSyncSurelyUsingLog');

    // Cleans
    fse.removeSync(logFile);
    expect(fs.existsSync(logFile)).toBe(false);
  });

  testName = 'connectSyncUsingSchema_dryRun_home';
  test(testName, function () {
    var logFile = os.makeTmpPath() + '.log';
    var lggr = logger.create('info/' + logFile);
    var anyVal1 = 'My * P@ss><';

    var retVal = smbcn.connectSyncUsingSchema(schema, 'home', {
      logger: lggr,
      overwrites: { anyVal1: anyVal1 },
      isDryRun: true
    });
    expect(retVal).toBeUndefined();

    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);

    var expC = expect(logStr).toContain; // Shorthand
    expC('Start the function smbcn.connectSyncSurelyUsingLog');
    expC('taskName: "home"');
    expC('dry-run [smbcn.connectSyncUsingSchema]:');
    expC('dry-run [smbcn.connectSyncSurelyUsingLog]:');
    expC('dry-run [net.SMB.connectSyncSurely]:');
    expC('dry-run [net.SMB.disconnectSync]:');

    (function () {
      var comp = schema.components.homeNasIP;
      var share = schema.components.ipc;
      var domain = '';
      var user = schema.tasks.home.user;
      var pwd = anyVal1;
      expC('Start the task: home');
      expC('Connecting to "' + comp + '"');
      expC('shareName: "' + share + '"');
      expC('domain: "' + domain + '", user: "' + user + '"');
      expC('password: "****"');
      expC('throws: false');
      expC(_getCmdNetDel(comp, share));
      expC(_getCmdNetCn(comp, share, domain, user, pwd));
      expC('Succeeded the connecting!');
    })();

    (function () {
      var comp = schema.tasks['work:office'].comp;
      var share = schema.components.ipc;
      var domain = schema.components.workNetDomain;
      var user = schema.components.workUsername;
      var pwd = 'null';
      expect(logStr).not.toContain('Start the task: work:office');
      expect(logStr).not.toContain('Connecting to "' + comp + '"');
      expect(logStr).not.toContain(_getCmdNetDel(comp, share));
      expect(logStr).not.toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    })();

    (function () {
      var comp = schema.tasks['work:labo'].comp;
      var share = schema.tasks['work:labo'].share;
      var domain = schema.tasks['work:labo'].domain;
      var user = schema.components.workUsername;
      var pwd = 'null';
      expect(logStr).not.toContain('Start the task: work:labo');
      expect(logStr).not.toContain('Connecting to "' + comp + '"');
      expect(logStr).not.toContain(_getCmdNetDel(comp, share));
      expect(logStr).not.toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    })();

    expC('Finished the function smbcn.connectSyncSurelyUsingLog');

    // Cleans
    fse.removeSync(logFile);
    expect(fs.existsSync(logFile)).toBe(false);
  });

  testName = 'connectSyncUsingSchema';
  test(testName, function () {
    expect('@TODO').toBe('PASS');

    var options = { throws: false, showResult: true };

    smbcn.connectSyncUsingSchema(schema, '*', options);

    noneObjVals.forEach(function (val) {
      expect(_cb(smbcn.connectSyncUsingSchema, val)).toThrowError();
    });

    noneStrVals.forEach(function (val) {
      expect(_cb(smbcn.connectSyncUsingSchema, schema, val)).toThrowError();
    });
  });
});
