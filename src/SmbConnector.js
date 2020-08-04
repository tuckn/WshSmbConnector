/* globals Wsh: false */

(function () {
  if (Wsh && Wsh.SmbConnector) return;

  /**
   * The WSH (Windows Script Host) CLI that connects to SMB resources according to the schema defined in a JSON file.
   *
   * @namespace SmbConnector
   * @memberof Wsh
   * @requires {@link https://github.com/tuckn/WshBasicPackage|tuckn/WshBasicPackage}
   */
  Wsh.SmbConnector = {};

  // Shorthands
  var util = Wsh.Util;
  var fs = Wsh.FileSystem;
  var net = Wsh.Net;
  var logger = Wsh.Logger;

  var objAdd = Object.assign;
  var insp = util.inspect;
  var obtain = util.obtainPropVal;
  var tmpParser = util.parseTemplateLiteral;
  var hasContent = util.hasContent;
  var includes = util.includes;
  var isSolidString = util.isSolidString;
  var isPlainObject = util.isPlainObject;

  var smbcn = Wsh.SmbConnector; // Shorthand

  /** @constant {string} */
  var MODULE_TITLE = 'WshSmbConnector/SmbConnector.js';

  var throwErrNonStr = function (functionName, typeErrVal) {
    util.throwTypeError('string', MODULE_TITLE, functionName, typeErrVal);
  };

  var throwErrNonObject = function (functionName, typeErrVal) {
    util.throwTypeError('object', MODULE_TITLE, functionName, typeErrVal);
  };

  var throwErrNonExist = function (functionName, typeErrVal) {
    fs.throwTypeErrorNonExisting(MODULE_TITLE, functionName, typeErrVal);
  };

  // smbcn.connectSyncSurelyUsingLog {{{
  /**
   * Connects the comp to a share resource
   *
   * @example
   * var smbcn = Wsh.SmbConnector; // Shorthand
   *
   * var comp = '11.22.33.44';
   * var share = 'public';
   * var domain = 'PCNAME';
   * var user = 'UserId';
   * var pwd = 'My * P@ss><';
   *
   * smbcn.connectSyncSurelyUsingLog(comp, share, domain, user, pwd, {
   *   logger: 'warn/winEvent', // See https://github.com/tuckn/WshLogger
   *   showsResult: true
   * });
   * @function connectSyncSurelyUsingLog
   * @memberof Wsh.SmbConnector
   * @param {string} comp - The computer name
   * @param {string} [shareName='IPC$'] - The share name
   * @param {string} [domain=''] - The domain name. If it is empty, net use uses the current logged on domain.
   * @param {string} [user] - The user name with which to log on
   * @param {string} [pwd] - The password. *: produce a prompt for the password.
   * @param {object} [options] - Optional parameters.
   * @param {(Logger|string|object)} [options.logger] - The Logger instance or create options. See {@link https://docs.tuckn.net/WshLogger/Wsh.Logger.html#.create|Wsh.Logger.create}.
   * @param {boolean} [options.transporsLog=true] - Outputs Wsh.Logger logs after connecting. See {@link https://docs.tuckn.net/WshLogger/Wsh.Logger.html#.this.transport|Wsh.Logger.transport}.
   * @param {boolean} [options.throws=false] - Throws the error, if SMB connecting throws an error.
   * @param {boolean} [options.showsResult=false] - Shows the current session after connecting.
   * @param {boolean} [options.isDryRun=false] - No execute, returns the string of command.
   * @returns {void}
   */
  smbcn.connectSyncSurelyUsingLog = function (comp, shareName, domain, user, pwd, options) {
    var FN = 'smbcn.connectSyncSurelyUsingLog';

    var loggerObj = obtain(options, 'logger', {});
    var lggr = logger.create(loggerObj);
    lggr.info('Start the function ' + FN);
    lggr.info('Connecting to "' + comp + '"');
    lggr.info('shareName: "' + shareName + '"');
    lggr.info('domain: "' + domain + '", user: "' + user + '"');
    lggr.info('password: "****"');

    var throws = obtain(options, 'throws', false);
    lggr.info('throws: ' + String(throws));

    var isDryRun = obtain(options, 'isDryRun', false);
    var retVal;

    try {
      retVal = net.SMB.connectSyncSurely(comp, shareName, domain, user, pwd, {
        isDryRun: isDryRun
      });

      if (isDryRun) lggr.info('dry-run [' + FN + ']: ' + retVal);
      lggr.success('Succeeded the connecting!');
    } catch (e) {
      if (throws) throw new Error(insp(e));
      lggr.error(insp(e));
    }

    lggr.info('Finished the function ' + FN);
    var transporsLog = obtain(options, 'transporsLog', true);
    if (transporsLog) lggr.transport();

    var showsResult = obtain(options, 'showsResult', false);
    if (showsResult) net.SMB.showCurrentSession();

    return;
  }; // }}}

  // smbcn.connectSyncUsingSchema {{{
  /**
   * @typedef {object} typeNetSmbConnectSchema
   * @property {object} components
   * @property {...typeNetSmbConnectSchemaResource} tasks
   */

  /**
   * @typedef {object} typeNetSmbConnectSchemaResource
   * @property {string} description
   * @property {boolean} [available=true] - If specifying false, Skips the resource.
   * @property {string} comp - The computer name or IP address.
   * @property {string} [share='IPC$'] - The share name.
   * @property {string} [domain] - The domain name. If it is empty, uses the current logged on domain.
   * @property {string} user
   * @property {string} password
   */

  /**
   * Connects the Windows to a share resource
   *
   * @example
   * var smbcn = Wsh.SmbConnector; // Shorthand
   * var schema = {
   *   components: {
   *     ipc: 'IPC$',
   *     homeNasIP: '127.0.0.10',
   *     workNetDomain: 'mycompany.local',
   *     workUsername: 'ID123456',
   *     anyVal1: null, // Overwrites with options.overwrites.anyVal1
   *     anyVal2: null // Overwrites with options.overwrites.anyVal2
   *   },
   *   tasks: {
   *     home: {
   *       comp: '${homeNasIP}',
   *       share: '${ipc}',
   *       user: 'tuckn',
   *       pwd: '${anyVal1}'
   *     },
   *     'work:office': {
   *       available: false,
   *       comp: 'SV12345',
   *       share: '${ipc}',
   *       domain: '${workNetDomain}',
   *       user: '${workUsername}',
   *       pwd: '{$anyVal2}'
   *     },
   *     'work:labo': {
   *       description: 'Test Server (Windows Server2008)',
   *       available: true,
   *       comp: 'PC67890',
   *       share: 'C$',
   *       domain: 'PC67890',
   *       user: '${workUsername}',
   *       pwd: '{$anyVal2}'
   *     }
   *   }
   * }
   *
   * smbcn.connectSyncUsingSchema(schema, 'work:*', {
   *   logger: 'info/console',
   *   showsResult: true,
   *   overwrites: { anyVal1: 'myHomeP@ss', anyVal2: 'officeP@ss' }
   * });
   * // Only process work:labo. work:office is not processed because available is false.
   * // command is `net use \\PC67890\C$ myP@ss /user:PC67890\ID123456`
   * @function connectSyncUsingSchema
   * @memberof Wsh.SmbConnector
   * @param {typeNetSmbConnectSchema} schema
   * @param {string} [query] - The resource name to connect
   * @param {object} [options] - Optional parameters.
   * @param {object} [options.overwrites] - Ex. { anyVal1: 'myP@ss', anyVal2: 'p_w_d' }
   * @param {(string|Object)} [options.logger] - See options of {@link Wsh.Logger.create}
   * @param {boolean} [options.showsResult=false] - The share name of the resource
   * @param {boolean} [options.isDryRun=false] - No execute, returns the string of command.
   * @returns {void|string} - If options.isDryRun is true, returns string.
   */
  smbcn.connectSyncUsingSchema = function (schema, query, options) {
    var FN = 'smbcn.connectSyncUsingSchema';
    if (!isPlainObject(schema)) throwErrNonObject(FN, schema);
    if (!isSolidString(query)) throwErrNonStr(FN, query);

    var loggerObj = obtain(options, 'logger', {});
    var lggr = logger.create(loggerObj);
    lggr.info('Start function ' + FN);
    lggr.info('query: "' + query + '"');

    var rsrcNames = Object.keys(schema.tasks);
    var regNameMatcher;
    if (includes(query, '*')) {
      regNameMatcher = new RegExp(query.replace(/\*/g, '.*'));
    } else {
      regNameMatcher = new RegExp(query);
    }
    var filterdNames = rsrcNames.filter(function (rsrcName) {
      return regNameMatcher.test(rsrcName);
    });
    lggr.info('matched tasks: ' + filterdNames.length);

    var vals = schema.components; // Shorthand

    // Set option values in keys storing null.
    if (hasContent(options.overwrites)) {
      Object.keys(vals).forEach(function (key) {
        if (vals[key] !== null) return;

        Object.keys(options.overwrites).some(function (writeKey) {
          if (key === writeKey) {
            vals[key] = options.overwrites[writeKey];
            return true;
          }
        });
      });
    }

    var rsrcs = schema.tasks; // Shorthand

    var isDryRun = obtain(options, 'isDryRun', false);
    if (isDryRun) lggr.info('dry-run [' + FN + ']:');

    filterdNames.forEach(function (rsrcName) {
      if (rsrcs[rsrcName].available === false) {
        lggr.info('Skip the non-availabel resource: ' + rsrcName);
        return;
      }

      var comp = tmpParser(rsrcs[rsrcName].comp || '', vals);
      var share = tmpParser(rsrcs[rsrcName].share || '', vals);
      var domain = tmpParser(rsrcs[rsrcName].domain || '', vals);
      var user = tmpParser(rsrcs[rsrcName].user || '', vals);
      var pwd = tmpParser(rsrcs[rsrcName].pwd || '', vals);

      try {
        smbcn.connectSyncSurelyUsingLog(
          comp, share, domain, user, pwd,
          objAdd({}, options, {
            logger: lggr,
            transporsLog: false,
            showsResult: false,
            throws: false
          })
        );
      } catch (e) { // It does not stop with an error.
        lggr.error(insp(e));
      }
    });

    lggr.info('Finished function ' + FN);
    var transporsLog = obtain(options, 'transporsLog', true);
    if (transporsLog) lggr.transport();

    var showsResult = obtain(options, 'showsResult', false);
    if (showsResult) net.SMB.showCurrentSession();

    return;
  }; // }}}
})();

// vim:set foldmethod=marker commentstring=//%s :
