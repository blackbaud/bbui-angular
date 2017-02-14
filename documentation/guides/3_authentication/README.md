# Authentication

## Configuration

Your app must be able to access ***Blackbaud CRM***. Add a `config` to your service that sets the required values on the bbui-angular service:

<pre><code>
    function config(bbuiShellServiceConfig) {
        bbuiShellServiceConfig.baseUrl = "/bbappfx";
        bbuiShellServiceConfig.databaseName = "BBInfinity"; // web.config key, not actual db name
    }

    config.$inject = ['bbuiShellServiceConfig'];

    angular.module('skytutorial')
    .config(config);
</code></pre>

## Authentication

You need to make a `sessionStart` request to the web shell service to see if the current user is logged in. If not, redirect to the login page to allow the user to log in.

Here is an example of a factory to help with this workflow:

<pre><code>
    angular.module('skytutorial')
    .factory('bbAuth', ['bbuiShellService', 'bbuiShellServiceConfig', function (bbuiShellService, bbuiShellServiceConfig) {

        var authenticateSuccessCallback,
            authenticateFailureCallback,
            authenticateFinallyCallback,
            svc,
            FORMS_AUTH_HEADER = "X-BB-FormsAuth";

        function getWebShellLoginUrl(databaseName, status) {

            var url,
                redirectUrl = window.location.href;

            url = bbuiShellServiceConfig.baseUrl + "/webui/WebShellLogin.aspx?databaseName=" + euc(databaseName);

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

            // Unathorized (401)
            // NotFound (404) implies WSFederation Authenticated but unable to match to AppUser
            if ((status === 401) || (status === 404)) {

                redirectUrl = getWebShellLoginUrl(svc.databaseName, headers(FORMS_AUTH_HEADER));
                window.location.replace(redirectUrl);
                authenticateFinallyCallback();
                // Don't call failure callback because we're just redirecting anyway.
            } else {
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

        return {
            authenticateAsync: authenticateAsync
        };

    }]);
</code></pre>

Next, you need to call your authentication method. Create a controller for your app to call the method you just created.

`<html charset="utf-8" ng-app="skytutorial" ng-controller="MainController as mainCtrl">`

The following code defines the new controller:

<pre><code>
    angular.module('skytutorial')
    .controller('MainController', ['bbAuth', 'bbWait', '$scope', function (bbAuth, bbWait, $scope) {

        bbWait.beginPageWait();

        bbAuth.authenticateAsync(function (sessionInfo) {
            // Authentication success!
            $scope.sessionInfo = sessionInfo;
        }, function (error) {
            // Authentication failure :(
            alert("Something went wrong!");
            console.error(JSON.stringify(error));
        }, function () {
            // Finally
            bbWait.endPageWait();
        });

    }]);
</code></pre>

If the user has not authenticated, we don't want to display the page. Create a `div` to wrap the contents of the page: 

`<div ng-if="sessionInfo">`

Notice that inside the controller, we set `sessionInfo` when the authentication call succeeds. Angular will not render this section until `sessionInfo` has a value.

Save your files and reload the page. If you are not already authenticated with ***Blackbaud CRM***, you will be redirected to the login page. After you log in, you will be redirected back to your SKY UX app.

<hr>

## Next step

[Create a record page »](https://github.com/blackbaud/bbui-angular/blob/docs-tutorials-edits/documentation/guides/4_create_record_page/README.md)
