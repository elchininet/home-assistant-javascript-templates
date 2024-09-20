export const NAMESPACE = '[home-assistant-javascript-templates]';
export const ENTITY_REGEXP = /^([a-z_]+)\.(\w+)$/;

export enum STATE_VALUES {
    UNKNOWN = 'unknown',
    UNAVAILABLE = 'unavailable'
}

export enum ATTRIBUTES {
    AREA_ID = 'area_id',
    NAME = 'name'
}

export const STRICT_MODE = '"use strict";';

export const MAX_ATTEMPTS = 100;
export const RETRY_DELAY = 50;
export const SUBSCRIBE_EVENTS = 'subscribe_events';
export const STATE_CHANGE_EVENT = 'state_changed';