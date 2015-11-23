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
