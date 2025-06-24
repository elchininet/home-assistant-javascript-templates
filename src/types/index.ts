export type Vars = Record<string, unknown>;

export interface Options {
    throwErrors?: boolean;
    throwWarnings?: boolean;
    variables?: Vars;
    autoReturn?: boolean;
}

export type RenderingFunction = (result?: any) => void;

export interface Area {
    area_id: string;
    name: string;
}

export interface Device {
    id: string;
    area_id: string | null;
    [key: string]: unknown;
}

export interface State {
    attributes: Vars;
    entity_id: string;
    state: string;
}

export interface Entity {
    area_id: string | null;
    device_id: string;
    [key: string]: unknown;
}

export interface User {
    name: string;
    is_admin: boolean;
    is_owner: boolean;
}

export interface Hass {
    areas: Record<string, Area>;
    devices: Record<string, Device>;
    entities: Record<string, Entity>;
    states: Record<string, State>;
    user: User;
    language: string;
}

export interface HomeAssistant extends HTMLElement {
	hass: Hass;
}

export interface ProxiedStatesOptions {
    with_unit?: boolean;
    rounded?: boolean | number;
}

export interface ProxiedStates {
    (entityId: string, options?: ProxiedStatesOptions): string | undefined;
    [entityId: string]: Record<string, State> | State | undefined;
}

export interface ProxiedEntities {
    (entityId?: string): Record<string, Entity> | Entity | undefined;
    [entityId: string]: Record<string, Entity> | Entity | undefined;
}

export interface ProxiedDevices {
    (deviceId?: string): Record<string, Device> | Device | undefined;
    [deviceId: string]: Device | undefined;
}

export type SubscriberEvent = {
    event_type: string;
    data: {
        entity_id: string;
        old_state?: {
            state: string;
        };
        new_state: {
            state: string;
        };
    }
};

export type CancelSubscription = () => Promise<void>;

export interface HassConnection {
    conn: {
        subscribeMessage: <T>(
            callback: (response: T) => void,
            options: Vars
        ) => Promise<CancelSubscription>;
    }
}

declare global {
    interface Window {
        hassConnection: Promise<HassConnection>;
    }
}

export type Ref = {
    value: unknown;
};

export interface Scopped {
    hass: Hass;
    // states
    states: ProxiedStates;
    is_state: (entityId: string, value: string) => boolean;
    state_attr: (entityId: string, attr: string) => unknown | undefined;
    is_state_attr: (entityId: string, attr: string, value: unknown) => boolean;
    has_value: (entityId: string) => boolean;
    // entities
    entities: ProxiedEntities;
    entity_prop: (entityId: string, attr: string) => unknown | undefined;
    is_entity_prop: (entityId: string, attr: string, value: unknown) => boolean;
    // devices
    devices: ProxiedDevices;
    device_attr: (deviceId: string, attr: string) => unknown | undefined;
    is_device_attr: (deviceId: string, attr: string, value: unknown) => boolean;
    device_id: (entityId: string) => string | undefined;
    // areas
    areas: () => string[];
    area_id: (lookupValue: string) => string | undefined;
    area_name: (lookupValue: string) => string | undefined;
    area_entities: (lookupValue: string) => string[];
    area_devices: (lookupValue: string) => string[];
    // user
    user_name: string;
    user_is_admin: boolean;
    user_is_owner: boolean;
    user_agent: string;
    // others
    clientSideProxy: Vars;
    // utilities
    tracked: Set<string>;
    ref(entityWatchCallback: (event: SubscriberEvent) => void, name: string, value?: unknown): Ref;
    unref(cleanTracked: (refId: string) => void, name: string): void;
    cleanTracked: () => void;
}