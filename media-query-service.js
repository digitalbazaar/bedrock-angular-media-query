/*!
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
define(['angular'], function(angular) {

'use strict';

function register(module) {
  module.service('brMediaQueryService', factory);
}

/* @ngInject */
function factory($rootScope, $window) {
  var service = {};

  // registered queries and their private listeners
  service._queries = {};

  // current screen state
  service._state = {};

  // user-registered change listeners
  service._listeners = {};

  /**
   * Registers a listener for changes to the user's media (i.e. their screen).
   *
   * @param [queryNames] a set of named media queries to use to monitor changes
   *          to the screen, e.g. ['phone', 'desktop'], where the names
   *          must be registered via `registerQuery` and whose status may be
   *          checked using the event given to the listener via
   *          `event.changes[name]` or `event.isMedia(name)`.
   * @param listener(event) the screen change event listener to use.
   *
   * @return a function that can be called to unregister the listener.
   */
  service.onMediaChange = function(queryNames, listener) {
    ensureFeature('matchMedia');

    if(typeof queryNames === 'function') {
      listener = queryNames;
      queryNames = Object.keys(service._defaultScreens);
    }

    if(typeof queryNames === 'string') {
      queryNames = [queryNames];
    } else if(!angular.isArray(queryNames)) {
      throw new TypeError('"queryNames" must be a string or an array.');
    }

    // register listener
    queryNames = queryNames.slice();
    angular.forEach(queryNames, function(name) {
      if(!('name' in service._listeners)) {
        service._listeners[name] = [];
      }
      service._listeners[name].push(listener);
    });

    // return function to unregister listener
    return function unregister() {
      angular.forEach(queryNames, function(name) {
        var listeners = service._listeners[name];
        var idx = listeners.indexOf(listener);
        if(idx !== -1) {
          listeners.splice(idx, 1);
        }
      });
    };
  };

  /**
   * Registers a named media query to allow change listeners to watch and
   * check the state of the user's screen with respect to the query.
   *
   * @param name the name to register for the media query.
   * @param media the media query itself.
   *
   */
  service.registerQuery = function(name, media) {
    ensureFeature('matchMedia');

    // unregister existing query
    service.unregisterQuery(name);

    // TODO: could optimize further by comparing `media` against existing
    // registered queries and create an aliases for it instead of a new
    // listener function

    // register new query
    var mediaQueryList = $window.matchMedia(media);
    var listener = function(event) {
      service._state = {name: event.matches};
      mediaChange(name, event.media, event.matches);
    };
    mediaQueryList.addListener(listener);
    service._queries[name] = {
      name: name,
      media: media,
      unregister: function unregister() {
        mediaQueryList.removeListener(listener);
        delete service._state[name];
      }
    };
  };

  /**
   * Unregisters a named media query.
   *
   * @param name the name of the media query to unregister.
   */
  service.unregisterQuery = function(name) {
    if(name in service._queries) {
      service._queries[name].unregister();
    }
  };

  function mediaChange(name, media, matches) {
    // emit change event to all listeners that are watching `name`
    var listeners = service._listeners[name];
    if(listeners) {
      angular.forEach(listeners, function(listener) {
        var event = {
          queryName: name,
          matches: matches,
          media: media,
          changes: {name: matches},
          isMedia: isMedia
        };
        $rootScope.$apply(listener.bind(listener, event));
      });
    }
  }

  function isMedia(name) {
    if(!(name in service._queries)) {
      throw new Error(
        'No media query has been registered with the name "' + name + '".');
    }
    if(!(name in service._state)) {
      // do immediate query to initialize state
      service._state[name] = $window.matchMedia(
        service._queries[name].media).matches;
    }
    return service._state[name];
  }

  function ensureFeature(feature) {
    if(feature in $window) {
      return true;
    }
    throw new Error(
      'The feature "' + feature + '" is not supported in this browser.');
  }

  // register default queries
  service._defaultQueries = {
    print: 'print',
    phone: '(max-width: 767px)',
    tablet: '(min-width: 768px) and (max-width: 979px)',
    desktop: '(min-width: 979px)',
    portrait: '(orientation: portrait)',
    landscape: '(orientation: landscape)'
  };
  angular.forEach(service._defaultQueries, function(media, name) {
    service.registerQuery(name, media);
  });

  return service;
}

return register;

});
