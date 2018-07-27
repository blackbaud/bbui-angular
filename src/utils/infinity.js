/*jshint browser: true */
/*global angular, console */

(function () {
    'use strict';

    angular.module("infinity.util")
    .factory("infinityUtilities", ["mockableUtilities", "bbMoment", 'bbuiShellServiceConfig', 'browserUtilities', 
    function (mockableUtilities, bbMoment, bbuiShellServiceConfig, browserUtilities) {

        var euc = encodeURIComponent,
            initialized = false,
            rootFolder,
            isCustomApp,
            GUID_EMPTY = '00000000-0000-0000-0000-000000000000';

        function initialize(rootFolderName, isCustom) {
            rootFolder = rootFolderName;
            isCustomApp = isCustom;
            initialized = true;
            bbuiShellServiceConfig.baseUrl = "/" + getVirtualDirectory();
            bbuiShellServiceConfig.databaseName = browserUtilities.getQueryStringParameters().databasename;
        }

        /**
         * Get the virtual directory name.
         *
         * @return {String}
         */
        function getVirtualDirectory() {

            var parser,
                path;

            if (!initialized) {
                console.error('getVirtualDirectory called before initialized');
            }

            parser = document.createElement('a');
            parser.href = mockableUtilities.getWindowLocation().href;

            path = parser.pathname; // i.e. /bbappfx/sky/frog/index.html

            path = path.substring(0, path.indexOf((isCustomApp ? '/browser/htmlforms/custom/' : '/sky/') + rootFolder));

            if (path[0] === "/") {
                path = path.substring(1);
            }

            return path;

        }

        function getDatabaseName() {
            return bbuiShellServiceConfig.databaseName;
        }

        /**
         * Get the Infinity login URL.
         *
         * @param {String} databaseName
         */
        function getWebShellLoginUrl(databaseName, status) {

            var url,
                redirectUrl;

            if (!initialized) {
                console.error('getWebShellLoginUrl called before initialized');
            }

            redirectUrl = mockableUtilities.getWindowLocation().href;

            url = "/" + getVirtualDirectory() + "/webui/WebShellLogin.aspx?databaseName=" + euc(databaseName);

            url += "&url=" + euc(redirectUrl);

            if (status) {
                url += "&status=" + euc(status);
            }

            return url;
        }

        /**
         * Convert a Blackbaud.AppFx.HourMinute to a readable string.
         *
         * @param {String} hourMinute
         *
         * @return {String}
         * The formatted time, such as "2:00 PM".
         */
        function convertHourMinute(hourMinute) {

            var result = "",
                time,
                hour,
                minute;

            if (hourMinute && typeof hourMinute === "string" &&
                hourMinute.length === 4 && hourMinute !== "    ") {

                hour = parseInt(hourMinute.substring(0, 2));
                minute = parseInt(hourMinute.substring(2, 4));

                time = bbMoment({ hour: hour, minute: minute });
                result = time.format("LT");

            }

            return result;

        }

        function toUpperIdOrNullIfEmpty(id) {
            if (!id || id === GUID_EMPTY) {
                return null;
            }
    
            return id.toUpperCase();
        }

        // Using this function in order to keep from accidentally modifying
        // an options object passed into a function.
        function cloneOrNew(bbui, options) {
            if (options) {
                return bbui.clone(options);
            }

            return {};
        }

        return {
            initialize: initialize,
            getVirtualDirectory: getVirtualDirectory,
            getDatabaseName: getDatabaseName,
            getWebShellLoginUrl: getWebShellLoginUrl,
            convertHourMinute: convertHourMinute,
            toUpperIdOrNullIfEmpty: toUpperIdOrNullIfEmpty,
            cloneOrNew: cloneOrNew,
            configuration: {
                isCustomApp: isCustomApp
            }
        };

    }])

    .factory("infinityAuth", ["infinityUtilities", "browserUtilities", "bbuiShellService", "$q", "$location",
    function (infinityUtilities, browserUtilities, bbuiShellService, $q, $location) {

        var svc,
            authenticateSuccessCallback,
            authenticateFailureCallback,
            authenticateFinallyCallback,
            FORMS_AUTH_HEADER = "X-BB-FormsAuth",
            noop = angular.noop,
            euc = encodeURIComponent;

        function sessionStartSuccess(reply) {
            authenticateSuccessCallback(reply.data);
            authenticateFinallyCallback();
        }

        function sessionStartFailure(data, status, headers) {

            var //formsAuthInUse,
                redirectUrl;
            //wsFederationEnabled,
            //authHeader,
            //isBearerAuthenticated,
            //homePageUrl;

            //homePageUrl = BBUI.urlConcat(svc.baseUrl, "browser/Default.aspx");
            //homePageUrl += "?DatabaseName=" + encodeURIComponent(svc.databaseName);

            //wsFederationEnabled = false;

            //When using Federated Authentication, there may be a "Bearer" WWW-Authenticate header;
            //But if the session start failed, all we can do is display the error on the login/migration form
            //formsAuthInUse = (!authHeader || isBearerAuthenticated) || wsFederationEnabled;

            // Unauthorized (401)
            // NotFound (404) implies WSFederation Authenticated but unable to match to AppUser
            if ((status === 401) || (status === 404)) {

                //if (formsAuthInUse) {
                // Forms authentication is configured on the server.  Redirect to the login page.
                redirectUrl = infinityUtilities.getWebShellLoginUrl(svc.databaseName, headers(FORMS_AUTH_HEADER));
                //} else {
                //    // Basic authentication is enabled and the user probably canceled the browser's
                //    // credentials prompt.  Redirect to the start page.
                //    redirectUrl = homePageUrl;
                //}
                browserUtilities.redirect(redirectUrl);
                authenticateFinallyCallback();
                // Don't call failure callback because we're just redirecting anyway.
            } else {
                // Unsure what the response object looks like with non-401 error codes.
                // I think this should get the user something that is possibly helpful.
                if (!data || !data.message) {
                    data = {
                        message: data
                    };
                }
                authenticateFailureCallback(data);
                authenticateFinallyCallback();
                //$(document.body).html(Res.getEncodedString("Viewport_NavigationLoadFail", false, error.message));
            }

        }

        function startSession() {

            // Need to save HTTP object since we need to do both .then and .error,
            // which are not supported together.
            var http = svc.sessionStart();

            http.then(sessionStartSuccess);

            http.error(sessionStartFailure);

        }

        function authenticateAsync(successCallback, failureCallback, finallyCallback) {

            var httpHeaders = {};

            authenticateSuccessCallback = successCallback || noop;
            authenticateFailureCallback = failureCallback || noop;
            authenticateFinallyCallback = finallyCallback || noop;

            // Add a custom HTTP header to all requests so the server will send back a 401 response without a challenge
            // header when the user logs in unsuccessfully.  This will keep the user from being prompted for credentials
            // by the browser.
            httpHeaders[FORMS_AUTH_HEADER] = "true";

            try {

                svc = bbuiShellService.create(null, null, {
                    httpHeaders: httpHeaders
                });

                startSession();

            } catch (ex) {
                failureCallback(ex);
                finallyCallback();
            }

        }

        /**
         * @returns {Promise<Boolean>}
         * True if the logout was successful.
         * Unsuccessful logout typically means
         * the user is not using custom authentication.
         */
        function logoutAsync() {
            return bbuiShellService
                .create()
                .logout()
                .then(function (reply) {
                    return reply.data;
                }, function (reply) {
                    var error = { message: "" };

                    if (reply && reply.data && reply.data.message) {
                        error.message = reply.data.message;
                    }

                    $q.reject(error);
                });
        }

        /**
         * Get any `$httpProvider` interceptors necessary for authentication.
         */
        function getAuthInterceptors() {
            return [
                function () {
                    return {
                        "responseError": function (response) {
                            var redirectUrl,
                                status = response.status,
                                FORMS_AUTH_HEADER = "X-BB-FormsAuth";
                
                            if (status === 401 || status === 404) {
                                redirectUrl = infinityUtilities.getWebShellLoginUrl(browserUtilities.getQueryStringParameters().databasename,
                                                                  response.headers(FORMS_AUTH_HEADER));
                                browserUtilities.redirect(redirectUrl);
                            }
                
                            return $q.reject(response);
                        }
                    };
                }
            ];
        }

        function afterLogout(logoutWasSuccessful) {
            var url;
            
            if (logoutWasSuccessful) {
                
                url = (infinityUtilities.configuration.isCustomApp ? '../' : '') + "../../webui/WebShellLogin.aspx?databaseName=" + euc(infinityUtilities.getDatabaseName());
                url += "&url=" + euc($location.absUrl()) + "&status=inactive";

                // $location.replace() doesn't seem to work here so using window.location.replace directly
                // Using replace keeps the login screen from showing up in the browser history.
                window.location.replace(url);
            } else {
                console.log("The user was not logged out.  This is likely because custom authentication was not used, or the user was logged out by another tab.");
            } 
        }

        return {
            authenticateAsync: authenticateAsync,
            logoutAsync: logoutAsync,
            getAuthInterceptors: getAuthInterceptors,
            afterLogout: afterLogout
        };

    }])

    .factory("infinityCache", ["$cacheFactory", function ($cacheFactory) {

        var cache;

        cache = $cacheFactory.get('bbcrm');
        if (!cache) {
            cache = $cacheFactory('bbcrm');
        }

        return {
            cache: cache
        };

    }])

    .factory("infinityProduct", ["bbui", "bbuiShellService", "infinityCache", "$q", 
    function (bbui, bbuiShellService, infinityCache, $q) {
        var infinityProduct,
            svc;

        infinityProduct = {
            productIsInstalledAsync: productIsInstalledAsync
        };

        return infinityProduct;

        /**
         * Checks if a given product is installed.
         * If the request fails, the error message will exist in the message property of the result.
         * @param {String} productId
         * @returns {Promise<Boolean>} true if the product is installed
         */
        function productIsInstalledAsync(productId) {
            var InstalledProductsMobileDataListId = "c495bc28-db3a-48dc-a980-259b0a0b08c1",
                cacheKey = "dataListLoad-" + InstalledProductsMobileDataListId,
                cacheResult;

            if (!productId || typeof productId !== "string") {
                return $q.reject({ message: "productId is required." });
            }

            productId = productId.toUpperCase();
            cacheResult = infinityCache.cache.get(cacheKey);

            if (cacheResult) {
                return $q.resolve(cacheResult.installedProducts.indexOf(productId) !== -1);
            }

            svc = bbuiShellService.create();

            return svc.dataListLoad(InstalledProductsMobileDataListId)
                .then(function (reply) {
                    var i,
                        n,
                        rows = reply.data.rows,
                        data,
                        installedProducts = [];

                    data = {
                        installedProducts: installedProducts
                    };

                    for (i = 0, n = rows.length; i < n; ++i) {
                        installedProducts.push(rows[i].values[0].toUpperCase());
                    }

                    infinityCache.cache.put(cacheKey, bbui.clone(data));
                    return installedProducts.indexOf(productId) !== -1;
                }, function (reply) {
                    var result = {};

                    if (reply && reply.data && reply.data.message) {
                        result.message = reply.data.message;
                    }

                    return $q.reject(result);
                });
        }
    }]);

}());