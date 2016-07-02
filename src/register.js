"use strict";

/**
 * registerElement will take a Polymer element prototype and upgrades it.
 * If you assign a static get method on the element prototype called
 * For templates to work, write a static getter method called 'html' on the element prototype
 * For styles to work, write a static getter method called 'styles' on the element prototype.
 *
 * @example
 * class HelloComponent {
 *      beforeRegister () {
 *          this.is = "hello-component";
 *          this.properties = {
 *              planet: {
 *                  type: String,
 *                  value: "earth"
 *              }
 *          };
 *      }
 *
 *      static get styles () {
 *          return `
 *              :host([planet="earth"]) {
 *                  background-color: blue;
 *              }
 *
 *              .works-too {
 *                  font-weight: bold;
 *              }
 *          `;
 *      }
 *
 *      get html () {
 *          return `<p class="works-too">Hello, [[planet]]`;
 *      }
 * }
 *
 * registerElement(HelloComponent);
 *
 * @author Frederik Wessberg [fwe@dlmma.com]
 * @param {object} element - the prototype of the element.
 */

export function registerElement(element) {
    const DOM_MODULE = document.createElement('dom-module');
    const STYLES = document.createElement('style', 'custom-style');
    const HTML = document.createElement('template');

    DOM_MODULE.id = element.prototype.elementName || element.elementName;
    DOM_MODULE.appendChild(STYLES);
    if (element.prototype.styles != null) {
        STYLES.textContent = element.prototype.styles;
    } else if (element.styles != null) {
        STYLES.textContent = element.styles;
    }
    DOM_MODULE.appendChild(HTML);
    if (element.prototype.html != null) {
        HTML.innerHTML = element.prototype.html;
    } else if (element.html != null) {
        HTML.innerHTML = element.html;
    }

    DOM_MODULE.createdCallback();
    return Polymer(element);
}

/**
 * registerStyles will take a string of css and add it to the document.
 *
 * @example
 * const CONDITIONAL_CSS = `
 *  .cool-conditional-style {
 *      color: yellow;
 *      font-size: 1.1rem;
 *  }
 * `;
 *
 * registerStyles(CONDITIONAL_CSS);
 *
 * @author Frederik Wessberg [fwe@dlmma.com]
 * @param {String} styleTemplate - the css template string to add to the document.
 */

export function registerStyles (styleTemplate) {
    const STYLE = document.createElement('style');
    STYLE.type ="text/css";
    if (STYLE.styleSheet) STYLE.styleSheet.cssText = styleTemplate;
    else STYLE.appendChild(document.createTextNode(styleTemplate));
    document.getElementsByTagName("head")[0].appendChild(STYLE);
}

/**
 * registerBehavior takes a class and a traditional Polymer-based behavior
 * and assigns the properties and methods of the behavior to the class.
 *  @example
 *  import IronResizeableBehavior from "PolymerElements";
 *  
 *  class AwesomeClass {
 *      //Code goes here
 *  }
 *
 * registerBehavior(AwesomeClass, IronResizeableBehavior);
 *
 * @author Frederik Wessberg [fwe@dlmma.com]
 * @param {constructor} to
 * @param {Object} behavior
 */
export function registerBehavior (to, behavior) {
    let prototype = to.prototype;

    for (let key in behavior) {
        if (behavior.hasOwnProperty(key)) {
            if (isFunction(behavior[key])) prototype[key] = behavior[key];
            else prototype[key] = Object.assign({}, prototype[key], behavior[key]);
        }
    }
}

/**
 * implementsInterface will verify that the methods and properties listed in the given interface
 * are implemented by the given class. It is strongly typed and will throw an error if any type
 * differs from the interface.
 * 
 * This MUST be called after calling 'registerElement'. It should usually be the last stuff in a class file. 
 * 
 * @example
 *  import {registerElement, implementsInterface} from "polymerjs/register";
 *  import CoolInterface from "../interfaces/CoolInterface";
 *
 *  class AwesomeClass {
 *      //Code goes here
 *  }
 *
 * registerElement(AwesomeClass);
 * implementsInterface(CoolInterface);
 * 
 * @param {constructor} to
 * @param {Object} implementedInterface
 */
export function implementsInterface (to, implementedInterface) {
    var prototype = to.prototype;
    for (var key in implementedInterface) {
        if (implementedInterface.hasOwnProperty(key) && key !== "interfaceName") {
            //Check if method or field is implemented
            if (!prototype.hasOwnProperty(key)) throw new Error(`Error: ${getConstructorName(to)} must implement the method or property: "${key}" from the "${implementedInterface.interfaceName}" interface!`);
            if (prototype.hasOwnProperty(key)) {
                //If it is, perform deep checks and type validation
                if (isObject(implementedInterface[key]) && !isObject(prototype[key])) {
                    throw new Error(`Error: "${key}" should be implemented as an Object according to the ${implementedInterface.interfaceName} interface!`);
                }

                if (isObject(implementedInterface[key])) {
                    var subObject = implementedInterface[key];
                    for (var subkey in subObject) {
                        if (subObject.hasOwnProperty(subkey)) {
                            if (!prototype[key].hasOwnProperty(subkey)) throw new Error(`Error: ${getConstructorName(to)} must implement the key: "${subkey}" in the ${key} Object from the ${implementedInterface.interfaceName} interface!`);
                            var implType = prototype[key][subkey];
                            var interfType = implementedInterface[key][subkey];
                            //If shorthand notation wasn't used, the type is located as a "type" key on the
                            //implType object.
                            if (implType.type) implType = implType.type;
                            var isSameType = implType === interfType;
                            if (!isSameType) throw new Error(`Error: the property: "${subkey}" in ${getConstructorName(to)} must be implemented as type: ${getConstructorName(interfType)}!`);
                        }
                    }
                } else {
                    if (isFunction(implementedInterface[key])) {
                        let same = hasSameSignature(prototype[key], implementedInterface[key]);
                        if (!same) throw new Error(`Error: the signature of the method: ${getSignature(prototype[key])} in ${getConstructorName(to)} must be identical to the one it implements: "${getSignature(implementedInterface[key])}" in the ${implementedInterface.interfaceName} interface!`);
                    }
                }
            }
        }
    }
}

function hasSameSignature (method1, method2) {
    var funcNameRegex = /function (.{1,}\))/;
    var first = (funcNameRegex).exec((method1).toString());
    var second = (funcNameRegex).exec((method2).toString());
    var firstResults = first.length > 1 ? first[1] : null;
    var secondResults = second.length > 1 ? second[1] : null;
    return firstResults === secondResults;
}

function getSignature (method) {
    var funcNameRegex = /function (.{1,}\))/;
    var results = (funcNameRegex).exec((method).toString());
    return results.length > 1 ? results[1] : null;
}

function getConstructorName (constructor) {
    var funcNameRegex = /function (.{1,})\(/;
    var results = (funcNameRegex).exec((constructor).toString());
    return (results && results.length > 1) ? results[1] : "unknown";
}

function isObject(value) {
    var type = typeof value;
    return !!value && (type == 'object');
}

function isFunction(value) {
    var type = typeof value;
    var isFunc = isObject(value) || type === "function";
    var objectProto = Object.prototype;
    var objToString = objectProto.toString;
    var funcTag = '[object Function]';
    return isFunc && objToString.call(value) == funcTag;
}

export default registerElement;