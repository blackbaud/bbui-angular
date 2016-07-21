/*global angular */

(function () {
    'use strict';

    angular.module('bbui.shellservice', ['bbui.core'])
        /**
         * @class bbui.shellservice.bbuiShellServiceConfig
         */
        .constant('bbuiShellServiceConfig', {
            /**
             * @cfg {String} baseUrl
             */
            baseUrl: null,
            /**
             * @cfg {String} databaseName
             */
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

                function doRequest(svc, method, url, data) {
                    return svc.$http({
                        method: method,
                        url: url,
                        data: data,
                        headers: getHeaders(svc),
                        cache: false
                    });
                }

                function doGet(svc, url) {
                    return svc.doGet(url);
                }

                function doPost(svc, url, data) {
                    return svc.doPost(url, data);
                }

                /**
                 * @class bbui.shellservice.bbuiShellService.Service
                 * Provides various methods for communicating with the web shell endpoints on the web server.
                 * <br/><br/>
                 * Note that all methods that make a call to the web server have the same last three arguments:
                 *
                 * @param {String} baseUrl
                 * The base URL to the web server.
                 *
                 * @param {String} databaseName
                 * The name of the database to which to connect.
                 *
                 * @param {Object} [options]
                 *
                 * @param {String} options.proxyUrl
                 * A URL to a web server that acts as a proxy between the client and the AppFx web server.
                 * This is useful in cases where the host page is hosted on a server other than the AppFx web server
                 * and the browser would otherwise block the request for being a cross-site request.
                 *
                 * @param {String} options.runAs
                 *
                 * @param {Object} options.onRequestBegin
                 *
                 * @param {Object} options.onRequestEnd
                 *
                 * @param {Object} options.httpHeaders
                 *
                 */
                Service = function (baseUrl, databaseName, options) {

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
                     * @readonly
                     * The base URL to the web server.
                     * @property baseUrl
                     * @type String
                     */
                    baseUrl: null,

                    /**
                     * @readonly
                     * The name of the database to which to connect.
                     * @property databaseName
                     * @type String
                     */
                    databaseName: null,

                    /**
                     * @private
                     * Validates a user name and password for a given user.
                     *
                     * @param {Object} loginInfo An object with username and password properties.
                     *
                     * @return {promise}
                     */
                    login: function (loginInfo) {
                        var url;

                        url = buildBaseUrl(this, "WebShellLogin.aspx") + "&action=login";

                        return doPost(this, url, loginInfo);
                    },

                    /**
                     * @private
                     * Removes the session cookie that keeps the user logged in.
                     *
                     * @return {promise}
                     */
                    logout: function () {
                        var url;

                        url = buildBaseUrl(this, "WebShellLogin.aspx") + "&action=logout";

                        return doPost(this, url, null);
                    },

                    /**
                     * @private
                     * Requests a password reset link and emails it to the associated user.
                     *
                     * @param {Object} emailAddress
                     * The user's email address.
                     *
                     * @return {promise}
                     */
                    sendPasswordResetLink: function (emailAddress) {
                        var url;

                        url = buildBaseUrl(this, "WebShellLogin.aspx") + "&action=sendPasswordResetLink&emailAddress=" + emailAddress;

                        return doPost(this, url, null);
                    },

                    /**
                     * @private
                     * Resets the user's password.
                     *
                     * @param {Object} request
                     * An object containing token and newPassword properties.
                     *
                     * @return {promise}
                     */
                    resetPassword: function (request) {
                        var url;

                        url = buildBaseUrl(this, "WebShellLogin.aspx") + "&action=resetPassword";

                        return doPost(this, url, request);
                    },

                    /**
                     * @private
                     * Starts the user's session and returns navigation information for web shell.
                     *
                     * @return {promise}
                     */
                    sessionStart: function () {
                        var url;

                        url = buildSvcBaseUrl(this, "sessionStart");

                        return doPost(this, url, null);
                    },

                    /**
                     * @private
                     * Gets the site-wide navigation information for web shell.
                     *
                     * @param {Object} [options]
                     *
                     * @param {Boolean} options.refreshCache
                     *
                     * @return {promise}
                     */
                    getNavigation: function (options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getNavigation");

                        if (options.refreshCache) {
                            url += "&refreshCache=true";
                        }

                        return doGet(this, url);
                    },

                    /**
                     * @private
                     * Gets the specified page's metadata.
                     *
                     * @param {String} pageId
                     * The ID of the page.
                     *
                     * @param {String} [recordId]
                     * The ID of the record to be shown by the page.
                     *
                     * @param {Object} [options]
                     *
                     * @param {Boolean} options.firstTab
                     * Indicates that the first visible tab's full metadata should be returned.  Only the caption for other tabs will be returned.
                     *
                     * @param {String} options.tabId
                     * The ID of the tab whose full metadata should be returned.  Only the caption for other tabs will be returned.
                     *
                     * @param {String} options.listBuilderInstanceId
                     *
                     * @return {promise}
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

                        return doGet(this, url);
                    },

                    /**
                    * @private
                    * Gets the specified page's metadata.
                    *
                    * @param {String} pageId
                    * The ID of the page.
                    *
                    * @return {promise}
                    */
                    getPageIsCustomizable: function (pageId) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageIsCustomizable", pageId);

                        return doGet(this, url);
                    },

                    /**
                     * @private
                     * Gets the specified page tab's metadata.
                     *
                     * @param {String} pageId
                     * The ID of the page.
                     *
                     * @param {String} tabId The ID of the tab.
                     * @param {String} recordId The ID of the record to be shown by the page.
                     *
                     * @return {promise}
                     */
                    getPageTab: function (pageId, tabId, recordId) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageTab", pageId, tabId, null, null, recordId);

                        return doGet(this, url);
                    },

                    /**
                     * @private
                     * Builds a page on the server according to the specified report and returns that page's metadata.
                     *
                     * @param {String} reportId The ID of the report.
                     *
                     * @param {Object} [options]
                     *
                     * @param {String} options.historyId
                     *
                     * @param {String} options.caption
                     *
                     * @param {String} options.displayPromptArea
                     *
                     * @param {Object[]} options.parameters
                     *
                     * @return {promise}
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
                     *
                     * @param {String} functionalAreaId
                     * The ID of the functional area.
                     *
                     * @param {String} taskId
                     * The ID of the functional area's task.
                     *
                     * @return {promise}
                     */
                    getFunctionalAreaTaskAction: function (functionalAreaId, taskId) {
                        var url;

                        url = buildSvcBaseUrl(this, "getFunctionalAreaTaskAction");

                        if (functionalAreaId) {
                            url += "&functionalAreaId=" + euc(functionalAreaId);
                        }

                        if (taskId) {
                            url += "&taskId=" + euc(taskId);
                        }

                        return doGet(this, url);
                    },

                    /**
                     * @private
                     * Returns a task as the variable reply for the callback
                     *
                     * @param {String} taskId
                     * The ID of the task.
                     *
                     * @return {promise}
                     */
                    getTaskAction: function (taskId) {
                        var url;

                        url = buildSvcBaseUrl(this, "getTaskAction");

                        if (taskId) {
                            url += "&taskId=" + euc(taskId);
                        }

                        return doGet(this, url);
                    },

                    /**
                     * @private
                     * Gets the metadata for a page-level action.
                     *
                     * @param {String} pageId
                     * The ID of the page.
                     *
                     * @param {String} actionId
                     * The ID of the page's action.
                     *
                     * @param {String} contextRecordId
                     *
                     * @return {promise}
                     */
                    getPageAction: function (pageId, actionId, contextRecordId) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageAction", pageId, null, null, actionId, contextRecordId);

                        return doGet(this, url);
                    },

                    /**
                     * @private
                     * Gets the metadata for a page section.
                     *
                     * @param {String} pageId
                     * The ID of the page.
                     *
                     * @param {String} tabId
                     * The ID of the tab to which the section belongs.
                     *
                     * @param {String} sectionId
                     * The ID of the section.
                     *
                     * @param {String} [contextRecordId]
                     * The ID of the page's context record.
                     *
                     * @return {promise}
                     */
                    getPageSection: function (pageId, tabId, sectionId, contextRecordId) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageSection", pageId, tabId, sectionId, null, contextRecordId);

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    getPageDataFormSectionAction: function (pageId, tabId, sectionId, actionId, contextRecordId, formSessionId, modelInstanceId) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageDataFormSectionAction", pageId, tabId, sectionId, actionId, contextRecordId) +
                            "&formSessionId=" +
                            euc(formSessionId) +
                            "&modelInstanceId=" +
                            euc(modelInstanceId);

                        return doPost(this, url, null);
                    },

                    /**
                     * @return {promise}
                     */
                    getPageReportSectionAction: function (pageId, tabId, sectionId, actionId, contextRecordId, options) {
                        var reportValues,
                            url;

                        if (options) {
                            reportValues = options.reportValues;
                        }

                        url = buildSvcBaseUrl(this, "getPageReportSectionAction", pageId, tabId, sectionId, actionId, contextRecordId);

                        return doPost(this, url, reportValues);
                    },

                    /**
                     * @return {promise}
                     */
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

                        return doPost(this, url, row);
                    },

                    /**
                     * @return {promise}
                     */
                    getPageUrlSectionAction: function (pageId, tabId, sectionId, actionId, contextRecordId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageUrlSectionAction", pageId, tabId, sectionId, actionId, contextRecordId);

                        if (options) {
                            if (options.pageRecordId) {
                                url += "&pageRecordId=" + euc(options.pageRecordId);
                            }
                        }

                        return doPost(this, url, null);
                    },

                    /**
                     * @return {promise}
                     */
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

                        return doPost(this, url, row);
                    },

                    /**
                     * @return {promise}
                     */
                    getPageListBuilderSectionAction: function (pageId, tabId, sectionId, actionId, contextRecordId, row, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageListBuilderSectionAction", pageId, tabId, sectionId, actionId, contextRecordId);

                        if (options && options.pageRecordId) {
                            url += "&pageRecordId=" + euc(options.pageRecordId);
                        }

                        return doPost(this, url, row);
                    },

                    /**
                     * @return {promise}
                     */
                    getListBuilderAvailableColumns: function (queryViewId) {
                        var url;

                        url = buildSvcBaseUrl(this, "getListBuilderAvailableColumns") + "&queryViewId=" + queryViewId;

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    listBuilderGetInstanceXml: function (queryViewId, request, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "listBuilderGetInstanceXml") +
                            "&queryViewId=" +
                            euc(queryViewId);

                        if (options.parameterFormSessionId) {
                            url += "&parameterFormSessionId=" + euc(options.parameterFormSessionId);
                        }

                        return doPost(this, url, request);
                    },

                    /**
                     * @return {promise}
                     */
                    listBuilderGetInstance: function (listBuilderInstanceId) {
                        var url;

                        url = buildSvcBaseUrl(this, "listBuilderGetInstance") + "&listBuilderInstanceId=" + listBuilderInstanceId;

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    listBuilderClearAllSettings: function (userSettingsPath, queryViewId) {

                        var url;

                        url = buildSvcBaseUrl(this, "listBuilderClearAllSettings") +
                            "&userSettingsPath=" + userSettingsPath +
                            "&queryViewId=" + queryViewId;

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    adHocQueryClearAllSettings: function (userSettingsPath, adHocQueryId) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQueryClearAllSettings") +
                            "&userSettingsPath=" + userSettingsPath +
                            "&adHocQueryId=" + adHocQueryId;

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    getAdHocQueryAvailableColumns: function (adHocQueryId) {
                        var url;

                        url = buildSvcBaseUrl(this, "getAdHocQueryAvailableColumns") + "&adHocQueryId=" + adHocQueryId;

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    getPageSummarySectionAction: function (pageId, actionId, contextRecordId, formSessionId, modelInstanceId) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageSummarySectionAction", pageId, null, null, actionId, contextRecordId) +
                            "&formSessionId=" +
                            euc(formSessionId) +
                            "&modelInstanceId=" +
                            euc(modelInstanceId);

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    evaluateDataListSectionActions: function (pageId, tabId, sectionId, contextRecordId, row, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "evaluateDataListSectionActions", pageId, tabId, sectionId, null, contextRecordId);

                        if (options) {
                            if (options.pageRecordId) {
                                url += "&pageRecordId=" + euc(options.pageRecordId);
                            }
                        }

                        return doPost(this, url, row);
                    },

                    /**
                     * @return {promise}
                     */
                    evaluateListBuilderSectionActions: function (pageId, tabId, sectionId, contextRecordId, row, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "evaluateListBuilderSectionActions", pageId, tabId, sectionId, null, contextRecordId);

                        if (options && options.pageRecordId) {
                            url += "&pageRecordId=" + euc(options.pageRecordId);
                        }

                        return doPost(this, url, row);
                    },

                    /**
                     * @return {promise}
                     */
                    evaluateDataFormSectionActions: function (pageId, tabId, sectionId, contextRecordId, formSessionId, modelInstanceId) {
                        var url;

                        url = buildSvcBaseUrl(this, "evaluateDataFormSectionActions", pageId, tabId, sectionId, null, contextRecordId) +
                            "&formSessionId=" +
                            euc(formSessionId) +
                            "&modelInstanceId=" +
                            euc(modelInstanceId);

                        return doPost(this, url, null);
                    },

                    /**
                     * @return {promise}
                     */
                    dataListGetOutputDefinition: function (dataListId, options) {
                        var url;

                        options = options || {};
                        options.cache = true;

                        url = BBUI.urlConcat(this.baseUrl, "webui/mc/") + euc(this.databaseName) + "/d/" + euc(dataListId) + "." + (options.timestamp || 0) + "_bbmd.ashx";

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    queryViewGetOutputDefinition: function (queryViewId, options) {
                        var url;

                        options = options || {};
                        options.cache = true;

                        url = BBUI.urlConcat(this.baseUrl, "webui/mc/") + euc(this.databaseName) + "/q/" + euc(queryViewId) + "." + (options.timestamp || 0) + "_bbmd.ashx";

                        return doGet(this, url);
                    },

                    /**
                     * Loads the results of the specified data list and passes the {@link BBUI.webshell.servicecontracts.DataListLoadReply reply object}
                     * to the promise.
                     *
                     * @param {String} dataListId
                     * The ID of the data list to load.
                     *
                     * @param {String} [contextRecordId]
                     * The ID of the data list's context record.
                     *
                     * @param {Object} [options]
                     *
                     * @param {String} options.pageRecordId
                     * The ID of the page's context record where the data list is rendered.
                     *
                     * @param {String} options.parameterFormSessionId
                     * The ID of the form session that provides parameters to the data list.
                     *
                     * @param {Object[]} options.parameters
                     * An array of objects containing <tt>name</tt> and <tt>value</tt> properties used to filter the data list results.
                     * @param {String} options.parameters.name
                     * @param {Object} options.parameters.value
                     *
                     * @param {Boolean} options.returnFlotData
                     * A flag indicating the data should be returned in a format readable by flot charts.
                     *
                     * @param {Boolean} options.returnFormattedValues
                     * Flag indicating the data list should return formatted values along with the raw values.
                     *
                     * @param {String} options.userSettingsPath
                     * The path used as the key to store user information about the data list, such as column sizes or the last filter values used.
                     *
                     * @return {promise}
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

                        return doGet(this, url);
                    },

                    /**
                     * Loads the results of the specified simple data list and passes the {@link BBUI.webshell.servicecontracts.SimpleDataListLoadReply reply object}
                     * to the promise.
                     *
                     * @param {String} simpleDataListId
                     * The ID of the simple data list to load.
                     *
                     * @param {Object} [options]
                     *
                     * @param {Object[]} options.parameters
                     * An array of objects containing <tt>name</tt> and <tt>value</tt> properties used to filter the simple data list results.
                     * @param {String} options.parameters.name
                     * @param {Object} options.parameters.value
                     *
                     * @return {promise}
                     */
                    simpleDataListLoad: function (simpleDataListId, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "simpleDataListLoad") +
                            "&simpleDataListId=" + euc(simpleDataListId);

                        if (options) {
                            url += BBUI.arrayToQueryString(options.parameters, paramPrefix, true);
                        }

                        return doGet(this, url);
                    },

                    /**
                     * @return {String}
                     */
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

                    /**
                     * @return {String}
                     */
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

                    /**
                     * @return {String}
                     */
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

                    /**
                     * @return {promise}
                     */
                    listBuilderClearCachedResults: function (moreRowsRangeKey) {
                        var url,
                            svc = this;

                        url = buildBaseUrl(svc, "WebShellListBuilderService.ashx") +
                            "&moreRowsRangeKey=" + euc(moreRowsRangeKey) +
                            "&discardRows=true";

                        return doGet(svc, url);
                    },

                    /**
                     * @return {promise}
                     */
                    pageSectionDataListLoad: function (pageId, tabId, sectionId, dataListId, options) {
                        var url;

                        url = this.buildPageSectionDataListResultsUrl(pageId, tabId, sectionId, dataListId, options);

                        return doGet(this, url);
                    },

                    /**
                     * Gets the prompt to be displayed before the specified record operation is performed and passes the
                     * {@link BBUI.webshell.servicecontracts.RecordOperationPrompt reply object} to the promise.
                     *
                     * @param {String} recordOperationId
                     * The ID of the record operation.
                     *
                     * @param {String} [recordId]
                     * The ID of the context record for the record operation.
                     *
                     * @return {promise}
                     */
                    recordOperationGetPrompt: function (recordOperationId, recordId) {
                        var url;

                        url = buildSvcBaseUrl(this, "recordOperationGetPrompt") +
                            "&recordOperationId=" +
                            euc(recordOperationId);

                        if (recordId) {
                            url += "&recordId=" + euc(recordId);
                        }

                        return doGet(this, url);
                    },

                    /**
                     * Performs a record operation.
                     *
                     * @param {String} recordOperationId
                     * The ID of the record operation.
                     *
                     * @param {String} [recordId]
                     * The ID of the context record for the record operation.
                     *
                     * @param {Object} [options]
                     *
                     * @param {Object[]} options.parameters
                     * An array of objects containing <tt>name</tt> and <tt>value</tt> properties used to to pass as parameters to the record operation.
                     * @param {String} options.parameters.name
                     * @param {Object} options.parameters.value
                     *
                     * @return {promise}
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

                        return doPost(this, url, data);
                    },

                    /**
                     * @return {promise}
                     */
                    searchListGetOutputDefinition: function (searchListId) {
                        var url;

                        url = buildSvcBaseUrl(this, "searchListGetOutputDefinition") +
                            "&searchListId=" +
                            euc(searchListId);

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
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

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    codeTableEntrySave: function (codeTableName, codeTableEntryId, request) {
                        var url;

                        url = buildSvcBaseUrl(this, "codeTableEntrySave") +
                            "&codeTableName=" +
                            euc(codeTableName) +
                            "&codeTableEntryId=" +
                            euc(codeTableEntryId);

                        return doPost(this, url, request);
                    },

                    /**
                     * @return {promise}
                     */
                    kpiDashboardGetDefinition: function (options) {
                        var url;

                        url = buildSvcBaseUrl(this, "kpiDashboardGetDefinition");

                        if (options.returnValues) {
                            url += "&returnValues=true";
                        }

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    queryViewGetFieldFindResults: function (request) {
                        var url;

                        url = buildSvcBaseUrl(this, "queryViewGetFieldFindResults");

                        return doPost(this, url, request);
                    },

                    /**
                     * @return {promise}
                     */
                    queryViewGetTree: function (id, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "queryViewGetTree") +
                            "&id=" +
                            euc(id);

                        if (options && options.forExport === true) {
                            url += "&loadExportDefinitionViews=true";
                        } else {
                            url += "&loadExportDefinitionViews=false";
                        }

                        if (options && options.forReportModelGenerator === true) {
                            url += "&reportModelViewsOnly=true";
                        } else {
                            url += "&reportModelViewsOnly=false";
                        }

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    queryViewGetMetaData: function (id) {
                        var url;

                        url = buildSvcBaseUrl(this, "queryViewGetMetaData") +
                            "&id=" +
                            euc(id);

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    queryViewGetTreeNodeFields: function (node, options) {
                        var url;

                        url = buildSvcBaseUrl(this, "queryViewGetTreeNodeFields") +
                            "&node=" +
                            euc(node);

                        if (options && options.forReportModelGenerator === true) {
                            url += "&reportModelViewsOnly=true";
                        } else {
                            url += "&reportModelViewsOnly=false";
                        }

                        return doGet(this, url);
                    },

                    /**
                     * @return {String}
                     */
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

                    /**
                     * @return {promise}
                     */
                    adHocQueryProcess: function (request, options) {
                        //var cancelCallback,
                        //    requestObj,
                        //    scope,
                        //    state,
                        var svc,
                            url;

                        // TODO implement cancellation.
                        // See http://stackoverflow.com/questions/13928057/how-to-cancel-an-http-request-in-angularjs
                        //function cancelAdHocQueryProcess() {
                        //}

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

                        return doPost(svc, url, request);
                    },

                    /**
                     * @return {promise}
                     */
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

                        return doPost(this, url, request);
                    },

                    /**
                     * @return {promise}
                     */
                    cancelAsyncOperation: function (cancelId) {
                        var url;

                        url = buildBaseUrl(this, "WebShellCancelAsyncOperation.ashx") +
                            "&cancelId=" +
                            euc(cancelId);

                        return doGet(this, url);
                    },

                    /**
                     * @return {String}
                     */
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

                    /**
                     * @return {String}
                     */
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

                    /**
                     * @return {String}
                     */
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

                    /**
                     * @return {promise}
                     */
                    adHocQuerySave: function (request) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQuerySave");

                        return doPost(this, url, request);
                    },

                    /**
                     * @return {promise}
                     */
                    adHocQuerySaveDataList: function (request) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQuerySaveDataList");

                        return doPost(this, url, request);
                    },

                    /**
                     * @return {promise}
                     */
                    adHocQuerySaveReport: function (request) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQuerySaveReport");

                        return doPost(this, url, request);
                    },

                    /**
                     * @return {promise}
                     */
                    adHocQuerySaveSmartQuery: function (request) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQuerySaveSmartQuery");

                        return doPost(this, url, request);
                    },

                    /**
                     * @return {promise}
                     */
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

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    adHocQueryDelete: function (id) {
                        var url;

                        url = buildSvcBaseUrl(this, "adHocQueryDelete") +
                            "&id=" +
                            euc(id);

                        return doPost(this, url, null);
                    },

                    /**
                     * @return {promise}
                     */
                    exportDefinitionSave: function (request) {
                        var url;

                        url = buildSvcBaseUrl(this, "exportDefinitionSave");

                        return doPost(this, url, request);
                    },

                    /**
                     * @return {promise}
                     */
                    exportDefinitionGetDefinition: function (id) {
                        var url;

                        url = buildSvcBaseUrl(this, "exportDefinitionGetDefinition") +
                            "&id=" +
                            euc(id);

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    smartQueryProcess: function (request, options) {
                        //var cancelCallback,
                        //    requestObj,
                        //    scope,
                        //    state,
                        var svc,
                            url;

                        // TODO implement cancellation.
                        // See http://stackoverflow.com/questions/13928057/how-to-cancel-an-http-request-in-angularjs
                        //function cancelSmartQueryProcess() {
                        //}

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

                        return doPost(svc, url, request);
                    },

                    /**
                     * @return {promise}
                     */
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

                        return doPost(this, url, request);
                    },

                    /**
                     * @return {String}
                     */
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

                    /**
                     * @return {promise}
                     */
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

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    userUpdateDataFormSettings: function (formSessionId, userSettingsPath) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdateDataFormSettings") +
                            "&formSessionId=" +
                            euc(formSessionId) +
                            "&userSettingsPath=" +
                            euc(userSettingsPath);

                        return doPost(this, url, null);
                    },

                    /**
                     * @return {promise}
                     */
                    userUpdateSelectedPervasiveSearchTask: function (pervasiveSearchTaskId) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdateSelectedPervasiveSearchTask");

                        if (pervasiveSearchTaskId) {
                            url += "&pervasiveSearchTaskId=" + euc(pervasiveSearchTaskId);
                        }

                        return doPost(this, url, null);
                    },

                    /**
                     * @return {promise}
                     */
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

                        return doPost(this, url, request);
                    },

                    /**
                     * @return {promise}
                     */
                    userUpdatePageActionGroupSettings: function (pageId, actionGroups) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdatePageActionGroupSettings") +
                            "&pageId=" +
                            euc(pageId);

                        return doPost(this, url, actionGroups);
                    },

                    /**
                     * @return {promise}
                     */
                    userUpdateFunctionalAreaActionGroupSettings: function (functionalAreaId, actionGroups) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdateFunctionalAreaActionGroupSettings") +
                            "&functionalAreaId=" +
                            euc(functionalAreaId);

                        return doPost(this, url, actionGroups);
                    },

                    /**
                     * @return {promise}
                     */
                    userUpdatePageDataListSettings: function (pageId, sectionId, dataListId, settings) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdatePageDataListSettings", pageId, null, sectionId) +
                            "&dataListId=" +
                            euc(dataListId);

                        return doPost(this, url, settings);
                    },

                    /**
                     * @return {promise}
                     */
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

                        return doPost(this, url, settings);
                    },

                    /**
                     * @return {promise}
                     */
                    userUpdateAdHocQueryListBuilderSettings: function (queryViewId, adHocQueryId, userSettingsPath, settings) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdatePageListBuilderSettings") +
                            "&queryViewId=" +
                            euc(queryViewId) +
                            "&adHocQueryId=" +
                            euc(adHocQueryId) +
                            "&userSettingsPath=" +
                            euc(userSettingsPath);

                        return doPost(this, url, settings);
                    },

                    /**
                     * @return {promise}
                     */
                    userUpdatePageSectionSettings: function (pageId, sections) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdatePageSectionSettings") +
                            "&pageId=" +
                            euc(pageId);

                        return doPost(this, url, sections);
                    },

                    /**
                     * @return {promise}
                     */
                    userUpdatePageTabSettings: function (pageId, tabs) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdatePageTabSettings") +
                            "&pageId=" +
                            euc(pageId);

                        return doPost(this, url, tabs);
                    },

                    /**
                     * @return {promise}
                     */
                    userSetFeatureTipSeen: function (featureTipId, tipSeen) {
                        var url;

                        url = buildSvcBaseUrl(this, "userSetFeatureTipSeen");

                        return doPost(this, url, {featureTipId: featureTipId, tipSeen: tipSeen});
                    },

                    /**
                     * @return {promise}
                     */
                    userGetFeatureTipSeen: function (featureTipId, setTipAsSeen) {
                        var url;

                        url = buildSvcBaseUrl(this, "userGetFeatureTipSeen");

                        return doPost(this, url, {featureTipId: featureTipId, setTipAsSeen: setTipAsSeen});
                    },

                    /**
                     * @return {promise}
                     */
                    userUpdateSearchListGridSettings: function (searchlistid, gridSettings) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdateSearchListGridSettings") +
                            "&searchlistid=" +
                            euc(searchlistid);

                        return doPost(this, url, gridSettings);
                    },

                    /**
                     * @return {promise}
                     */
                    userGetSearchListGridSettings: function (searchlistid) {
                        var url;

                        url = buildSvcBaseUrl(this, "userGetSearchListGridSettings") +
                            "&searchlistid=" +
                            euc(searchlistid);

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    userUpdateActionPanelSettings: function (settings) {
                        var url;

                        url = buildSvcBaseUrl(this, "userUpdateActionPanelSettings");

                        return doPost(this, url, settings);
                    },

                    /**
                     * @return {promise}
                     */
                    featureSearch: function (criteria, onlyRssFeeds) {
                        var url;

                        url = buildSvcBaseUrl(this, "featureSearch") +
                            "&criteria=" +
                            euc(criteria);

                        if (onlyRssFeeds) {
                            url += "&onlyRssFeeds=true";
                        }

                        return doGet(this, url);
                    },

                    /**
                     * @return {String}
                     */
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
                     * Loads a data form from the server and passes the {@link BBUI.webshell.servicecontracts.DataFormLoadReply reply object} to the promise.
                     *
                     * @param {String} dataFormInstanceId
                     * The ID of the data form instance to load.
                     *
                     * @param {Object} [options]
                     *
                     * @param {String} [options.recordId]
                     * The ID of the record for the data form.
                     *
                     * @param {String} [options.contextRecordId]
                     * The ID of the record that provides context for the data form.
                     *
                     * @return {promise}
                     */
                    dataFormLoad: function (dataFormInstanceId, options) {
                        var url;

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

                        return doGet(this, url);
                    },

                    /**
                     * Saves a data form on the server and passes the {@link BBUI.webshell.servicecontracts.DataFormSaveReply reply object} to the promise.
                     *
                     * @param {String} dataFormInstanceId The ID of the data form instance to load.
                     *
                     * @param {Object} [options]
                     *
                     * @param {String} [options.recordId]
                     * The ID of the record for the data form.
                     *
                     * @param {String} [options.contextRecordId]
                     * The ID of the record that provides context for the data form.
                     *
                     * @return {promise}
                     */
                    dataFormSave: function (dataFormInstanceId, options) {
                        var url,
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

                        return doPost(this, url, data);
                    },

                    /**
                     * @return {promise}
                     */
                    taskWizardGetDefinition: function (taskWizardId) {
                        var url;

                        url = buildSvcBaseUrl(this, "taskwizardgetdefinition") +
                            "&taskWizardId=" +
                            euc(taskWizardId);

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    taskWizardGetTaskStatus: function (taskId) {
                        var url;

                        url = buildSvcBaseUrl(this, "taskwizardgettaskstatus") +
                            "&taskId=" +
                            euc(taskId);

                        return doGet(this, url);
                    },

                    /**
                     * @return {String}
                     */
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

                    /**
                     * @return {promise}
                     */
                    cacheDataFormItem: function (values) {
                        var url,
                            data;

                        if (values) {
                            data = {
                                values: values
                            };
                        }

                        url = buildSvcBaseUrl(this, "cacheDataFormItem");

                        return doPost(this, url, data);
                    },

                    /**
                     * @return {promise}
                     */
                    idMap: function (idMapperId, sourceId) {
                        var url;

                        url = buildSvcBaseUrl(this, "idMap") +
                            "&idMapperId=" + euc(idMapperId);

                        if (sourceId) {
                            url += "&sourceId=" + euc(sourceId);
                        }

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    securityUserGrantedFeature: function (id, featureType) {
                        var url;

                        url = buildSvcBaseUrl(this, "securityUserGrantedFeature") +
                            "&id=" + euc(id) +
                            "&featureType=" + euc(featureType);

                        return doGet(this, url);
                    },

                    /**
                     * @return {promise}
                     */
                    loadCatalogItem: function (sourceType, sourceName, itemResourceName) {
                        var url;

                        url = buildSvcBaseUrl(this, "loadCatalogItem") +
                            "&sourceType=" + euc(sourceType) +
                            "&sourceName=" + euc(sourceName) +
                            "&itemResourceName=" + euc(itemResourceName);

                        return doPost(this, url, null);
                    },

                    /**
                     * @return {promise}
                     */
                    getPageHelpKey: function (pageId, tabId, sectionId, recordId) {
                        var url;

                        url = buildSvcBaseUrl(this, "getPageHelpkey", pageId, tabId, sectionId, null, recordId);

                        return doGet(this, url);
                    },

                    /**
                     * @return {String}
                     */
                    buildSvcBaseUrl: function (action) {
                        return buildSvcBaseUrl(this, action);
                    },

                    /**
                     * @return {promise}
                     */
                    doGet: function (url) {
                        return doRequest(this, "GET", url, null);
                    },

                    /**
                     * @return {promise}
                     */
                    doPost: function (url, data) {
                        return doRequest(this, "POST", url, data);
                    }
                };

            }());

            /**
             * @class bbui.shellservice.bbuiShellService
             */
            return {
                /**
                 *
                 * @return {bbui.shellservice.bbuiShellService.Service}
                 */
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
