# Start a project

This tutorial builds on the SKY UX [Getting Started guide](http://skyux.developer.blackbaud.com/getting-started/start-a-project/) and guides you through the process to create a basic application with SKY UX and bbui-angular. We start with a blank HTML page and proceed to create a fully functioning application.

## Create a page

Let's start with a basic HTML page that includes SKY UX. To simplify HTTP requests to ***Blackbaud CRM***, let's set up the page inside the ***Blackbaud CRM*** virtual directory at [http://localhost/bbappfx/sky/custom/myapp](http://localhost/bbappfx/sky/custom/myapp). This avoids CORS and web.config issues during development.

If your environment has a different virtual directory name, just replace any instance of `bbappfx` with your virtual directory name. And if ***Blackbaud CRM*** is not deployed locally, replace `localhost` with the name of the machine to access.

First, create a folder and add an HTML file called `index.html`. To ensure that the page renders correctly in all modern browsers, start with the following boilerplate HTML:

<pre><code>&lt;!DOCTYPE html>
&lt;html charset="utf-8">
  &lt;head>
    &lt;meta http-equiv="X-UA-Compatible" content="IE=edge">
    &lt;title>My First bbui-angular App&lt;/title>
  &lt;/head>
  &lt;body>

  &lt;/body>
&lt;/html></code></pre>

Next, to add SKY UX to the page, point to SKY UX via the Blackbaud SKY CDN.

**Note:** If you prefer to host SKY UX yourself, you may install it with [Bower](http://bower.io/) or [NPM](https://www.npmjs.com/package/blackbaud-skyux) instead of pointing to the CDN. See the [SKY UX GitHub page](https://github.com/blackbaud/skyux/) for instructions to install with Bower or NPM.

<pre><code>&lt;!DOCTYPE html>
&lt;html charset="utf-8">
  &lt;head>
    &lt;meta http-equiv="X-UA-Compatible" content="IE=edge">
    &lt;title>My First bbui-angular App&lt;/title>
    &lt;link rel="stylesheet" href="https://sky.blackbaudcdn.net/skyux/1.6.6/css/sky-bundle.css" integrity="sha384-0qQTcXi3TFJvyqm3IBveZiYW0GHbY8LuphtukDr6FkZdy6FEXIHdQ6yF6Z3GUbvK" crossorigin="anonymous">
  &lt;/head>
  &lt;body>
    &lt;script src="https://sky.blackbaudcdn.net/skyux/1.6.6/js/sky-bundle.min.js" integrity="sha384-DD+Y69jYPzp2eVhGSZyfXyW+TxZpImxAF4T16WyV4YVpycGhkUVzOiCE0jKscve/" crossorigin="anonymous">&lt;/script>
  &lt;/body>
&lt;/html></code></pre>

Next, add bbui-angular to the page.

<pre><code>&lt;!DOCTYPE html>
&lt;html charset="utf-8">
  &lt;head>
    &lt;meta http-equiv="X-UA-Compatible" content="IE=edge">
    &lt;title>My First bbui-angular App&lt;/title>
    &lt;link rel="stylesheet" href="https://sky.blackbaudcdn.net/skyux/1.6.6/css/sky-bundle.css" integrity="sha384-0qQTcXi3TFJvyqm3IBveZiYW0GHbY8LuphtukDr6FkZdy6FEXIHdQ6yF6Z3GUbvK" crossorigin="anonymous">
  &lt;/head>
  &lt;body>
    &lt;script src="https://sky.blackbaudcdn.net/skyux/1.6.6/js/sky-bundle.min.js" integrity="sha384-DD+Y69jYPzp2eVhGSZyfXyW+TxZpImxAF4T16WyV4YVpycGhkUVzOiCE0jKscve/" crossorigin="anonymous">&lt;/script>
    &lt;script src="bower_components/bbui-angular/dist/js/bbui.js">&lt;/script>
  &lt;/body>
&lt;/html></code></pre>

## Web.config

You need to create a web.config to turn on anonymous authentication for this page. If you don't allow anonymous authentication, users are prompted to log in before they get to your page and, with some authentication set ups, have to log in a second time.

<pre><code>
&lt;configuration>
	&lt;location path="index.html">
		&lt;system.webServer>
			&lt;security>
				&lt;authentication>
					&lt;basicAuthentication enabled="false" />
					&lt;anonymousAuthentication enabled="true" />
					&lt;windowsAuthentication enabled="false" />
				&lt;/authentication>
			&lt;/security>
		&lt;/system.webServer>
	&lt;/location>
	&lt;location path="js/index.js">
		&lt;system.webServer>
			&lt;security>
				&lt;authentication>
					&lt;basicAuthentication enabled="false" />
					&lt;anonymousAuthentication enabled="true" />
					&lt;windowsAuthentication enabled="false" />
				&lt;/authentication>
			&lt;/security>
		&lt;/system.webServer>
	&lt;/location>
    &lt;location path="bower_components/bbui-angular/dist/js/bbui.js">
		&lt;system.webServer>
			&lt;security>
				&lt;authentication>
					&lt;basicAuthentication enabled="false" />
					&lt;anonymousAuthentication enabled="true" />
					&lt;windowsAuthentication enabled="false" />
				&lt;/authentication>
			&lt;/security>
		&lt;/system.webServer>
	&lt;/location>
&lt;/configuration>
</code></pre>

You should now be able to access your page in a web browser. Check the browser's console to make sure no errors occur.

## Add content to the page

### Simple HTML elements

Let's brighten things up a bit by adding a button to the page. SKY UX is based on Bootstrap, so we can use all [standard Bootstrap CSS classes](http://getbootstrap.com/css/).

Add a `div` tag within your page's `<body>` element and use the `class` attribute to wrap the button in the Bootstrap CSS class `.container-fluid` and the SKY UX CSS class `.bb-page-content`. These classes separate the content from the navbar and the edges of the browser window.

**Note:** For brevity, the remaining code samples omit the boilerplate HTML and just show the code to add to your page's `<body>` element.

<pre><code class="language-markup">&lt;div class="container-fluid bb-page-content">
  &lt;button type="button" class="btn btn-primary">Hello World&lt;/button>
&lt;/div>
</code></pre>

While the button respects the Bootstrap `btn-primary` class, it looks a little different than the default Bootstrap button. SKY UX overrides Bootstrap styles with its own styles to create a unique user interface that still takes advantage of the responsive nature of its Bootstrap core.

### AngularJS directives

Of course, SKY UX is more than just CSS. It also features an [extensive library](http://skyux.developer.blackbaud.com/components/) of [AngularJS](https://angularjs.org/) components. To use these, your page must define an Angular application.

In the page's `html` element, add an `ng-app` attribute, but don't refresh your browser just yet.

<pre><code class="language-markup">&lt;html charset="utf-8" ng-app="skytutorial"&gt;</code></pre>

To define `skytutorial` as an Angular module in JavaScript so that Angular knows what to wire up to your HTML page, create an `index.js` file in a `js` folder next to `index.html` at the root of your project. Add a reference to your `index.js` to the bottom of the `<body>` element.

<pre><code class="language-markup">&lt;script src="js/index.js"&gt;&lt;/script&gt;</code></pre>

In the `index.js` file, add the `sky` and `bbui` modules as dependencies on your `skytutorial` module by putting them in brackets as the second argument to `angular.module()`. This ensures that all SKY UX and bbui-angular functionality is available to your Angular application.

<pre><code class="language-javascript">(function () {
  'use strict';

  angular.module('skytutorial', ['sky', 'bbui']);
}());</code></pre>

Now that our page is a proper Angular application, we can add Angular components. Let's start with the navbar. Don't worry too much about what all this HTML does for now. I just copied it from the [navbar documentation](http://skyux.developer.blackbaud.com/components/navbar/) and pasted it here as-is. Copy the following HTML and paste it immediately after your opening `<body>` tag.

<pre><code class="language-markup">&lt;bb-navbar>
  &lt;div class="container-fluid">
    &lt;ul class="nav navbar-nav navbar-left">
      &lt;li class="bb-navbar-active">&lt;a href="">Selected Item&lt;/a>&lt;/li>
      &lt;li class="dropdown">
        &lt;a href="" class="dropdown-toggle" role="button">Child Items &lt;span class="caret">&lt;/span>&lt;/a>
        &lt;ul class="dropdown-menu" role="menu">
          &lt;li>
            &lt;a href="">Child Item 1&lt;/a>
          &lt;/li>
          &lt;li>
            &lt;a href="">Child Item 2&lt;/a>
          &lt;/li>
          &lt;li>
            &lt;a href="">Child Item 3&lt;/a>
          &lt;/li>
        &lt;/ul>
      &lt;/li>
    &lt;/ul>
    &lt;ul class="nav navbar-nav navbar-right">
      &lt;li>&lt;a href="">Right Item&lt;/a>&lt;/li>
    &lt;/ul>
  &lt;/div>
&lt;/bb-navbar>
</code></pre>

At this point, your HTML file should look like this:

<pre><code class="language-markup">&lt;!DOCTYPE html>
&lt;html charset="utf-8" ng-app="skytutorial">
&lt;head>
  &lt;meta http-equiv="X-UA-Compatible" content="IE=edge">
  &lt;title>My First SKY UX App&lt;/title>
  &lt;link rel="stylesheet" href="https://sky.blackbaudcdn.net/skyux/1.6.6/css/sky-bundle.css" integrity="sha384-0qQTcXi3TFJvyqm3IBveZiYW0GHbY8LuphtukDr6FkZdy6FEXIHdQ6yF6Z3GUbvK" crossorigin="anonymous">
&lt;/head>
&lt;body>
  &lt;bb-navbar>
    &lt;div class="container-fluid">
      &lt;ul class="nav navbar-nav navbar-left">
        &lt;li class="bb-navbar-active">&lt;a href="">Selected Item&lt;/a>&lt;/li>
        &lt;li class="dropdown">
          &lt;a href="" class="dropdown-toggle" role="button">Child Items &lt;span class="caret">&lt;/span>&lt;/a>
          &lt;ul class="dropdown-menu" role="menu">
            &lt;li>
              &lt;a href="">Child Item 1&lt;/a>
            &lt;/li>
            &lt;li>
              &lt;a href="">Child Item 2&lt;/a>
            &lt;/li>
            &lt;li>
              &lt;a href="">Child Item 3&lt;/a>
            &lt;/li>
          &lt;/ul>
        &lt;/li>
      &lt;/ul>
      &lt;ul class="nav navbar-nav navbar-right">
        &lt;li>&lt;a href="">Right Item&lt;/a>&lt;/li>
      &lt;/ul>
    &lt;/div>
  &lt;/bb-navbar>
  &lt;div class="container-fluid bb-page-content">
    &lt;button type="button" class="btn btn-primary">Hello World&lt;/button>
  &lt;/div>
  &lt;script src="https://sky.blackbaudcdn.net/skyux/1.6.6/js/sky-bundle.min.js" integrity="sha384-DD+Y69jYPzp2eVhGSZyfXyW+TxZpImxAF4T16WyV4YVpycGhkUVzOiCE0jKscve/" crossorigin="anonymous">&lt;/script>
  &lt;script src="bower_components/bbui-angular/dist/js/bbui.js">&lt;/script>
  &lt;script src="js/index.js">&lt;/script>
&lt;/body>

&lt;/html></code></pre>

And there you have it! A page that uses both the CSS and Angular components of SKY UX.

<hr>

<p><strong>Next step:</strong> <a href="#!/guide/authentication">Authentication »</a></p>

**Next step:** [Authentication »](#!/guides/authentication)
