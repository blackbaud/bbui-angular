# Create a record page

Now that you've learned how to get a [SKY UX app up and running](https://github.com/blackbaud/bbui-angular/blob/master/documentation/guides/2_start_project/README.md) and you can [authenticate with ***Blackbaud CRM***](https://github.com/blackbaud/bbui-angular/blob/master/documentation/guides/3_authentication/README.md), let's build a page with some content. SKY UX applications feature two common page types: record pages and tabbed pages.

Record pages usually display information about specific records in two distinct sections: a summary section and a tiles section.

## Summary section

### Static values

The summary section resides at the top of the page to provide a general overview of a record. For example, it can display information such as a record name, description, and profile picture. To add a summary section to your page, use the [page summary directive](http://skyux.developer.blackbaud.com/components/pagesummary).

<pre><code class="language-markup">&lt;bb-page-summary>
  &lt;bb-page-summary-image>
    &lt;bb-avatar
      bb-avatar-src="'http://skyux.developer.blackbaud.com/assets/img/hernandez.jpg'">
    &lt;/bb-avatar>
  &lt;/bb-page-summary-image>
  &lt;bb-page-summary-title>
    Robert Hernandez
  &lt;/bb-page-summary-title>
  &lt;bb-page-summary-subtitle>
    CEO, Barkbaud, Inc.
  &lt;/bb-page-summary-subtitle>
  &lt;bb-page-summary-content>
    Robert Hernandez is an important member of our organization.
  &lt;/bb-page-summary-content>
&lt;/bb-page-summary>
</code></pre>

### Dynamic values

Hard-coded values for Robert Hernandez aren't going to be very useful. We want to pull values from a service dynamically.

Add a controller with Robert Hernandez's information to your Angular module:

<pre><code>  angular.module('skytutorial')
  .controller('ConstituentController', [function () {

    return {
      constituent: {
        name: "Robert Hernandez",
        title: "CEO",
        company: "Barkbaud, Inc.",
        alert: "Robert Hernandez is an important member of our organization."
      }
    };

  }]);</code></pre>

Set the controller on a `div` tag, and pull the page values from the controller:

<pre><code>  &lt;div ng-controller="ConstituentController as constitCtrl">
    &lt;bb-page-summary>
      &lt;bb-page-summary-image>
        &lt;bb-avatar
          bb-avatar-src="'http://skyux.developer.blackbaud.com/assets/img/hernandez.jpg'">
        &lt;/bb-avatar>
      &lt;/bb-page-summary-image>
      &lt;bb-page-summary-title>
        {{constitCtrl.constituent.name}}
      &lt;/bb-page-summary-title>
      &lt;bb-page-summary-subtitle>
        {{constitCtrl.constituent.title}}, {{constitCtrl.constituent.company}}
      &lt;/bb-page-summary-subtitle>
      &lt;bb-page-summary-content>
        {{constitCtrl.constituent.alert}}
      &lt;/bb-page-summary-content>
    &lt;/bb-page-summary>
  &lt;div></code></pre>

The content in the `{{` and `}}` brackets is pulled from your Angular service.

### Values from ***Blackbaud CRM***

You can change your Angular service to pull the constituent information from ***Blackbaud CRM***. In this case, we want to pull data from two different forms. Some data in this example is still hard-coded, but it provides the general idea. For a real app, you won't hard-code the constituent ID either; you're more likely to link to a constituent page from a list or search.

<pre><code>
    angular.module('skytutorial')
    .controller('ConstituentController', ['bbuiShellService', '$scope', '$q', function (bbuiShellService, $scope, $q) {

        var self = this,
            svc = bbuiShellService.create(),
            CONSTITUENT_ID = "d445a2c7-f7df-447c-9fb9-c946541cc8b9",
            RELATIONSHIPTILE_ID = "4C7CB597-8DAF-40B0-8DCA-01D632364702",
            CONSTITUENTNAME_VIEW_ID = "3BC0BA15-6BF2-4c6d-A687-56B350A983FE",
            constituent = {
                title: "CEO",
                alert: "Robert Hernandez is an important member of our organization."
            };

        $scope.loading = true;

        function getConstituentAsync() {

            $q.all([
                svc.dataFormLoad(CONSTITUENTNAME_VIEW_ID, {
                    recordId: CONSTITUENT_ID
                }),
                svc.dataFormLoad(RELATIONSHIPTILE_ID, {
                    recordId: CONSTITUENT_ID
                })
            ]).then(function (replies) {

                constituent.name = replies[0].data.values[0].value;
                constituent.company = replies[1].data.values[5].value; // PRIMARYBUSINESSNAME

            }, function (response) {
                alert("Something went wrong!");
                console.error(JSON.stringify(response));
            }).finally(function () {
                $scope.loading = false;
            });

        }

        getConstituentAsync();

        return {
            constituent: constituent
        };

    }]);
</code></pre>

Because requests to ***Blackbaud CRM*** can take some time, it's a good idea to use the SKY UX [wait component](http://skyux.developer.blackbaud.com/components/wait/) to display a spinner to let users know something is happening. In the controller above, we set the `loading` value to `true` when the request starts and to `false` when the request finishes.

`<div ng-controller="ConstituentController as constitCtrl" bb-wait="loading">`

Now you have a SKY UX application that can talk to your ***Blackbaud CRM*** installation! Since we use the web shell service to talk to ***Blackbaud CRM***, security is included. You shouldn't need any additional work to get the security for your application to work just like in ***Blackbaud CRM***. You will use feature specs behind the scenes, so any users who do not have rights to a feature cannot complete calls to that feature.

This means you need to check for feature permissions in some cases. For example, if users do not have rights to an edit form, you should hide or disable the button conditionally. The Infinity web shell handles this kind of permissions for you and only displays features when users have permissions.

<hr>

## Next step

[Navigation »](https://github.com/blackbaud/bbui-angular/blob/master/documentation/guides/5_navigation/README.md)
