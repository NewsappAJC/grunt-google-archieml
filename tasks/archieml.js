'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks


  grunt.registerMultiTask('archieml', 'Parses google docs and downloads as json', function() {

    var done = this.async();

    var options = this.options();

    var fs = require('fs');
    var readline = require('readline');
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');
    var archieml = require('archieml');
    var htmlparser = require('htmlparser2');
    var Entities = require('html-entities').AllHtmlEntities;

    var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
    var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
        process.env.USERPROFILE) + '/.credentials/';
    var TOKEN_PATH = TOKEN_DIR + 'drive-api-quickstart.json';
    var file_key = options.fileID;

    var credentials = grunt.file.readJSON(options.credentials);


    authorize(credentials, download);



    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
      var clientSecret = credentials.web.client_secret;
      var clientId = credentials.web.client_id;
      var redirectUrl = credentials.web.redirect_uris[0];
      var auth = new googleAuth();
      var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

      // Check if we have previously stored a token.
      var token = grunt.file.readJSON(TOKEN_PATH);

      if (!token) {
        getNewToken(oauth2Client, callback);
      } else {
        oauth2Client.credentials = token;
        callback(oauth2Client);
      }
      
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     *
     * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback to call with the authorized
     *     client.
     */
    function getNewToken(oauth2Client, callback) {
      var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
      });
      grunt.log.write('Authorize this app by visiting this url: ', authUrl);
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
          if (err) {
            grunt.log.write('Error while trying to retrieve access token', err);
            return;
          }
          oauth2Client.credentials = token;
          storeToken(token);
          callback(oauth2Client);
        });
      });
    }

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */
    function storeToken(token) {
      try {
        grunt.file.mkdir(TOKEN_DIR);
      } catch (err) {
        if (err.code != 'EEXIST') {
          throw err;
        }
      }
      grunt.file.write(TOKEN_PATH, JSON.stringify(token));
      grunt.log.write('Token stored to ' + TOKEN_PATH);
    }


    // parse google doc for archieML
    function download(auth){

      if (!grunt.file.isDir('archie')){
        grunt.file.mkdir('archie');
      }

      var drive = google.drive({ version: 'v2', auth: auth });

      // grunt.file.write(drive);

      drive.files.get({fileId: file_key}, function (err, doc) {
        var doc_name = doc.title;
        var export_links = doc.exportLinks['text/html'];
        auth._makeRequest({method: "GET", uri: export_links}, function(err, body) {

          var handler = new htmlparser.DomHandler(function(error, dom) {
            var tagHandlers = {
              _base: function (tag) {
                var str = '';
                tag.children.forEach(function(child) {
                  var func = tagHandlers[child.name || child.type];
                  if (func) str += func(child);      
                });
                return str;
              },
              text: function (textTag) { 
                return textTag.data; 
              },
              span: function (spanTag) {
                return tagHandlers._base(spanTag);
              },
              p: function (pTag) { 
                return tagHandlers._base(pTag) + '\n'; 
              },
              a: function (aTag) {
                var href = aTag.attribs.href;
                if (href === undefined) return '';

                // extract real URLs from Google's tracking
                // from: http://www.google.com/url?q=http%3A%2F%2Fwww.nytimes.com...
                // to: http://www.nytimes.com...
                if (aTag.attribs.href && url.parse(aTag.attribs.href,true).query && url.parse(aTag.attribs.href,true).query.q) {
                  href = url.parse(aTag.attribs.href,true).query.q;
                }

                var str = '<a href="' + href + '">';
                str += tagHandlers._base(aTag);
                str += '</a>';
                return str;
              },
              li: function (tag) {
                return '* ' + tagHandlers._base(tag) + '\n';
              }
            };

            ['ul', 'ol'].forEach(function(tag) {
              tagHandlers[tag] = tagHandlers.span;
            });
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(function(tag) {
              tagHandlers[tag] = tagHandlers.p;
            });

            var _body = dom[0].children[1];
            var parsedText = tagHandlers._base(_body);

            // Convert html entities into the characters as they exist in the google doc
            var entities = new Entities();
            parsedText = entities.decode(parsedText);

            // Remove smart quotes from inside tags
            parsedText = parsedText.replace(/<[^<>]*>/g, function(match){
              return match.replace(/”|“/g, '"').replace(/‘|’/g, "'");
            });

            var parsed = archieml.load(parsedText);
            grunt.file.write('archie/text.json',JSON.stringify(parsed, null, 4));

          });

          var parser = new htmlparser.Parser(handler);
          parser.write(body);
          parser.done();
        });
      });
    };
  
  });
};