/*
 * octofish
 * https://github.com/mattstyles/octofish
 *
 * Content Delivery Module for Viperfish
 * https://github.com/mattstyles/viperfish
 *
 * Copyright (c) 2013 Matt Styles
 * Licensed under the MIT license.
 */

// Add external dependencies
var GithubApi    = require( 'github' );



/* -----------------------------------------------------------------------
 *
 *     Private octofish object
 *     Contains functions that are private to octofish so they are
 *     namespaced and don't interfere with core
 *
 * ----------------------------------------------------------------------- */
var octofish = {};

// Add the config to the octofish object
octofish.config = require( './octo-config' );

octofish = {

    // Register the config object that was collected from octo-config.js
    config: octofish.config,

    // Set up githubapi
    github: new GithubApi( octofish.config.apiOpts ),

    /**
     * decodes the data returned from a github api query
     * @param data - base64 encoded response from querying github for content
     * @returns buffer containing a string representation of the base64 encoded query data
     */
    decodeGithubData: function( data ) {
        return new Buffer(data, 'base64').toString('utf8');
    },

    /**
     * decodes github image data from base64 to binary
     * @param data - base64 encoded response from querying github for content
     * @return buffer containing a binary representation of the base64 encoded image
     */
    decodeGithubImageData: function( data ) {
        return new Buffer( data, 'base64').toString( 'binary' );
    },

    /**
     * setPath
     * sets the path for retrieving a file from github
     * @param path
     */
    setContentPath: function( path ) {
        octofish.config.contentOpts.path = path;
    }
};



/* -----------------------------------------------------------------------
 *
 *     Expose the public API
 *     These functions will be used to extend and overwrite core functions
 *
 * ----------------------------------------------------------------------- */
module.exports = {
    /**
     * getContent
     * gets the content from github repo set up in config
     * @param cb - the callback to fire on success - passes in the collected data
     */
    getContent: function( path, cb ) {
        // Set the content path
        octofish.setContentPath( path );

        // Use the content path to retrieve content
        octofish.github.repos.getContent( octofish.config.contentOpts, function ( err, res ) {

            var data = null;

            // Handle any error
            if (err) {
                // Log the error - not a very useful log at the moment
                console.log( 'An error occured whilst getting content from github - this should be dealt with properly' );
                console.log( 'It is most likely a URL error with the path' );

                // Call the callback with a null value to denote an error
                cb( data );
                return;
            }

            // Decode the data before sending on to the callback
            // Check for decoding an image
            if ( octofish.config.contentOpts.path.match(/img/) ) {
                data = octofish.decodeGithubImageData( res.content );
            } else {
                data = octofish.decodeGithubData( res.content );
            }

            // If the content was collected successfully then call the callback and remember to pass in the data
            cb( data );
        });
    },

    /**
     * authGithub
     * Grabs the environment variables or config variables and uses them to authenticate with github
     * It is possible to be aiming for oauth authentication but end up with basic authentication but it's an edge
     * case and quite hard to do by accident (there is no problem with doing it by accident)
     */
    authorise: function( cb_success, cb_failure ) {
        // Create auth object ready to be populated
        var auth = {};

        /**
         * Gets the correct method for building an authentication object to pass to github
         * @param authType { basic || oauth }
         * @return calls the correct function for building an auth object || null
         */
        var startAuth = function( authType ) {
            switch ( authType.toLowerCase() ) {
                case 'basic':
                    console.log( 'Attempting to use basic authorisation' );
                    getBasicAuth() ? cb_success() : cb_failure();
                    break;

                case 'oauth':
                    console.log( 'Using oAuth to authenticate' );
                    return getOAuth();
                    break;

                default:
                    console.warn( 'Incorrect authorisation type passed to Octofish' );
                    console.warn( 'Authorisation to github will be unauthorised' );

                    cb_failure();
                    return false;
            }

            return true;
        };

        var storeAuth = function( auth ) {
//            octofish.github.authenticate( {
//                type: 'oauth',
//                token: res.token
//            });
            octofish.github.authenticate( auth );
        };

        /**
         * Completes basic authorisation or returns null
         * @return auth object or null
         */
        var getBasicAuth = function() {
            auth.type = 'basic';

            auth.username = process.env.GHusername || octofish.config.auth.username || null;
            auth.password = process.env.GHpassword || octofish.config.auth.password || null;

            if ( !auth.password || !auth.username ) {
                return false;
            } else {
                octofish.github.authenticate( auth );
                return true;
            }
        };

        /**
         * Creates the auth object if it can
         * Otherwise it returns null
         * @return auth object or null
         */
        var getOAuth = function() {
            auth.type = 'oauth';

            // If a valid token has been passed then just use that to authenticate
            if ( octofish.config.auth.token ) {
                auth.token = octofish.config.auth.token;
                storeAuth( auth );
                cb_success();
                return;
            }

            // If we got here then we'll have to request a valid token from github which will require basic authentication
            // Perform basic authorisation and bail on fail
            if ( !getBasicAuth() ) {            // todo this does not work as it only validates that a username and password have been given, not that they are correct
                console.warn('Basic auth is required to use oAuth but...' );
                console.warn( 'Basic authentication failed --- can not proceed with oauth' );
                cb_failure();
                return;
            }

            // Build oauth object to authenticate with
            auth.client_ID = process.env.oauthKEY || octofish.config.auth.KEY || '';
            auth.client_secret = process.env.oauthSECRET || octofish.config.auth.SECRET || '';
            octofish.config.auth.scope ? auth.scopes = octofish.config.auth.scope.split(',') : '';

            // Authenticate using oauth
            octofish.github.authorization.create( auth, function( err, res) {
                if ( err ) {
                    console.warn( 'Error using oAuth' );
                    console.log( 'oAuth object used to authenticate: ');
                    console.dir( auth );
                    console.log( 'Error returned: ');
                    console.log( err );
                    return;
                }

                console.log( 'Authenticating to github with oAuth --- success' );
                auth.token = res.token;
                storeAuth( auth );

                cb_success();
            });
        };

        // Get the authentication data
        startAuth( octofish.config.auth.type );
    }
};
