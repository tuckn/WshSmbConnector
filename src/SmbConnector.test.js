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
      + NET + ' use ' + '\\\\' + comp + '\\' + share + ' /delete /yes 1> ';
};

var _getCmdNetCn = function (comp, share, domain, user, pwd) {
  var domainStr = domain ? domain + '\\' : '';

  return 'dry-run [_shRun]: ' + CMD + ' /S /C"'
    + NET + ' use ' + '\\\\' + comp + '\\' + share
    + ' ' + escapeForCmd(pwd) + ' /user:' + domainStr + user + ' /persistent:no 1> ';
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
    expect(logStr).toContain('dry-run [smbcn.connectSyncSurelyUsingLog]: ');
    expect(logStr).toContain('dry-run [net.SMB.connectSyncSurely]: ');
    expect(logStr).toContain('dry-run [net.SMB.disconnectSync]: ');
    expect(logStr).toContain('dry-run [_shRun]: ' + CMD + ' /S /C"'
      + NET + ' use ' + '\\\\' + comp + '\\' + shareName + ' /delete /yes 1> ');
    expect(logStr).toContain('dry-run [_shRun]: ' + CMD + ' /S /C"'
      + NET + ' use ' + '\\\\' + comp + '\\' + shareName
      + ' ' + pwd + ' /user:' + domain + '\\' + user + ' /persistent:no 1> ');

    expect(logStr).toContain(' info    Start the function smbcn.connectSyncSurelyUsingLog');
    expect(logStr).toContain(' info    Connecting to "' + comp + '"');
    expect(logStr).toContain(' info    shareName: "' + shareName + '"');
    expect(logStr).toContain(' info    domain: "' + domain + '", user: "' + user + '"');
    expect(logStr).toContain(' info    password: "****"');
    expect(logStr).toContain(' info    throws: false');
    expect(logStr).toContain(' success Succeeded the connecting!');
    expect(logStr).toContain(' info    Finished the function smbcn.connectSyncSurelyUsingLog');

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
    var retVal;
    var comp;
    var share;
    var domain;
    var user;
    var pwd;

    retVal = smbcn.connectSyncUsingSchema(schema, '*', {
      logger: lggr,
      isDryRun: true
    });
    expect(retVal).toBeUndefined();

    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);

    expect(logStr).toContain(' info    Start the function smbcn.connectSyncSurelyUsingLog');
    expect(logStr).toContain(' info    taskName: "*"');

    expect(logStr).toContain('dry-run [smbcn.connectSyncUsingSchema]:');
    expect(logStr).toContain('dry-run [smbcn.connectSyncSurelyUsingLog]:');

    expect(logStr).toContain('dry-run [net.SMB.connectSyncSurely]:');
    expect(logStr).toContain('dry-run [net.SMB.disconnectSync]:');


    comp = schema.components.homeNasIP;
    share = schema.components.ipc;
    domain = '';
    user = schema.tasks.home.user;
    pwd = 'null';
    expect(logStr).toContain(' info    Connecting to "' + comp + '"');
    expect(logStr).toContain(' info    shareName: "' + share + '"');
    expect(logStr).toContain(' info    domain: "' + domain + '", user: "' + user + '"');
    expect(logStr).toContain(' info    password: "****"');
    expect(logStr).toContain(' info    throws: false');
    expect(logStr).toContain(_getCmdNetDel(comp, share));
    expect(logStr).toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    expect(logStr).toContain(' success Succeeded the connecting!');

    comp = schema.tasks['work:office'].comp;
    share = schema.components.ipc;
    domain = schema.components.workNetDomain;
    user = schema.components.workUsername;
    pwd = 'null';
    expect(logStr).not.toContain(' info    Connecting to "' + comp + '"');
    expect(logStr).not.toContain(_getCmdNetDel(comp, share));
    expect(logStr).not.toContain(_getCmdNetCn(comp, share, domain, user, pwd));

    comp = schema.tasks['work:labo'].comp;
    share = schema.tasks['work:labo'].share;
    domain = schema.tasks['work:labo'].domain;
    user = schema.components.workUsername;
    pwd = 'null';
    expect(logStr).toContain(' info    Connecting to "' + comp + '"');
    expect(logStr).toContain(' info    shareName: "' + share + '"');
    expect(logStr).toContain(' info    domain: "' + domain + '", user: "' + user + '"');
    expect(logStr).toContain(' info    password: "****"');
    expect(logStr).toContain(' info    throws: false');
    expect(logStr).toContain(_getCmdNetDel(comp, share));
    expect(logStr).toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    expect(logStr).toContain(' success Succeeded the connecting!');

    expect(logStr).toContain(' info    Finished the function smbcn.connectSyncSurelyUsingLog');

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

    var anyVal1 = 'My * P@ss><';

    retVal = smbcn.connectSyncUsingSchema(schema, 'home', {
      logger: lggr,
      overwrites: { anyVal1: anyVal1 },
      isDryRun: true
    });
    expect(retVal).toBeUndefined();

    var logStr = fs.readFileSync(logFile, { encoding: 'utf8' });
    // console.log(logStr);

    expect(logStr).toContain(' info    Start the function smbcn.connectSyncSurelyUsingLog');
    expect(logStr).toContain(' info    taskName: "home"');

    expect(logStr).toContain('dry-run [smbcn.connectSyncUsingSchema]:');
    expect(logStr).toContain('dry-run [smbcn.connectSyncSurelyUsingLog]:');

    expect(logStr).toContain('dry-run [net.SMB.connectSyncSurely]:');
    expect(logStr).toContain('dry-run [net.SMB.disconnectSync]:');

    comp = schema.components.homeNasIP;
    share = schema.components.ipc;
    domain = '';
    user = schema.tasks.home.user;
    pwd = anyVal1;
    expect(logStr).toContain(' info    Connecting to "' + comp + '"');
    expect(logStr).toContain(' info    shareName: "' + share + '"');
    expect(logStr).toContain(' info    domain: "' + domain + '", user: "' + user + '"');
    expect(logStr).toContain(' info    password: "****"');
    expect(logStr).toContain(' info    throws: false');
    expect(logStr).toContain(_getCmdNetDel(comp, share));
    expect(logStr).toContain(_getCmdNetCn(comp, share, domain, user, pwd));
    expect(logStr).toContain(' success Succeeded the connecting!');

    comp = schema.tasks['work:office'].comp;
    share = schema.components.ipc;
    domain = schema.components.workNetDomain;
    user = schema.components.workUsername;
    pwd = 'null';
    expect(logStr).not.toContain(' info    Connecting to "' + comp + '"');
    expect(logStr).not.toContain(_getCmdNetDel(comp, share));
    expect(logStr).not.toContain(_getCmdNetCn(comp, share, domain, user, pwd));

    comp = schema.tasks['work:labo'].comp;
    share = schema.tasks['work:labo'].share;
    domain = schema.tasks['work:labo'].domain;
    user = schema.components.workUsername;
    pwd = 'null';
    expect(logStr).not.toContain(' info    Connecting to "' + comp + '"');
    expect(logStr).not.toContain(_getCmdNetDel(comp, share));
    expect(logStr).not.toContain(_getCmdNetCn(comp, share, domain, user, pwd));

    expect(logStr).toContain(' info    Finished the function smbcn.connectSyncSurelyUsingLog');

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
