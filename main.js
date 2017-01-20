/*!
 * Bedrock Media Query Module
 *
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
define([
  'angular',
  './media-query-service'
], function(angular) {

'use strict';

var module = angular.module('bedrock.media-query', []);

Array.prototype.slice.call(arguments, 1).forEach(function(register) {
  register(module);
});

});
