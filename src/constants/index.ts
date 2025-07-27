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

export enum CLIENT_SIDE_ENTITIES {
    PANEL_URL = 'panel_url',
    LANG = 'lang'
}

export enum EVENT {
    LOCATION_CHANGED = 'location-changed',
    TRANSLATIONS_UPDATED = 'translations-updated',
    POPSTATE = 'popstate',
    SUBSCRIBE_EVENTS = 'subscribe_events',
    STATE_CHANGE_EVENT = 'state_changed'
}

export const STRICT_MODE = '"use strict";';