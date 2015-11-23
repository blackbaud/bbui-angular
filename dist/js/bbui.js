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

/*global angular */

(function () {
    'use strict';
    
    angular.module('bbui', ['bbui.core', 'bbui.shellservice', 'bbui.uimodelingservice']);
    
}());
/*global angular */

(function () {
    'use strict';

    angular.module('bbui.shellservice', ['bbui.core'])
        .constant('bbuiShellServiceConfig', {
            baseUrl: null,
            databaseName: null
        })
        .factory('bbuiShellService', ['$http', 'bbui', 'bbuiShellServiceConfig', function ($http, BBUI, bbuiShellServiceConfig) {
            var Service;

            (function () {
                // Shorter alias for commonly-used function.
                var euc = encodeURIComponent,
                    paramPrefix = "p_";

                function pushIf(sb, qsVarName, value, condition) {
                    if (typeof condition === "undefined") {
                        condition = !!value;
                    }

                    if (condition) {
                        sb.push("&" + qsVarName + "=");
                        sb.push(euc(value));
                    }
                }

                function buildBaseUrl(svc, fileName, action, pageId, tabId, sectionId, actionId, contextRecordId) {
                    var sb;

                    sb = [];

                    if (svc.proxyUrl) {
                        sb.push(svc.proxyUrl +
                            (svc.proxyUrl.indexOf("?") >= 0 ? "&" : "?") +
                            "fileName=" +
                            euc(fileName) +
                            "&");
                    } else {
                        sb.push(BBUI.urlConcat(svc.baseUrl, "webui/" + fileName + "?"));
                    }

                    sb.push("databaseName=" + euc(svc.databaseName));

                    pushIf(sb, "runAs", svc.runAs);

                    pushIf(sb, "action", action);
                    pushIf(sb, "pageId", pageId);
                    pushIf(sb, "tabId", tabId);
                    pushIf(sb, "sectionId", sectionId);
                    pushIf(sb, "actionId", actionId);
                    pushIf(sb, "contextRecordId", contextRecordId);

                    return sb.join("");
                }

                function buildSvcBaseUrl(svc, action, pageId, tabId, sectionId, actionId, contextRecordId) {
                    return buildBaseUrl(svc, "WebShellService.ashx", action, pageId, tabId, sectionId, actionId, contextRecordId);
                }

                function buildAdHocQuerySvcBaseUrl(svc) {
                    return buildBaseUrl(svc, "WebShellAdHocQueryService.ashx");
                }

                function buildDataListSvcBaseUrl(svc, dataListId, pageId, tabId, sectionId) {
                    var url;

                    url = buildBaseUrl(svc, "WebShellDataListService.ashx", null, pageId, tabId, sectionId) +
                        "&dataListId=" +
                        euc(dataListId);

                    return url;
                }

                function buildSearchListSvcBaseUrl(svc, searchListId, criteria) {
                    return buildBaseUrl(svc, "WebShellSearchListService.ashx") +
                        "&searchListId=" +
                        euc(searchListId) +
                        "&criteria=" +
                        euc(criteria);
                }

                function addSecurityContext(url, options) {
                    if (options) {
                        if (options.securityContextFeatureId) {
                            url += "&securityContextFeatureId=" + euc(options.securityContextFeatureId);
                        }

                        if (BBUI.is(options.securityContextFeatureType)) {
                            url += "&securityContextFeatureType=" + euc(options.securityContextFeatureType);
                        }
                    }

                    return url;
                }

                function getHeaders(svc) {
                    var headers;

                    headers = {};

                    BBUI.copyProps(headers, bbuiShellServiceConfig.globalHttpHeaders);
                    BBUI.copyProps(headers, svc.httpHeaders);

                    return headers;
                }

                function doRequest(svc, method, url, data, options) {
                    var postOptions,
                        session;

                    return svc.$http({
                        method: method,
                        url: url,
                        data: data,
                        headers: getHeaders(svc),
                        cache: false
                    });
                }

                function doGet(svc, url, options) {
                    return svc.doGet(url, options);
                }

                function doPost(svc, url, data, options) {
                    return svc.doPost(url, data, options);
                }

                /**
                 * @class BBUI.webshell.Service
                 * Provides various methods for communicating with the web shell endpoints on the web server.
                 * <br/><br/>Note that all methods that make a call to the web server have the same last three arguments:
                 * <div class="mdetail-params">
                 * <ul>
                 * <li><tt>successCallback</tt> : Function <div class="sub-desc">The function to be called when request completes successfully.
                 * The <tt>reply</tt> object will be passed as the first parameter to the function.</div></li>
                 * <li><tt>failureCallback</tt> : Function <div class="sub-desc">The function to be called when an error occurs during the request.
                 * The original XMLHttpRequest object will be passed as the first parameter to the function, and the error message will be passed
                 * as the second parameter.</div></li>
                 * <li><tt>options</tt> : Object <div class="sub-desc">The following properties apply to all requests.
                 * Each method may implement its own properties which are documented on the method itself.</div></li>
                 * <ul>
                 * <li><tt>scope</tt> : Object <div class="sub-desc">The scope (<tt>this</tt>) to use for the callback functions.</div></li>
                 * <li><tt>state</tt> : Object <div class="sub-desc">An extra parameter to be passed to the success/failure callback functions
                 * which can be used instead of <tt>scope</tt>. This will be the second parameter passed to the successCallback function or the
                 * third parameter passed to the failureCallback function.</div></li>
                 * </ul>
                 * </ul>
                 * </div>
                 * An example performing a record operation a custom page action that illustrates how the success/failure callbacks work:
                 * <pre><code>
            (function () {
                // Ensure the webshelltest namespace exists.
                var ns = BBUI.ns("BBUI.customactions.webshelltest"),
                    Util = BBUI.forms.Utility;

                ns.MyCustomAction = function (host) {
                    // Cache the host object so it can be referenced later.
                    this.host = host;
                };

                ns.MyCustomAction.prototype = {

                    executeAction: function (callback) {
                        var host,
                            recordOperationId,
                            webShellSvc;

                        host = this.host;
                        webShellSvc = host.webShellSvc;
                        recordOperationId = "183bf26e-ba1c-4c02-aa43-f0a806f6fe4d";

                        // Callback for when the record operation is performed successfully.
                        function performSuccess() {
                            // The record operation is complete.  Call the callback.
                            callback();
                        }

                        // Callback for when the record operation fails.
                        function performFailure(request, error) {
                            Util.alert(error.message);
                        }

                        // Callback for when getting the prompt succeeds.
                        function promptSuccess(reply) {

                            // Util.confirm() is an asynchronous operation, so create a callback for when the user answers the prompt.
                            function confirmCallback(result) {
                                if (result === 1) { // Yes
                                    // The user confirmed the prompt; perform the record operation.
                                    webShellSvc.recordOperationPerform(recordOperationId,
                                        host.getFieldValue("RECORDID"),
                                        performSuccess,
                                        performFailure);
                                }
                            }

                            Util.confirm(reply.promptText, {
                                buttonStyle: 2, // Yes/No
                                callback: confirmCallback
                            });
                        }

                        // Callback for when getting the prompt fails.
                        function promptFailure(request, error) {
                            Util.alert(error.message);
                        }

                        // Get the prompt.
                        webShellSvc.recordOperationGetPrompt(recordOperationId, promptSuccess, promptFailure);
                    }

                };

            })();
                 * </code></pre>
                 * @uimodel <span style="color: red;">No</span>
                 * @pageaction <span style="color: green;">Yes</span>
                 */
                Service = function (baseUrl, databaseName, options) {
                    /// <summary>The main AJAX interface between web shell pages and the web server.</summary>
                    /// <param name="baseUrl" type="String">The base URL to the web server.</param>
                    /// <param name="databaseName" type="String">The name of the database to which to connect.</param>
                    /// <param name="options" type="Object" optional="true">
                    /// An object containing any of the following properties:
                    /// proxyUrl: A URL to a web server that acts as a proxy between the client and the AppFx web server.
                    /// This is useful in cases where the host page is hosted on a server other than the AppFx web server
                    /// and the browser would otherwise block the request for being a cross-site request.
                    /// </param>
                    /// <field name="baseUrl" type="String">The base URL to the web server.</field>
                    /// <field name="databaseName" type="String">The name of the database to which to connect.</field>

                    var svc;

                    svc = this;

                    svc.baseUrl = baseUrl;
                    svc.databaseName = databaseName;

                    if (options) {
                        svc.runAs = options.runAs;
                        svc.onRequestBegin = options.onRequestBegin;
                        svc.onRequestEnd = options.onRequestEnd;
                        svc.httpHeaders = options.httpHeaders;
                        svc.proxyUrl = options.proxyUrl;
                    }
                };

                Service.prototype = {

                    /**
                     * Read-only.  The base URL to the web server.
                     * @property baseUrl
                     * @type String
                     */
                    baseUrl: null,

                    /**
                     * Read-only.  The name of the database to which to connect.
                     * @property databaseName
                     * @type String
                     */
                    databaseName: null,

                    /**
                     * @private
                     * Validates a user name and password for a given user.
                     * @param {Object} loginInfo An object with username and password properties.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    login: function (loginInfo, options) {
                        var url;

                        url = buildBaseUrl(this, "WebShellLogin.aspx") + "&action=login";

                        return doPost(this, url, loginInfo, options);
                    },

                    /**
                     * @private
                     * Removes the session cookie that keeps the user logged in.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    logout: function (options) {
                        var url;

                        url = buildBaseUrl(this, "WebShellLogin.aspx") + "&action=logout";

                        return doPost(this, url, null, options);
                    },

                    /**
                     * @private
                     * Requests a password reset link and emails it to the associated user.
                     * @param {Object} emailAddress The user's email address.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    sendPasswordResetLink: function (emailAddress, options) {
                        var url;

                        url = buildBaseUrl(this, "WebShellLogin.aspx") + "&action=sendPasswordResetLink&emailAddress=" + emailAddress;

                        return doPost(this, url, null, options);
                    },

                    /**
                     * @private
                     * Resets the user's password.
                     * @param {Object} request An object containing token and newPassword properties.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    resetPassword: function (request, options) {
                        var url;

                        url = buildBaseUrl(this, "WebShellLogin.aspx") + "&action=resetPassword";

                        return doPost(this, url, request, options);
                    },

                    /**
                     * @private
                     * Starts the user's session and returns navigation information for web shell.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    sessionStart: function (options) {
                        var url;

                        url = buildSvcBaseUrl(this, "sessionStart");

                        return doPost(this, url, null, options);
                    },

                    /**
                     * @private
                     * Gets the site-wide navigation information for web shell.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    getNavigation: function (options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getNavigation");

                        if (options.refreshCache) {
                            url += "&refreshCache=true";
                        }

                        return doGet(this, url, options);
                    },

                    /**
                     * @private
                     * Gets the specified page's metadata.
                     * @param {String} pageId The ID of the page.
                     * @param {String} recordId (optional) The ID of the record to be shown by the page.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>firstTab</tt> : Indicates that the first visible tab's full metadata should be returned.  Only the caption for other tabs will be returned.</li>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * <li><tt>tabId</tt> : The ID of the tab whose full metadata should be returned.  Only the caption for other tabs will be returned.</li>
                     * </ul>
                     */
                    getPage: function (pageId, recordId, options) {
                        var url;

                        options = options || {};

                        url = buildSvcBaseUrl(this, "getPage", pageId, options.tabId, null, null, recordId);

                        if (options.firstTab) {
                            url += "&firstTab=true";
                        }
                        if (options.listBuilderInstanceId) {
                            url += "&listBuilderInstanceId=" + euc(options.listBuilderInstanceId);
                        }

                        return doGet(this, url, options);
                    },

                    /**
                    * @private
                    * Gets the specified page's metadata.
                    * @param {String} pageId The ID of the page.
                    * @param {String} recordId (optional) The ID of the record to be shown by the page.
                    * @param {Object} options (optional) An object that my contain any of the following properties:
                    * <ul>
                    * <li><tt>firstTab</tt> : Indicates that the first visible tab's full metadata should be returned.  Only the caption for other tabs will be returned.</li>
                    * <li><tt>scope</tt> : See class description for more information.</li>
                    * <li><tt>tabId</tt> : The ID of the tab whose full metadata should be returned.  Only the caption for other tabs will be returned.</li>
                    * </ul>
                    */
                    getPageIsCustomizable: function (pageId, options) {
                        var url;

                        options = options || {};

                        url = buildSvcBaseUrl(this, "getPageIsCustomizable", pageId);

                        return doGet(this, url, options);
                    },

                    /**
                     * @private
                     * Gets the specified page tab's metadata.
                     * @param {String} pageId The ID of the page.
                     * @param {String} tabId The ID of the tab.
                     * @param {String} recordId The ID of the record to be shown by the page.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    getPageTab: function (pageId, tabId, recordId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageTab", pageId, tabId, null, null, recordId);

                        return doGet(this, url, options);
                    },

                    /**
                     * @private
                     * Builds a page on the server according to the specified report and returns that page's metadata.
                     * @param {String} reportId The ID of the report.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    getReportPage: function (reportId, options) {
                        var url;

                        options = options || {};

                        url = buildSvcBaseUrl(this, "getReportPage") +
                            "&reportId=" + euc(reportId);

                        if (options.historyId) {
                            url += "&historyId=" + euc(options.historyId);
                        }

                        if (options.caption) {
                            url += "&caption=" + euc(options.caption);
                        }

                        if (options.displayPromptArea) {
                            url += "&displayPromptArea=" + euc(options.displayPromptArea);
                        }

                        url += BBUI.arrayToQueryString(options.parameters, paramPrefix, true);

                        return doGet(this, url, options);
                    },

                    /**
                     * @private
                     * Gets the action metadata for a functional area's task.
                     * @taskId {String} The ID of the functional area's task.
                     * @functionalAreaId {String} The ID of the functional area.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    getFunctionalAreaTaskAction: function (functionalAreaId, taskId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getFunctionalAreaTaskAction");

                        if (functionalAreaId) {
                            url += "&functionalAreaId=" + euc(functionalAreaId);
                        }

                        if (taskId) {
                            url += "&taskId=" + euc(taskId);
                        }

                        return doGet(this, url, options);
                    },

                    /**
                    * @private
                    * Returns a task as the variable reply for the callback
                    * @taskId {String} The ID of the task
                    * @param {Function} successCallback (optional) See class description for more information.
                    * @param {Function} failureCallback (optional) See class description for more information.
                    */
                    getTaskAction: function (taskId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getTaskAction");

                        if (taskId) {
                            url += "&taskId=" + euc(taskId);
                        }

                        return doGet(this, url, options);
                    },

                    /**
                     * @private
                     * Gets the metadata for a page-level action.
                     * @pageId {String} The ID of the page.
                     * @actionId {String} The ID of the page's action.
                     * @param {Function} successCallback (optional) See class description for more information.
                     * @param {Function} failureCallback (optional) See class description for more information.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    getPageAction: function (pageId, actionId, contextRecordId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageAction", pageId, null, null, actionId, contextRecordId);

                        return doGet(this, url, options);
                    },

                    /**
                     * @private
                     * Gets the metadata for a page section.
                     * @pageId {String} The ID of the page.
                     * @tabId {String} The ID of the tab to which the section belongs.
                     * @sectionId {String} The ID of the section.
                     * @contextRecordId {String} (optional) The ID of the page's context record.
                     * @param {Function} successCallback (optional) See class description for more information.
                     * @param {Function} failureCallback (optional) See class description for more information.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    getPageSection: function (pageId, tabId, sectionId, contextRecordId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageSection", pageId, tabId, sectionId, null, contextRecordId);

                        return doGet(this, url, options);
                    },

                    getPageDataFormSectionAction: function (pageId, tabId, sectionId, actionId, contextRecordId, formSessionId, modelInstanceId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageDataFormSectionAction", pageId, tabId, sectionId, actionId, contextRecordId) +
                            "&formSessionId=" +
                            euc(formSessionId) +
                            "&modelInstanceId=" +
                            euc(modelInstanceId);

                        return doPost(this, url, null, options);
                    },

                    getPageReportSectionAction: function (pageId, tabId, sectionId, actionId, contextRecordId, options) {
                        var reportValues,
                            url;

                        if (options) {
                            reportValues = options.reportValues;
                        }

                        url = buildSvcBaseUrl(this, "getPageReportSectionAction", pageId, tabId, sectionId, actionId, contextRecordId);

                        return doPost(this, url, reportValues, options);
                    },


                    getPageUIWidgetSectionAction: function (pageId, tabId, sectionId, actionId, contextRecordId, options) {
                        var row = null,
                            url;

                        url = buildSvcBaseUrl(this, "getPageUIWidgetSectionAction", pageId, tabId, sectionId, actionId, contextRecordId);

                        if (options) {
                            if (options.pageRecordId) {
                                url += "&pageRecordId=" + euc(options.pageRecordId);
                            }

                            if (options.rowValues) {
                                row = options.rowValues;
                            }
                        }

                        return doPost(this, url, row, options);
                    },

                    getPageUrlSectionAction: function (pageId, tabId, sectionId, actionId, contextRecordId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageUrlSectionAction", pageId, tabId, sectionId, actionId, contextRecordId);

                        if (options) {
                            if (options.pageRecordId) {
                                url += "&pageRecordId=" + euc(options.pageRecordId);
                            }
                        }

                        return doPost(this, url, null, options);
                    },

                    getPageDataListSectionAction: function (pageId, tabId, sectionId, actionId, contextRecordId, row, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageDataListSectionAction", pageId, tabId, sectionId, actionId, contextRecordId);

                        if (options) {
                            if (options.pageRecordId) {
                                url += "&pageRecordId=" + euc(options.pageRecordId);
                            }
                            if (options.formSessionId) {
                                url += "&formSessionId=" + euc(options.formSessionId);
                            }
                            if (options.modelInstanceId) {
                                url += "&modelInstanceId=" + euc(options.modelInstanceId);
                            }
                        }

                        return doPost(this, url, row, options);
                    },

                    getPageListBuilderSectionAction: function (pageId, tabId, sectionId, actionId, contextRecordId, row, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageListBuilderSectionAction", pageId, tabId, sectionId, actionId, contextRecordId);

                        if (options && options.pageRecordId) {
                            url += "&pageRecordId=" + euc(options.pageRecordId);
                        }

                        return doPost(this, url, row, options);
                    },

                    getListBuilderAvailableColumns: function (queryViewId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getListBuilderAvailableColumns") + "&queryViewId=" + queryViewId;

                        return doGet(this, url, options);
                    },

                    listBuilderGetInstanceXml: function (queryViewId, request, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "listBuilderGetInstanceXml") +
                            "&queryViewId=" +
                            euc(queryViewId);

                        if (options.parameterFormSessionId) {
                            url += "&parameterFormSessionId=" + euc(options.parameterFormSessionId);
                        }

                        return doPost(this, url, request, options);
                    },

                    listBuilderGetInstance: function (listBuilderInstanceId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "listBuilderGetInstance") + "&listBuilderInstanceId=" + listBuilderInstanceId;

                        return doGet(this, url, options);
                    },

                    listBuilderClearAllSettings: function (userSettingsPath, queryViewId, options) {

                        var url;

                        url = buildSvcBaseUrl(this, "listBuilderClearAllSettings") +
                            "&userSettingsPath=" + userSettingsPath +
                            "&queryViewId=" + queryViewId;

                        return doGet(this, url, options);
                    },

                    adHocQueryClearAllSettings: function (userSettingsPath, adHocQueryId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQueryClearAllSettings") +
                            "&userSettingsPath=" + userSettingsPath +
                            "&adHocQueryId=" + adHocQueryId;

                        return doGet(this, url, options);
                    },

                    getAdHocQueryAvailableColumns: function (adHocQueryId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getAdHocQueryAvailableColumns") + "&adHocQueryId=" + adHocQueryId;

                        return doGet(this, url, options);
                    },

                    getPageSummarySectionAction: function (pageId, actionId, contextRecordId, formSessionId, modelInstanceId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageSummarySectionAction", pageId, null, null, actionId, contextRecordId) +
                            "&formSessionId=" +
                            euc(formSessionId) +
                            "&modelInstanceId=" +
                            euc(modelInstanceId);

                        return doGet(this, url, options);
                    },

                    evaluateDataListSectionActions: function (pageId, tabId, sectionId, contextRecordId, row, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "evaluateDataListSectionActions", pageId, tabId, sectionId, null, contextRecordId);

                        if (options) {
                            if (options.pageRecordId) {
                                url += "&pageRecordId=" + euc(options.pageRecordId);
                            }
                        }

                        return doPost(this, url, row, options);
                    },

                    evaluateListBuilderSectionActions: function (pageId, tabId, sectionId, contextRecordId, row, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "evaluateListBuilderSectionActions", pageId, tabId, sectionId, null, contextRecordId);

                        if (options && options.pageRecordId) {
                            url += "&pageRecordId=" + euc(options.pageRecordId);
                        }

                        return doPost(this, url, row, options);
                    },

                    evaluateDataFormSectionActions: function (pageId, tabId, sectionId, contextRecordId, formSessionId, modelInstanceId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "evaluateDataFormSectionActions", pageId, tabId, sectionId, null, contextRecordId) +
                            "&formSessionId=" +
                            euc(formSessionId) +
                            "&modelInstanceId=" +
                            euc(modelInstanceId);

                        return doPost(this, url, null, options);
                    },

                    dataListGetOutputDefinition: function (dataListId, options) {
                        var url;

                        options = options || {};
                        options.cache = true;

                        url = BBUI.urlConcat(this.baseUrl, "webui/mc/") + euc(this.databaseName) + "/d/" + euc(dataListId) + "." + (options.timestamp || 0) + "_bbmd.ashx";

                        return doGet(this, url, options);
                    },

                    queryViewGetOutputDefinition: function (queryViewId, options) {
                        var url;

                        options = options || {};
                        options.cache = true;

                        url = BBUI.urlConcat(this.baseUrl, "webui/mc/") + euc(this.databaseName) + "/q/" + euc(queryViewId) + "." + (options.timestamp || 0) + "_bbmd.ashx";

                        return doGet(this, url, options);
                    },

                    /**
                     * Loads the results of the specified data list and passes the {@link BBUI.webshell.servicecontracts.DataListLoadReply reply object}
                     * to the successCallback function.
                     * @param {String} dataListId The ID of the data list to load.
                     * @param {String} contextRecordId (optional) The ID of the data list's context record.
                     * @param {Function} successCallback (optional) See class description for more information.
                     * @param {Function} failureCallback (optional) See class description for more information.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>pageRecordId</tt> : The ID of the page's context record where the data list is rendered.</li>
                     * <li><tt>parameterFormSessionId</tt> : The ID of the form session that provides parameters to the data list.</li>
                     * <li><tt>parameters</tt> : An array of objects containing <tt>name</tt> and <tt>value</tt> properties used to filter the data list results.</li>
                     * <li><tt>returnFlotData</tt> : A flag indicating the data should be returned in a format readable by flot charts.</li>
                     * <li><tt>returnFormattedValues</tt> : Flag indicating the data list should return formatted values along with the raw values.</li>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * <li><tt>userSettingsPath</tt> : The path used as the key to store user information about the data list, such as column sizes or the last filter values used.</li>
                     * </ul>
                     */
                    dataListLoad: function (dataListId, contextRecordId, options) {
                        var sb,
                            url;

                        options = options || {};

                        sb = [buildDataListSvcBaseUrl(this, dataListId)];

                        pushIf(sb, "recordId", contextRecordId);

                        if (options) {
                            pushIf(sb, "returnFormattedValues", "true", !!options.returnFormattedValues);
                            pushIf(sb, "pageRecordId", options.pageRecordId);
                            pushIf(sb, "parameterFormSessionId", options.parameterFormSessionId);
                            pushIf(sb, "functionalAreaId", options.functionalAreaId);
                            pushIf(sb, "uiWidgetId", options.uiWidgetId);
                            pushIf(sb, "personalizationMode", options.personalizationMode);
                            pushIf(sb, "userSettingsPath", options.userSettingsPath);
                            pushIf(sb, "returnFlotData", "true", !!options.returnFlotData);
                            pushIf(sb, "pageId", options.pageId);
                            pushIf(sb, "tabId", options.tabId);
                            pushIf(sb, "sectionId", options.sectionId);
                            pushIf(sb, "moreRowsRangeKey", options.moreRowsRangeKey);
                            pushIf(sb, "discardRows", "true", !!options.discardRows);
                            pushIf(sb, "returnPageNavigationTree", "true", !!options.returnPageNavigationTree);
                            pushIf(sb, "limit", options.limit);
                            pushIf(sb, "cancelId", options.cancelId);

                            sb.push(BBUI.arrayToQueryString(options.parameters, paramPrefix, true));
                        }

                        url = sb.join("");

                        return doGet(this, url, options);
                    },

                    /**
                     * Loads the results of the specified simple data list and passes the {@link BBUI.webshell.servicecontracts.SimpleDataListLoadReply reply object}
                     * to the successCallback function.
                     * @param {String} simpleDataListId The ID of the simple data list to load.
                     * @param {Function} successCallback (optional) See class description for more information.
                     * @param {Function} failureCallback (optional) See class description for more information.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>parameters</tt> : An array of objects containing <tt>name</tt> and <tt>value</tt> properties used to filter the simple data list results.</li>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    simpleDataListLoad: function (simpleDataListId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "simpleDataListLoad") +
                            "&simpleDataListId=" + euc(simpleDataListId);

                        if (options) {
                            url += BBUI.arrayToQueryString(options.parameters, paramPrefix, true);
                        }

                        return doGet(this, url, options);
                    },

                    buildPageSectionDataListResultsUrl: function (pageId, tabId, sectionId, dataListId, options) {
                        var sb,
                            url;

                        if (!options) {
                            options = {};
                        }

                        sb = [buildDataListSvcBaseUrl(this, dataListId, pageId, tabId, sectionId)];

                        pushIf(sb, "recordId", options.contextRecordId);
                        pushIf(sb, "pageRecordId", options.pageRecordId);
                        pushIf(sb, "returnFormattedValues", "true", options.returnFormattedValues);
                        // Adding moreRowsRangeKey back here
                        // Since buildResultsUrl is always called now to set the proxy connection url, we should always be getting the correct value
                        pushIf(sb, "moreRowsRangeKey", options.moreRowsRangeKey);
                        pushIf(sb, "previousRowCount", options.previousRowCount);
                        pushIf(sb, "parameterFormSessionId", options.parameterFormSessionId);
                        pushIf(sb, "personalizationMode", options.personalizationMode);
                        pushIf(sb, "userSettingsPath", options.userSettingsPath);
                        pushIf(sb, "exportFormat", options.exportFormat);
                        pushIf(sb, "cancelId", options.cancelId);

                        sb.push(BBUI.arrayToQueryString(options.parameters, paramPrefix, true));

                        url = sb.join("");

                        return url;
                    },

                    buildPageSectionAdHocQueryListResultsUrl: function (pageId, tabId, sectionId, adHocQueryId, queryViewId, options) {
                        var sb,
                            svc = this,
                            url;

                        sb = [buildBaseUrl(svc, "WebShellAdHocQueryListService.ashx") +
                            "&adHocQueryId=" + euc(adHocQueryId) +
                            "&queryViewId=" + euc(queryViewId) +
                            "&returnResults=true"];

                        options = options || {};

                        pushIf(sb, "returnFormattedValues", "true", options.returnFormattedValues);
                        pushIf(sb, "parameterFormSessionId", options.parameterFormSessionId);
                        pushIf(sb, "pageId", pageId);
                        pushIf(sb, "tabId", tabId);
                        pushIf(sb, "sectionId", sectionId);
                        pushIf(sb, "pageRecordId", options.pageRecordId);
                        pushIf(sb, "recordId", options.contextRecordId);
                        pushIf(sb, "userSettingsPath", options.userSettingsPath);
                        pushIf(sb, "saveUserSettings", "true", !!options.saveUserSettings);
                        pushIf(sb, "cancelId", options.cancelId);

                        url = sb.join("");

                        return url;
                    },

                    buildPageSectionListBuilderResultsUrl: function (pageId, tabId, sectionId, queryViewId, options) {
                        var sb,
                            svc = this,
                            url;

                        sb = [buildBaseUrl(svc, "WebShellListBuilderService.ashx") +
                            "&queryViewId=" + euc(queryViewId) +
                            "&returnResults=true"];

                        options = options || {};

                        pushIf(sb, "returnFormattedValues", "true", options.returnFormattedValues);
                        pushIf(sb, "parameterFormSessionId", options.parameterFormSessionId);
                        pushIf(sb, "pageId", pageId);
                        pushIf(sb, "tabId", tabId);
                        pushIf(sb, "sectionId", sectionId);
                        pushIf(sb, "pageRecordId", options.pageRecordId);
                        pushIf(sb, "recordId", options.contextRecordId);
                        pushIf(sb, "userSettingsPath", options.userSettingsPath);
                        pushIf(sb, "saveUserSettings", "true", !!options.saveUserSettings);
                        pushIf(sb, "moreRowsRangeKey", options.moreRowsRangeKey);
                        pushIf(sb, "previousRowCount", options.previousRowCount);
                        pushIf(sb, "cancelId", options.cancelId);
                        pushIf(sb, "storeSettingsByContextRecordId", options.storeSettingsByContextRecordId);

                        url = sb.join("");

                        return url;
                    },

                    listBuilderClearCachedResults: function (moreRowsRangeKey, options) {
                        var url,
                            svc = this;

                        url = buildBaseUrl(svc, "WebShellListBuilderService.ashx") +
                            "&moreRowsRangeKey=" + euc(moreRowsRangeKey) +
                            "&discardRows=true";

                        return doGet(svc, url, options);
                    },

                    pageSectionDataListLoad: function (pageId, tabId, sectionId, dataListId, options) {
                        var url;

                        url = this.buildPageSectionDataListResultsUrl(pageId, tabId, sectionId, dataListId, options);

                        return doGet(this, url, options);
                    },

                    /**
                     * Gets the prompt to be displayed before the specified record operation is performed and passes the
                     * {@link BBUI.webshell.servicecontracts.RecordOperationPrompt reply object} to the successCallback function.
                     * @param {String} recordOperationId The ID of the record operation.
                     * @param {String} recordId (optional) The ID of the context record for the record operation.
                     * @param {Function} successCallback (optional) See class description for more information.
                     * @param {Function} failureCallback (optional) See class description for more information.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    recordOperationGetPrompt: function (recordOperationId, recordId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "recordOperationGetPrompt") +
                            "&recordOperationId=" +
                            euc(recordOperationId);

                        if (recordId) {
                            url += "&recordId=" + euc(recordId);
                        }

                        return doGet(this, url, options);
                    },

                    /**
                     * Performs a record operation.
                     * @param {String} recordOperationId The ID of the record operation.
                     * @param {String} recordId (optional) The ID of the context record for the record operation.
                     * @param {Function} successCallback (optional) See class description for more information.
                     * @param {Function} failureCallback (optional) See class description for more information.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>parameters</tt> : An array of objects containing <tt>name</tt> and <tt>value</tt> properties to pass as parameters to the record operation.</li>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    recordOperationPerform: function (recordOperationId, recordId, options) {
                        var url,
                            sb,
                            data;

                        if (options && (options.parameters || options.recordIds)) {
                            data = {};

                            if (options.parameters) {
                                data.values = options.parameters;
                            }

                            if (options.recordIds) {
                                data.recordIds = options.recordIds;
                            }
                        }

                        sb = [buildSvcBaseUrl(this, "recordOperationPerform")];

                        pushIf(sb, "recordOperationId", recordOperationId);
                        pushIf(sb, "recordId", recordId);

                        url = sb.join("");

                        return doPost(this, url, data, options);
                    },

                    searchListGetOutputDefinition: function (searchListId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "searchListGetOutputDefinition") +
                            "&searchListId=" +
                            euc(searchListId);

                        return doGet(this, url, options);
                    },

                    searchListQuickFind: function (searchListId, criteria, options) {
                        var url;

                        url = buildSearchListSvcBaseUrl(this, searchListId, criteria);

                        if (options) {
                            if (options.onlyReturnRows) {
                                url += "&onlyReturnRows=true";
                            }
                            if (options.maxRecords) {
                                url += "&maxRecords=" + euc(options.maxRecords);
                            }
                        }

                        return doGet(this, url, options);
                    },

                    codeTableEntrySave: function (codeTableName, codeTableEntryId, request, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "codeTableEntrySave") +
                            "&codeTableName=" +
                            euc(codeTableName) +
                            "&codeTableEntryId=" +
                            euc(codeTableEntryId);

                        return doPost(this, url, request, options);
                    },

                    kpiDashboardGetDefinition: function (options) {
                        var url;

                        url = buildSvcBaseUrl(this, "kpiDashboardGetDefinition");

                        if (options.returnValues) {
                            url += "&returnValues=true";
                        }

                        return doGet(this, url, options);
                    },

                    queryViewGetFieldFindResults: function (request, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "queryViewGetFieldFindResults");

                        return doPost(this, url, request, options);
                    },

                    queryViewGetTree: function (id, options, forExport, forReportModelGenerator) {
                        var url;

                        url = buildSvcBaseUrl(this, "queryViewGetTree") +
                            "&id=" +
                            euc(id);

                        if (BBUI.is(forExport) && forExport === true) {
                            url += "&loadExportDefinitionViews=true";
                        } else {
                            url += "&loadExportDefinitionViews=false";
                        }

                        if (BBUI.is(forReportModelGenerator) && forReportModelGenerator === true) {
                            url += "&reportModelViewsOnly=true";
                        } else {
                            url += "&reportModelViewsOnly=false";
                        }

                        return doGet(this, url, options);
                    },

                    queryViewGetMetaData: function (id, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "queryViewGetMetaData") +
                            "&id=" +
                            euc(id);

                        return doGet(this, url, options);
                    },

                    queryViewGetTreeNodeFields: function (node, options, forReportModelGenerator) {
                        var url;

                        url = buildSvcBaseUrl(this, "queryViewGetTreeNodeFields") +
                            "&node=" +
                            euc(node);

                        if (BBUI.is(forReportModelGenerator) && forReportModelGenerator === true) {
                            url += "&reportModelViewsOnly=true";
                        } else {
                            url += "&reportModelViewsOnly=false";
                        }

                        return doGet(this, url, options);
                    },

                    buildQueryViewGetTreeNodeChildrenUrl: function (queryViewId, forExport, forReportModelGenerator) {
                        var url;

                        url = buildSvcBaseUrl(this, "queryViewGetTreeNodeChildren");

                        if (BBUI.is(forExport) && forExport === true) {
                            url += "&loadExportDefinitionViews=true";
                        } else {
                            url += "&loadExportDefinitionViews=false";
                        }

                        if (BBUI.is(forReportModelGenerator) && forReportModelGenerator === true) {
                            url += "&reportModelViewsOnly=true";
                        } else {
                            url += "&reportModelViewsOnly=false";
                        }

                        return url;
                    },

                    adHocQueryProcess: function (request, options) {
                        var cancelCallback,
                            requestObj,
                            scope,
                            state,
                            svc,
                            url;

                        function cancelAdHocQueryProcess() {
                        }

                        svc = this;

                        url = buildAdHocQuerySvcBaseUrl(svc);

                        if (options) {
                            if (options.returnFormattedValues) {
                                url += "&returnFormattedValues=true";
                            }
                            if (options.cancelId) {
                                url += "&cancelId=" + options.cancelId;
                            }
                        }

                        return doPost(svc, url, request, options);
                    },

                    adHocQueryGetResults: function (request, options) {
                        var url;

                        url = buildAdHocQuerySvcBaseUrl(this);

                        if (options) {
                            if (options.returnFormattedValues) {
                                url += "&returnFormattedValues=true" + "&getResults=true";
                            }
                            if (options.cancelId) {
                                url += "&cancelId=" + euc(options.cancelId);
                            }
                        }

                        return doPost(this, url, request, options);
                    },

                    cancelAsyncOperation: function (cancelId, options) {
                        var url;

                        url = buildBaseUrl(this, "WebShellCancelAsyncOperation.ashx") +
                            "&cancelId=" +
                            euc(cancelId);

                        return doGet(this, url, options);
                    },

                    buildAdHocQueryExportUrl: function (options) {
                        var url;

                        options = options || {};

                        url = [];
                        url.push(buildAdHocQuerySvcBaseUrl(this));
                        url.push("&forExport=true");

                        pushIf(url, "getResults", "true", !!options.getResults);
                        pushIf(url, "queryViewId", options.queryViewId);

                        return url.join("");
                    },

                    buildListBuilderExportUrl: function (options) {
                        var url;

                        options = options || {};

                        url = [];
                        url.push(buildBaseUrl(this, "WebShellListBuilderService.ashx"));
                        url.push("&forExport=true");

                        pushIf(url, "queryViewId", options.queryViewId);
                        pushIf(url, "suppressPrimaryKeyField", "true", !!options.suppressPrimaryKeyField);
                        pushIf(url, "searchText", options.searchText);
                        pushIf(url, "parameterFormSessionId", options.parameterFormSessionId);

                        return url.join("");
                    },

                    buildAdHocQueryListExportUrl: function (options) {
                        var url;

                        options = options || {};

                        url = [];
                        url.push(buildBaseUrl(this, "WebShellAdHocQueryListService.ashx"));
                        url.push("&forExport=true");

                        pushIf(url, "adHocQueryId", options.adHocQueryId);
                        pushIf(url, "queryViewId", options.queryViewId);
                        pushIf(url, "suppressPrimaryKeyField", "true", !!options.suppressPrimaryKeyField);
                        pushIf(url, "searchText", options.searchText);
                        pushIf(url, "parameterFormSessionId", options.parameterFormSessionId);

                        return url.join("");
                    },

                    adHocQuerySave: function (request, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQuerySave");

                        return doPost(this, url, request, options);
                    },

                    adHocQuerySaveDataList: function (request, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQuerySaveDataList");

                        return doPost(this, url, request, options);
                    },

                    adHocQuerySaveReport: function (request, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQuerySaveReport");

                        return doPost(this, url, request, options);
                    },

                    adHocQuerySaveSmartQuery: function (request, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQuerySaveSmartQuery");

                        return doPost(this, url, request, options);
                    },
                    adHocQueryGetDefinition: function (id, options) {
                        var definitionType = options.definitionType,
                            throwOnInvalidFields = options.throwOnInvalidFields,
                            url;

                        url = buildSvcBaseUrl(this, "adHocQueryGetDefinition") +
                            "&id=" +
                            euc(id);

                        if (!BBUI.is(definitionType)) {
                            definitionType = 0; //ad-hoc query
                        }

                        url += "&definitionType=" + euc(definitionType);

                        if (BBUI.is(throwOnInvalidFields)) {
                            url += "&throwOnInvalidFields=" + euc(throwOnInvalidFields);
                        }

                        return doGet(this, url, options);
                    },

                    adHocQueryDelete: function (id, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQueryDelete") +
                            "&id=" +
                            euc(id);

                        return doPost(this, url, null, options);
                    },

                    exportDefinitionSave: function (request, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "exportDefinitionSave");

                        return doPost(this, url, request, options);
                    },

                    exportDefinitionGetDefinition: function (id, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "exportDefinitionGetDefinition") +
                            "&id=" +
                            euc(id);

                        return doGet(this, url, options);
                    },

                    smartQueryProcess: function (request, options) {
                        var cancelCallback,
                            requestObj,
                            scope,
                            state,
                            svc,
                            url;

                        function cancelSmartQueryProcess() {
                        }

                        svc = this;

                        url = buildBaseUrl(svc, "WebShellSmartQueryService.ashx");

                        if (options) {
                            if (options.returnFormattedValues) {
                                url += "&returnFormattedValues=true";
                            }
                            if (options.cancelId) {
                                url += "&cancelId=" + euc(options.cancelId);
                            }
                        }

                        return doPost(svc, url, request, options);
                    },

                    smartQueryGetResults: function (request, options) {
                        var url;

                        url = buildBaseUrl(this, "WebShellSmartQueryService.ashx");

                        if (options) {
                            if (options.returnFormattedValues) {
                                url += "&returnFormattedValues=true" + "&getResults=true";
                            }
                            if (options.cancelId) {
                                url += "&cancelId=" + euc(options.cancelId);
                            }
                        }

                        return doPost(this, url, request, options);
                    },

                    buildSmartQueryExportUrl: function (options) {
                        var url;

                        url = [];
                        url.push(buildBaseUrl(this, "WebShellSmartQueryService.ashx"));
                        url.push("&forExport=true");

                        if (options && options.getResults) {
                            url.push("&getResults=true");
                        }

                        return url.join("");
                    },

                    userGetFunctionalAreaHistory: function (functionalAreaId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userGetFunctionalAreaHistory") +
                            "&functionalAreaId=" +
                            euc(functionalAreaId);

                        if (options) {
                            if (options.folderPath) {
                                url += "&folderPath=" +
                                    euc(options.folderPath);
                            }

                            if (options.includeSearchTasks) {
                                url += "&includeSearchTasks=true";
                            }

                            if (options.includeShortcuts) {
                                url += "&includeShortcuts=true";
                            }

                            if (!options.skipMru) {
                                url += "&includeMru=true";
                            }
                        }

                        return doGet(this, url, options);
                    },

                    userUpdateDataFormSettings: function (formSessionId, userSettingsPath, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdateDataFormSettings") +
                            "&formSessionId=" +
                            euc(formSessionId) +
                            "&userSettingsPath=" +
                            euc(userSettingsPath);

                        return doPost(this, url, null, options);
                    },

                    userUpdateSelectedPervasiveSearchTask: function (pervasiveSearchTaskId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdateSelectedPervasiveSearchTask");

                        if (pervasiveSearchTaskId) {
                            url += "&pervasiveSearchTaskId=" + euc(pervasiveSearchTaskId);
                        }

                        return doPost(this, url, null, options);
                    },

                    userUpdateShortcuts: function (request, options) {
                        var url;

                        options = options || {};

                        url = buildSvcBaseUrl(this, "userUpdateShortcuts");

                        if (options.remove) {
                            url += "&remove=" + euc(options.remove);
                        }

                        if (options.replace) {
                            url += "&replace=" + euc(options.replace);
                        }

                        return doPost(this, url, request, options);
                    },

                    userUpdatePageActionGroupSettings: function (pageId, actionGroups, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdatePageActionGroupSettings") +
                            "&pageId=" +
                            euc(pageId);

                        return doPost(this, url, actionGroups, options);
                    },

                    userUpdateFunctionalAreaActionGroupSettings: function (functionalAreaId, actionGroups, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdateFunctionalAreaActionGroupSettings") +
                            "&functionalAreaId=" +
                            euc(functionalAreaId);

                        return doPost(this, url, actionGroups, options);
                    },

                    userUpdatePageDataListSettings: function (pageId, sectionId, dataListId, settings, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdatePageDataListSettings", pageId, null, sectionId) +
                            "&dataListId=" +
                            euc(dataListId);

                        return doPost(this, url, settings, options);
                    },

                    userUpdatePageListBuilderSettings: function (queryViewId, userSettingsPath, settings, options) {
                        var url;

                        options = options || {};

                        url = buildSvcBaseUrl(this, "userUpdatePageListBuilderSettings") +
                            "&queryViewId=" +
                            euc(queryViewId) +
                            "&userSettingsPath=" +
                            euc(userSettingsPath);

                        if (options.storeSettingsByContextRecordId) {
                            url += "&storeSettingsByContextRecordId=true";

                            if (options.contextRecordId) {
                                url += "&contextRecordId=" + euc(options.contextRecordId);
                            }
                        }

                        return doPost(this, url, settings, options);
                    },

                    userUpdateAdHocQueryListBuilderSettings: function (queryViewId, adHocQueryId, userSettingsPath, settings, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdatePageListBuilderSettings") +
                            "&queryViewId=" +
                            euc(queryViewId) +
                            "&adHocQueryId=" +
                            euc(adHocQueryId) +
                            "&userSettingsPath=" +
                            euc(userSettingsPath);

                        return doPost(this, url, settings, options);
                    },

                    userUpdatePageSectionSettings: function (pageId, sections, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdatePageSectionSettings") +
                            "&pageId=" +
                            euc(pageId);

                        return doPost(this, url, sections, options);
                    },

                    userUpdatePageTabSettings: function (pageId, tabs, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdatePageTabSettings") +
                            "&pageId=" +
                            euc(pageId);

                        return doPost(this, url, tabs, options);
                    },

                    userSetFeatureTipSeen: function (featureTipId, tipSeen, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userSetFeatureTipSeen");

                        return doPost(this, url, {featureTipId: featureTipId, tipSeen: tipSeen}, options);
                    },

                    userGetFeatureTipSeen: function (featureTipId, setTipAsSeen, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userGetFeatureTipSeen");

                        return doPost(this, url, {featureTipId: featureTipId, setTipAsSeen: setTipAsSeen}, options);
                    },

                    userUpdateSearchListGridSettings: function (searchlistid, gridSettings, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdateSearchListGridSettings") +
                            "&searchlistid=" +
                            euc(searchlistid);

                        return doPost(this, url, gridSettings, options);
                    },

                    userGetSearchListGridSettings: function (searchlistid, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userGetSearchListGridSettings") +
                            "&searchlistid=" +
                            euc(searchlistid);

                        return doGet(this, url, options);
                    },

                    userUpdateActionPanelSettings: function (settings, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdateActionPanelSettings");

                        return doPost(this, url, settings, options);
                    },

                    featureSearch: function (criteria, onlyRssFeeds, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "featureSearch") +
                            "&criteria=" +
                            euc(criteria);

                        if (onlyRssFeeds) {
                            url += "&onlyRssFeeds=true";
                        }

                        return doGet(this, url, options);
                    },

                    buildRssFeedUrl: function (dataListId, contextRecordId) {
                        var url;

                        url = BBUI.urlConcat(this.baseUrl, "rssfeed.ashx?WebShell=true&DBName=" +
                            euc(this.databaseName) +
                            "&DataListID=" +
                            euc(dataListId));

                        if (contextRecordId) {
                            url += "&ContextRecordID=" + contextRecordId;
                        }

                        return url;
                    },

                    /**
                     * Loads a data form from the server and passes the {@link BBUI.webshell.servicecontracts.DataFormLoadReply reply object} to the successCallback function.
                     * @param {String} dataFormInstanceId The ID of the data form instance to load.
                     * @param {Function} successCallback (optional) See class description for more information.
                     * @param {Function} failureCallback (optional) See class description for more information.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>recordId</tt> : The ID of the record for the data form.</li>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    dataFormLoad: function (dataFormInstanceId, options) {
                        var svc,
                            url;

                        options = options || {};

                        url = buildSvcBaseUrl(this, "dataFormLoad") +
                            "&dataFormInstanceId=" +
                            euc(dataFormInstanceId);

                        if (options.recordId) {
                            url += "&recordId=" + euc(options.recordId);
                        }

                        if (options.contextRecordId) {
                            url += "&contextRecordId=" + euc(options.contextRecordId);
                        }

                        url = addSecurityContext(url, options);

                        return doGet(this, url, options);
                    },

                    /**
                     * Saves a data form on the server and passes the {@link BBUI.webshell.servicecontracts.DataFormSaveReply reply object} to the successCallback function.
                     * @param {String} dataFormInstanceId The ID of the data form instance to load.
                     * @param {Function} successCallback (optional) See class description for more information.
                     * @param {Function} failureCallback (optional) See class description for more information.
                     * @param {Object} options (optional) An object that my contain any of the following properties:
                     * <ul>
                     * <li><tt>contextRecordId</tt> : The ID of the record that provides context for the data form.</li>
                     * <li><tt>recordId</tt> : The ID of the record for the data form.</li>
                     * <li><tt>scope</tt> : See class description for more information.</li>
                     * </ul>
                     */
                    dataFormSave: function (dataFormInstanceId, options) {
                        var svc,
                            url,
                            data;

                        options = options || {};

                        data = {};

                        url = buildSvcBaseUrl(this, "dataFormSave") +
                            "&dataFormInstanceId=" +
                            euc(dataFormInstanceId);

                        if (options.recordId) {
                            url += "&recordId=" + euc(options.recordId);
                        }

                        if (options.contextRecordId) {
                            url += "&contextRecordId=" + euc(options.contextRecordId);
                        }

                        url = addSecurityContext(url, options);

                        if (options.values) {
                            data.values = options.values;
                        }

                        return doPost(this, url, data, options);
                    },

                    taskWizardGetDefinition: function (taskWizardId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "taskwizardgetdefinition") +
                            "&taskWizardId=" +
                            euc(taskWizardId);

                        return doGet(this, url, options);
                    },

                    taskWizardGetTaskStatus: function (taskId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "taskwizardgettaskstatus") +
                            "&taskId=" +
                            euc(taskId);

                        return doGet(this, url, options);
                    },

                    buildReportExportUrl: function (reportId, historyId, exportType, deviceInfo, dataFormItemKey, fileName) {
                        var url;

                        url = buildSvcBaseUrl(this, "exportReport") +
                            "&reportId=" + euc(reportId);

                        if (historyId) {
                            url += "&historyId=" + euc(historyId);
                        }

                        if (!BBUI.is(exportType)) {
                            exportType = 2;
                        }

                        url += "&exportType=" + euc(exportType);

                        if (deviceInfo) {
                            url += "&deviceInfo=" + euc(deviceInfo);
                        }

                        if (dataFormItemKey) {
                            url += "&dataFormItemKey=" + euc(dataFormItemKey);
                        }

                        if (fileName) {
                            url += "&fileName=" + euc(fileName);
                        }

                        return url;
                    },

                    cacheDataFormItem: function (values, options) {
                        var url,
                            data;

                        if (values) {
                            data = {
                                values: values
                            };
                        }

                        url = buildSvcBaseUrl(this, "cacheDataFormItem");

                        return doPost(this, url, data, options);
                    },

                    idMap: function (idMapperId, sourceId, options) {
                        var url,
                            data;

                        url = buildSvcBaseUrl(this, "idMap") +
                            "&idMapperId=" + euc(idMapperId);

                        if (sourceId) {
                            url += "&sourceId=" + euc(sourceId);
                        }

                        return doGet(this, url, options);
                    },

                    securityUserGrantedFeature: function (id, featureType, options) {
                        var url,
                            data;

                        url = buildSvcBaseUrl(this, "securityUserGrantedFeature") +
                            "&id=" + euc(id) +
                            "&featureType=" + euc(featureType);

                        return doGet(this, url, options);
                    },

                    loadCatalogItem: function (sourceType, sourceName, itemResourceName, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "loadCatalogItem") +
                            "&sourceType=" + euc(sourceType) +
                            "&sourceName=" + euc(sourceName) +
                            "&itemResourceName=" + euc(itemResourceName);

                        return doPost(this, url, null, options);
                    },

                    getPageHelpKey: function (pageId, tabId, sectionId, recordId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageHelpkey", pageId, tabId, sectionId, null, recordId);

                        return doGet(this, url, options);
                    },

                    buildSvcBaseUrl: function (action) {
                        return buildSvcBaseUrl(this, action);
                    },

                    doGet: function (url, options) {
                        return doRequest(this, "GET", url, null, options);
                    },

                    doPost: function (url, data, options) {
                        return doRequest(this, "POST", url, data, options);
                    }
                };

            }());

            return {
                create: function (baseUrl, databaseName, options) {
                    var svc;

                    baseUrl = baseUrl || bbuiShellServiceConfig.baseUrl;
                    databaseName = databaseName || bbuiShellServiceConfig.databaseName;

                    if (baseUrl === null || !databaseName) {
                        throw new Error('You must either provide a baseUrl and databaseName as parameters or set them globally using bbuiShellServiceConfig.');
                    }

                    svc = new Service(baseUrl, databaseName, options);
                    svc.$http = $http;

                    return svc;
                }
            };
        }]);
}());

/*global angular */

(function () {
    "use strict";

    angular.module('bbui.uimodelingservice', [])
        .constant('bbuiUIModelingServiceConfig', {
            baseUrl: null,
            databaseName: null
        })
        .factory('bbuiUIModelingService', ['$http', 'bbui', 'bbuiUIModelingServiceConfig', function ($http, BBUI, bbuiUIModelingServiceConfig) {
            var euc,
                formSessionServerIds,
                formSessionServerIdsBufferPos,
                formSessionServerIdsBufferSize,
                keepAliveInterval,
                processEventQueue,
                Service;

            // Since this is called many times in this file, create a shorter alias for it.
            euc = encodeURIComponent;

            formSessionServerIds = [];
            formSessionServerIdsBufferPos = 0;
            formSessionServerIdsBufferSize = 100;

            function getNextFormSessionServerIdPos() {
                var next;

                next = formSessionServerIdsBufferPos++;

                if (formSessionServerIdsBufferPos === formSessionServerIdsBufferSize) {
                    formSessionServerIdsBufferPos = 0;
                }

                return next;
            }

            function buildSvcBaseUrl(svc, action, formSessionId, modelInstanceId, fieldId) {
                var url;

                url =
                    BBUI.urlConcat(svc.baseUrl, "uimodel/UIModelingService.ashx?action=") +
                    action +
                    "&databaseName=" + euc(svc.databaseName);

                if (svc.runAs) {
                    url += "&runAs=" + euc(svc.runAs);
                }

                if (formSessionId) {
                    url += "&formSessionId=" + euc(formSessionId);
                }

                if (modelInstanceId) {
                    url += "&modelInstanceId=" + euc(modelInstanceId);
                }

                if (fieldId) {
                    url += "&fieldId=" + euc(fieldId);
                }

                return url;
            }

            function doRequest(svc, method, url, data, options) {
                var postOptions,
                    session;

                return svc.$http({
                    method: method,
                    url: url,
                    data: data,
                    cache: false
                });
            }

            function doGet(svc, url, options) {
                return doRequest(svc, "GET", url, null, options);
            }

            function doPost(svc, url, data, options) {
                return doRequest(svc, "POST", url, data, options);
            }

            function addOptionalFormSessionArgs(url, options) {

                if (options) {
                    if (options.recordId) {
                        url += "&recordId=" + euc(options.recordId);
                    }

                    if (options.contextRecordId) {
                        url += "&contextRecordId=" + euc(options.contextRecordId);
                    }

                    if (options.uiWidgetDashboardSystemId) {
                        url += "&uiWidgetDashboardSystemId=" + euc(options.uiWidgetDashboardSystemId);
                    }

                    if (options.uiWidgetDashboardWidgetId) {
                        url += "&uiWidgetDashboardWidgetId=" + euc(options.uiWidgetDashboardWidgetId);
                    }

                    if (options.userSettingsPath) {
                        url += "&userSettingsPath=" + euc(options.userSettingsPath);
                    }
                }

                return url;
            }

            /**
             * @class BBUI.uimodeling.Service
             * Provides various methods for communicating changes to a UI model to the web server.
             * @uimodel <span style="color: yes;">Yes</span>
             * @pageaction <span style="color: green;">Yes</span>
             */
            Service = function (baseUrl, databaseName, options) {
                /// <summary>Provides interaction to models on the web server.</summary>
                /// <param name="baseUrl" type="String">The base URL to the web server.</param>
                /// <param name="databaseName" type="String">The name of the database to which to connect.</param>
                /// <field name="baseUrl" type="String">The base URL to the web server.</field>
                /// <field name="databaseName" type="String">The name of the database to which to connect.</field>

                var svc,
                    useEventQueue;

                svc = this;

                /**
                 * Read-only.  The base URL to the web server.
                 * @property baseUrl
                 * @type String
                 */
                svc.baseUrl = baseUrl;

                /**
                 * Read-only.  The name of the database to which to connect.
                 * @property databaseName
                 * @type String
                 */
                svc.databaseName = databaseName;

                if (options) {
                    svc.runAs = options.runAs;
                    svc.onRequestBegin = options.onRequestBegin;
                    svc.onRequestEnd = options.onRequestEnd;
                    svc.httpHeaders = options.httpHeaders;
                    svc.useEventQueue = useEventQueue = BBUI.is(options.useEventQueue) ? options.useEventQueue : true;

                    if (useEventQueue) {
                        svc._formSessionQueue = {};
                    }
                }

                svc.handlers = {};
            };

            Service.prototype = {

                on: function (evt, fn, scope, formSessionId) {
                    var evtHandlers,
                        handlers;

                    handlers = this.handlers;

                    evtHandlers = handlers[evt];

                    if (!evtHandlers) {
                        evtHandlers = handlers[evt] = [];
                    }

                    evtHandlers.push({
                        fn: fn,
                        formSessionId: formSessionId,
                        scope: scope
                    });
                },

                un: function (evt, fn, formSessionId) {
                    var evtHandlers,
                        i;

                    evtHandlers = this.handlers[evt];

                    if (evtHandlers) {
                        i = evtHandlers.length;
                        while (i--) {
                            if (evtHandlers[i].fn === fn && evtHandlers[i].formSessionId === formSessionId) {
                                evtHandlers.splice(i, 1);
                                break;
                            }
                        }
                    }
                },

                createFormSession: function (assemblyName, className, args, options) {
                    /// <summary>Creates an instance of the form on the server.</summary>
                    /// <param name="assemblyName" type="String">The assembly name containing the UI model class.</param>
                    /// <param name="className" type="String">The name of the UI model class.</param>
                    /// <param name="args" type="BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs">Optional arguments to pass to the form session.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object" optional="true">
                    /// An object literal that may contain any of the following properties:
                    /// recordId: The ID of the record being edited.
                    /// contextRecordId: The ID of the record that provides the context for the record being added or edited.
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createFormSession") +
                        "&assemblyName=" +
                        euc(assemblyName) +
                        "&className=" +
                        euc(className);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args, options);
                },

                createMergeTaskFormSession: function (mergeTaskId, args, options) {
                    /// <summary>Creates an instance of the form on the server.</summary>
                    /// <param name="mergeTaskId" type="String">The Id of the merge task.</param>
                    /// <param name="args" type="BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs">Optional arguments to pass to the form session.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object" optional="true">
                    /// An object literal that may contain any of the following properties:
                    /// recordId: The ID of the record being edited.
                    /// contextRecordId: The ID of the record that provides the context for the record being added or edited.
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createMergeTaskFormSession") +
                        "&mergeTaskId=" +
                        euc(mergeTaskId);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args, options);
                },

                createDataFormSession: function (dataFormInstanceId, args, options) {
                    /// <summary>Creates an instance of the form on the server.</summary>
                    /// <param name="dataFormInstanceId" type="String">The ID of the data form instance to interact with.</param>
                    /// <param name="args" type="BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs">Optional arguments to pass to the form session.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object" optional="true">
                    /// An object literal that may contain any of the following properties:
                    /// recordId: The ID of the record being edited.
                    /// contextRecordId: The ID of the record that provides the context for the record being added or edited.
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createDataFormSession") +
                        "&dataFormInstanceId=" +
                        euc(dataFormInstanceId);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args, options);
                },

                createSearchListSession: function (searchListId, args, options) {
                    /// <summary>Creates an instance of the form on the server.</summary>
                    /// <param name="searchListId" type="String">The ID of the search list to interact with.</param>
                    /// <param name="args" type="BBUI.uimodeling.servicecontracts.CreateSearchListFormSessionArgs">Optional arguments to pass to the search list session.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object" optional="true">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    url = buildSvcBaseUrl(this, "createSearchListFormSession") +
                        "&searchListId=" +
                        euc(searchListId);

                    return doPost(this, url, args, options);
                },

                createDataListFilterFormSession: function (dataListId, args, options) {
                    /// <summary>Creates an instance of the data list's filter form on the server.</summary>
                    /// <param name="dataFormInstanceId" type="String">The ID of the data list to interact with.</param>
                    /// <param name="args" type="BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs">Optional arguments to pass to the form session.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object" optional="true">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createDataListFilterFormSession") +
                        "&dataListId=" +
                        euc(dataListId);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args, options);
                },

                createListBuilderFilterFormSession: function (queryViewId, args, options) {
                    /// <summary>Creates an instance of the list builder filter form on the server.</summary>
                    /// <param name="queryViewId" type="String">The ID of the query view used to render the list.</param>
                    /// <param name="args" type="BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs">Optional arguments to pass to the form session.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object" optional="true">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createListBuilderFilterFormSession") +
                        "&queryViewId=" +
                        euc(queryViewId);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args, options);
                },

                createReportParameterFormSession: function (reportId, historyId, args, options) {
                    /// <summary>Creates an instance of the report's parameter form on the server.</summary>
                    /// <param name="reportId" type="String">The ID of the report to interact with.</param>
                    /// <param name="historyId" type="String">The history ID of the report to interact with.</param>
                    /// <param name="args" type="BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs">Optional arguments to pass to the form session.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object" optional="true">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createReportParameterFormSession") +
                        "&reportId=" +
                        euc(reportId);

                    if (historyId) {
                        url += "&historyId=" + euc(historyId);
                    }

                    if (options.showAllParameters) {
                        url += "&showAllParameters=true";
                    }

                    return doPost(this, url, args, options);
                },

                createBusinessProcessFormSession: function (businessProcessId, args, options) {
                    /// <summary>Creates an instance of the business process's parameter form on the server.</summary>
                    /// <param name="businessProcessId" type="String">The ID of the data form instance to interact with.</param>
                    /// <param name="args" type="BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs">Optional arguments to pass to the form session.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object" optional="true">
                    /// An object literal that may contain any of the following properties:
                    /// recordId: The ID of the record being edited.
                    /// contextRecordId: The ID of the record that provides the context for the record being added or edited.
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createBusinessProcessFormSession") +
                        "&businessProcessId=" +
                        euc(businessProcessId);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args, options);
                },

                buildSearchListResultsUrl: function (formSessionId, modelInstanceId, htmlEncodeValues, returnFormattedValues, taskId, taskHistoryId, cancelId) {
                    var url;

                    url = BBUI.urlConcat(this.baseUrl, "uimodel/UIModelingSearchService.ashx?databaseName=") + euc(this.databaseName);

                    if (this.runAs) {
                        url += "&runAs=" + euc(this.runAs);
                    }

                    url +=
                        "&formSessionId=" + euc(formSessionId) +
                        "&modelInstanceId=" + euc(modelInstanceId);

                    if (htmlEncodeValues) {
                        url += "&htmlEncodeValues=true";
                    }

                    if (returnFormattedValues) {
                        url += "&returnFormattedValues=true";
                    }

                    if (taskId) {
                        url += "&taskId=" + euc(taskId);
                    }

                    if (taskHistoryId) {
                        url += "&taskHistoryId=" + euc(taskHistoryId);
                    }

                    if (cancelId) {
                        url += "&cancelId=" + euc(cancelId);
                    }

                    return url;
                },

                buildStartBusinessProcessUrl: function (businessProcessId, parameterSetId, dataFormItemKey, businessProcessStatusId) {
                    var url;

                    url =
                        BBUI.urlConcat(this.baseUrl, "uimodel/UIModelingBusinessProcessService.ashx?databaseName=") + euc(this.databaseName) +
                        "&businessProcessId=" + euc(businessProcessId);

                    if (BBUI.is(parameterSetId)) {
                        url += "&parameterSetId=" + euc(parameterSetId);
                    }

                    if (BBUI.is(dataFormItemKey)) {
                        url += "&dataFormItemKey=" + euc(dataFormItemKey);
                    }

                    if (BBUI.is(businessProcessStatusId)) {
                        url += "&businessProcessStatusId=" + euc(businessProcessStatusId);
                    }

                    if (this.runAs) {
                        url += "&runAs=" + euc(this.runAs);
                    }

                    return url;
                },

                searchListGetOutputDefinition: function (formSessionId, modelInstanceId, returnExistingResults, options) {
                    /// <summary>Gets the output definition of a search.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the search list form model.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the search list form model.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the search is executed successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while executing the search.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    if (!options) {
                        options = {};
                    }

                    var url = buildSvcBaseUrl(this, "searchListGetOutputDefinition", formSessionId, modelInstanceId) +
                        "&returnExistingResults=" +
                        (returnExistingResults ? "true" : "false");

                    if (options.taskHistoryId) {
                        url += "&taskHistoryId=" + euc(options.taskHistoryId);
                    }

                    return doGet(this, url, options, formSessionId);
                },

                getSearchListResults: function (formSessionId, modelInstanceId, htmlEncodeValues, options) {
                    /// <summary>Gets the results of a search.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the search list form model.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the search list form model.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the search is executed successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while executing the search.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    if (!options) {
                        options = {};
                    }

                    // Append a timestamp to the end of the URL so the results aren't cached by the browser.
                    var url = this.buildSearchListResultsUrl(formSessionId,
                        modelInstanceId,
                        htmlEncodeValues,
                        options.returnFormattedValues,
                        options.taskId,
                        options.taskHistoryId,
                        options.cancelId) +
                        "&_reqid=" + new Date().getTime();

                    return doGet(this, url, options, formSessionId);
                },

                invokeSearchItemSelected: function (formSessionId, modelInstanceId, selectedIndex, options) {
                    /// <summary>Invokes the searchItemSelected event with the given search field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the search form session.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the search model instance.</param>
                    /// <param name="selectedIndex" type="Number" integer="true">The zero-based index of the selected search result row.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the event is invoked successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while invoking the event.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "invokeSearchItemSelected", formSessionId, modelInstanceId);

                    return doPost(this, url, selectedIndex, options, formSessionId);
                },

                invokeFieldSearch: function (formSessionId, modelInstanceId, fieldName, options) {
                    /// <summary>Invokes the search list associated with the given search field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="fieldName" type="String">The name of the search field.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the search is invoked successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while invoking the search.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "invokeFieldSearch", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, null, options, formSessionId);
                },

                invokeFieldQuickFind: function (formSessionId, modelInstanceId, fieldName, criteria, options) {
                    /// <summary>Invokes quick find on the given search field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="fieldName" type="String">The name of the search field.</param>
                    /// <param name="criteria" type="String">The quick find criteria.</param>
                    /// <param name="successCallback" type="Function">The function to be called when quick find is invoked successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while invoking quick find.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    url = BBUI.urlConcat(this.baseUrl, "uimodel/UIModelingSearchService.ashx?databaseName=" +
                        euc(this.databaseName) +
                        "&formSessionId=" +
                        euc(formSessionId) +
                        "&modelInstanceId=" +
                        euc(modelInstanceId) +
                        "&fieldId=" +
                        euc(fieldName) +
                        "&quickFindCriteria=" +
                        euc(criteria));

                    if (this.runAs) {
                        url += "&runAs=" + euc(this.runAs);
                    }

                    return doPost(this, url, null, options, formSessionId);
                },

                invokeFieldAutoSearch: function (formSessionId, modelInstanceId, fieldName, options) {
                    /// <summary>Invokes the search list associated with the given search field and executes the search.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="fieldName" type="String">The name of the search field.</param>
                    /// <param name="successCallback" type="Function">The function to be called when quick find is invoked successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while invoking quick find.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    url = BBUI.urlConcat(this.baseUrl, "uimodel/UIModelingSearchService.ashx?databaseName=" +
                        euc(this.databaseName) +
                        "&formSessionId=" +
                        euc(formSessionId) +
                        "&modelInstanceId=" +
                        euc(modelInstanceId) +
                        "&fieldId=" +
                        euc(fieldName) +
                        "&autoSearch=true");

                    if (this.runAs) {
                        url += "&runAs=" + euc(this.runAs);
                    }

                    return doPost(this, url, null, options, formSessionId);
                },

                invokeQuickFind: function (searchListId, criteria, options) {
                    /// <summary>Invokes quick find on the given search list.</summary>
                    /// <param name="searchListId" type="String">The ID of the search list.</param>
                    /// <param name="criteria" type="String">The quick find criteria.</param>
                    /// <param name="successCallback" type="Function">The function to be called when quick find is invoked successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while invoking quick find.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    url = BBUI.urlConcat(this.baseUrl, "uimodel/UIModelingSearchService.ashx?databaseName=" +
                        euc(this.databaseName) +
                        "&searchListId=" +
                        euc(searchListId) +
                        "&quickFindCriteria=" +
                        euc(criteria));

                    if (this.runAs) {
                        url += "&runAs=" + euc(this.runAs);
                    }

                    return doPost(this, url, null, options);
                },

                checkForDuplicate: function (formSessionId, modelInstanceId, options) {
                    /// <summary>Checks the current values of a data form session's fields to see if there are matching records already in the database.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the data.</param>
                    /// <param name="successCallback" type="Function">The function to be called when duplicates are checked successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while checking for duplicates.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    url = BBUI.urlConcat(this.baseUrl, "uimodel/UIModelingSearchService.ashx?databaseName=" +
                        euc(this.databaseName) +
                        "&formSessionId=" +
                        euc(formSessionId) +
                        "&modelInstanceId=" +
                        euc(modelInstanceId) +
                        "&duplicateCheck=true");

                    if (this.runAs) {
                        url += "&runAs=" + euc(this.runAs);
                    }

                    return doPost(this, url, null, options, formSessionId);
                },

                selectFieldSearchItem: function (formSessionId, modelInstanceId, fieldName, searchFormSessionId, selectedIndex, options) {
                    /// <summary>Selects a search list row to represent the value of the search field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="fieldName" type="String">The name of the search field.</param>
                    /// <param name="searchFormSessionId" type="String">The ID of the search form session that was invoked.</param>
                    /// <param name="selectedIndex" type="Number" integer="true">The zero-based index of the selected search result row.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the row is selected successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while selecting the row.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "selectFieldSearchItem", formSessionId, modelInstanceId, fieldName) +
                        "&searchFormSessionId=" +
                        euc(searchFormSessionId);

                    return doPost(this, url, selectedIndex, options, formSessionId);
                },

                selectFieldSearchItemById: function (formSessionId, modelInstanceId, fieldName, recordId, options) {
                    /// <summary>Selects a search list row to represent the value of the search field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="fieldName" type="String">The name of the search field.</param>
                    /// <param name="recordId" type="String">The ID of the selected record.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the row is selected successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while selecting the row.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "selectFieldSearchItemById", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, recordId, options, formSessionId);
                },

                selectActionSearchItem: function (formSessionId, modelInstanceId, actionName, searchFormSessionId, selectedIndex, options) {
                    /// <summary>Selects a search list row to represent the value of the search field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="actionName" type="String">The name of the search action.</param>
                    /// <param name="searchFormSessionId" type="String">The ID of the search form session that was invoked.</param>
                    /// <param name="selectedIndex" type="Number" integer="true">The zero-based index of the selected search result row.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the row is selected successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while selecting the row.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "selectSearchItemAction", formSessionId, modelInstanceId) +
                        "&actionId=" + actionName +
                        "&searchFormSessionId=" +
                        euc(searchFormSessionId);

                    return doPost(this, url, selectedIndex, options, formSessionId);
                },

                selectActionSearchItemById: function (formSessionId, modelInstanceId, actionName, recordId, options) {
                    /// <summary>Selects a search list row to represent the value of the search field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="actionName" type="String">The name of the search action.</param>
                    /// <param name="searchFormSessionId" type="String">The ID of the search form session that was invoked.</param>
                    /// <param name="recordId" type="String">The ID of the selected record.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the row is selected successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while selecting the row.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "selectSearchItemActionById", formSessionId, modelInstanceId) +
                        "&actionId=" + actionName;

                    return doPost(this, url, recordId, options, formSessionId);
                },

                updateField: function (formSessionId, modelInstanceId, fieldName, value, options) {
                    /// <summary>Updates a field on the form.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and field to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the field to be updated.</param>
                    /// <param name="fieldName" type="String">The name of the field to be updated.</param>
                    /// <param name="value" type="String|Number|Boolean|Object">The field's value.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the field value is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while updating the field value.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "updateField", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, value, options, formSessionId);
                },

                updateMultipleFields: function (formSessionId, modelInstanceId, fieldValues, options) {
                    /// <summary>Updates multiple fields on the form.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and fields to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the fields to be updated.</param>
                    /// <param name="fieldValues" type="Array">An array of object literals each with a "name" and "value" property.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the field values are updated successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while updating the field values.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "updateMultipleFields", formSessionId, modelInstanceId);

                    return doPost(this, url, fieldValues, options, formSessionId);
                },

                updateRelationshipMapFieldProperties: function (formSessionId, modelInstanceId, fieldName, properties, options) {
                    /// <summary>Updates one or more special properties on a relationship map field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and field to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the field to be updated.</param>
                    /// <param name="fieldName" type="String">The name of the field to be updated.</param>
                    /// <param name="properties" type="Array">An array of objects containing a name and value property representing the properties on the relationship map field to update.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the field is updated successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while updating the field.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "updateRelationshipMapFieldProperties", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, properties, options, formSessionId);
                },

                selectTreeViewNode: function (formSessionId, modelInstanceId, fieldName, nodePath, options) {
                    /// <summary>Selects or de-selects the given tree view node.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and field to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the field to be updated.</param>
                    /// <param name="fieldName" type="String">The name of the field to be updated.</param>
                    /// <param name="nodePath" type="String">The fully qualified path of the node to select.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the node is selected successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while selecting the node.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "selectTreeViewNode", formSessionId, modelInstanceId, fieldName) +
                        "&nodePath=" +
                        euc(nodePath);

                    return doPost(this, url, null, options, formSessionId);
                },

                selectTreeViewNodes: function (formSessionId, modelInstanceId, fieldName, nodePaths, options) {
                    /// <summary>Selects or de-selects the given tree view nodes.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and field to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the field to be updated.</param>
                    /// <param name="fieldName" type="String">The name of the field to be updated.</param>
                    /// <param name="nodePaths" type="String">The fully qualified path of each node to select.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the node is selected successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while selecting the node.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "selectTreeViewNodes", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, nodePaths, options, formSessionId);
                },

                setTreeViewNodeExpanded: function (formSessionId, modelInstanceId, fieldName, nodePath, expanded, options) {
                    /// <summary>Sets the expanded property on a tree view node.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and field to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the field to be updated.</param>
                    /// <param name="fieldName" type="String">The name of the field to be updated.</param>
                    /// <param name="nodePath" type="String">The fully qualified path of the node.</param>
                    /// <param name="expanded" type="Boolean">A flag indicating whether the node is expanded.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the expanded property is set successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while setting the expanded property.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "setTreeViewNodeExpanded", formSessionId, modelInstanceId, fieldName) +
                        "&nodePath=" +
                        euc(nodePath) +
                        "&expanded=" +
                        euc(expanded);

                    return doPost(this, url, null, options, formSessionId);
                },

                addCodeTableEntry: function (formSessionId, modelInstanceId, fieldName, codeTableEntryDescription, options) {
                    /// <summary>Adds a code table entry and sets the specified field's value to the new code table entry.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and field to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the field to be updated.</param>
                    /// <param name="fieldName" type="String">The name of the field to be updated.</param>
                    /// <param name="codeTableEntryDescription" type="String|Number|Boolean|Object">The description of the code table entry to add.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the code table entry is added successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while adding the code table entry.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "addCodeTableEntry", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, codeTableEntryDescription, options, formSessionId);
                },

                deleteCollectionItem: function (formSessionId, modelInstanceId, fieldName, itemInstanceId, options) {
                    /// <summary>Deletes an item from a collection field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and field to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the field to be updated.</param>
                    /// <param name="fieldName" type="String">The name of the collection field containing the item to be deleted.</param>
                    /// <param name="itemInstanceId" type="String">The ID of the item to be deleted.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the item is deleted successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while deleting the item.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "deleteCollectionItem", formSessionId, modelInstanceId, fieldName) +
                        "&itemInstanceId=" +
                        euc(itemInstanceId);

                    return doPost(this, url, null, options, formSessionId);
                },

                deleteCollectionItems: function (formSessionId, modelInstanceId, fieldName, itemInstanceIds, options) {
                    /// <summary>Deletes items from a collection field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and field to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the field to be updated.</param>
                    /// <param name="fieldName" type="String">The name of the collection field containing the item to be deleted.</param>
                    /// <param name="itemInstanceIds" type="Array">The items to be deleted.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the item is deleted successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while deleting the item.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "deleteCollectionItems", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, itemInstanceIds, options, formSessionId);
                },

                deleteSelectedCollectionItems: function (formSessionId, modelInstanceId, fieldName, options) {
                    /// <summary>Deletes all selected items from a collection field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and field to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the field to be updated.</param>
                    /// <param name="fieldName" type="String">The name of the collection field containing the item to be deleted.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the items are deleted successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while deleting the items.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "deleteSelectedCollectionItems", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, null, options, formSessionId);
                },

                setCollectionItemSelected: function (formSessionId, modelInstanceId, fieldName, itemInstanceId, selected, options) {
                    /// <summary>Selects or de-selects an item in a collection field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and field to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the field to be updated.</param>
                    /// <param name="fieldName" type="String">The name of the collection field to be updated.</param>
                    /// <param name="itemInstanceId" type="String">The ID of the item.</param>
                    /// <param name="selected" type="Boolean">The selected state of the item.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the item is updated successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while updating the item.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "selectCollectionItem", formSessionId, modelInstanceId, fieldName) +
                        "&itemInstanceId=" +
                        euc(itemInstanceId) +
                        "&selected=" +
                        (selected ? "true" : "false");

                    return doPost(this, url, null, options, formSessionId);
                },

                moveCollectionItem: function (formSessionId, modelInstanceId, fieldName, itemInstanceId, newIndex, options) {
                    /// <summary>Moves an item to a different position in the collection.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and field to be updated.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the field to be updated.</param>
                    /// <param name="fieldName" type="String">The name of the collection field to be updated.</param>
                    /// <param name="itemInstanceId" type="String">The ID of the item to be deleted.</param>
                    /// <param name="newIndex" type="Number" integer="true">The new index (zero-based) for the item.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "moveCollectionItem", formSessionId, modelInstanceId, fieldName) +
                        "&itemInstanceId=" +
                        euc(itemInstanceId) +
                        "&newindex=" +
                        euc(newIndex);

                    return doPost(this, url, null, options, formSessionId);
                },

                confirmForm: function (formSessionId, options) {
                    /// <summary>Saves the form instance on the server.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session to save.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// returnDataFormItem: Flag indicating whether the data form item XML should be returned with the save result.  For backwards compatibility with the Windows ClickOnce shell.
                    /// </param>

                    var url;

                    if (!BBUI.is(options)) {
                        options = {};
                    }

                    url = buildSvcBaseUrl(this, "confirmFormSession", formSessionId);

                    if (options.returnDataFormItem) {
                        url += "&returnDataFormItem=true";
                    }

                    if (options.storeDataFormItem) {
                        url += "&storeDataFormItem=true";
                    }

                    if (options.skipValidate) {
                        url += "&skipValidate=true";
                    }

                    return doPost(this, url, null, options, formSessionId);
                },

                cancelSession: function (formSessionId, overrideDirty, options) {
                    /// <summary>Cancels the form instance on the server and removes it from the session.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session to cancel.</param>
                    /// <param name="overrideDirty" type="Boolean">Flag indicating whether to cancel the form even if its values have changed since it was created.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url;

                    url = buildSvcBaseUrl(this, "closeFormSession", formSessionId);
                    url += "&canceling=true";

                    if (overrideDirty) {
                        url += "&overridedirty=true";
                    }

                    return doPost(this, url, null, options, formSessionId);
                },

                handlePrompt: function (formSessionId, modelInstanceId, promptId, response, options) {
                    /// <summary>Sends a response to a prompt to the server.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that caused the prompt.</param>
                    /// <param name="modelInstanceId" type="String">ID of the model instance that caused the prompt.</param>
                    /// <param name="promptId" type="String">The ID of the prompt being responded to.</param>
                    /// <param name="response" type="String|Number|Boolean|Object">The prompt response.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "handlePrompt", formSessionId, modelInstanceId) +
                        "&promptId=" +
                        euc(promptId);

                    return doPost(this, url, response, options, formSessionId);
                },

                invokeAction: function (formSessionId, modelInstanceId, actionName, options) {
                    /// <summary>Invokes an action on the server.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the action.</param>
                    /// <param name="modelInstanceId" type="String">ID of the model instance that contains the action.</param>
                    /// <param name="actionName" type="String">Name of the action to invoke.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the action is executed successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while executing the action.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var data,
                        url;

                    url = buildSvcBaseUrl(this, "invokeAction", formSessionId, modelInstanceId) +
                        "&actionId=" +
                        euc(actionName);

                    if (options) {
                        if (options.parameters || options.defaultValues) {
                            data = {};
                            if (options.parameters) {
                                data.parameters = options.parameters;
                            }
                            if (options.defaultValues) {
                                data.defaultValues = options.defaultValues;
                            }
                        }
                        if (options.cancelId) { 
                            url += "&cancelId=" + euc(options.cancelId);
                        }
                    } else {
                        data = null;
                    }

                    return doPost(this, url, data, options, formSessionId);
                },

                confirmFormAction: function (formSessionId, modelInstanceId, actionName, confirmFormSessionId, options) {
                    /// <summary>Confirms a child form that was shown as a result of a form action.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session.</param>
                    /// <param name="modelInstanceId" type="String">The ID model that invoked the action.</param>
                    /// <param name="actionName" type="String">Name of the invoked action.</param>
                    /// <param name="confirmFormSessionId" type="String">The ID of the child form session.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "confirmFormAction", formSessionId, modelInstanceId) +
                        "&actionId=" +
                        euc(actionName) +
                        "&confirmFormSessionId=" +
                        euc(confirmFormSessionId);

                    return doPost(this, url, null, options, formSessionId);
                },

                cancelFormAction: function (formSessionId, modelInstanceId, actionName, options) {
                    /// <summary>Cancels a child form that was shown as a result of a form action.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session.</param>
                    /// <param name="modelInstanceId" type="String">The ID model that invoked the action.</param>
                    /// <param name="actionName" type="String">Name of the invoked action.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>
                    var url = buildSvcBaseUrl(this, "cancelFormAction", formSessionId, modelInstanceId) +
                        "&actionId=" +
                        euc(actionName);

                    return doPost(this, url, null, options, formSessionId);

                },

                notifyFormHidden: function (formSessionId, options) {
                    /// <summary>Server side notification that a close form request is being made.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>
                    var url = buildSvcBaseUrl(this, "notifyFormHidden", formSessionId);

                    return doPost(this, url, null, options, formSessionId);
                },

                notifyFormShown: function (formSessionId, options) {
                    /// <summary>Server side notification that a close form request is being made.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is created successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while creating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>
                    var url = buildSvcBaseUrl(this, "notifyFormShown", formSessionId);

                    return doPost(this, url, null, options, formSessionId);
                },

                invokeCollectionPageChange: function (formSessionId, modelInstanceId, fieldName, start, options) {
                    /// <summary>Selects a search list row to represent the value of the search field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="start" type="String">The starting row which is being requested.  Start + paging size number of rows should be returned.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the row is selected successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while selecting the row.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "invokeCollectionPageChange", formSessionId, modelInstanceId, fieldName) +
                        "&start=" + start;

                    return doPost(this, url, null, options, formSessionId);
                },

                invokeCollectionSelectionUpdate: function (formSessionId, modelInstanceId, fieldName, selectionData, options) {
                    /// <summary>Selects a search list row to represent the value of the search field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="selectionData" type="Object">The selection data to be sent to the server. Conforms to the CollectionSelectionModel contract.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the row is selected successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while selecting the row.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "collectionSelectionUpdate", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, selectionData, options, formSessionId);
                },

                invokeCollectionSpecialAction: function (formSessionId, modelInstanceId, fieldName, actionName, options) {
                    /// <summary>Selects a search list row to represent the value of the search field.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="actionName" type="String">The grid field special action name.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the row is selected successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while selecting the row.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "invokeCollectionSpecialAction", formSessionId, modelInstanceId, fieldName) +
                        "&actionname=" + actionName;

                    return doPost(this, url, null, options, formSessionId);
                },

                invokeFileChanged: function (formSessionId, modelInstanceId, fieldName, fileName, options) {
                    /// <summary>Notifies the UIModel that a file has been selected in the file picker dialog.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="fileName" type="String">The name of the newly selected file.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the row is selected successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while selecting the row.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "selectFile", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, fileName, options, formSessionId);
                },

                cancelAction: function (formSessionId, modelInstanceId, fieldId, cancelId, sucessCallback, failureCallback, options) {
                    /// <summary>Cancels an action on the server.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the model and search field.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the model instance containing the search field.</param>
                    /// <param name="cancelId" type="String">Uniquely identifies the running action on the server.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the row is selected successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while selecting the row.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "cancelAction", formSessionId, modelInstanceId, fieldId) +
                        "&cancelId=" + euc(cancelId);

                    // Cancelling an action means that an action is currently in process which would ordinarily force this request onto
                    // the event queue. Bypass it. 
                    options = options || {};
                    options.bypassQueue = true;
                    return doPost(this, url, null, sucessCallback, failureCallback, options, formSessionId);
                },

                getFieldDataSourceUrl: function (formSessionId, modelInstanceId, fieldName) {
                    return buildSvcBaseUrl(this, "getFieldDataSource", formSessionId, modelInstanceId, fieldName);
                },

                getFieldDataSource: function (formSessionId, modelInstanceId, fieldName, options) {
                    var url = buildSvcBaseUrl(this, "getFieldDataSource", formSessionId, modelInstanceId, fieldName);
                    return doGet(this, url, options, formSessionId);
                },

                getFieldImageUrl: function (formSessionId, modelInstanceId, fieldName) {
                    return buildSvcBaseUrl(this, "getFieldImage", formSessionId, modelInstanceId, fieldName);
                },

                getFieldFileUrl: function (formSessionId, modelInstanceId, fieldName, options) {
                    var url;

                    url = buildSvcBaseUrl(this, "getFieldFile", formSessionId, modelInstanceId, fieldName);

                    if (options && options.fileName) {
                        url += "&fileName=" + euc(options.fileName);
                    }

                    return url;
                },

                getCustomFileUrl: function (formSessionId, modelInstanceId, key, fileName) {
                    var url;

                    url = buildSvcBaseUrl(this, "getCustomFile", formSessionId, modelInstanceId) +
                        "&key=" +
                        euc(key) +
                        "&fileName=" + euc(fileName);

                    return url;
                },

                getUploadFieldImageUrl: function (formSessionId, modelInstanceId, fieldName, thumbnailFieldName) {
                    var url;

                    url = buildSvcBaseUrl(this, "uploadFieldImage", formSessionId, modelInstanceId, fieldName);

                    if (thumbnailFieldName) {
                        url += "&thumbnailFieldId=" + euc(thumbnailFieldName);
                    }

                    return url;
                },

                getUploadFieldFileUrl: function (fieldName, fileUploadKey, useChunkingUrl) {
                    /// <summary>Gets the upload url for a file field.</summary>
                    /// <param name="fieldName" type="String">The name of the file field.</param>
                    /// <param name="fileUploadKey" type="String">A unique ID to identify this upload instance.</param>
                    /// <param name="useChunkingUrl" type="Boolean">Whether or not to return a base url that can be used for breaking up a file into multiple smaller uploads.</param>

                    var url;

                    useChunkingUrl = useChunkingUrl || false;

                    url = BBUI.urlConcat(this.baseUrl, "Upload/FileUpload.ashx?DBName=" +
                        euc(this.databaseName) +
                        "&FieldID=" +
                        euc(fieldName) +
                        "&FileUploadKey=" +
                        euc(fileUploadKey) +
                        (useChunkingUrl === true ? "" : "&InitialRequest=true"));

                    if (this.runAs) {
                        url += "&runAs=" + euc(this.runAs);
                    }

                    return url;
                },

                createSearchListAddFormSession: function (dataFormSessionId,
                    dataFormModelInstanceId,
                    dataFormFieldName,
                    searchFormSessionId,
                    searchModelInstanceId,
                    dataFormInstanceId,
                    options) {

                    var url = buildSvcBaseUrl(this, "searchListAddFormInvoke", dataFormSessionId, dataFormModelInstanceId, dataFormFieldName) +
                        "&dataFormInstanceId=" + euc(dataFormInstanceId) +
                        "&searchFormSessionId=" + euc(searchFormSessionId) +
                        "&searchModelInstanceId=" + euc(searchModelInstanceId);

                    return doPost(this, url, null, options, dataFormSessionId);
                },

                createSearchListActionAddFormSession: function (dataFormSessionId,
                    dataFormModelInstanceId,
                    dataFormActionName,
                    searchFormSessionId,
                    searchModelInstanceId,
                    dataFormInstanceId,
                    options) {

                    var url = buildSvcBaseUrl(this, "actionSearchListAddFormInvoke", dataFormSessionId, dataFormModelInstanceId) +
                        "&actionId=" + euc(dataFormActionName) +
                        "&dataFormInstanceId=" + euc(dataFormInstanceId) +
                        "&searchFormSessionId=" + euc(searchFormSessionId) +
                        "&searchModelInstanceId=" + euc(searchModelInstanceId);

                    return doPost(this, url, null, options, dataFormSessionId);
                },

                confirmSearchListAddForm: function (formSessionId,
                    modelInstanceId,
                    fieldName,
                    confirmFormSessionId,
                    ignoreConcurrency,
                    options) {

                    var url = buildSvcBaseUrl(this, "searchListAddFormConfirm", formSessionId, modelInstanceId, fieldName) +
                        "&confirmFormSessionId=" + euc(confirmFormSessionId) +
                        "&ignoreConcurrency=" + euc(ignoreConcurrency);

                    return doPost(this, url, null, options, formSessionId);
                },

                confirmSearchListActionAddForm: function (formSessionId,
                    modelInstanceId,
                    actionName,
                    confirmFormSessionId,
                    ignoreConcurrency,
                    options) {

                    var url = buildSvcBaseUrl(this, "actionSearchListAddFormConfirm", formSessionId, modelInstanceId) +
                        "&actionId=" + euc(actionName) +
                        "&confirmFormSessionId=" + euc(confirmFormSessionId) +
                        "&ignoreConcurrency=" + euc(ignoreConcurrency);

                    return doPost(this, url, null, options, formSessionId);
                },

                confirmSearchListAddQuery: function (formSessionId, modelInstanceId, fieldName, queryInstanceId, selectionId, options) {
                    var url = buildSvcBaseUrl(this, "searchListAddQueryConfirm", formSessionId, modelInstanceId) +
                        "&fieldId=" +
                        euc(fieldName) +
                        "&queryInstanceId=" +
                        euc(queryInstanceId) +
                        "&selectionId=" +
                        euc(selectionId);

                    return doPost(this, url, null, options, formSessionId);
                },

                confirmQueryAction: function (formSessionId, modelInstanceId, actionName, queryInstanceId, selectionId, options, queryType) {
                    var url = buildSvcBaseUrl(this, "confirmQueryAction", formSessionId, modelInstanceId) +
                        "&actionId=" +
                        euc(actionName) +
                        "&queryInstanceId=" +
                        euc(queryInstanceId) +
                        "&selectionId=" +
                        euc(selectionId) +
                        "&queryType=" +
                        euc(queryType);

                    return doPost(this, url, null, options, formSessionId);
                },

                confirmSearchListAddExportDefinition: function (formSessionId, modelInstanceId, fieldName, exportDefinitionId, options) {
                    var url = buildSvcBaseUrl(this, "searchListAddExportDefinitionConfirm", formSessionId, modelInstanceId) +
                        "&fieldId=" +
                        euc(fieldName) +
                        "&exportDefinitionId=" +
                        euc(exportDefinitionId);

                    return doPost(this, url, null, options, formSessionId);
                },

                confirmExportDefinitionAction: function (formSessionId, modelInstanceId, actionName, exportDefinitionId, options) {
                    var url = buildSvcBaseUrl(this, "confirmExportDefinitionAction", formSessionId, modelInstanceId) +
                        "&actionId=" +
                        euc(actionName) +
                        "&exportDefinitionId=" +
                        euc(exportDefinitionId);

                    return doPost(this, url, null, options, formSessionId);
                },

                resetFormSession: function (formSessionId, modelInstanceId, options) {
                    /// <summary>Resets the values in the form instance.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the form instance.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the form model.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the reset is executed successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while executing the reset.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    if (!options) {
                        options = {};
                    }

                    var url = buildSvcBaseUrl(this, "resetFormSession", formSessionId, modelInstanceId);

                    return doPost(this, url, null, options, formSessionId);
                },

                refreshFormSession: function (formSessionId, modelInstanceId, options) {
                    /// <summary>Refreshes the form with the latest data.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the form instance.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the form model.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the request is executed successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while executing the request.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    if (!options) {
                        options = {};
                    }

                    var url = buildSvcBaseUrl(this, "refreshFormSession", formSessionId, modelInstanceId);

                    return doPost(this, url, null, options, formSessionId);
                },

                selectDuplicateRecord: function (formSessionId, modelInstanceId, recordId, options) {
                    /// <summary>Notifies the server that a duplicate record has been selected in the context of a form session instead of creating a new record.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session that contains the form instance.</param>
                    /// <param name="modelInstanceId" type="String">The ID of the form model.</param>
                    /// <param name="recordId" type="String">The ID of the duplicate record.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the reset is executed successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while executing the reset.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "selectDuplicateRecord", formSessionId, modelInstanceId) +
                        "&selectedRecordId=" + euc(recordId);

                    return doPost(this, url, null, options, formSessionId);
                },

                startBusinessProcess: function (businessProcessId, parameterSetId, dataFormItemKey, options) {
                    /// <summary>Starts a business process on the server with the information contained in the form session.</summary>
                    /// <param name="businessProcessId" type="String">The ID of the business process to start.</param>
                    /// <param name="parameterSetId" type="String">The ID of the parameter set for the business process.</param>
                    /// <param name="dataFormItemKey" type="String">The key of the data form item stored on the server.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the business process finishes execution.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while starting the business process.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url,
                        data,
                        businessProcessStatusId;

                    options = options || {};

                    businessProcessStatusId = options.businessProcessStatusId;

                    url = this.buildStartBusinessProcessUrl(businessProcessId, parameterSetId, dataFormItemKey, businessProcessStatusId);

                    if (!dataFormItemKey && options.values) {
                        data = {
                            values: options.values
                        };
                    }

                    return doPost(this, url, data, options);
                },

                selectDuplicateRecordAction: function (formSessionId, modelInstanceId, actionName, duplicateFormSessionId, recordId, options) {
                    var url = buildSvcBaseUrl(this, "selectDuplicateRecordAction", formSessionId, modelInstanceId) +
                        "&duplicateFormSessionId=" + euc(duplicateFormSessionId) +
                        "&actionId=" + euc(actionName) +
                        "&selectedRecordId=" + euc(recordId);

                    return doPost(this, url, null, options, formSessionId);
                },

                invokeRelationshipMapNodeAction: function (formSessionId, modelInstanceId, fieldId, nodeId, actionName, options) {
                    var url = buildSvcBaseUrl(this, "relationshipMapNodeInvokeAction", formSessionId, modelInstanceId, fieldId) +
                        "&nodeId=" + euc(nodeId) +
                        "&actionName=" + euc(actionName);

                    return doPost(this, url, null, options, formSessionId);
                },

                buildReportHostUrl: function (reportId, options) {
                    var i,
                        n,
                        parameter,
                        url;

                    url = BBUI.urlConcat(this.baseUrl, "uimodel/ReportHost.aspx?databaseName=") +
                        euc(this.databaseName) +
                        "&reportId=" +
                        euc(reportId);

                    options = options || {};

                    if (options.historyId) {
                        url += "&historyId=" + euc(options.historyId);
                    }

                    if (options.formSessionId) {
                        url += "&formSessionId=" + euc(options.formSessionId);
                    }

                    if (options.modelInstanceId) {
                        url += "&modelInstanceId=" + euc(options.modelInstanceId);
                    }

                    if (BBUI.is(options.showToolbar)) {
                        url += "&showToolbar=" + euc(options.showToolbar);
                    }

                    if (BBUI.is(options.runAs)) {
                        url += "&runAs=" + euc(options.runAs);
                    }

                    if (options.showParameterPrompts) {
                        url += "&showParameterPrompts=true";
                    }

                    if (options.showPromptAreaButton) {
                        url += "&showPromptAreaButton=true";
                    }

                    if (options.displayPromptArea) {
                        url += "&displayPromptArea=" + euc(options.displayPromptArea);
                    }

                    url += BBUI.arrayToQueryString(options.parameters, "p_", true);

                    return url;
                },

                validateFormSession: function (formSessionId, options) {
                    /// <summary>Performs validation on a form session.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session to validate.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is validated successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while validating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url,
                        svc;

                    url = buildSvcBaseUrl(this, "validateformsession", formSessionId);

                    return doPost(this, url, null, options, formSessionId);
                },

                removeFromQueue: function (formSessionId, modelInstanceId, options) {
                    var i,
                        n,
                        event,
                        eventQueue,
                        queue;

                    if (!this._formSessionQueue) {
                        return;
                    }

                    queue = this._formSessionQueue[formSessionId];

                    if (queue && queue.eventQueue && queue.eventQueue.length) {
                        eventQueue = queue.eventQueue;
                        for (i = 0, n = eventQueue.length; i < n; ++i) {
                            // find the url connection string in this entity, and attempt match. It is always at [2]
                            event = eventQueue[i][2].toLowerCase();

                            if (!(options.action && event.indexOf(options.action.toLowerCase()) === -1) &&
                                    !(options.fieldName && event.indexOf(options.fieldName.toLowerCase()) === -1)) {
                                eventQueue.splice(i, 1);
                                break;
                            }
                        }
                    }
                },

                getFormSessionDataFormItemXml: function (formSessionId, modelInstanceId, options) {
                    /// <summary>returns dataform item for a given form session and model instance.</summary>
                    /// <param name="formSessionId" type="String">The ID of the form session to validate.</param>
                    /// <param name="successCallback" type="Function">The function to be called when the form is validated successfully.  The result object will be passed as the first parameter to the function.</param>
                    /// <param name="failureCallback" type="Function">The function to be called when an error occurs while validating the form.  The original HTTP request will be passed as the first parameter to the function, and the error message will be passed as the second parameter.</param>
                    /// <param name="options" type="Object">
                    /// An object literal that may contain any of the following properties:
                    /// scope: The scope in which the callback methods will be called.  Default is the current instance of BBUI.uimodeling.Service.
                    /// async: Flag indicating whether the call to the web server should be asynchronous.  Default is true.
                    /// </param>

                    var url = buildSvcBaseUrl(this, "getFormSessionDataFormItemXml", formSessionId, modelInstanceId);

                    return doGet(this, url, options, formSessionId);
                },

                reportActionFormSaved: function (formSessionId, modelInstanceId, actionName, options) {

                    var url = buildSvcBaseUrl(this, "reportActionFormSaved", formSessionId, modelInstanceId) +
                        "&actionId=" + euc(actionName);

                    return doPost(this, url, null, options, formSessionId);
                },

                clearParameterDetail: function (formSessionId, modelInstanceId, parameterDetailName, options) {
                    var url;

                    url = buildSvcBaseUrl(this, "clearParameterDetail") +
                        "&formSessionId=" + euc(formSessionId) +
                        "&modelInstanceId=" + euc(modelInstanceId) +
                        "&parameterDetailName=" + euc(parameterDetailName);

                    return doPost(this, url, null, options, formSessionId);
                },

                cancelAsyncOperation: function (cancelId, options) {

                    var url = BBUI.urlConcat(this.baseUrl, "uimodel/UIModelingCancelAsyncOperation.ashx?databaseName=") +
                        euc(this.databaseName) +
                        "&cancelId=" +
                        euc(cancelId);

                    return doGet(this, url, options);
                }
            };            
            
            return {
                create: function (baseUrl, databaseName, options) {
                    var svc;
                    
                    baseUrl = baseUrl || bbuiUIModelingServiceConfig.baseUrl;
                    databaseName = databaseName || bbuiUIModelingServiceConfig.databaseName;
                    
                    if (baseUrl === null || !databaseName) {
                        throw new Error('You must either provide a baseUrl and databaseName as parameters or set them globally using bbuiShellServiceConfig.');
                    }
                    
                    svc = new Service(baseUrl, databaseName, options);
                    svc.$http = $http;
                    
                    return svc;
                }
            };
        }]);

}(this));

//# sourceMappingURL=bbui.js.map