# polymerjs [![NPM version][npm-image]][npm-url]
> The Polymer library in a nice, frequently updated NPM package.

## Usage

Install `polymerjs` as a dependency:

```shell
npm install polymerjs
```

Polymer comes in three standard sizes and this version adds an additional one.

#### full
[See features here](https://www.polymer-project.org/1.0/docs/devguide/experimental.html#polymer-standard)
(311kb)

#### macro
All the features from the full Polymer package except for:
- dom-if, dom-bind and array-selector has been stripped away. dom-repeat survives.
- custom style including/excluding and the shim for css variables has been stripped away.
(272kb)

#### mini
[See features here](https://www.polymer-project.org/1.0/docs/devguide/experimental.html#polymer-mini)
(114kb)

#### micro
[See features here](https://www.polymer-project.org/1.0/docs/devguide/experimental.html#polymer-micro)
(27kb)

To use it, import it either as a dependency from your code:


```shell
import "polymerjs"
```

Note that Polymer will bind to the window object. If you please, you can also do:

```shell
import Polymer from "polymerjs"
```

Which is arguably more readable.

If you want to load the macro, mini or micro versions, use:

```shell
import Polymer from "polymerjs/macro"
```

or

```shell
import Polymer from "polymerjs/mini"
```

or 

```shell
import Polymer from "polymerjs/micro"
```

That's it!

[npm-url]: https://npmjs.org/package/polymerjs
[npm-image]: https://badge.fury.io/js/polymerjs.svg