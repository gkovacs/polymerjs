define(['exports'], function (exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    /*
        @license
    Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
        This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
        The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
        The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
        Code distributed by Google as part of the polymer project is also
    subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
    */

    (function () {
        function resolve() {
            document.body.removeAttribute('unresolved');
        }
        if (window.WebComponents) {
            addEventListener('WebComponentsReady', resolve);
        } else {
            if (document.readyState === 'interactive' || document.readyState === 'complete') {
                resolve();
            } else {
                addEventListener('DOMContentLoaded', resolve);
            }
        }
    })();
    window.Polymer = {
        Settings: function () {
            var settings = window.Polymer || {};
            var parts = location.search.slice(1).split('&');
            for (var i = 0, o; i < parts.length && (o = parts[i]); i++) {
                o = o.split('=');
                o[0] && (settings[o[0]] = o[1] || true);
            }
            settings.wantShadow = settings.dom === 'shadow';
            settings.hasShadow = Boolean(Element.prototype.createShadowRoot);
            settings.nativeShadow = settings.hasShadow && !window.ShadowDOMPolyfill;
            settings.useShadow = settings.wantShadow && settings.hasShadow;
            settings.hasNativeImports = Boolean('import' in document.createElement('link'));
            settings.useNativeImports = settings.hasNativeImports;
            settings.useNativeCustomElements = !window.CustomElements || window.CustomElements.useNative;
            settings.useNativeShadow = settings.useShadow && settings.nativeShadow;
            settings.usePolyfillProto = !settings.useNativeCustomElements && !Object.__proto__;
            return settings;
        }()
    };
    (function () {
        var userPolymer = window.Polymer;
        window.Polymer = function (prototype) {
            if (typeof prototype === 'function') {
                prototype = prototype.prototype;
            }
            if (!prototype) {
                prototype = {};
            }
            var factory = desugar(prototype);
            prototype = factory.prototype;
            var options = { prototype: prototype };
            var extendsNative = prototype.__extendsNativeElement;
            if (extendsNative) {
                options.extends = extendsNative;
            }
            Polymer.telemetry._registrate(prototype);
            document.registerElement(prototype.is, options);
            return factory;
        };
        Polymer.registry = {};
        var desugar = function (prototype) {
            if (!Polymer.isInstance(prototype)) {
                var base = prototype.extends ? Polymer.Base._getExtendedPrototype(prototype.extends) : Polymer.Base;
                prototype = Polymer.Base.chainObject(prototype, base);
            }
            prototype.registerCallback();
            Polymer.Base._registerPrototype(prototype.is, prototype);
            return prototype.constructor;
        };
        if (userPolymer) {
            for (var i in userPolymer) {
                Polymer[i] = userPolymer[i];
            }
        }
        Polymer.Class = desugar;
    })();
    Polymer.telemetry = {
        registrations: [],
        _regLog: function (prototype) {
            console.log('[' + prototype.is + ']: registered');
        },
        _registrate: function (prototype) {
            this.registrations.push(prototype);
            Polymer.log && this._regLog(prototype);
        },
        dumpRegistrations: function () {
            this.registrations.forEach(this._regLog);
        }
    };
    Object.defineProperty(window, 'currentImport', {
        enumerable: true,
        configurable: true,
        get: function () {
            return (document._currentScript || document.currentScript).ownerDocument;
        }
    });
    Polymer.RenderStatus = {
        _ready: false,
        _callbacks: [],
        whenReady: function (cb) {
            if (this._ready) {
                cb();
            } else {
                this._callbacks.push(cb);
            }
        },
        _makeReady: function () {
            this._ready = true;
            for (var i = 0; i < this._callbacks.length; i++) {
                this._callbacks[i]();
            }
            this._callbacks = [];
        },
        _catchFirstRender: function () {
            requestAnimationFrame(function () {
                Polymer.RenderStatus._makeReady();
            });
        },
        _afterNextRenderQueue: [],
        _waitingNextRender: false,
        afterNextRender: function (element, fn, args) {
            this._watchNextRender();
            this._afterNextRenderQueue.push([element, fn, args]);
        },
        _watchNextRender: function () {
            if (!this._waitingNextRender) {
                this._waitingNextRender = true;
                var fn = function () {
                    Polymer.RenderStatus._flushNextRender();
                };
                if (!this._ready) {
                    this.whenReady(fn);
                } else {
                    requestAnimationFrame(fn);
                }
            }
        },
        _flushNextRender: function () {
            var self = this;
            setTimeout(function () {
                self._flushRenderCallbacks(self._afterNextRenderQueue);
                self._afterNextRenderQueue = [];
                self._waitingNextRender = false;
            });
        },
        _flushRenderCallbacks: function (callbacks) {
            for (var i = 0, h; i < callbacks.length; i++) {
                h = callbacks[i];
                h[1].apply(h[0], h[2] || Polymer.nar);
            }
        }
    };
    if (window.HTMLImports) {
        HTMLImports.whenReady(function () {
            Polymer.RenderStatus._catchFirstRender();
        });
    } else {
        Polymer.RenderStatus._catchFirstRender();
    }
    Polymer.ImportStatus = Polymer.RenderStatus;
    Polymer.ImportStatus.whenLoaded = Polymer.ImportStatus.whenReady;
    Polymer.Base = {
        __isPolymerInstance__: true,
        _addFeature: function (feature) {
            this.extend(this, feature);
        },
        registerCallback: function () {
            this._desugarBehaviors();
            this._doBehavior('beforeRegister');
            this._registerFeatures();
            this._doBehavior('registered');
        },
        createdCallback: function () {
            Polymer.telemetry.instanceCount++;
            this.root = this;
            this._doBehavior('created');
            this._initFeatures();
        },
        attachedCallback: function () {
            var self = this;
            Polymer.RenderStatus.whenReady(function () {
                self.isAttached = true;
                self._doBehavior('attached');
            });
        },
        detachedCallback: function () {
            this.isAttached = false;
            this._doBehavior('detached');
        },
        attributeChangedCallback: function (name, oldValue, newValue) {
            this._attributeChangedImpl(name);
            this._doBehavior('attributeChanged', [name, oldValue, newValue]);
        },
        _attributeChangedImpl: function (name) {
            this._setAttributeToProperty(this, name);
        },
        extend: function (prototype, api) {
            if (prototype && api) {
                var n$ = Object.getOwnPropertyNames(api);
                for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
                    this.copyOwnProperty(n, api, prototype);
                }
            }
            return prototype || api;
        },
        mixin: function (target, source) {
            for (var i in source) {
                target[i] = source[i];
            }
            return target;
        },
        copyOwnProperty: function (name, source, target) {
            var pd = Object.getOwnPropertyDescriptor(source, name);
            if (pd) {
                Object.defineProperty(target, name, pd);
            }
        },
        _log: console.log.apply.bind(console.log, console),
        _warn: console.warn.apply.bind(console.warn, console),
        _error: console.error.apply.bind(console.error, console),
        _logf: function () {
            return this._logPrefix.concat([this.is]).concat(Array.prototype.slice.call(arguments, 0));
        }
    };
    Polymer.Base._logPrefix = function () {
        var color = window.chrome || /firefox/i.test(navigator.userAgent);
        return color ? ['%c[%s::%s]:', 'font-weight: bold; background-color:#EEEE00;'] : ['[%s::%s]:'];
    }();
    Polymer.Base.chainObject = function (object, inherited) {
        if (object && inherited && object !== inherited) {
            if (!Object.__proto__) {
                object = Polymer.Base.extend(Object.create(inherited), object);
            }
            object.__proto__ = inherited;
        }
        return object;
    };
    Polymer.Base = Polymer.Base.chainObject(Polymer.Base, HTMLElement.prototype);
    if (window.CustomElements) {
        Polymer.instanceof = CustomElements.instanceof;
    } else {
        Polymer.instanceof = function (obj, ctor) {
            return obj instanceof ctor;
        };
    }
    Polymer.isInstance = function (obj) {
        return Boolean(obj && obj.__isPolymerInstance__);
    };
    Polymer.telemetry.instanceCount = 0;
    Polymer.Element = function () {};
    Polymer.Element.prototype = Polymer.Base;
    (function () {
        var modules = {};
        var lcModules = {};
        var findModule = function (id) {
            return modules[id] || lcModules[id.toLowerCase()];
        };
        var DomModule = function () {
            return document.createElement('dom-module');
        };
        DomModule.prototype = Object.create(HTMLElement.prototype);
        Polymer.Base.extend(DomModule.prototype, {
            constructor: DomModule,
            createdCallback: function () {
                this.register();
            },
            register: function (id) {
                id = id || this.id || this.getAttribute('name') || this.getAttribute('is');
                if (id) {
                    this.id = id;
                    modules[id] = this;
                    lcModules[id.toLowerCase()] = this;
                }
            },
            import: function (id, selector) {
                if (id) {
                    var m = findModule(id);
                    if (!m) {
                        forceDomModulesUpgrade();
                        m = findModule(id);
                    }
                    if (m && selector) {
                        m = m.querySelector(selector);
                    }
                    return m;
                }
            }
        });
        var cePolyfill = window.CustomElements && !CustomElements.useNative;
        document.registerElement('dom-module', DomModule);
        function forceDomModulesUpgrade() {
            if (cePolyfill) {
                var script = document._currentScript || document.currentScript;
                var doc = script && script.ownerDocument || document;
                var modules = doc.querySelectorAll('dom-module');
                for (var i = modules.length - 1, m; i >= 0 && (m = modules[i]); i--) {
                    if (m.__upgraded__) {
                        return;
                    } else {
                        CustomElements.upgrade(m);
                    }
                }
            }
        }
    })();
    Polymer.Base._addFeature({
        _prepIs: function () {
            if (!this.is) {
                var module = (document._currentScript || document.currentScript).parentNode;
                if (module.localName === 'dom-module') {
                    var id = module.id || module.getAttribute('name') || module.getAttribute('is');
                    this.is = id;
                }
            }
            if (this.is) {
                this.is = this.is.toLowerCase();
            }
        }
    });
    Polymer.Base._addFeature({
        behaviors: [],
        _desugarBehaviors: function () {
            if (!this.hasOwnProperty('behaviors')) {
                this.behaviors = [];
            }
            if (this.behaviors && this.behaviors.length) {
                this.behaviors = this._desugarSomeBehaviors(this.behaviors);
            }
            this._desugarSuperBehaviors();
        },
        _desugarSuperBehaviors: function () {
            var supr = this.__getSuper(this);
            if (supr) {
                this.__behaviorMethods = this.behaviors.concat(supr.__behaviorMethods || supr.behaviors);
                var superBehaviors = supr.behaviors.slice();
                superBehaviors.push(supr);
                this.behaviors = superBehaviors.concat(this.behaviors);
                for (var i in Polymer.Base._behaviorMetaProperties) {
                    if (!this.hasOwnProperty(i)) {
                        this[i] = new Polymer.Base._behaviorMetaProperties[i]();
                    }
                }
            }
        },
        _desugarSomeBehaviors: function (behaviors) {
            var behaviorSet = [];
            behaviors = this._flattenBehaviorsList(behaviors);
            for (var i = behaviors.length - 1; i >= 0; i--) {
                var b = behaviors[i];
                if (behaviorSet.indexOf(b) === -1) {
                    this._mixinBehavior(b);
                    behaviorSet.unshift(b);
                }
            }
            return behaviorSet;
        },
        _flattenBehaviorsList: function (behaviors) {
            var flat = [];
            for (var i = 0; i < behaviors.length; i++) {
                var b = behaviors[i];
                if (b instanceof Array) {
                    flat = flat.concat(this._flattenBehaviorsList(b));
                } else if (b) {
                    flat.push(b);
                } else {
                    this._warn(this._logf('_flattenBehaviorsList', 'behavior is null, check for missing or 404 import'));
                }
            }
            return flat;
        },
        _mixinBehavior: function (b) {
            var n$ = Object.getOwnPropertyNames(b);
            for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
                if (!Polymer.Base._behaviorProperties[n] && !this.hasOwnProperty(n)) {
                    this.copyOwnProperty(n, b, this);
                }
            }
        },
        _prepBehaviors: function () {
            for (var i = 0, l = this.behaviors.length; i < l; i++) {
                this._prepBehavior(this.behaviors[i]);
            }
            this._prepBehavior(this);
        },
        _doBehavior: function (name, args) {
            var list = this.__behaviorMethods || this.behaviors;
            for (var i = 0; i < list.length; i++) {
                this._invokeBehavior(list[i], name, args);
            }
            this._invokeBehavior(this, name, args);
        },
        _invokeBehavior: function (b, name, args) {
            var fn = b[name];
            if (fn) {
                fn.apply(this, args || Polymer.nar);
            }
        },
        _marshalBehaviors: function () {
            for (var i = 0; i < this.behaviors.length; i++) {
                this._marshalBehavior(this.behaviors[i]);
            }
            this._marshalBehavior(this);
        }
    });
    Polymer.Base._behaviorMetaProperties = {
        hostAttributes: Object,
        properties: Object,
        observers: Array,
        listeners: Object
    };
    Polymer.Base._behaviorProperties = Polymer.Base.chainObject({
        beforeRegister: true,
        registered: true,
        created: true,
        attached: true,
        detached: true,
        attributeChanged: true,
        ready: true
    }, Polymer.Base._behaviorMetaProperties);
    Polymer.Base._addFeature({
        _getExtendedPrototype: function (tag) {
            var isNative = tag && tag.indexOf('-') < 0;
            var proto = isNative ? this._getExtendedNativePrototype(tag) : this._getExtendedElementPrototype(tag);
            if (!proto.__extendsNativeElement && isNative) {
                proto.__extendsNativeElement = tag;
            }
            return proto;
        },
        _nativePrototypes: {},
        _registeredPrototypes: {},
        _getExtendedElementPrototype: function (tag) {
            return this._registeredPrototypes[tag];
        },
        _registerPrototype: function (tag, proto) {
            if (tag) {
                this._registeredPrototypes[tag] = proto;
            }
        },
        getPrototype: function (tag) {
            return this._registeredPrototypes[tag];
        },
        __getSuper: function (proto) {
            var supr = proto.__proto__;
            if (supr.__isPolymerInstance__ && !supr.hasOwnProperty('__isPolymerInstance__')) {
                return supr;
            }
        },
        _getExtendedNativePrototype: function (tag) {
            var p = this._nativePrototypes[tag];
            if (!p) {
                var np = this.getNativePrototype(tag);
                p = this.extend(Object.create(np), Polymer.Base);
                this._nativePrototypes[tag] = p;
            }
            return p;
        },
        getNativePrototype: function (tag) {
            return Object.getPrototypeOf(document.createElement(tag));
        }
    });
    Polymer.Base._addFeature({
        _prepConstructor: function () {
            this._factoryArgs = [this.is];
            if (this.__extendsNativeElement) {
                this._factoryArgs.unshift(this.__extendsNativeElement);
            }
            var ctor = function () {
                return this._factory(arguments);
            };
            if (this.hasOwnProperty('extends')) {
                ctor.extends = this.extends;
            }
            Object.defineProperty(this, 'constructor', {
                value: ctor,
                writable: true,
                configurable: true
            });
            ctor.prototype = this;
        },
        _factory: function (args) {
            var elt = document.createElement.apply(document, this._factoryArgs);
            if (this.factoryImpl) {
                this.factoryImpl.apply(elt, args);
            }
            return elt;
        }
    });
    Polymer.nob = Object.create(null);
    Polymer.Base._addFeature({
        properties: {},
        getPropertyInfo: function (property) {
            var info = this._getPropertyInfo(property, this.properties);
            if (!info) {
                for (var i = 0; i < this.behaviors.length; i++) {
                    info = this._getPropertyInfo(property, this.behaviors[i].properties);
                    if (info) {
                        return info;
                    }
                }
            }
            return info || Polymer.nob;
        },
        _getPropertyInfo: function (property, properties) {
            var p = properties && properties[property];
            if (typeof p === 'function') {
                p = properties[property] = { type: p };
            }
            if (p) {
                p.defined = true;
            }
            return p;
        },
        _prepPropertyInfo: function () {
            this._propertyInfo = {};
            for (var i = 0; i < this.behaviors.length; i++) {
                this._addPropertyInfo(this._propertyInfo, this.behaviors[i].properties);
            }
            this._addPropertyInfo(this._propertyInfo, this.properties);
            this._addPropertyInfo(this._propertyInfo, this._propertyEffects);
        },
        _addPropertyInfo: function (target, source) {
            if (source) {
                var t, s;
                for (var i in source) {
                    t = target[i];
                    s = source[i];
                    if (i[0] === '_' && !s.readOnly) {
                        continue;
                    }
                    if (!target[i]) {
                        target[i] = {
                            type: typeof s === 'function' ? s : s.type,
                            readOnly: s.readOnly,
                            attribute: Polymer.CaseMap.camelToDashCase(i)
                        };
                    } else {
                        if (!t.type) {
                            t.type = s.type;
                        }
                        if (!t.readOnly) {
                            t.readOnly = s.readOnly;
                        }
                    }
                }
            }
        }
    });
    Polymer.CaseMap = {
        _caseMap: {},
        _rx: {
            dashToCamel: /-[a-z]/g,
            camelToDash: /([A-Z])/g
        },
        dashToCamelCase: function (dash) {
            return this._caseMap[dash] || (this._caseMap[dash] = dash.indexOf('-') < 0 ? dash : dash.replace(this._rx.dashToCamel, function (m) {
                return m[1].toUpperCase();
            }));
        },
        camelToDashCase: function (camel) {
            return this._caseMap[camel] || (this._caseMap[camel] = camel.replace(this._rx.camelToDash, '-$1').toLowerCase());
        }
    };
    Polymer.Base._addFeature({
        _addHostAttributes: function (attributes) {
            if (!this._aggregatedAttributes) {
                this._aggregatedAttributes = {};
            }
            if (attributes) {
                this.mixin(this._aggregatedAttributes, attributes);
            }
        },
        _marshalHostAttributes: function () {
            if (this._aggregatedAttributes) {
                this._applyAttributes(this, this._aggregatedAttributes);
            }
        },
        _applyAttributes: function (node, attr$) {
            for (var n in attr$) {
                if (!this.hasAttribute(n) && n !== 'class') {
                    var v = attr$[n];
                    this.serializeValueToAttribute(v, n, this);
                }
            }
        },
        _marshalAttributes: function () {
            this._takeAttributesToModel(this);
        },
        _takeAttributesToModel: function (model) {
            if (this.hasAttributes()) {
                for (var i in this._propertyInfo) {
                    var info = this._propertyInfo[i];
                    if (this.hasAttribute(info.attribute)) {
                        this._setAttributeToProperty(model, info.attribute, i, info);
                    }
                }
            }
        },
        _setAttributeToProperty: function (model, attribute, property, info) {
            if (!this._serializing) {
                property = property || Polymer.CaseMap.dashToCamelCase(attribute);
                info = info || this._propertyInfo && this._propertyInfo[property];
                if (info && !info.readOnly) {
                    var v = this.getAttribute(attribute);
                    model[property] = this.deserialize(v, info.type);
                }
            }
        },
        _serializing: false,
        reflectPropertyToAttribute: function (property, attribute, value) {
            this._serializing = true;
            value = value === undefined ? this[property] : value;
            this.serializeValueToAttribute(value, attribute || Polymer.CaseMap.camelToDashCase(property));
            this._serializing = false;
        },
        serializeValueToAttribute: function (value, attribute, node) {
            var str = this.serialize(value);
            node = node || this;
            if (str === undefined) {
                node.removeAttribute(attribute);
            } else {
                node.setAttribute(attribute, str);
            }
        },
        deserialize: function (value, type) {
            switch (type) {
                case Number:
                    value = Number(value);
                    break;
                case Boolean:
                    value = value != null;
                    break;
                case Object:
                    try {
                        value = JSON.parse(value);
                    } catch (x) {}
                    break;
                case Array:
                    try {
                        value = JSON.parse(value);
                    } catch (x) {
                        value = null;
                        console.warn('Polymer::Attributes: couldn`t decode Array as JSON');
                    }
                    break;
                case Date:
                    value = new Date(value);
                    break;
                case String:
                default:
                    break;
            }
            return value;
        },
        serialize: function (value) {
            switch (typeof value) {
                case 'boolean':
                    return value ? '' : undefined;
                case 'object':
                    if (value instanceof Date) {
                        return value.toString();
                    } else if (value) {
                        try {
                            return JSON.stringify(value);
                        } catch (x) {
                            return '';
                        }
                    }
                default:
                    return value != null ? value : undefined;
            }
        }
    });
    Polymer.version = '1.3.1';
    Polymer.Base._addFeature({
        _registerFeatures: function () {
            this._prepIs();
            this._prepSuper();
            this._prepBehaviors();
            this._prepConstructor();
            this._prepPropertyInfo();
        },
        _prepSuper: function () {
            this._aggregatedAttributes = null;
        },
        _prepBehavior: function (b) {
            this._addHostAttributes(b.hostAttributes);
        },
        _marshalBehavior: function (b) {},
        _initFeatures: function () {
            this._marshalHostAttributes();
            this._marshalBehaviors();
        }
    });

    exports.default = Polymer;
});