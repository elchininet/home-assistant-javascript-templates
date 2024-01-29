export const NAMESPACE = '[home-assistant-javascript-templates]';
export const DOMAIN_REGEXP = /^([a-z]+)\.(\w+)$/;

export enum STATE_VALUES {
    UNKNOWN = 'unknown',
    UNAVAILABLE = 'unavailable'
}

export enum ATTRIBUTES {
    AREA_ID = 'area_id',
    NAME = 'name'
}

export const STRICT_MODE = '"use strict";';