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
    attributes: Record<string, unknown>;
    entity_id: string;
    state: string;
}

export interface Entity {
    area_id: string | null;
    device_id: string;
}

export interface Hass {
    areas: Record<string, Area>;
    devices: Record<string, Device>;
    entities: Record<string, Entity>;
    states: Record<string, State>;
}

export interface ProxiedStates {
    (entityId: string): string | undefined;
    [entityId: string]: State[] | State | undefined;
}

export interface Scopped {
    hass: Hass;
    states: ProxiedStates;
    is_state: (entityId: string, value: string) => boolean;
    state_attr: (entityId: string, attr: string) => unknown | undefined;
    is_state_attr: (entityId: string, attr: string, value: unknown) => boolean;
    has_value: (entityId: string) => boolean;
    device_attr: (deviceId: string, attr: string) => unknown | undefined;
    is_device_attr: (deviceId: string, attr: string, value: unknown) => boolean;
    device_id: (entityId: string) => string | undefined;
    areas: () => string[];
    area_id: (lookupValue: string) => string | undefined;
    area_name: (lookupValue: string) => string | undefined;
    area_entities: (lookupValue: string) => string[];
    area_devices: (lookupValue: string) => string[];
}