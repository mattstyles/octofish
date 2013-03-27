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

/**
 * Octofish config file
 */

module.exports = {
    // GithubApi Config Options
    githubapi : {

        apiOpts : {
            version     : '3.0.0',
            timeout     : 5000
        },

        contentOpts : {
            user        : 'mattstyles',
            repo        : 'vpf-def',
            path        : null
        }
    }
};