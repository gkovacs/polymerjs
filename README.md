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

I recommend that you install my customized version of the Polymer team's [webcomponentsjs] (https://github.com/dlmma/webcomponentsjs) polyfill and add it as a dependency as well:

```shell
npm install webcomponentsjs --save
```

I've added a `micro` version of the polyfills which is only 40kb. It doesn't polyfill the URL() object nor the HTMLImports which dramatically improves loading times.

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

To use it, import it as a dependency from your code:


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

If your element should have markup, define it in a static html getter:
```javascript
static get html () {
    return `<p>This is the markup for my element.</p>`
}
```
If your element should have styles, define it in a static styles getter:
```javascript
static get styles () {
    return `
        :host {
            background-color: red;
        }
    `
}
```

To register an element, use the provided method `registerElement`:

```javascript
import {registerElement} from "polymerjs/register";

registerElement(MyCoolElement);
```

Then you can use it like you normally would, either declaratively: 
```html
<my-cool-element></my-cool-element
``` 
or imperatively: 
```javascript
new MyCoolElement();
```

This enables you to do cool stuff you wouldn't otherwise be able to do.

For instance, here's a cool take on reusing styles by using string interpolation:

```javascript

import * as Color from "styles/color";

...

static get styles () {
    return `
        :host p {
            color: &{Color.AWESOME};
        }
    `;
}

...

```

With the full force of JavaScript at your disposal, you can also do stuff like:

```javascript
static get HTML () {
    return `
        <p>G&{"oo".repeat(1000)}gle</p>
    `;
}
```

## To sum it up

I really only see benefits of this approach. You get to use one package manager, one module loader, less polyfills, no ugly JSX syntax, structured and unified code, the full force of JavaScript at your disposal for writing your styles and templates while also keeping all benefits of Polymer which to remind you are:
- true encapsulation of styles with full css support as well as polyfills for CSS4 selectors
- Leveraging browser standards with no need to polyfill anything in browsers that supports the specs
- Polymers advanced tap and track events
- And every other incredible Polymer feature.

## Motivation

I remember when I stumpled upon the coolest kid on the block a few years ago - The developer preview of **Polymer**.

Polymer was this fantastic library that enabled you to build encapsulated elements much like Angular directives, but in a way that followed a W3C spec proposal called *WebComponents*. That was unique and many people argued that it was the next big thing. 

Working with the library was incredibly easy too. Data binding was easy. Loading dependencies were easy. A lot of nice elements were already built and published by the Polymer team.

I felt like Polymer aimed to push the web forward and I was there for the long haul.

Today, I still am. Polymer is still a great library that keeps improving, but it's not the cool kid it once was. There are probably different reasons for this, but to me, the main thing is that the WebComponents spec is not very well aligned with how we declare dependencies now with ES2015. Let me explain my thoughts:

I think it's safe to say that it has become standard to write your code in ES2015 and transpile down to ES5 using a tool like Babel. With ES2015 comes the new Module Loading system for managing dependencies.

Developers can write clean, readable client-side code with clear class- and object hierarchies and we are seeing a lot of traditional design patterns being implemented for complex web apps. 

We are seeing it primarily through the use of React paired with a Flux-implementation such as Redux (encouraging a reactive functional programming style, a uni-directional data flow and very often immutability) and Angular 2 (Not as opiniated, but supports the same reactive functional programming style as well as traditional object-oriented design patterns).

For both of these libraries, the template code is written directly from code (in Angular 2, you can also instead link to a HTML file from your angular component) and one of the main benefits is that all dependencies can be listed in the import statements in the file header. Development happens in one branch, using one dependency system.

Trying to accomplish the same in Polymer has proved to be very burdensome. Here's my thoughts on why:

**1. Dependencies**:

Polymer is a library around Web Components and thus it expects you to use HTML Imports for loading the dependencies for a custom element. The result is that you end up with two separate dependency systems and branches - Which is confusing and just feels *"not quite right"*. The Polymer team has tried to solve this by designing the IMD (Import Module Definition) which is compatible with AMD (which ES2015 modules are often transpiled to) but doesn't load anything. All it does is to define and resolve modules, but it still relies on HTML imports for loading which ultimately puts us in the same position as without IMD - two ways to declare dependencies in the same project.

**2. The Imperative approach**:

In Polymer, you can define your element as a ES2015 class and wrap Polymer around it. Then you can do stuff like this in the 'created' callback: 'this.innerHTML = "Hello Earth!"'. However, this has its limitations. Polymer parses the template during registration time and thus you can't do this in the 'created' callback: 
```javascript
this.innerHTML = "Hello [[planet]]";
```
This goes for styles too. Under Shady DOM, the lightweight Shadow DOM alternative bundled with Polymer, a style scope is attached to each element. But each element is parsed for style tags during registration time too. Polymer did have a way of binding post-registration in the developer preview, but the performance impact was huge, they found.

**3. It uses Bower**:

Bower is a tool for handling project package dependencies, but NPM has grown to be the go-to package manager since then. By using Bower, users are often required to have separate bower.json and package.json files instead of being able to list all dependencies in the same place. 

Well, I think Polymer is a great library and that Web Components is the way to go minus the HTML imports draft which it seems that browser vendors is not really implementing either. I think we can reap all of the benefits of Polymer and combine them with the modern approach to building client-side rendered web apps. Here is how I've reimagined the approach:

1. Polymer should be on NPM with the polymer, polymer-mini and polymer-micro package as separate .js files.
2. The webcomponentsjs polyfill should be on NPM and offer a version without HTML imports.
3. We need to be able to write our styles and templates for Polymer elements with full data-binding support without any added abstraction.

Hopefully, this implementation of Polymer will serve as inspiration or even as the foundation of your next Polymer project.

[npm-url]: https://npmjs.org/package/polymerjs
[npm-image]: https://badge.fury.io/js/polymerjs.svg