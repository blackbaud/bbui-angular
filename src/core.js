/*global angular */

// Declare the one global variable under which all other BBUI components will reside.
(function () {
    "use strict";

    angular.module('bbui.core', [])
        .factory('bbui', ['$window', function ($window) {
            var BBUI,
                // JSLint chokes on this regular expression if a literal is used.
                escapeRegExpRegEx = new RegExp("[.*+?|()\\[\\]{}\\\\\\$\\^]", "g"),
                euc = $window.encodeURIComponent,
                TYPE_STRING = "string";

            function emptyFn() {
            }

            function propOrDefault(obj, name, defaultValue) {
                var value;

                value = obj[name];

                if (typeof value === "undefined") {
                    return defaultValue;
                }

                return value;
            }

            function objEquals(value1, value2, ignoreCase) {
                if (value1 === value2) {
                    return true;
                }

                if (ignoreCase && typeof value1 === TYPE_STRING && typeof value2 === TYPE_STRING) {
                    return value1.toUpperCase() === value2.toUpperCase();
                }

                return false;
            }

            /**
             * @class BBUI Contains methods for issuing XMLHttpReqests as well as some basic helper functions.
             * @singleton
             * @uimodel <span style="color: green;">Yes</span>
             * @pageaction <span style="color: green;">Yes</span>
            */
            BBUI = {

                /**
                 * Read-only.  Represents an empty GUID value.
                 * @type {String}
                 */
                emptyGuid: "00000000-0000-0000-0000-000000000000",

                /**
                 * Returns a flag indicating the given object is defined and its value is not null.   This function is mainly
                 * used to see if a JSON property is present, since the absense of a property usually means "no change" rather
                 * than "this property's value was changed to null."<br/><br/>
                 * Calling this function is equivalent to evaluating <tt>typeof obj !== "undefined" && obj !== null</tt>.
                 * @param {Object} obj The object to check.
                 * @return {Boolean} False if the object is null or undefined; otherwise, true.
                 */
                is: function (obj) {
                    /// <summary>
                    /// Returns a flag indicating the given object is defined and its value is not null.   This function is mainly
                    /// used to see if a JSON property is present, since the absense of a property usually means "no change" rather
                    /// than "this property's value was changed to null."
                    /// Calling this function is equivalent to evaluating "typeof obj !== 'undefined' && obj !== null".
                    /// </summary>
                    /// <param name="obj" type="Object">The object to check.</param>
                    return typeof obj !== "undefined" && obj !== null;
                },

                /**
                 * Finds an item in an array with the specified property value.
                 * @param {Array} items The array to search.
                 * @param {String} propName The property's name.
                 * @param {Object} value The property's value.
                 * @param {Boolean} ignorePropCase (optional) Does a case-insensitive search on the property's name.  Default is false.
                 * @param {Boolean} ignoreValueCase (optional) Does a case-insensitive search on the property's value.  Default is false.
                 * @return {Object} The first item in the array that matches the property value (or null if no matching item is found).
                 */
                findByProp: function (items, propName, value, ignorePropCase, ignoreValueCase) {
                    /// <summary>Finds an item in an array with the specified property value.</summary>
                    /// <param name="items" type="Array">The array to search.</param>
                    /// <param name="propName" type="String">The name of the property.</param>
                    /// <param name="value" type="Object">The value of the property.</param>
                    /// <returns type="object">The first item in the array that matches the property value (or null if no matching item is found).</returns>

                    var i,
                        item,
                        propValue;

                    if (items) {
                        i = items.length || 0;
                        while (i--) {
                            item = items[i];

                            if (item) {
                                propValue = BBUI.getPropValue(item, propName, ignorePropCase);
                                if (objEquals(propValue, value, ignoreValueCase)) {
                                    return item;
                                }
                            }
                        }
                    }

                    return null;
                },

                getPropValue: function (obj, propName, ignoreCase, defaultValue) {
                    /// <summary>Gets an object's property value using a case-insensitive comparison if specified.</summary>
                    /// <param name="obj" type="Object">The object containing the property.</param>
                    /// <param name="propName" type="String">The name of the property.</param>
                    /// <param name="ignoreCase" type="Boolean">Indicates whether to ignore case on the property value.</param>
                    /// <param name="defaultValue" type="Object">The default value to return if the property does not exist.</param>

                    var p,
                        propNameUpper;

                    if (obj && propName) {
                        if (typeof obj[propName] !== "undefined") {
                            return obj[propName];
                        }

                        if (ignoreCase) {
                            propNameUpper = propName.toUpperCase();
                            for (p in obj) {
                                /*jslint forin: true */
                                if (p.toUpperCase() === propNameUpper) {
                                    return obj[p];
                                }
                            }
                        }
                    }

                    return defaultValue;
                },

                clone: function (obj) {
                    /// <summary>Copies the properties of the specified object to a new object and returns the new object.</summary>
                    /// <param name="obj" type="Object">Object to clone.</param>
                    /// <returns type="Object">The cloned object.</return>

                    var cloneObj,
                        p;

                    if (typeof obj !== "undefined") {
                        if (obj === null) {
                            return null;
                        }
                        cloneObj = {};
                        for (p in obj) {
                            if (obj.hasOwnProperty(p)) {
                                cloneObj[p] = obj[p];
                            }
                        }
                    }

                    return cloneObj;
                },

                copyProps: function (to, from) {
                    var p;

                    if (from) {
                        for (p in from) {
                            if (from.hasOwnProperty(p)) {
                                to[p] = from[p];
                            }
                        }
                    }
                },

                /**
                 * Compares two GUID values by normalizing capitalization of each GUID and comparing them as strings.
                 * @param {String} guid1 The first GUID to compare.
                 * @param {String} guid2 The second GUID to compare.
                 * @param {String} guid1Upper (optional) A flag indicating the first GUID is already upper-cased.  When true, a new upper-cased string is not created for the
                 * first GUID for comparison.  Use this flag as an optimization when comparing GUIDs in a loop so a new string does not
                 * have to be created for each iteration of the loop when the GUID does not change between iterations.
                 * @param {String} guid2Upper (optional) A flag indicating the second GUID is already upper-cased.  When true, a new upper-cased string is not created for the
                 * second GUID for comparison.  Use this flag as an optimization when comparing GUIDs in a loop so a new string does not
                 * have to be created for each iteration of the loop when the GUID does not change between iterations.
                 * @return {Boolean} A flag indicating whether the two GUIDs are the same.
                 */
                guidEquals: function (guid1, guid2, guid1Upper, guid2Upper) {
                    /// <summary>Compares two GUID values by normalizing capitalization of each GUID and comparing them as strings.</summary>
                    /// <param name="guid1" type="String">The first GUID to compare.</param>
                    /// <param name="guid2" type="String">The second GUID to compare.</param>
                    /// <param name="guid1Upper" type="Boolean" optional="true">
                    /// A flag indicating the first GUID is already upper-cased.  When true, a new upper-cased string is not created for the
                    /// first GUID for comparison.  Use this flag as an optimization when comparing GUIDs in a loop so a new string does not
                    /// have to be created for each iteration of the loop when the GUID does not change between iterations.
                    /// </param>
                    /// <param name="guid2Upper" type="Boolean" optional="true">
                    /// A flag indicating the second GUID is already upper-cased.  When true, a new upper-cased string is not created for the
                    /// second GUID for comparison.  Use this flag as an optimization when comparing GUIDs in a loop so a new string does not
                    /// have to be created for each iteration of the loop when the GUID does not change between iterations.
                    /// </param>
                    /// <returns type="Boolean">A flag indicating whether the two GUIDs are the same.</returns>

                    if (typeof guid1 !== TYPE_STRING || typeof guid2 !== TYPE_STRING) {
                        return false;
                    }

                    if (!guid1Upper) {
                        guid1 = guid1.toUpperCase();
                    }

                    if (!guid2Upper) {
                        guid2 = guid2.toUpperCase();
                    }

                    return guid1 === guid2;
                },

                getObjByName: function (objName) {
                    /// <summary>Parses the provided object name and returns a reference to the object it represents.</summary>
                    /// <param name="objName" type="String">The name of the object.</param>
                    /// <returns type="Object">The corresponding object, or null if any part of the object is undefined.</returns>

                    var i,
                        n,
                        obj,
                        parts,
                        part;

                    // Split the object name on the period, then loop through the parts, building up a reference to the
                    // object.  This essentially turns a string like "BBUI.globals.myFunctionName" into the object
                    // window["BBUI"]["globals"]["myFunctionName"].
                    parts = objName.split(".");

                    // Start with the window object.
                    obj = $window;

                    for (i = 0, n = parts.length; i < n; i++) {
                        part = parts[i];
                        if (!(i === 0 && part === "window")) {
                            obj = obj[part];
                            if (typeof obj === "undefined" && i < n - 1) {
                                return null;
                            }
                        }
                    }

                    return obj;
                },

                /**
                 * Creates a "namespace" using the provided string and returns the object representing the namespace.
                 * An example where a custom page action is created under the BBUI.customactions namespace:
                 * <pre><code>
        var ns;

        // Ensure the webshelltest namespace exists.
        ns = BBUI.ns("BBUI.customactions.webshelltest");

        ns.MyCustomAction = function (host) {
            // Cache the host object so it can be referenced later.
            this.host = host;
        };

        ns.MyCustomAction.prototype = {

            executeAction: function (callback) {
                // Action logic goes here.
            }

        };

                /**
                 * Concatenates all the provided arguments as if they were portions of a URL, inserting forward slashes where appropriate.
                 * @param {String} arg1 A portion of the URL.
                 * @param {String} arg2 (optional)
                 * @param {String} etc (optional)
                 * @return {String} The concatenated URL.
                 */
                urlConcat: function (arg1) {
                    /// <summary>
                    /// Concatenates all the provided arguments as if they were portions of a URL, inserting forward slashes
                    /// where appropriate.
                    /// </summary>
                    /// <returns type="String">The concatenated URL.</returns>

                    var arg,
                        argCount,
                        argObj,
                        i,
                        url;

                    argCount = arguments.length;

                    if (argCount) {
                        if (!BBUI.is(arg1)) {
                            return null;
                        }

                        url = arg1.toString();

                        for (i = 1; i < argCount; i++) {
                            argObj = arguments[i];

                            if (!BBUI.is(argObj)) {
                                return null;
                            }

                            arg = argObj.toString();

                            if (url.charAt(url.length - 1) !== "/" && arg.charAt(0) !== "/") {
                                url += "/";
                            }

                            url += arg;
                        }

                        return url;
                    }

                    return null;
                },

                argsToArray: function (args, start) {
                    /// <summary>
                    /// Takes the special arguments object from a function and returns the arguments in a true array.
                    /// </summary>
                    /// <param name="args">The arguments object.</param>
                    /// <param name="start" type="Integer" optional="true">
                    /// The index of the first item to return.  When not specified, all the items are returned.
                    /// </param>
                    /// <returns type="Array">The array of arguments.</returns>
                    return Array.prototype.slice.call(args, start || 0);
                },

                arrayToQueryString: function (items, itemPrefix, prependAmpersand) {
                    /// <summary>
                    /// Takes an array of objects with an "id" or "name" property and a "value" property and returns
                    /// the items as a query string.
                    /// <summary>
                    /// <param name="items" type="Array">The array of objects.</param>
                    /// <param name="itemPrefix" type="String" use="optional">
                    /// The string to prepend to the query string item name.
                    /// </param>
                    /// <param name="prependAmpersand" type="Boolean" use="optional">
                    /// Flag indicating whether to prepend an ampersand to the returned query string.
                    /// </param>
                    /// <returns type="String">The query string.</returns>
                    var i,
                        item,
                        n,
                        s;

                    s = "";

                    if (items && items.length) {
                        itemPrefix = itemPrefix || "";

                        for (i = 0, n = items.length; i < n; i++) {
                            item = items[i];

                            if (i > 0 || prependAmpersand) {
                                s += "&";
                            }

                            s += itemPrefix + euc(item.id || item.name) + "=" + euc(item.value);
                        }
                    }

                    return s;
                },

                getAbsoluteBaseUrl: function (relativeBaseUrl) {
                    var baseUrl,
                        i,
                        serverPartsCount;

                    if (!relativeBaseUrl) {
                        return relativeBaseUrl;
                    }

                    serverPartsCount = relativeBaseUrl.split("/").length;

                    // NOTE: The base URL value used to be passed as a relative URL down from the server, but this caused problems
                    // with mixed content warnings in IE8 when a URL on a DOM element (such as an href attribute on a LINK element
                    // or a background-image CSS rule on a DIV element) was specified and then created and not added to the page or
                    // removed from the page and then garbage collected.  This is due to a bug in IE8 where the protocol of "about:"
                    // is assumed rather than the protocol specified on the current web page.  Changing the base URL to an absolute
                    // URL by removing a known part of the URL here fixes this issue.  More information on the bug in IE that causes
                    // the mixed content warning can be found here:
                    // http://support.microsoft.com/kb/925014
                    // http://www.pelagodesign.com/blog/2007/10/30/ie7-removechild-and-ssl/
                    // http://blog.httpwatch.com/2009/09/17/even-more-problems-with-the-ie-8-mixed-content-warning/#comment-10632
                    // http://blogs.msdn.com/b/ieinternals/archive/2009/06/22/https-mixed-content-in-ie8.aspx?PageIndex=3#comments

                    // Also, a utility called "Scriptfree" was instrumental in tracking this bug down.  This was mentioned in a
                    // comment on the IEInternals blog post above.
                    // http://www.enhanceie.com/dl/scriptfreesetup.exe

                    // Remove the query string since it's not relevant.
                    baseUrl = $window.location.href.split("?")[0];

                    for (i = 0; i < serverPartsCount + 1; i++) {
                        baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/"));
                    }

                    return baseUrl;
                },

                /**
                 * Detemines whether the value of the first parameter ends with the value of the second parameter.
                 * @param {String} s The value to search.
                 * @param {String} val The value to find.
                 * @return {Boolean} A flag indicating whether the value of the first parameter ends with the value of the second parameter.
                 */
                endsWith: function (s, val) {
                    var pos;

                    if (typeof s === TYPE_STRING && typeof val === TYPE_STRING) {
                        pos = s.length - val.length;
                        return pos >= 0 && s.lastIndexOf(val) === pos;
                    }

                    return false;
                },

                /**
                 * Overrides functions on the first argument with properties from the second argument and returns an object
                 * with the original base functions.
                 * @param {Object} to The object whose functions are to be overridden.
                 * @param {Object} from The Object containing the override functions.
                 * @return {Object} The object containing the original functions.
                 */
                override: function (to, from) {
                    var base,
                        overridden,
                        p;

                    base = {};

                    for (p in from) {
                        if (from.hasOwnProperty(p)) {
                            overridden = to[p];

                            if (overridden) {
                                base[p] = overridden;
                            }

                            to[p] = from[p];
                        }
                    }

                    return base;
                },

                escapeRegExp: function (filter) {
                    if (typeof filter === TYPE_STRING) {
                        return filter.replace(escapeRegExpRegEx, '\\$&');
                    }

                    return null;
                }

            };

            return BBUI;

        }]);

}());
