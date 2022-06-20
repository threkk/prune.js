# Prune.js

> Prune.js is a tool created to detect dead code in JavaScript projects using
> ECMAScript 6.

## Getting started

The project requires the latest stable version of Node.js to run, although it is
highly likely that it will run in any version of Node.js but not compile.

```
$ git clone https://github.com/threkk/prune.js
$ npm install
$ npm run build

# If you want to install it locally
$ npm link
$ prunejs

# If you just want to run it
$ npm run prunejs
```

## How to use

The tool takes two inputs. The first one is a command, and the second is a
configuration file. There are three commands available:

- `dead-code`: Runs the tool in dead code detection mode. It will return three
  lists: one for dependencies, one for the modules and one for the statements.
- `project-graph`: Prints a call graph of the whole project in Graphviz format.
- `file-graph`: Prints a call graph of the module passed as a path in the third
  parameter.

### Configuration file

The second input is a configuration file with some information for the project
that is necessary to run the tool. The file is a JavaScript file with the
following format:

```
module.exports = {
  root: '~/code/my-project',
  ignore: ['./docs/'],
  entryPoints: ['./src/index.js'],
}
```

- **root**: Path where the project is located.
- **entryPoints**: List of paths that point to the entry points of the project.
- **ignore**: List of paths to ignore when executing the project.
- **isLibrary**: Boolean that indicates if the project should be analysed as an
  external library which is expected to be consumed.

## Why

This tool is part of the output of my MSc. Software Engineering at the
University of Amsterdam. The code is provided as a reference with the intention
to verify the results obtained and for future work. The paper will be linked as
soon as it is published.

### Related material

- [threkk/prune.js-paper](https://github.com/threkk/prune.js-paper): This repository contains the TeX files for the paper of the project.
- [threkk/prune.js-presentation](https://github.com/threkk/prune.js-presentation): Slides used during the presentation of the project.
- [threkk/prune.js-material](https://github.com/threkk/prune.js-material):
  Repository with the material used in the examples in the paper.
- [threkk/dead-code-example](https://github.com/threkk/dead-code-example):
  Example project to run prune.js against.
