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

var path = require( 'path'),
    fs   = require( 'fs' );

/**
 * Octofish config file
 */

module.exports = (function() {

    var setConfig = function( config ) {

        // GithubApi Config Default Options
        var githubapi = {

            auth : {
                type        : 'basic',
                username    : '',
                password    : '',
                scope       : '',
                token       : '',
                ID          : '',
                SECRET      : ''
            },

            apiOpts : {
                version     : '3.0.0',
                timeout     : 5000
            },

            contentOpts : {
                user        : 'mattstyles',
                repo        : 'vpf-def',
                path        : null
            }
        };

        var cwf = path.join( process.cwd(), config );

        try {
            fs.readFileSync( cwf );

            console.log( 'Custom config found for Octofish - setting config' );

            // Require the file to get the custom config goodies inside
            // Only add the actual githubapi object that is needed here
            var configOpts = require( cwf ).githubapi;

            // Set config to equal the custom config options
            for ( var prop in configOpts) {
                githubapi[ prop ] = configOpts[ prop ];
            }
        }
        catch(err) {
            console.log( 'No custom Octofish config found - using default' );
        }

        // Return the new (or not) config object
        return githubapi;
    };

    // Call function to find (if available) and include a custom config file
    // Then return the config to be used by octofish
    return setConfig( 'config.js' );

})();