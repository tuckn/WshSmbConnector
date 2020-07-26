# WshSmbConnector

The WSH (Windows Script Host) CLI that connects to SMB resources according to the schema defined in a JSON file.

## Operating environment

Works on JScript in Windows.

## Installation

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

## Usage
"
Now _.\\MyScript.js_ (JScript ) can use `Wsh.SmbConnector`.

```js
var smb = Wsh.SmbConnector; // Shorthand

```

You can use [Wsh.ConfigStore filename](https://docs.tuckn.net/WshConfigStore/ConfigStore.html).

### Dependency Modules

You can also use [tuckn/WshBasicPackage](https://github.com/tuckn/WshBasicPackage) functions in _.\\MyScript.js_ (JScript).

## Documentation

See all specifications [here](https://docs.tuckn.net/WshSmbConnector) and also [WshBasicPackage](https://docs.tuckn.net/WshBasicPackage).

## License

MIT

Copyright (c) 2020 [Tuckn](https://github.com/tuckn)
