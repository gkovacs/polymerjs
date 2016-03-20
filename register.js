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
    } else if (element.styles != null) {
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

export default registerElement;