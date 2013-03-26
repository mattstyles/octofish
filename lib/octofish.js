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

var _            = require( 'underscore'),
    GithubApi    = require( 'github' );

// File for storing octofish temporarily until it is broken out to its own module
// Over-ride core functionality and add additional functionality

module.exports = function( vpf ) {
    /* -----------------------------------------------------------------------
     *
     *     Extend core functionality
     *
     * ----------------------------------------------------------------------- */
    _.extend( vpf.core, {
        // Set up githubapi
        github: new GithubApi( vpf.config.githubapi.apiOpts ),

        /**
         * setPath
         * sets the path for retrieving a file from github
         * @param path
         */
        setContentPath: function( path ) {
            vpf.config.githubapi.contentOpts.path = path;
        },

        /**
         * getContent
         * gets the content from github repo set up in config
         * @param cb - the callback to fire on success - passes in the collected data
         */
        getContent: function( cb ) {
            vpf.core.github.repos.getContent( vpf.config.githubapi.contentOpts, function ( err, res ) {
                // Handle any error
                if (err) {
                    console.log( 'An error occured whilst getting content from github - this should be dealt with properly' );
                    console.log( 'Should be displaying a 404 here as the URL is probably invalid' );
                    return;
                }

                var data = null;

                // Decode the data before sending on to the callback
                // Check for decoding an image
                if ( vpf.config.githubapi.contentOpts.path.match(/img/) ) {
                    data = vpf.core.decodeGithubImageData( res.content )
                } else {
                    data = vpf.core.decodeGithubData( res.content );
                }

                // If the operation to get content from github was successful then call the callback with only the content
                // This file should actually handle what happens next but for now delegate to a callback
                cb( data );
            });
        },

        /**
         * getNav
         * Accesses github for the main.json, extracts nav data and sets it in the config
         */
        getNav: function () {

            var setNav = function ( data ) {
                // Quick check for no data
                if ( !data ) {
                    console.error( 'No data received from accessing main.json on start - should be dealt with properly' );
                    return;
                }

                // Decode the data
                var dataObj = JSON.parse( data );

                // Place the data into the config
                vpf.utils.config.setNav( dataObj );
            };

            // Set the path for retrieving the main json object that contains nav data
            vpf.core.setContentPath( 'main.json' );

            // Get the content and assign the nav when its done
            vpf.core.getContent( setNav );
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
                vpf.core.github.authenticate( auth );
            } else {
                console.warn( 'No github credentials in environment vars --- Unauthorised access to github --- max rate limit of 60 reqs per hour' );
            }
        },

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
    });
};
