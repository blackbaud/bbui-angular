/*global angular, BBUI */

(function () {
    'use strict';
    
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

            BBUI.copyProps(headers, BBUI.webshell.Service.globalHttpHeaders);
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

    angular.module('bbui.shellservice', [])
        .constant('bbuiShellServiceConfig', {
            baseUrl: null,
            databaseName: null
        })
        .factory('bbuiShellService', ['$http', 'bbuiShellServiceConfig', function ($http, bbuiShellServiceConfig) {
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