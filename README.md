# WshSmbConnector

The WSH (Windows Script Host) CLI that connects to SMB resources according to the schema defined in a JSON file.

## Operating environment

Works on JScript in Windows.

## Installation

Download this ZIP and unzipping or Use following `git` command.

```console
D:\> git clone https://github.com/tuckn/WshSmbConnector.git
```

Now suppose your directory structure looks like this.

```console
D:\WshSmbConnector\
  ├─ .wsh\
  │ └─ settings.json
  └─ dist\
     ├─ Run.wsf
     └─ bundle.js
```

## Usage

### Write Schema JSON

The JSON default path to load is _%CD%\.wsh\\settings.json_.
See _.\\.wsh\\settings.json_ as example.

Write your connection settings to the JSON file, for example,

```json
{
  "connectSchema": {
    "tasks": {
      "home": {
        "comp": "11.22.33.44",
        "share": "Public",
        "user": "user1",
        "pwd": "user p@ss"
      },
      "office": {
        "comp": "SV12345",
        "share": "IPC$",
        "domain": "ID123456",
        "user": "user1",
        "pwd": "user p@ss"
      }
    }
  }
}
```

You can also define the values into `components` object.

```json
{
  "connectSchema": {
    "components": {
      "myUser": "user1",
      "myPass": null
    },
    "tasks": {
      "home": {
        "comp": "11.22.33.44",
        "share": "Public",
        "user": "${myUser}",
        "pwd": "${myPass}"
      },
      "office": {
        "comp": "SV12345",
        "share": "IPC$",
        "domain": "ID123456",
        "user": "${myUser}",
        "pwd": "${myPass}"
      }
    }
  }
}
```

The values specified as `null` in `components` must be specified CLI arguments.

### Schema Connecting

```console
D:\WshSmbConnector>cscript Run.wsf schemaConnect "myPass:user p@ss"
[2020-08-01T06:50:28] info    taskName: "*"
[2020-08-01T06:50:28] info    matched tasks: 2
[2020-08-01T06:50:28] info    Start the function smbcn.connectSyncSurelyUsingLog
[2020-08-01T06:50:28] info    Connecting to "11.22.33.44"
[2020-08-01T06:50:28] info    shareName: "Public"
[2020-08-01T06:50:28] info    domain: "", user: "user1"
[2020-08-01T06:50:28] info    password: "****"
[2020-08-01T06:50:28] info    throws: false
[2020-08-01T06:50:28] success Succeeded the connecting!
[2020-08-01T06:50:28] info    Finished the function smbcn.connectSyncSurelyUsingLog
[2020-08-01T06:50:28] info    Connecting to "SV12345"
[2020-08-01T06:50:28] info    shareName: "IPC$"
[2020-08-01T06:50:28] info    domain: "ID123456", user: "user1"
[2020-08-01T06:50:28] info    password: "****"
[2020-08-01T06:50:28] info    throws: false
[2020-08-01T06:50:28] success Succeeded the connecting!
[2020-08-01T06:50:28] info    Finished the function smbcn.connectSyncSurelyUsingLog
```

Specify any tasks with property names.

```console
D:\WshSmbConnector>cscript Run.wsf schemaConnect "myPass:user p@ss" --task "home"
[2020-08-01T06:50:28] info    taskName: "home"
[2020-08-01T06:50:28] info    matched tasks: 1
[2020-08-01T06:50:28] info    Start the function smbcn.connectSyncSurelyUsingLog
[2020-08-01T06:50:28] info    Connecting to "11.22.33.44"
[2020-08-01T06:50:28] info    shareName: "Public"
[2020-08-01T06:50:28] info    domain: "", user: "user1"
[2020-08-01T06:50:28] info    password: "****"
[2020-08-01T06:50:28] info    throws: false
[2020-08-01T06:50:28] success Succeeded the connecting!
[2020-08-01T06:50:28] info    Finished the function smbcn.connectSyncSurelyUsingLog
```

Show the help.

```console
> cscript Run.wsf schemaConnect --help

Usage: schemaConnect [overwriteKey:val...] [options]

The command to connect a Windows to resources with the schema

Options:
  -V, --version          Output the version number
  -D, --dir-path <path>  The path name where the schema JSON is located. <Directory Path> or "cwd", "portable", "userProfile". Default: "cmd" is "%CD%\\.wsh"
  -F, --file-name <name> A JSON file name. (default: "settings.json")
  -E, --encoding <name>  The JSON file encoding. (default: "utf-8")
  -N, --prop-name <name> A property name of the schema object. (default: "connectSchema")
  -T, --task <name>  Specify the task name to connect to. e.g. "work:*" (default: "*")
  -L, --logger <val>     <level>/<transportation>. e.g. "warn/popup".  (default: "info/console")
  -H, --has-result       Show a result(net use) (default: false)
  -R, --dry-run          No execute. Outputs the string of command. (default: false)
  -h, --help             Output usage information
```

See [Wsh.ConfigStore](https://docs.tuckn.net/WshConfigStore/) for the options `--dir-path` and `--fine-name`.
and see [Wsh.Logger](https://docs.tuckn.net/WshLogger/) for the options `--logger`.

## Installation as Module

(1) Create a directory of your WSH project.

```console
D:\> mkdir MyWshProject
D:\> cd MyWshProject
```

(2) Download this ZIP and unzipping or Use following `git` command.

```console
> git clone https://github.com/tuckn/WshSmbConnector.git ./WshModules/WshSmbConnector
or
> git submodule add https://github.com/tuckn/WshSmbConnector.git ./WshModules/WshSmbConnector
```

(3) Include _.\\WshSmbConnector\\dist\\bundle.js_ into your .wsf file.
For Example, if your file structure is

```console
D:\MyWshProject\
├─ Run.wsf
├─ MyScript.js
└─ WshModules\
    └─ WshSmbConnector\
        └─ dist\
          └─ bundle.js
```

The content of above _Run.wsf_ is

```xml
<package>
  <job id = "run">
    <script language="JScript" src="./WshModules/WshSmbConnector/dist/bundle.js"></script>
    <script language="JScript" src="./MyScript.js"></script>
  </job>
</package>
```

I recommend this .wsf file encoding to be UTF-8 [BOM, CRLF].

## Usage as Module

Now _.\\MyScript.js_ (JScript ) can use `Wsh.SmbConnector`.

Connecting and logging

```js
var smbcn = Wsh.SmbConnector; // Shorthand

var comp = '11.22.33.44';
var share = 'public';
var domain = 'PCNAME';
var user = 'UserId';
var pwd = 'My * P@ss><';

smbcn.connectSyncSurelyUsingLog(comp, share, domain, user, pwd, {
  logger: 'warn/winEvent', // See https://github.com/tuckn/WshLogger
  showsResult: true
});
```

Schema Connecting

```js
var smbcn = Wsh.SmbConnector; // Shorthand

var schema = {
  connectSchema: {
    components: {
      myUser: 'user1',
      myPass: null
    },
    tasks: {
      home: {
        comp: '11.22.33.44',
        share: 'Public',
        user: '${myUser}',
        pwd: '${myPass}'
      },
      office: {
        comp: 'SV12345',
        share: 'IPC$',
        domain: 'ID123456',
        user: '${myUser}',
        pwd: '${myPass}'
      }
    }
  }
};

smbcn.connectSyncUsingSchema(schema, '*', {
  logger: 'info/console',
  overwrites: { myPass: 'user p@ss' },
  isDryRun: true
});
```

### Dependency Modules

You can also use [tuckn/WshBasicPackage](https://github.com/tuckn/WshBasicPackage) functions in _.\\MyScript.js_ (JScript).

## Documentation

See all specifications [here](https://docs.tuckn.net/WshSmbConnector) and also [WshBasicPackage](https://docs.tuckn.net/WshBasicPackage).

## License

MIT

Copyright (c) 2020 [Tuckn](https://github.com/tuckn)
