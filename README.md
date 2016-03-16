# polymerjs [![NPM version][npm-image]][npm-url]
> The Polymer library in a nice, frequently updated NPM package with support for imperative programming and extending other custom elements.

## TL;DR

A special version of Polymer where:
- It uses NPM instead of Bower. No more multiple package managers.
- It supports imperative programming. You can now define your templates and styles from your element class prototype. Everything still works with no compromises!
- It's based on the "extends" branch by default which means that you can write your elements as ES2015 classes that extends other custom elements. No need for Behaviors or composition for that anymore.
- You can now use Polymer without HTML Imports and rely on ES2015 module loading instead.

## Installation

Install `polymerjs` as a dependency:

```shell
npm install polymerjs --save
```

I recommend that you install my custom [webcomponentsjs] (https://github.com/dlmma/webcomponentsjs) polyfill and add it as a dependency as well:

```shell
npm install webcomponentsjs --save
```

I've added a webcomponentsjs-micro version which is only 40kb. It doesn't polyfill the Url() object nor the HTML Imports which dramatically improves loading times.

Polymer comes in three standard sizes.

#### full
[See features here](https://www.polymer-project.org/1.0/docs/devguide/experimental.html#polymer-standard)
(311kb)

#### mini
[See features here](https://www.polymer-project.org/1.0/docs/devguide/experimental.html#polymer-mini)
(114kb)

#### micro
[See features here](https://www.polymer-project.org/1.0/docs/devguide/experimental.html#polymer-micro)
(27kb)

To use it, import it either as a dependency from your code:


```javascript
import "polymerjs"
```

Note that Polymer will bind to the window object. If you please, you can also do:

```javascript
import Polymer from "polymerjs"
```

Which is arguably more readable.

If you want to load the mini or micro versions, use:


```javascript
import Polymer from "polymerjs/mini"
```

or 

```javascript
import Polymer from "polymerjs/micro"
```

That's it!

## Usage

Here's a basic example to start you off with:

```javascript
import "webcomponentsjs/micro";
import Polymer from "polymerjs";
import {registerElement} from "polymerjs/register";

class HelloComponent {

   beforeRegister () {
       this.is = "hello-component";
       this.properties = {
           planet: {
               type: String,
               value: "earth"
           }
       };
   }

   static get styles () {
       return `
           :host([planet="earth"]) {
               background-color: blue;
           }

           .works-too {
               font-weight: bold;
           }
       `;
   }

   static get html () {
       return `<p class="works-too">Hello, [[planet]]!`;
   }
}

registerElement(HelloComponent);

```

Extension works much the same way:

```javascript
class ButtonComponent {
    beforeRegister () {
        this.is = "button-component";
        this.properties = {
            coolProperty: {
                type: String,
                value: "this property is cool!"
            }
        };
    }
}

class LessCoolComponent extends ButtonComponent {
    beforeRegister () {
        this.is = "less-cool-component";
    }
    
    static get html () {
        return `<p>Even though I'm less cool, [[coolProperty]]</p>`
    }
}

registerElement(ButtonComponent);
registerElement(LessCoolComponent);
```


To register an element, use the provided method `registerElement`:

```javascript
import {registerElement} from "polymerjs/register";

registerElement(MyCoolElement);
```

Then you can use it like you normally would, either declaratively: `<my-cool-element></my-cool-element` or imperatively: `new MyCoolElement();`.

[npm-url]: https://npmjs.org/package/polymerjs
[npm-image]: https://badge.fury.io/js/polymerjs.svg