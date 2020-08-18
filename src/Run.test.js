/* globals Wsh: false */
/* globals process: false */
/* globals __dirname: false */
/* globals __filename: false */

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

var includes = util.includes;
var srr = os.surroundPath;
var escapeForCmd = os.escapeForCmd;
var CMD = os.exefiles.cmd;
var CSCRIPT = os.exefiles.cscript;
var NET = os.exefiles.net;
var execSync = child_process.execSync;

var testRun;
if (includes(process.execArgv, '//job:test:dist:Run')) {
  testRun = srr(CSCRIPT) + ' ' + srr(path.join(__dirname, 'dist', 'Run.wsf')) + ' //nologo';
} else {
  testRun = srr(CSCRIPT) + ' ' + srr(__filename) + ' //nologo //job:test:src:Run';
}

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

describe('Run', function () {
  var testName;

  testName = 'connect_help';
  test(testName, function () {
    expect('@TODO').toBe('TEST');

    var args = ['connect', '-h'];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    console.dir(retObj);
  });

  testName = 'connect_dryRun';
  test(testName, function () {
    var comp = '11.22.33.44';
    var share = 'public';
    var domain = 'PCNAME';
    var user = 'UserId';
    var pwd = 'My * P@ss><';

    var args = [
      'connect', comp,
      '-S', share,
      '-D', domain,
      '-U', user,
      '-P', '"' + pwd + '"',
      '-R'
    ];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    expect(retObj.error).toBeFalsy();
    expect(retObj.stderr).toBe('');

    var expC = expect(retObj.stdout).toContain; // Shorthand
    expC('Start the function smbcn.connectSyncSurelyUsingLog');
    expC('Connecting to "' + comp + '"');
    expC('shareName: "' + share + '"');
    expC('domain: "' + domain + '", user: "' + user + '"');
    expC('password: "****"');
    expC('throws: false');
    expC('Succeeded the connecting!');
    expC('Finished the function smbcn.connectSyncSurelyUsingLog');

    expC('dry-run [smbcn.connectSyncSurelyUsingLog]: ');
    expC('dry-run [net.SMB.connectSyncSurely]: ');
    expC('dry-run [net.SMB.disconnectSync]: ');
    expC(_getCmdNetDel(comp, share));
    expC(_getCmdNetCn(comp, share, domain, user, pwd));
  });

  testName = 'disconnect_help';
  test(testName, function () {
    expect('@TODO').toBe('TEST');

    var args = ['disconnect', '-h'];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    console.dir(retObj);
  });

  testName = 'disconnect_dryRun';
  test(testName, function () {
    var comp = '11.22.33.44';
    var share = 'public';
    var retObj;
    var stdout;

    var args = ['disconnect', comp, '-S', share, '-R'];
    retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    expect(retObj.error).toBeFalsy();
    expect(retObj.stderr).toBe('');

    stdout = retObj.stdout;
    expect(stdout).toContain('dry-run [_shRun]: ' + CMD + ' /S /C"'
      + NET + ' use' + ' \\\\' + comp + '\\' + share + ' /delete /yes 1> '
    );
  });

  testName = 'schemaConnect_help';
  test(testName, function () {
    expect('@TODO').toBe('TEST');

    var args = ['schemaConnect', '-h'];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    console.dir(retObj);
  });

  var schema = {
    connectSchema: {
      components: {
        ipc: 'IPC$',
        homeNasIP: '11.22.33.44',
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
    }
  };

  testName = 'schemaConnect_dryRun-NoVal';
  test(testName, function () {
    var tmpDir = os.makeTmpPath() + '_' + testName;
    var wshDir = path.join(tmpDir, '.wsh');
    var schemaJson = path.join(wshDir, 'settings.json');

    fse.ensureDirSync(wshDir);
    fse.writeJsonSync(schemaJson, schema);

    var args = ['schemaConnect', '-D', wshDir, '-R'];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    expect(retObj.error).toBeFalsy();
    expect(retObj.stderr).toBe('');

    // Shorthands
    var cmp = schema.connectSchema.components;
    var rsrc = schema.connectSchema.tasks;
    var expC = expect(retObj.stdout).toContain;

    expC('Start function smbcn.connectSyncUsingSchema');
    expC('taskName: "*"');
    expC('matched tasks: ' + Object.keys(rsrc).length);
    expC('Start the function smbcn.connectSyncSurelyUsingLog');

    (function () {
      var comp = cmp.homeNasIP;
      var share = cmp.ipc;
      var user = rsrc.home.user;
      var domain = '';
      var pwd = 'null';
      expC('Start the task: home');
      expC('Connecting to "' + comp + '"');
      expC('shareName: "' + share + '"');
      expC('domain: "", user: "' + user + '"');
      expC('password: "****"');
      expC('throws: false');
      expC(_getCmdNetDel(comp, share));
      expC(_getCmdNetCn(comp, share, domain, user, pwd));
      expC(' success Succeeded the connecting!');
    })();

    (function () {
      expC('Start the task: work:office');
      expC('available: false => Skip this task');
    })();

    (function () {
      var comp = rsrc['work:labo'].comp;
      var share = rsrc['work:labo'].share;
      var user = cmp.workUsername;
      var domain = rsrc['work:labo'].domain;
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
    expC('Finished function smbcn.connectSyncUsingSchema');

    // Cleans
    fse.removeSync(tmpDir);
    expect(fs.existsSync(tmpDir)).toBe(false);
  });

  testName = 'schemaConnect_dryRun';
  test(testName, function () {
    var tmpDir = os.makeTmpPath() + '_' + testName;
    var wshDir = path.join(tmpDir, '.wsh');
    var schemaJson = path.join(wshDir, 'settings.json');

    fse.ensureDirSync(wshDir);
    fse.writeJsonSync(schemaJson, schema);

    var anyVal1 = 'My * P@ss><_1';
    var anyVal2 = 'My * P@ss><_2';
    var args = [
      'schemaConnect',
      '"anyVal1:' + anyVal1 + '"',
      '"anyVal2:' + anyVal2 + '"',
      '-D', wshDir,
      '-R'
    ];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    expect(retObj.error).toBeFalsy();
    expect(retObj.stderr).toBe('');

    // Shorthands
    var cmp = schema.connectSchema.components;
    var rsrc = schema.connectSchema.tasks;
    var expC = expect(retObj.stdout).toContain;

    expC('Start function smbcn.connectSyncUsingSchema');
    expC('taskName: "*"');
    expC('matched tasks: ' + Object.keys(rsrc).length);
    expC('Start the function smbcn.connectSyncSurelyUsingLog');

    (function () {
      var comp = cmp.homeNasIP;
      var share = cmp.ipc;
      var user = rsrc.home.user;
      var domain = '';
      var pwd = anyVal1;
      expC('Start the task: home');
      expC('Connecting to "' + comp + '"');
      expC('shareName: "' + share + '"');
      expC('domain: "", user: "' + user + '"');
      expC('password: "****"');
      expC('throws: false');
      expC(_getCmdNetDel(comp, share));
      expC(_getCmdNetCn(comp, share, domain, user, pwd));
      expC('Succeeded the connecting!');
    })();

    (function () {
      expC('Start the task: work:office');
      expC('available: false => Skip this task');
    })();

    (function () {
      var comp = rsrc['work:labo'].comp;
      var share = rsrc['work:labo'].share;
      var user = cmp.workUsername;
      var domain = rsrc['work:labo'].domain;
      var pwd = anyVal2;
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
    expC('Finished function smbcn.connectSyncUsingSchema');

    // Cleans
    fse.removeSync(tmpDir);
    expect(fs.existsSync(tmpDir)).toBe(false);
  });

  testName = 'schemaConnect_dryRun_defJson';
  test(testName, function () {
    var anyVal1 = 'My * P@ss><_1';
    var anyVal2 = 'My * P@ss><_2';
    var args = [
      'schemaConnect',
      '"anyVal1:' + anyVal1 + '"',
      '"anyVal2:' + anyVal2 + '"',
      '-R'
    ];
    var retObj = execSync(testRun + ' ' + args.join(' '));
    // console.dir(retObj);
    expect(retObj.error).toBeFalsy();
    expect(retObj.stderr).toBe('');

    // Shorthands
    var cmp = schema.connectSchema.components;
    var rsrc = schema.connectSchema.tasks;
    var expC = expect(retObj.stdout).toContain;

    expC('Start function smbcn.connectSyncUsingSchema');
    expC('taskName: "*"');
    expC('matched tasks: ' + Object.keys(rsrc).length);
    expC('Start the function smbcn.connectSyncSurelyUsingLog');

    (function () {
      var comp = cmp.homeNasIP;
      var share = cmp.ipc;
      var user = rsrc.home.user;
      var domain = '';
      var pwd = anyVal1;
      expC('Start the task: home');
      expC('Connecting to "' + comp + '"');
      expC('shareName: "' + share + '"');
      expC('domain: "", user: "' + user + '"');
      expC('password: "****"');
      expC('throws: false');
      expC(_getCmdNetDel(comp, share));
      expC(_getCmdNetCn(comp, share, domain, user, pwd));
      expC('Succeeded the connecting!');
    })();

    (function () {
      expC('Start the task: work:office');
      expC('available: false => Skip this task');
    })();

    (function () {
      var comp = rsrc['work:labo'].comp;
      var share = rsrc['work:labo'].share;
      var user = cmp.workUsername;
      var domain = rsrc['work:labo'].domain;
      var pwd = anyVal2;
      expC('Start the task: work:labo');
      expC('Connecting to "' + comp + '"');
      expC('shareName: "' + share + '"');
      expC('domain: "' + domain + '", user: "' + user + '"');
      expC('password: "****"');
      expC('throws: false');
      expC(_getCmdNetDel(comp, share));
      expC(_getCmdNetCn(comp, share, domain, user, pwd));
      expC('success Succeeded the connecting!');
    })();

    expC('Finished the function smbcn.connectSyncSurelyUsingLog');
    expC('Finished function smbcn.connectSyncUsingSchema');
  });
});
