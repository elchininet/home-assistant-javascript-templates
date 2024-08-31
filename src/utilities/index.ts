import {
    HomeAssistant,
    State,
    Entity,
    Device,
    ProxiedStates,
    ProxiedEntities,
    ProxiedDevices,
    Scopped
} from '@types';
import {
    NAMESPACE,
    DOMAIN_REGEXP,
    STATE_VALUES,
    ATTRIBUTES
} from '@constants';

const objectFromEntries = <T = unknown>(entries: [string, T][]): Record<string, T> => {
    return entries.reduce((acc: Record<string, T>, entry: [string, T]): Record<string, T> => {
        const [entityId, state] = entry;
        const entity = entityId.replace(DOMAIN_REGEXP, '$2');
        acc[entity] = state;
        return acc;
    }, {} as Record<string, T>);
};

const hasDot = (entityId: string): boolean => entityId.includes('.');

export function createScoppedFunctions(ha: HomeAssistant, trackNonExistent: boolean): Scopped {

    const areasEntries = () => Object.entries(ha.hass.areas);
    const statesEntries = () => Object.entries(ha.hass.states);
    const devicesEntries = () => Object.entries(ha.hass.devices);
    const entitiesEntries = () => Object.entries(ha.hass.entities);

    const entities = new Set<string>();
    const domains = new Set<string>();

    const trackEntity = (entityId: string): void => {
        if (trackNonExistent || ha.hass.states[entityId]) {
            entities.add(entityId);
        }
    };

    const trackDomain = (domain: string): void => {
        domains.add(domain);
    };

    return {
        get hass() {
            return ha.hass;
        },
        // ---------------------- States
        states: new Proxy(
            ((entityId: string): string | undefined => {
                if (hasDot(entityId)) {
                    trackEntity(entityId);
                    return ha.hass.states[entityId]?.state;
                }
                throw SyntaxError(`${NAMESPACE}: states method cannot be used with a domain, use it as an object instead.`);
            }) as ProxiedStates, 
            {
                get(__target, entityId: string): Record<string, State> | State | undefined {
                    if (hasDot(entityId)) {
                        trackEntity(entityId);
                        return ha.hass.states[entityId];
                    }
                    const filteredStatesByDomain = statesEntries().filter(([id]): boolean => {
                        return id.startsWith(entityId);
                    });
                    if (trackNonExistent || filteredStatesByDomain.length) {
                        trackDomain(entityId);
                    }
                    return new Proxy(
                        objectFromEntries(filteredStatesByDomain),
                        {
                            get(__target, subEntityId: string): State | undefined {
                                trackEntity(`${entityId}.${subEntityId}`);
                                return __target[subEntityId];
                            }
                        }
                    );
                }
            }
        ),
        is_state(entityId: string, value: string): boolean {
            trackEntity(entityId);
            return ha.hass.states[entityId]?.state === value;
        },
        state_attr(entityId: string, attr: string): unknown {
            trackEntity(entityId);
            return ha.hass.states[entityId]?.attributes?.[attr];
        },
        is_state_attr(entityId: string, attr: string, value: unknown): boolean {
            return this.state_attr(entityId, attr) === value;
        },
        has_value(entityId: string): boolean {
            if (!this.states(entityId)) {
                return false;
            }
            return !(
                this.is_state(entityId, STATE_VALUES.UNKNOWN) ||
                this.is_state(entityId, STATE_VALUES.UNAVAILABLE)
            );
        },

        // ---------------------- Entities
        entities: new Proxy(
            ((entityId?: string): Record<string, Entity> | Entity | undefined => {
                if (entityId === undefined) {
                    return ha.hass.entities;
                }
                if (hasDot(entityId)) {
                    trackEntity(entityId);
                    return ha.hass.entities[entityId];
                }
                const filteredEntriesByDomain = entitiesEntries().filter(([id]): boolean => {
                    return id.startsWith(entityId);
                });
                if (trackNonExistent || filteredEntriesByDomain.length) {
                    trackDomain(entityId);
                }
                return new Proxy(
                    objectFromEntries(filteredEntriesByDomain),
                    {
                        get(__target, subEntityId: string): Entity | undefined {
                            trackEntity(`${entityId}.${subEntityId}`);
                            return __target[subEntityId];
                        }
                    }
                );
            }) as ProxiedEntities,
            {
                get(__target, entityId: string): Record<string, Entity> | Entity | undefined {
                    return __target(entityId);                    
                }
            }
        ),
        entity_prop(entityId: string, attr: string): unknown | undefined {
            trackEntity(entityId);
            return ha.hass.entities[entityId]?.[attr];
        },
        is_entity_prop(entityId: string, attr: string, value: unknown): boolean {
            return this.entity_prop(entityId, attr) === value;
        },

        // ---------------------- Devices
        devices: new Proxy(
            ((deviceId?: string): Record<string, Device> | Device | undefined => {
                if (deviceId === undefined) {
                    return ha.hass.devices;
                }
                if (hasDot(deviceId)) {
                    throw SyntaxError(`${NAMESPACE}: devices method cannot be used with an entity id, you should use a device id instead.`);
                }
                return ha.hass.devices[deviceId];
            }) as ProxiedDevices,
            {
                get(__target, deviceId: string): Record<string, Device> | Device | undefined {
                    if (hasDot(deviceId)) {
                        throw SyntaxError(`${NAMESPACE}: devices cannot be accesed using an entity id, you should use a device id instead.`);
                    }
                    return ha.hass.devices[deviceId];
                }
            }
        ),

        device_attr(deviceId: string, attr: string): unknown {
            return ha.hass.devices[deviceId]?.[attr];
        },
        is_device_attr(deviceId: string, attr: string, value: unknown): boolean {
            return this.device_attr(deviceId, attr) === value;
        },
        device_id(entityId: string): string {
            trackEntity(entityId);
            return ha.hass.entities[entityId]?.device_id;
        },
        
        // ---------------------- Areas
        areas(): string[] {
            return areasEntries().map(([, area]): string => {
                return area.area_id;
            });
        },
        area_id(lookupValue: string): string | undefined {
            if (lookupValue in ha.hass.devices) {
                return this.device_attr(lookupValue, ATTRIBUTES.AREA_ID);
            }
            const deviceId = this.device_id(lookupValue);
            if (deviceId) {
                return this.device_attr(deviceId, ATTRIBUTES.AREA_ID);
            }
            const area = areasEntries().find(([, area]) => area.name === lookupValue);
            return area?.[1]?.area_id;
        },
        area_name(lookupValue: string): string | undefined {
            let areaId: string;
            if (lookupValue in ha.hass.devices) {
                areaId = this.device_attr(lookupValue, ATTRIBUTES.AREA_ID);
            }
            const deviceId = this.device_id(lookupValue);
            if (deviceId) {
                areaId = this.device_attr(deviceId, ATTRIBUTES.AREA_ID);
            }
            const area = areasEntries().find(([, area]) => {
                return (
                    area.area_id === lookupValue ||
                    area.area_id === areaId
                );
            });
            return area?.[1]?.name;
        },
        area_entities(lookupValue: string): string[] {
            const areaFound = areasEntries().find(([, area]) => {
                return (
                    area.area_id === lookupValue ||
                    area.name === lookupValue
                );
            });
            if (areaFound) {
                return entitiesEntries()
                    .filter(([, entity]): boolean => {
                        return entity.area_id === areaFound[1].area_id;
                    })
                    .map(([entityId]): string => {
                        return entityId;
                    });
            }
            return [];
        },
        area_devices(lookupValue: string): string[] {
            const areaFound = areasEntries().find(([, area]) => {
                return (
                    area.area_id === lookupValue ||
                    area.name === lookupValue
                );
            });
            if (areaFound) {
                return devicesEntries()
                    .filter(([, device]): boolean => {
                        return device.area_id === areaFound[1].area_id;
                    })
                    .map(([, device]) => {
                        return device.id;
                    });
            }
            return [];
        },
        get user_name() {
            return ha.hass.user.name;
        },
        get user_is_admin() {
            return ha.hass.user.is_admin
        },
        get user_is_owner() {
            return ha.hass.user.is_owner
        },
        get user_agent() {
            return window.navigator.userAgent;
        },
        tracked: {
            get entities(): string[] {
                return Array.from(entities);
            },
            get domains(): string[] {
                return Array.from(domains);
            }
        },
        cleanTrackedEntities(): void {
            entities.clear();
        },
        cleanTrackedDomains(): void {
            domains.clear();
        }
    };
}