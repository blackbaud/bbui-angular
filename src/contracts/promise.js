// Add any documentation tags that do not belong elsewhere here.

/**
 * @class promise
 *
 * See <a href="https://docs.angularjs.org/api/ng/service/$q">$q</a>.
 *
 * Here is an example of how to use {@link bbui.shellservice.bbuiShellService.Service#dataListLoad dataListLoad} with promises:
 *
 * <pre><code>
(function () {
    'use strict';

    angular.module("custom", ["bbui"])
    .factory("myfactory", ["bbuiShellServiceConfig", "bbuiShellService",
        function (bbuiShellServiceConfig, bbuiShellService) {

            var svc,
                DATALIST_ID = "f1cf0b14-8f4e-48c8-9ecb-ddfcb1b5679d",
                contextRecordId = "748e4ed3-a0c3-4a87-a363-572e20121c91";

            function getListResultsAsync(successCallback, failureCallback, finallyCallback) {

                successCallback = successCallback || function () { };
                failureCallback = failureCallback || function () { };
                finallyCallback = finallyCallback || function () { };

                svc = bbuiShellService.create();

                svc.dataListLoad(
                    DATALIST_ID,
                    contextRecordId,
                    {
                        parameters: [
                            {
                                name: "MYBOOLEANPARAM",
                                value: true
                            }
                        ]
                    }
                ).then(function (response) {
                    successCallback(response.data);
                }, function (response) {
                    // The list failed to load for some reason. Maybe insufficient rights.
                    failureCallback(response);
                })
                .finally(function () {
                    finallyCallback();
                });

            }

            return {
                getListResultsAsync: getListResultsAsync
            };

        }]);

}());

 * </code></pre>
 *
 */




/*

(function () {
    'use strict';

    angular.module("custom", ["bbui"])
    .factory("myfactory", ["bbuiShellServiceConfig", "bbuiShellService",
        function (bbuiShellServiceConfig, bbuiShellService) {

            var authenticateSuccessCallback,
                authenticateFailureCallback,
                authenticateFinallyCallback,
                svc,
                FORMS_AUTH_HEADER = "X-BB-FormsAuth",
                DATALIST_ID = "f1cf0b14-8f4e-48c8-9ecb-ddfcb1b5679d";

            function getDatabaseName() {
                return bbuiShellServiceConfig.databaseName;
            }

            function initialize() {

                bbuiShellServiceConfig.baseUrl = "/bbappfx";
                bbuiShellServiceConfig.databaseName = "BBInfinity";

            }

            function getWebShellLoginUrl(databaseName, status) {

                var url,
                    redirectUrl = window.location.href;

                url = "/" + bbuiShellServiceConfig.baseUrl + "/webui/WebShellLogin.aspx?databaseName=" + euc(databaseName);

                url += "&url=" + euc(redirectUrl);

                if (status) {
                    url += "&status=" + euc(status);
                }

                return url;
            }

            function sessionStartSuccess(reply) {
                authenticateSuccessCallback(reply.data);
                authenticateFinallyCallback();
            }

            function sessionStartFailure(data, status, headers) {

                var redirectUrl;

                // Unauthorized (401)
                // NotFound (404) implies WSFederation Authenticated but unable to match to AppUser
                if ((status === 401) || (status === 404)) {

                    // Forms authentication is configured on the server.  Redirect to the login page.
                    redirectUrl = getWebShellLoginUrl(svc.databaseName, headers(FORMS_AUTH_HEADER));
                    window.location.replace(redirectUrl);
                    authenticateFinallyCallback();
                    // Don't call failure callback because we're just redirecting anyway.
                } else {
                    // Not totally sure what the response object looks like with non-401 error codes.
                    // I think this should get the user something that is mildly helpful.
                    if (!data || !data.message) {
                        data = {
                            message: data
                        };
                    }
                    authenticateFailureCallback(data);
                    authenticateFinallyCallback();
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

                authenticateSuccessCallback = successCallback || function () { };
                authenticateFailureCallback = failureCallback || function () { };
                authenticateFinallyCallback = finallyCallback || function () { };

                var httpHeaders = {};

                // Add a custom HTTP header to all requests so the server will send back a 401 response without a challenge
                // header when the user logs in unsuccessfully.  This will keep the user from being prompted for credentials
                // by the browser.
                httpHeaders[FORMS_AUTH_HEADER] = "true";

                svc = bbuiShellService.create(null, null, {
                    httpHeaders: httpHeaders
                });

                startSession();

            }

            function getListResultsAsync(successCallback, failureCallback, finallyCallback) {

                successCallback = successCallback || function () { };
                failureCallback = failureCallback || function () { };
                finallyCallback = finallyCallback || function () { };

                svc = bbuiShellService.create();

                svc.dataListLoad(
                    DATALIST_ID,
                    contextRecordId,
                    {
                        parameters: [
                            {
                                name: "MYBOOLEANPARAM",
                                value: true
                            }
                        ]
                    }
                ).then(function (response) {
                    successCallback(response.data);
                }, function (response) {
                    // The list failed to load for some reason. Maybe insufficient rights.
                    failureCallback(response);
                })
                .finally(function () {
                    finallyCallback();
                });

            }

            return {
                getDatabaseName: getDatabaseName,
                initialize: initialize,
                authenticateAsync: authenticateAsync,
                getListResultsAsync: getListResultsAsync
            };

        }]);

}());
*/