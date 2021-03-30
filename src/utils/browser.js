/*global angular */

(function () {
    'use strict';

    angular.module("infinity.util", [])
    .factory("browserUtilities", ["mockableUtilities", function (mockableUtilities) {

        /**
         * Get the parameters from the query string.
         *
         * @return {Object}
         */
        function getQueryStringParameters() {

            // Adapted from: https://www.developerdrive.com/2013/08/turning-the-querystring-into-a-json-object-using-javascript/

            var queryString = mockableUtilities.getWindowLocation().search,
                pairs = queryString.toLowerCase().slice(1).split('&'),
                result = {};

            if (queryString === '') {
                return {};
            }
            
            if (pairs) {
                pairs.forEach(function (pair) {
                    pair = pair.split('=');
                    
                    if (!pair[1]) {
                        result[pair[0]] = null;
                    } else {
                        result[pair[0]] = decodeURIComponent(pair[1]);
                    }
                });
            }
            
            return JSON.parse(JSON.stringify(result));
        }

        /**
         * Redirect the page.
         *
         * @param {String} redirectUrl
         */
        function redirect(redirectUrl) {
            mockableUtilities.getWindowLocation().replace(redirectUrl);
        }

        return {
            getWindowLocation: mockableUtilities.getWindowLocation,
            getQueryStringParameters: getQueryStringParameters,
            redirect: redirect
        };
    }]);

}());
