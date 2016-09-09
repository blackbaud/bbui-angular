/*global angular */

(function () {
    "use strict";

    angular.module('bbui.uimodelingservice', [])
        /**
         * @class bbui.uimodelingservice.bbuiUIModelingServiceConfig
         *
         * Configuration for {@link bbui.uimodelingservice.bbuiUIModelingService bbuiUIModelingService}.
         */
        .constant('bbuiUIModelingServiceConfig', {
            /**
             * @cfg {String} baseUrl
             */
            baseUrl: null,
            /**
             * @cfg {String} databaseName
             */
            databaseName: null
        })
        .factory('bbuiUIModelingService', ['$http', 'bbui', 'bbuiUIModelingServiceConfig', function ($http, BBUI, bbuiUIModelingServiceConfig) {
            var euc,
                formSessionServerIds,
                formSessionServerIdsBufferPos,
                formSessionServerIdsBufferSize,
                Service;

            // Since this is called many times in this file, create a shorter alias for it.
            euc = encodeURIComponent;

            formSessionServerIds = [];
            formSessionServerIdsBufferPos = 0;
            formSessionServerIdsBufferSize = 100;

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

            function doRequest(svc, method, url, data) {
                return svc.$http({
                    method: method,
                    url: url,
                    data: data,
                    cache: false
                });
            }

            function doGet(svc, url) {
                return doRequest(svc, "GET", url, null);
            }

            function doPost(svc, url, data) {
                return doRequest(svc, "POST", url, data);
            }

            /**
             * @private
             *
             * @param {String} url
             *
             * @param {Object} [options]
             *
             * @param {String} [options.recordId]
             *
             * @param {String} [options.contextRecordId]
             *
             * @param {String} [options.uiWidgetDashboardSystemId]
             *
             * @param {String} [options.uiWidgetDashboardWidgetId]
             *
             * @param {String} [options.userSettingsPath]
             *
             * @return {String}
             * The URL with query string parameters appended.
             */
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
             * @class bbui.uimodelingservice.bbuiUIModelingService.Service
             * Provides various methods for communicating changes to a UI model to the web server.
             *
             * @param {String} baseUrl
             * The base URL to the web server.
             *
             * @param {String} databaseName
             * The name of the database to which to connect.
             *
             * @param {Object} [options]
             *
             * @param {Object} options.runAs
             *
             * @param {Object} options.onRequestBegin
             *
             * @param {Object} options.onRequestEnd
             *
             * @param {Object} options.httpHeaders
             *
             * @param {Object} options.useEventQueue
             *
             */
            Service = function (baseUrl, databaseName, options) {

                var svc,
                    useEventQueue;

                svc = this;

                /**
                 * @readonly
                 * The base URL to the web server.
                 * @property baseUrl
                 * @type String
                 */
                svc.baseUrl = baseUrl;

                /**
                 * @readonly
                 * The name of the database to which to connect.
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

                /**
                 * @property handlers
                 * @type Object
                 */
                svc.handlers = {};
            };

            Service.prototype = {

                /**
                 */
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

                /**
                 */
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

                /**
                 * Creates an instance of the form on the server.
                 *
                 * @param {String} assemblyName
                 * The assembly name containing the UI model class.
                 *
                 * @param {String} className
                 * The name of the UI model class.
                 *
                 * @param {BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs} [args]
                 * Arguments to pass to the form session.
                 *
                 * @param {Object} [options]
                 * An object literal that may contain any of the following properties:
                 *
                 * @param {String} [options.recordId]
                 * The ID of the record being edited.
                 *
                 * @param {String} [options.contextRecordId]
                 * The ID of the record that provides the context for the record being added or edited.
                 *
                 * @param {String} [options.uiWidgetDashboardSystemId]
                 *
                 * @param {String} [options.uiWidgetDashboardWidgetId]
                 *
                 * @param {String} [options.userSettingsPath]
                 *
                 * @return {promise}
                 */
                createFormSession: function (assemblyName, className, args, options) {

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createFormSession") +
                        "&assemblyName=" +
                        euc(assemblyName) +
                        "&className=" +
                        euc(className);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args);
                },

                /**
                 * Creates an instance of the form on the server.
                 *
                 * @param {String} mergeTaskId
                 * The Id of the merge task.
                 *
                 * @param {BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs} [args]
                 * Arguments to pass to the form session.
                 *
                 * @param {Object} [options]
                 * An object literal that may contain any of the following properties:
                 *
                 * @param {String} [options.recordId]
                 * The ID of the record being edited.
                 *
                 * @param {String} [options.contextRecordId]
                 * The ID of the record that provides the context for the record being added or edited.
                 *
                 * @param {String} [options.uiWidgetDashboardSystemId]
                 *
                 * @param {String} [options.uiWidgetDashboardWidgetId]
                 *
                 * @param {String} [options.userSettingsPath]
                 *
                 * @return {promise}
                 */
                createMergeTaskFormSession: function (mergeTaskId, args, options) {

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createMergeTaskFormSession") +
                        "&mergeTaskId=" +
                        euc(mergeTaskId);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args);
                },

                /**
                 * Creates an instance of the form on the server.
                 *
                 * @param {String} dataFormInstanceId
                 * The ID of the data form instance to interact with.
                 *
                 * @param {BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs} [args]
                 * Arguments to pass to the form session.
                 *
                 * @param {Object} [options]
                 * An object literal that may contain any of the following properties:
                 *
                 * @param {String} [options.recordId]
                 * The ID of the record being edited.
                 *
                 * @param {String} [options.contextRecordId]
                 * The ID of the record that provides the context for the record being added or edited.
                 *
                 * @param {String} [options.uiWidgetDashboardSystemId]
                 *
                 * @param {String} [options.uiWidgetDashboardWidgetId]
                 *
                 * @param {String} [options.userSettingsPath]
                 *
                 * @return {promise}
                 */
                createDataFormSession: function (dataFormInstanceId, args, options) {

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createDataFormSession") +
                        "&dataFormInstanceId=" +
                        euc(dataFormInstanceId);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args);
                },

                /**
                 * Creates an instance of the form on the server.
                 *
                 * @param {String} searchListId
                 * The ID of the search list to interact with.
                 *
                 * @param {BBUI.uimodeling.servicecontracts.CreateSearchListFormSessionArgs} [args]
                 * Arguments to pass to the search list session.
                 *
                 * @return {promise}
                 */
                createSearchListSession: function (searchListId, args) {

                    var url;

                    url = buildSvcBaseUrl(this, "createSearchListFormSession") +
                        "&searchListId=" +
                        euc(searchListId);

                    return doPost(this, url, args);
                },

                /**
                 * Creates an instance of the data list's filter form on the server.
                 *
                 * @param {String} dataFormInstanceId
                 * The ID of the data list to interact with.
                 *
                 * @param {BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs} [args]
                 * Arguments to pass to the form session.
                 *
                 * @param {Object} [options]
                 * An object literal that may contain any of the following properties:
                 *
                 * @param {String} [options.recordId]
                 * The ID of the record being edited.
                 *
                 * @param {String} [options.contextRecordId]
                 * The ID of the record that provides the context for the record being added or edited.
                 *
                 * @param {String} [options.uiWidgetDashboardSystemId]
                 *
                 * @param {String} [options.uiWidgetDashboardWidgetId]
                 *
                 * @param {String} [options.userSettingsPath]
                 *
                 * @return {promise}
                 */
                createDataListFilterFormSession: function (dataListId, args, options) {

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createDataListFilterFormSession") +
                        "&dataListId=" +
                        euc(dataListId);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args);
                },

                /**
                 * Creates an instance of the list builder filter form on the server.
                 *
                 * @param {String} queryViewId
                 * The ID of the query view used to render the list.
                 *
                 * @param {BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs} [args]
                 * Arguments to pass to the form session.
                 *
                 * @param {Object} [options]
                 * An object literal that may contain any of the following properties:
                 *
                 * @param {String} [options.recordId]
                 * The ID of the record being edited.
                 *
                 * @param {String} [options.contextRecordId]
                 * The ID of the record that provides the context for the record being added or edited.
                 *
                 * @param {String} [options.uiWidgetDashboardSystemId]
                 *
                 * @param {String} [options.uiWidgetDashboardWidgetId]
                 *
                 * @param {String} [options.userSettingsPath]
                 *
                 * @return {promise}
                 */
                createListBuilderFilterFormSession: function (queryViewId, args, options) {

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createListBuilderFilterFormSession") +
                        "&queryViewId=" +
                        euc(queryViewId);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args);
                },

                /**
                 * Creates an instance of the report's parameter form on the server.
                 *
                 * @param {String} reportId
                 * The ID of the report to interact with.
                 *
                 * @param {String} historyId
                 * The history ID of the report to interact with.
                 *
                 * @param {BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs} [args]
                 * Arguments to pass to the form session.
                 *
                 * @param {Object} [options]
                 *
                 * @param {Boolean} [options.showAllParameters]
                 *
                 * @return {promise}
                 */
                createReportParameterFormSession: function (reportId, historyId, args, options) {

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

                    return doPost(this, url, args);
                },

                /**
                 * Creates an instance of the business process's parameter form on the server.
                 *
                 * @param {String} businessProcessId
                 * The ID of the data form instance to interact with.
                 *
                 * @param {BBUI.uimodeling.servicecontracts.CreateDataFormSessionArgs} [args]
                 * Arguments to pass to the form session.
                 *
                 * @param {Object} [options]
                 * An object literal that may contain any of the following properties:
                 *
                 * @param {String} [options.recordId]
                 * The ID of the record being edited.
                 *
                 * @param {String} [options.contextRecordId]
                 * The ID of the record that provides the context for the record being added or edited.
                 *
                 * @param {String} [options.uiWidgetDashboardSystemId]
                 *
                 * @param {String} [options.uiWidgetDashboardWidgetId]
                 *
                 * @param {String} [options.userSettingsPath]
                 *
                 * @return {promise}
                 */
                createBusinessProcessFormSession: function (businessProcessId, args, options) {

                    var url;

                    options = options || {};

                    url = buildSvcBaseUrl(this, "createBusinessProcessFormSession") +
                        "&businessProcessId=" +
                        euc(businessProcessId);

                    url = addOptionalFormSessionArgs(url, options);

                    return doPost(this, url, args);
                },

                /**
                 */
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

                /**
                 */
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

                /**
                 * Gets the output definition of a search.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the search list form model.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the search list form model.
                 *
                 * @param {Boolean} returnExistingResults
                 *
                 * @param {Object} [options]
                 * An object literal that may contain any of the following properties:
                 *
                 * @param {String} [options.taskHistoryId]
                 *
                 * @return {promise}
                 */
                searchListGetOutputDefinition: function (formSessionId, modelInstanceId, returnExistingResults, options) {

                    var url = buildSvcBaseUrl(this, "searchListGetOutputDefinition", formSessionId, modelInstanceId) +
                        "&returnExistingResults=" +
                        (returnExistingResults ? "true" : "false");

                    if (!options) {
                        options = {};
                    }

                    if (options.taskHistoryId) {
                        url += "&taskHistoryId=" + euc(options.taskHistoryId);
                    }

                    return doGet(this, url);
                },

                /**
                 * Gets the results of a search.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the search list form model.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the search list form model.
                 *
                 * @param {Object} htmlEncodeValues
                 *
                 * @param {Object} [options]
                 * An object literal that may contain any of the following properties:
                 *
                 * @param {Boolean} [options.returnFormattedValues]
                 *
                 * @param {String} [options.taskId]
                 *
                 * @param {String} [options.taskHistoryId]
                 *
                 * @param {String} [options.cancelId]
                 *
                 * @return {promise}
                 */
                getSearchListResults: function (formSessionId, modelInstanceId, htmlEncodeValues, options) {

                    var url;

                    if (!options) {
                        options = {};
                    }

                    // Append a timestamp to the end of the URL so the results aren't cached by the browser.
                    url = this.buildSearchListResultsUrl(formSessionId,
                        modelInstanceId,
                        htmlEncodeValues,
                        options.returnFormattedValues,
                        options.taskId,
                        options.taskHistoryId,
                        options.cancelId) +
                        "&_reqid=" + new Date().getTime();

                    return doGet(this, url);
                },

                /**
                 * Invokes the searchItemSelected event with the given search field.
                 *
                 * @param {String} formSessionId
                 * The ID of the search form session.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the search model instance.
                 *
                 * @param {Number} selectedIndex
                 * The zero-based index of the selected search result row.
                 *
                 * @return {promise}
                 */
                invokeSearchItemSelected: function (formSessionId, modelInstanceId, selectedIndex) {

                    var url = buildSvcBaseUrl(this, "invokeSearchItemSelected", formSessionId, modelInstanceId);

                    return doPost(this, url, selectedIndex);
                },

                /**
                 * Invokes the search list associated with the given search field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} fieldName
                 * The name of the search field.
                 *
                 * @return {promise}
                 */
                invokeFieldSearch: function (formSessionId, modelInstanceId, fieldName) {

                    var url = buildSvcBaseUrl(this, "invokeFieldSearch", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url);
                },

                /**
                 * Invokes quick find on the given search field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} fieldName
                 * The name of the search field.
                 *
                 * @param {String} criteria
                 * The quick find criteria.
                 *
                 * @return {promise}
                 */
                invokeFieldQuickFind: function (formSessionId, modelInstanceId, fieldName, criteria) {

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

                    return doPost(this, url);
                },

                /**
                 * Invokes the search list associated with the given search field and executes the search.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} fieldName
                 * The name of the search field.
                 *
                 * @return {promise}
                 */
                invokeFieldAutoSearch: function (formSessionId, modelInstanceId, fieldName) {

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

                    return doPost(this, url);
                },

                /**
                 * Invokes quick find on the given search list.
                 *
                 * @param {String} searchListId
                 * The ID of the search list.
                 *
                 * @param {String} criteria
                 * The quick find criteria.
                 *
                 * @return {promise}
                 */
                invokeQuickFind: function (searchListId, criteria) {

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

                    return doPost(this, url);
                },

                /**
                 * Checks the current values of a data form session's fields to see if there are matching records already in the database.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the data.
                 *
                 * @return {promise}
                 */
                checkForDuplicate: function (formSessionId, modelInstanceId) {

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

                    return doPost(this, url, null);
                },

                /**
                 * Selects a search list row to represent the value of the search field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} fieldName
                 * The name of the search field.
                 *
                 * @param {String} searchFormSessionId
                 * The ID of the search form session that was invoked.
                 *
                 * @param {Number} selectedIndex
                 * The zero-based index of the selected search result row.
                 *
                 * @return {promise}
                 */
                selectFieldSearchItem: function (formSessionId, modelInstanceId, fieldName, searchFormSessionId, selectedIndex) {

                    var url = buildSvcBaseUrl(this, "selectFieldSearchItem", formSessionId, modelInstanceId, fieldName) +
                        "&searchFormSessionId=" +
                        euc(searchFormSessionId);

                    return doPost(this, url, selectedIndex);
                },

                /**
                 * Selects a search list row to represent the value of the search field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} fieldName
                 * The name of the search field.
                 *
                 * @param {String} recordId
                 * The ID of the selected record.
                 *
                 * @return {promise}
                 */
                selectFieldSearchItemById: function (formSessionId, modelInstanceId, fieldName, recordId) {

                    var url = buildSvcBaseUrl(this, "selectFieldSearchItemById", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, recordId);
                },

                /**
                 * Selects a search list row to represent the value of the search field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} actionName
                 * The name of the search action.
                 *
                 * @param {String} searchFormSessionId
                 * The ID of the search form session that was invoked.
                 *
                 * @param {Number} selectedIndex
                 * The zero-based index of the selected search result row.
                 *
                 * @return {promise}
                 */
                selectActionSearchItem: function (formSessionId, modelInstanceId, actionName, searchFormSessionId, selectedIndex) {

                    var url = buildSvcBaseUrl(this, "selectSearchItemAction", formSessionId, modelInstanceId) +
                        "&actionId=" + actionName +
                        "&searchFormSessionId=" +
                        euc(searchFormSessionId);

                    return doPost(this, url, selectedIndex);
                },

                /**
                 * Selects a search list row to represent the value of the search field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} actionName
                 * The name of the search action.
                 *
                 * @param {String} recordId
                 * The ID of the selected record.
                 *
                 * @return {promise}
                 */
                selectActionSearchItemById: function (formSessionId, modelInstanceId, actionName, recordId) {

                    var url = buildSvcBaseUrl(this, "selectSearchItemActionById", formSessionId, modelInstanceId) +
                        "&actionId=" + actionName;

                    return doPost(this, url, recordId);
                },

                /**
                 * Updates a field on the form.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and field to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the field to be updated.
                 *
                 * @param {String} fieldName
                 * The name of the field to be updated.
                 *
                 * @param {String|Number|Boolean|Object} value
                 * The field's value.
                 *
                 * @return {promise}
                 */
                updateField: function (formSessionId, modelInstanceId, fieldName, value) {

                    var url = buildSvcBaseUrl(this, "updateField", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, value);
                },

                /**
                 * Updates multiple fields on the form.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and fields to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the fields to be updated.
                 *
                 * @param {Object[]} fieldValues
                 * @param {String} fieldValues.name
                 * @param {Object} fieldValues.value
                 *
                 * @return {promise}
                 */
                updateMultipleFields: function (formSessionId, modelInstanceId, fieldValues) {

                    var url = buildSvcBaseUrl(this, "updateMultipleFields", formSessionId, modelInstanceId);

                    return doPost(this, url, fieldValues);
                },

                /**
                 * Updates one or more special properties on a relationship map field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and field to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the field to be updated.
                 *
                 * @param {String} fieldName
                 * The name of the field to be updated.
                 *
                 * @param {Object[]} properties
                 * The properties on the relationship map field to update.
                 * @param {String} properties.name
                 * @param {Object} properties.value
                 *
                 * @return {promise}
                 */
                updateRelationshipMapFieldProperties: function (formSessionId, modelInstanceId, fieldName, properties) {

                    var url = buildSvcBaseUrl(this, "updateRelationshipMapFieldProperties", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, properties);
                },

                /**
                 * Selects or de-selects the given tree view node.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and field to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the field to be updated.
                 *
                 * @param {String} fieldName
                 * The name of the field to be updated.
                 *
                 * @param {String} nodePath
                 * The fully qualified path of the node to select.
                 *
                 * @return {promise}
                 */
                selectTreeViewNode: function (formSessionId, modelInstanceId, fieldName, nodePath) {

                    var url = buildSvcBaseUrl(this, "selectTreeViewNode", formSessionId, modelInstanceId, fieldName) +
                        "&nodePath=" +
                        euc(nodePath);

                    return doPost(this, url, null);
                },

                /**
                 * Selects or de-selects the given tree view nodes.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and field to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the field to be updated.
                 *
                 * @param {String} fieldName
                 * The name of the field to be updated.
                 *
                 * @param {String} nodePaths
                 * The fully qualified path of each node to select.
                 *
                 * @return {promise}
                 */
                selectTreeViewNodes: function (formSessionId, modelInstanceId, fieldName, nodePaths) {

                    var url = buildSvcBaseUrl(this, "selectTreeViewNodes", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, nodePaths);
                },

                /**
                 * Sets the expanded property on a tree view node.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and field to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the field to be updated.
                 *
                 * @param {String} fieldName
                 * The name of the field to be updated.
                 *
                 * @param {String} nodePath
                 * The fully qualified path of the node.
                 *
                 * @param {Boolean} expanded
                 * A flag indicating whether the node is expanded.
                 *
                 * @return {promise}
                 */
                setTreeViewNodeExpanded: function (formSessionId, modelInstanceId, fieldName, nodePath, expanded) {

                    var url = buildSvcBaseUrl(this, "setTreeViewNodeExpanded", formSessionId, modelInstanceId, fieldName) +
                        "&nodePath=" +
                        euc(nodePath) +
                        "&expanded=" +
                        euc(expanded);

                    return doPost(this, url, null);
                },

                /**
                 * Adds a code table entry and sets the specified field's value to the new code table entry.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and field to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the field to be updated.
                 *
                 * @param {String} fieldName
                 * The name of the field to be updated.
                 *
                 * @param {String|Number|Boolean|Object} codeTableEntryDescription
                 * The description of the code table entry to add.
                 *
                 * @return {promise}
                 */
                addCodeTableEntry: function (formSessionId, modelInstanceId, fieldName, codeTableEntryDescription) {

                    var url = buildSvcBaseUrl(this, "addCodeTableEntry", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, codeTableEntryDescription);
                },

                /**
                 * Deletes an item from a collection field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and field to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the field to be updated.
                 *
                 * @param {String} fieldName
                 * The name of the collection field containing the item to be deleted.
                 *
                 * @param {String} itemInstanceId
                 * The ID of the item to be deleted.
                 *
                 * @return {promise}
                 */
                deleteCollectionItem: function (formSessionId, modelInstanceId, fieldName, itemInstanceId) {

                    var url = buildSvcBaseUrl(this, "deleteCollectionItem", formSessionId, modelInstanceId, fieldName) +
                        "&itemInstanceId=" +
                        euc(itemInstanceId);

                    return doPost(this, url, null);
                },

                /**
                 * Deletes items from a collection field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and field to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the field to be updated.
                 *
                 * @param {String} fieldName
                 * The name of the collection field containing the item to be deleted.
                 *
                 * @param {String[]} itemInstanceIds
                 * The items to be deleted.
                 *
                 * @return {promise}
                 */
                deleteCollectionItems: function (formSessionId, modelInstanceId, fieldName, itemInstanceIds) {

                    var url = buildSvcBaseUrl(this, "deleteCollectionItems", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, itemInstanceIds);
                },

                /**
                 * Deletes all selected items from a collection field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and field to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the field to be updated.
                 *
                 * @param {String} fieldName
                 * The name of the collection field containing the item to be deleted.
                 *
                 * @return {promise}
                 */
                deleteSelectedCollectionItems: function (formSessionId, modelInstanceId, fieldName) {

                    var url = buildSvcBaseUrl(this, "deleteSelectedCollectionItems", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, null);
                },

                /**
                 * Selects or de-selects an item in a collection field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and field to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the field to be updated.
                 *
                 * @param {String} fieldName
                 * The name of the collection field to be updated.
                 *
                 * @param {String} itemInstanceId
                 * The ID of the item.
                 *
                 * @param {Boolean} selected
                 * The selected state of the item.
                 *
                 * @return {promise}
                 */
                setCollectionItemSelected: function (formSessionId, modelInstanceId, fieldName, itemInstanceId, selected) {

                    var url = buildSvcBaseUrl(this, "selectCollectionItem", formSessionId, modelInstanceId, fieldName) +
                        "&itemInstanceId=" +
                        euc(itemInstanceId) +
                        "&selected=" +
                        (selected ? "true" : "false");

                    return doPost(this, url, null);
                },

                /**
                 * Moves an item to a different position in the collection.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and field to be updated.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the field to be updated.
                 *
                 * @param {String} fieldName
                 * The name of the collection field to be updated.
                 *
                 * @param {String} itemInstanceId
                 * The ID of the item.
                 *
                 * @param {Number} newIndex
                 * The new index (zero-based) for the item.
                 *
                 * @return {promise}
                 */
                moveCollectionItem: function (formSessionId, modelInstanceId, fieldName, itemInstanceId, newIndex) {

                    var url = buildSvcBaseUrl(this, "moveCollectionItem", formSessionId, modelInstanceId, fieldName) +
                        "&itemInstanceId=" +
                        euc(itemInstanceId) +
                        "&newindex=" +
                        euc(newIndex);

                    return doPost(this, url, null);
                },

                /**
                 * Saves the form instance on the server.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session to save.
                 *
                 * @param {Object} [options]
                 * An object literal that may contain any of the following properties:
                 *
                 * @param {Boolean} [options.returnDataFormItem]
                 * Flag indicating whether the data form item XML should be returned with the save result.  For backwards compatibility with the Windows ClickOnce shell.
                 *
                 * @param {Boolean} [options.storeDataFormItem]
                 *
                 * @param {Boolean} [options.skipValidate]
                 *
                 * @return {promise}
                 */
                confirmForm: function (formSessionId, options) {

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

                    return doPost(this, url, null);
                },

                /**
                 * Cancels the form instance on the server and removes it from the session.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session to cancel.
                 *
                 * @param {Boolean} overrideDirty
                 * Flag indicating whether to cancel the form even if its values have changed since it was created.
                 *
                 * @return {promise}
                 */
                cancelSession: function (formSessionId, overrideDirty) {

                    var url;

                    url = buildSvcBaseUrl(this, "closeFormSession", formSessionId);
                    url += "&canceling=true";

                    if (overrideDirty) {
                        url += "&overridedirty=true";
                    }

                    return doPost(this, url, null);
                },

                /**
                 * Sends a response to a prompt to the server.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that caused the prompt.
                 *
                 * @param {String} modelInstanceId
                 * ID of the model instance that caused the prompt.
                 *
                 * @param {String} promptId
                 * The ID of the prompt being responded to.
                 *
                 * @param {String|Number|Boolean|Object} response
                 * The prompt response.
                 *
                 * @return {promise}
                 */
                handlePrompt: function (formSessionId, modelInstanceId, promptId, response) {

                    var url = buildSvcBaseUrl(this, "handlePrompt", formSessionId, modelInstanceId) +
                        "&promptId=" +
                        euc(promptId);

                    return doPost(this, url, response);
                },

                /**
                 * Invokes an action on the server.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the action.
                 *
                 * @param {String} modelInstanceId
                 * ID of the model instance that contains the action.
                 *
                 * @param {String} actionName
                 * Name of the action to invoke.
                 *
                 * @param {Object} [options]
                 * An object literal that may contain any of the following properties:
                 *
                 * @param {Object} [options.parameters]
                 *
                 * @param {Object} [options.defaultValues]
                 *
                 * @param {String} [options.cancelId]
                 *
                 * @return {promise}
                 */
                invokeAction: function (formSessionId, modelInstanceId, actionName, options) {

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

                    return doPost(this, url, data);
                },

                /**
                 * Confirms a child form that was shown as a result of a form action.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session.
                 *
                 * @param {String} modelInstanceId
                 * ID of the model instance that invoked the action.
                 *
                 * @param {String} actionName
                 * Name of the invoked action.
                 *
                 * @param {String} confirmFormSessionId
                 * The ID of the child form session.
                 *
                 * @return {promise}
                 */
                confirmFormAction: function (formSessionId, modelInstanceId, actionName, confirmFormSessionId) {

                    var url = buildSvcBaseUrl(this, "confirmFormAction", formSessionId, modelInstanceId) +
                        "&actionId=" +
                        euc(actionName) +
                        "&confirmFormSessionId=" +
                        euc(confirmFormSessionId);

                    return doPost(this, url, null);
                },

                /**
                 * Cancels a child form that was shown as a result of a form action.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session.
                 *
                 * @param {String} modelInstanceId
                 * ID of the model instance that invoked the action.
                 *
                 * @param {String} actionName
                 * Name of the invoked action.
                 *
                 * @return {promise}
                 */
                cancelFormAction: function (formSessionId, modelInstanceId, actionName) {

                    var url = buildSvcBaseUrl(this, "cancelFormAction", formSessionId, modelInstanceId) +
                        "&actionId=" +
                        euc(actionName);

                    return doPost(this, url, null);

                },

                /**
                 * Server side notification that a close form request is being made.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session.
                 *
                 * @return {promise}
                 */
                notifyFormHidden: function (formSessionId) {

                    var url = buildSvcBaseUrl(this, "notifyFormHidden", formSessionId);

                    return doPost(this, url, null);
                },

                /**
                 * Server side notification that a close form request is being made.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session.
                 *
                 * @return {promise}
                 */
                notifyFormShown: function (formSessionId) {

                    var url = buildSvcBaseUrl(this, "notifyFormShown", formSessionId);

                    return doPost(this, url, null);
                },

                /**
                 * Selects a search list row to represent the value of the search field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} fieldName
                 *
                 * @param {String} start
                 * The starting row which is being requested.  Start + paging size number of rows should be returned.
                 *
                 * @return {promise}
                 */
                invokeCollectionPageChange: function (formSessionId, modelInstanceId, fieldName, start) {

                    var url = buildSvcBaseUrl(this, "invokeCollectionPageChange", formSessionId, modelInstanceId, fieldName) +
                        "&start=" + start;

                    return doPost(this, url, null);
                },

                /**
                 * Selects a search list row to represent the value of the search field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} fieldName
                 *
                 * @param {Object} selectionData
                 * The selection data to be sent to the server. Conforms to the CollectionSelectionModel contract.
                 *
                 * @return {promise}
                 */
                invokeCollectionSelectionUpdate: function (formSessionId, modelInstanceId, fieldName, selectionData) {

                    var url = buildSvcBaseUrl(this, "collectionSelectionUpdate", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, selectionData);
                },

                /**
                 * Selects a search list row to represent the value of the search field.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} fieldName
                 *
                 * @param {String} actionName
                 * The grid field special action name.
                 *
                 * @return {promise}
                 */
                invokeCollectionSpecialAction: function (formSessionId, modelInstanceId, fieldName, actionName) {

                    var url = buildSvcBaseUrl(this, "invokeCollectionSpecialAction", formSessionId, modelInstanceId, fieldName) +
                        "&actionname=" + actionName;

                    return doPost(this, url, null);
                },

                /**
                 * Notifies the UIModel that a file has been selected in the file picker dialog.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} fieldName
                 *
                 * @param {String} fileName
                 * The name of the newly selected file.
                 *
                 * @return {promise}
                 */
                invokeFileChanged: function (formSessionId, modelInstanceId, fieldName, fileName) {

                    var url = buildSvcBaseUrl(this, "selectFile", formSessionId, modelInstanceId, fieldName);

                    return doPost(this, url, fileName);
                },

                /**
                 * Cancels an action on the server.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the model and search field.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the model instance containing the search field.
                 *
                 * @param {String} fieldId
                 *
                 * @param {String} cancelId
                 * Uniquely identifies the running action on the server.
                 *
                 * @return {promise}
                 */
                cancelAction: function (formSessionId, modelInstanceId, fieldId, cancelId) {

                    var url = buildSvcBaseUrl(this, "cancelAction", formSessionId, modelInstanceId, fieldId) +
                        "&cancelId=" + euc(cancelId);

                    return doPost(this, url, null);
                },

                /**
                 */
                getFieldDataSourceUrl: function (formSessionId, modelInstanceId, fieldName) {
                    return buildSvcBaseUrl(this, "getFieldDataSource", formSessionId, modelInstanceId, fieldName);
                },

                /**
                 */
                getFieldDataSource: function (formSessionId, modelInstanceId, fieldName) {
                    var url = buildSvcBaseUrl(this, "getFieldDataSource", formSessionId, modelInstanceId, fieldName);
                    return doGet(this, url);
                },

                /**
                 */
                getFieldImageUrl: function (formSessionId, modelInstanceId, fieldName) {
                    return buildSvcBaseUrl(this, "getFieldImage", formSessionId, modelInstanceId, fieldName);
                },

                /**
                 */
                getFieldFileUrl: function (formSessionId, modelInstanceId, fieldName, options) {
                    var url;

                    url = buildSvcBaseUrl(this, "getFieldFile", formSessionId, modelInstanceId, fieldName);

                    if (options && options.fileName) {
                        url += "&fileName=" + euc(options.fileName);
                    }

                    return url;
                },

                /**
                 */
                getCustomFileUrl: function (formSessionId, modelInstanceId, key, fileName) {
                    var url;

                    url = buildSvcBaseUrl(this, "getCustomFile", formSessionId, modelInstanceId) +
                        "&key=" +
                        euc(key) +
                        "&fileName=" + euc(fileName);

                    return url;
                },

                /**
                 */
                getUploadFieldImageUrl: function (formSessionId, modelInstanceId, fieldName, thumbnailFieldName) {
                    var url;

                    url = buildSvcBaseUrl(this, "uploadFieldImage", formSessionId, modelInstanceId, fieldName);

                    if (thumbnailFieldName) {
                        url += "&thumbnailFieldId=" + euc(thumbnailFieldName);
                    }

                    return url;
                },

                /**
                 * Gets the upload url for a file field.
                 *
                 * @param {String} fieldName
                 * The name of the file field.
                 *
                 * @param {String} fileUploadKey
                 * A unique ID to identify this upload instance.
                 *
                 * @param {Boolean} useChunkingUrl
                 * Whether or not to return a base url that can be used for breaking up a file into multiple smaller uploads.
                 *
                 * @return {String}
                 */
                getUploadFieldFileUrl: function (fieldName, fileUploadKey, useChunkingUrl) {

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

                /**
                 */
                createSearchListAddFormSession: function (dataFormSessionId,
                    dataFormModelInstanceId,
                    dataFormFieldName,
                    searchFormSessionId,
                    searchModelInstanceId,
                    dataFormInstanceId) {

                    var url = buildSvcBaseUrl(this, "searchListAddFormInvoke", dataFormSessionId, dataFormModelInstanceId, dataFormFieldName) +
                        "&dataFormInstanceId=" + euc(dataFormInstanceId) +
                        "&searchFormSessionId=" + euc(searchFormSessionId) +
                        "&searchModelInstanceId=" + euc(searchModelInstanceId);

                    return doPost(this, url, null);
                },

                /**
                 */
                createSearchListActionAddFormSession: function (dataFormSessionId,
                    dataFormModelInstanceId,
                    dataFormActionName,
                    searchFormSessionId,
                    searchModelInstanceId,
                    dataFormInstanceId) {

                    var url = buildSvcBaseUrl(this, "actionSearchListAddFormInvoke", dataFormSessionId, dataFormModelInstanceId) +
                        "&actionId=" + euc(dataFormActionName) +
                        "&dataFormInstanceId=" + euc(dataFormInstanceId) +
                        "&searchFormSessionId=" + euc(searchFormSessionId) +
                        "&searchModelInstanceId=" + euc(searchModelInstanceId);

                    return doPost(this, url, null);
                },

                /**
                 */
                confirmSearchListAddForm: function (formSessionId,
                    modelInstanceId,
                    fieldName,
                    confirmFormSessionId,
                    ignoreConcurrency) {

                    var url = buildSvcBaseUrl(this, "searchListAddFormConfirm", formSessionId, modelInstanceId, fieldName) +
                        "&confirmFormSessionId=" + euc(confirmFormSessionId) +
                        "&ignoreConcurrency=" + euc(ignoreConcurrency);

                    return doPost(this, url, null);
                },

                /**
                 */
                confirmSearchListActionAddForm: function (formSessionId,
                    modelInstanceId,
                    actionName,
                    confirmFormSessionId,
                    ignoreConcurrency) {

                    var url = buildSvcBaseUrl(this, "actionSearchListAddFormConfirm", formSessionId, modelInstanceId) +
                        "&actionId=" + euc(actionName) +
                        "&confirmFormSessionId=" + euc(confirmFormSessionId) +
                        "&ignoreConcurrency=" + euc(ignoreConcurrency);

                    return doPost(this, url, null);
                },

                /**
                 */
                confirmSearchListAddQuery: function (formSessionId, modelInstanceId, fieldName, queryInstanceId, selectionId) {
                    var url = buildSvcBaseUrl(this, "searchListAddQueryConfirm", formSessionId, modelInstanceId) +
                        "&fieldId=" +
                        euc(fieldName) +
                        "&queryInstanceId=" +
                        euc(queryInstanceId) +
                        "&selectionId=" +
                        euc(selectionId);

                    return doPost(this, url, null);
                },

                /**
                 */
                confirmQueryAction: function (formSessionId, modelInstanceId, actionName, queryInstanceId, selectionId, queryType) {
                    var url = buildSvcBaseUrl(this, "confirmQueryAction", formSessionId, modelInstanceId) +
                        "&actionId=" +
                        euc(actionName) +
                        "&queryInstanceId=" +
                        euc(queryInstanceId) +
                        "&selectionId=" +
                        euc(selectionId) +
                        "&queryType=" +
                        euc(queryType);

                    return doPost(this, url, null);
                },

                /**
                 */
                confirmSearchListAddExportDefinition: function (formSessionId, modelInstanceId, fieldName, exportDefinitionId) {
                    var url = buildSvcBaseUrl(this, "searchListAddExportDefinitionConfirm", formSessionId, modelInstanceId) +
                        "&fieldId=" +
                        euc(fieldName) +
                        "&exportDefinitionId=" +
                        euc(exportDefinitionId);

                    return doPost(this, url, null);
                },

                /**
                 */
                confirmExportDefinitionAction: function (formSessionId, modelInstanceId, actionName, exportDefinitionId) {
                    var url = buildSvcBaseUrl(this, "confirmExportDefinitionAction", formSessionId, modelInstanceId) +
                        "&actionId=" +
                        euc(actionName) +
                        "&exportDefinitionId=" +
                        euc(exportDefinitionId);

                    return doPost(this, url, null);
                },

                /**
                 * Resets the values in the form instance.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the form instance.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the form model.
                 *
                 * @return {promise}
                 */
                resetFormSession: function (formSessionId, modelInstanceId) {

                    var url = buildSvcBaseUrl(this, "resetFormSession", formSessionId, modelInstanceId);

                    return doPost(this, url, null);
                },

                /**
                 * Refreshes the form with the latest data.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the form instance.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the form model.
                 *
                 * @return {promise}
                 */
                refreshFormSession: function (formSessionId, modelInstanceId) {

                    var url = buildSvcBaseUrl(this, "refreshFormSession", formSessionId, modelInstanceId);

                    return doPost(this, url, null);
                },

                /**
                 * Notifies the server that a duplicate record has been selected in the context of a form session instead of creating a new record.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session that contains the form instance.
                 *
                 * @param {String} modelInstanceId
                 * The ID of the form model.
                 *
                 * @param {String} recordId
                 * The ID of the duplicate record.
                 *
                 * @return {promise}
                 */
                selectDuplicateRecord: function (formSessionId, modelInstanceId, recordId) {

                    var url = buildSvcBaseUrl(this, "selectDuplicateRecord", formSessionId, modelInstanceId) +
                        "&selectedRecordId=" + euc(recordId);

                    return doPost(this, url, null);
                },

                /**
                 * Starts a business process on the server with the information contained in the form session.
                 *
                 * @param {String} businessProcessId
                 * The ID of the business process to start.
                 *
                 * @param {String} parameterSetId
                 * The ID of the parameter set for the business process.
                 *
                 * @param {String} dataFormItemKey
                 * The key of the data form item stored on the server.
                 *
                 * @param {Object} [options]
                 * An object literal that may contain any of the following properties:
                 *
                 * @param {String} [options.businessProcessStatusId]
                 *
                 * @param {Object} [options.values]
                 *
                 * @return {promise}
                 */
                startBusinessProcess: function (businessProcessId, parameterSetId, dataFormItemKey, options) {

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

                    return doPost(this, url, data);
                },

                /**
                 */
                selectDuplicateRecordAction: function (formSessionId, modelInstanceId, actionName, duplicateFormSessionId, recordId) {
                    var url = buildSvcBaseUrl(this, "selectDuplicateRecordAction", formSessionId, modelInstanceId) +
                        "&duplicateFormSessionId=" + euc(duplicateFormSessionId) +
                        "&actionId=" + euc(actionName) +
                        "&selectedRecordId=" + euc(recordId);

                    return doPost(this, url, null);
                },

                /**
                 */
                invokeRelationshipMapNodeAction: function (formSessionId, modelInstanceId, fieldId, nodeId, actionName) {
                    var url = buildSvcBaseUrl(this, "relationshipMapNodeInvokeAction", formSessionId, modelInstanceId, fieldId) +
                        "&nodeId=" + euc(nodeId) +
                        "&actionName=" + euc(actionName);

                    return doPost(this, url, null);
                },

                /**
                 */
                buildReportHostUrl: function (reportId, options) {
                    var url;

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

                /**
                 * Performs validation on a form session.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session to validate.
                 *
                 * @return {promise}
                 */
                validateFormSession: function (formSessionId) {

                    var url;

                    url = buildSvcBaseUrl(this, "validateformsession", formSessionId);

                    return doPost(this, url, null);
                },

                /**
                 */
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

                /**
                 * returns dataform item for a given form session and model instance.
                 *
                 * @param {String} formSessionId
                 * The ID of the form session to validate.
                 *
                 * @param {String} modelInstanceId
                 *
                 * @return {promise}
                 */
                getFormSessionDataFormItemXml: function (formSessionId, modelInstanceId) {

                    var url = buildSvcBaseUrl(this, "getFormSessionDataFormItemXml", formSessionId, modelInstanceId);

                    return doGet(this, url);
                },

                /**
                 */
                reportActionFormSaved: function (formSessionId, modelInstanceId, actionName) {

                    var url = buildSvcBaseUrl(this, "reportActionFormSaved", formSessionId, modelInstanceId) +
                        "&actionId=" + euc(actionName);

                    return doPost(this, url, null);
                },

                /**
                 */
                clearParameterDetail: function (formSessionId, modelInstanceId, parameterDetailName) {
                    var url;

                    url = buildSvcBaseUrl(this, "clearParameterDetail") +
                        "&formSessionId=" + euc(formSessionId) +
                        "&modelInstanceId=" + euc(modelInstanceId) +
                        "&parameterDetailName=" + euc(parameterDetailName);

                    return doPost(this, url, null);
                },

                /**
                 */
                cancelAsyncOperation: function (cancelId) {

                    var url = BBUI.urlConcat(this.baseUrl, "uimodel/UIModelingCancelAsyncOperation.ashx?databaseName=") +
                        euc(this.databaseName) +
                        "&cancelId=" +
                        euc(cancelId);

                    return doGet(this, url);
                }
            };

            /**
             * @class bbui.uimodelingservice.bbuiUIModelingService
             *
             */
            return {
                /**
                 * Create an instance of the UIModeling service.
                 *
                 * @param {String} [baseUrl=bbuiUIModelingServiceConfig.baseUrl]
                 *
                 * @param {String} [databaseName=bbuiUIModelingServiceConfig.databaseName]
                 *
                 * @param {Object} [options]
                 *
                 * @param {Object} options.runAs
                 *
                 * @param {Object} options.onRequestBegin
                 *
                 * @param {Object} options.onRequestEnd
                 *
                 * @param {Object} options.httpHeaders
                 *
                 * @param {Object} options.useEventQueue
                 *
                 * @return {bbui.uimodelingservice.bbuiUIModelingService.Service}
                 * @return {Object} return.http
                 * $http TODO this property is referenced via `$http`, not `http`. Need to get docs to render properly.
                 */
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
