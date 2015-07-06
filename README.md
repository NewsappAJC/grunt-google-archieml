# grunt-google-archieml

> Generate json from google docs with archieml

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-google-archieml --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-google-archieml');
```

## The "archieml" task

### Overview

This plugin works with [ArchieML] to parse Google Docs and convert them into json files. You'll first have to get your own API credentials to work with Google's OAuth2.0 Drive API. You can do that [here](https://console.developers.google.com/flows/enableapi?apiid=drive) by setting up a new project. Then, go to credentials and set up a new Client ID for OAuth2.0 (for a web application). Set the javascript origins as `https://developers.google.com` and the redirect URIs as `https://developers.google.com/oauthplayground`. When you're done setting it up, download the JSON for your web application's Client ID, and save it inside a `config` directory in your project as `client_secret.json`.

You'll also need the file ID of the Google Doc you've written in ArchieML.


In your project's Gruntfile, add a section named `archieml` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  archieml: {
    options: {
      credentials:'config/client_secrets.json', //or whatever the path is to your google api client secrets
      fileID: 'id_of_google_doc_youre_referencing'
    }
  },
});
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
