/*!
 * Bedrock Media Query Module
 *
 * Copyright (c) 2017 Digital Bazaar, Inc. All rights reserved.
 */
import angular from 'angular';
import MediaQueryService from './media-query-service.js';

var module = angular.module('bedrock.media-query', []);

module.service('brMediaQueryService', MediaQueryService);
