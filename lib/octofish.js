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
var _            = require( 'underscore'),
    GithubApi    = require( 'github' );

/* -----------------------------------------------------------------------
 *
 *     Export the public API
 *     These functions will be used to extend and overwrite core functions
 *
 * ----------------------------------------------------------------------- */
module.exports = {
    /**
     * getContent
     * gets the content from github repo set up in config
     * @param cb - the callback to fire on success - passes in the collected data
     */
    getContent: function( cb ) {
        octofish.github.repos.getContent( octofish.config.githubapi.contentOpts, function ( err, res ) {
            // Handle any error
            if (err) {
                console.log( 'An error occured whilst getting content from github - this should be dealt with properly' );
                console.log( 'Should be displaying a 404 here as the URL is probably invalid' );
                return;
            }

            var data = null;

            // Decode the data before sending on to the callback
            // Check for decoding an image
            if ( octofish.config.githubapi.contentOpts.path.match(/img/) ) {
                data = octofish.decodeGithubImageData( res.content )
            } else {
                data = octofish.decodeGithubData( res.content );
            }

            // If the operation to get content from github was successful then call the callback with only the content
            // This file should actually handle what happens next but for now delegate to a callback
            cb( data );
        });
    },

    /**
     * authGithub
     * Grabs the environment variables and uses them to authenticate with github
     */
    authorise: function() {
        var getAuth = function() {
            var auth = {};

            auth.type = 'basic';
            auth.username = process.env.GHusername || null;
            auth.password = process.env.GHpassword || null;

            if ( auth.password === null || auth.username === null ) {
                return null;
            } else {
                return auth;
            }
        };

        // Get the authentication data - use environment vars
        var auth = getAuth();

        // If authentication vars are valid then attempt to authenticate with github
        if ( auth ) {
            console.log( 'Got github credentials from process.env --- attempting to authenticate with github --- using basic authorisation' );
            octofish.github.authenticate( auth );
        } else {
            console.warn( 'No github credentials in environment vars --- Unauthorised access to github --- max rate limit of 60 reqs per hour' );
        }
    },
    /**
     * setPath
     * sets the path for retrieving a file from github
     * @param path
     */
    setContentPath: function( path ) {
        octofish.config.githubapi.contentOpts.path = path;
    }
};


/* -----------------------------------------------------------------------
 *
 *     Private octofish object
 *     Contains functions that are private to octofish so they are
 *     namespaced and don't interfere with core
 *
 * ----------------------------------------------------------------------- */
var octofish = octofish || {};

// Add the config to the octofish object
octofish.config = require( './octo-config' );

octofish = {

    config: octofish.config,

    // Set up githubapi
    github: new GithubApi( octofish.config.githubapi.apiOpts ),

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
    }
};