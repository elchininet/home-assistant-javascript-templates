import {
    HomeAssistant,
    State,
    Entity,
    Device,
    ProxiedStates,
    ProxiedStatesOptions,
    ProxiedEntities,
    ProxiedDevices,
    Scopped,
    Ref
} from '@types';
import {
    NAMESPACE,
    ENTITY_REGEXP,
    STATE_VALUES,
    ATTRIBUTES,
    CLIENT_SIDE_ENTITIES,
    EVENT
} from '@constants';

const objectFromEntries = <T = unknown>(entries: [string, T][]): Record<string, T> => {
    return entries.reduce((acc: Record<string, T>, entry: [string, T]): Record<string, T> => {
        const [entityId, state] = entry;
        const entity = entityId.replace(ENTITY_REGEXP, '$2');
        acc[entity] = state;
        return acc;
    }, {} as Record<string, T>);
};

const hasDot = (entityId: string): boolean => entityId.includes('.');

export function createScoppedFunctions(
    ha: HomeAssistant,
    throwErrors: boolean,
    throwWarnings: boolean
): Scopped {

    const areasEntries = () => Object.entries(ha.hass.areas);
    const statesEntries = () => Object.entries(ha.hass.states);
    const devicesEntries = () => Object.entries(ha.hass.devices);
    const entitiesEntries = () => Object.entries(ha.hass.entities);

    const entities = new Set<string>();
    const refs = new Map<string, Ref>();
    const refProp = 'ref';
    const refValue = 'value';
    const refToJson = 'toJSON';
    const getRefId = (name: string): string => `${refProp}.${name}`;

    const warnNonExistent = (type: string, entityId: string): void => {
        if(throwWarnings) {
            console.warn(`${type} ${entityId} used in a JavaScript template doesn't exist`);
        }
    };
    const warnNonExistentEntity = (entityId: string): void => warnNonExistent('Entity', entityId);
    const warnNonExistentDomain = (domain: string): void => warnNonExistent('Domain', domain);

    const refError = (errorMessage: string): void => {
        const error = new SyntaxError(errorMessage);
        if (throwErrors) {
            throw error;
        } else if (throwWarnings) {
            console.warn(error);
        }
    };

    const trackEntity = (entityId: string): void => {
        if (ha.hass.states[entityId]) {
            entities.add(entityId);
        } else {
            warnNonExistentEntity(entityId);
        }
    };

    const trackClientSideEntity = (entity: string): void => {
        entities.add(entity);
    };

    const formatState = (
        state: State | undefined,
        options: ProxiedStatesOptions
    ): string | undefined => {
        const {
            with_unit = false,
            rounded = false
        } = options;
        if (state) {
            const stateStringValue = state.state;
            const stateUnitValue = state.attributes.unit_of_measurement;
            const decimals = Number(rounded);
            const stateValue = rounded !== false && !isNaN(Number(stateStringValue))
                ? new Intl.NumberFormat(
                    ha.hass.language,
                    {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    }
                ).format(Number(stateStringValue))
                : stateStringValue;
            
            return with_unit && stateUnitValue
                ? `${stateValue} ${stateUnitValue}`
                : stateValue;
        }
        return undefined;
    };

    const buildProxyState = (state: State): State => new Proxy(
        state,
        {
            get(__target, prop: 'state_with_unit' | keyof State) {
                if (prop === 'state_with_unit') {
                    return formatState(
                        __target,
                        {
                            rounded: true,
                            with_unit: true
                        }
                    );
                }
                return __target[prop];
            }
        }
    );;

    return {
        get hass() {
            return ha.hass;
        },
        // ---------------------- States
        states: new Proxy(
            ((entityId: string, options: ProxiedStatesOptions = {}): string | undefined => {
                if (hasDot(entityId)) {
                    trackEntity(entityId);
                    return formatState(ha.hass.states[entityId], options);             
                }
                throw SyntaxError(`${NAMESPACE}: states method cannot be used with a domain, use it as an object instead.`);
            }) as ProxiedStates, 
            {
                get(__target, entityId: string): Record<string, State> | State | undefined {
                    if (hasDot(entityId)) {
                        trackEntity(entityId);
                        return buildProxyState(ha.hass.states[entityId]);
                    }
                    const filteredStatesByDomain = statesEntries().filter(([id]): boolean => {
                        return id.startsWith(entityId);
                    });
                    if (!filteredStatesByDomain.length) {
                        warnNonExistentDomain(entityId);
                    }
                    return new Proxy(
                        objectFromEntries(filteredStatesByDomain),
                        {
                            get(__target, subEntityId: string): State | undefined {
                                trackEntity(`${entityId}.${subEntityId}`);
                                return buildProxyState(__target[subEntityId]);
                            }
                        }
                    );
                }
            }
        ),
        state_translated(entityId: string): string | undefined {
            trackEntity(entityId);
            if (ha.hass.states[entityId]) {
                return ha.hass.formatEntityState(ha.hass.states[entityId]);
            }
            return undefined;
        },
        is_state(entityId: string, value: string | string[]): boolean {
            trackEntity(entityId);
            if (Array.isArray(value)) {
                return value.some((valueItem: string): boolean => {
                    return ha.hass.states[entityId]?.state === valueItem;
                });
            }
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
                warnNonExistentEntity(entityId);
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
                if (!filteredEntriesByDomain.length) {
                    warnNonExistentDomain(entityId);
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
            const deviceId = ha.hass.entities[lookupValue]?.device_id;
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
            const deviceId = ha.hass.entities[lookupValue]?.device_id;
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
        get tracked() {
            return entities;
        },
        cleanTracked(): void {
            entities.clear();
        },
        ref(entityWatchCallback, name: string): Ref {

            const entityId = getRefId(name);
            
            if (refs.has(name)) {
                return refs.get(name);
            }

            const ref = new Proxy(
                {
                    [refValue]: undefined,
                    [refToJson]() {
                        return this[refValue];
                    }
                },
                {
                    get(target, property: string, receiver?: unknown): unknown {
                        if (
                            property === refValue ||
                            property === refToJson
                        ) {
                            trackClientSideEntity(entityId);
                            return Reflect.get(target, property, receiver);
                        } else {
                            refError(`${property} is not a valid ${refProp} property. A ${refProp} only exposes a "${refValue}" property`);
                        }
                    },
                    set(target, property: string, value: unknown): boolean {
                        if (property === refValue) {
                            const oldValue = target[refValue];
                            target[refValue] = value;
                            entityWatchCallback({
                                event_type: EVENT.STATE_CHANGE_EVENT,
                                data: {
                                    entity_id: entityId,
                                    old_state: {
                                        state: JSON.stringify(oldValue)
                                    },
                                    new_state: {
                                        state: JSON.stringify(value)
                                    }
                                }
                            });
                            return true;
                        } else {
                            refError(`property "${property}" cannot be set in a ${refProp}`);
                            return false;
                        }
                    }
                }
            );

            refs.set(name, ref);

            return ref;

        },
        unref(cleanTracked, name: string) {
            const entityId = getRefId(name);
            if (refs.has(name)) {
                refs.delete(name);
                cleanTracked(entityId);
            } else {
                refError(`${name} is not a ref or it has been unrefed already`);
            }
        },
        clientSideProxy: new Proxy(
            {},
            {
                get(__target, property: string) {
                    if (property === CLIENT_SIDE_ENTITIES.PANEL_URL) {
                        trackClientSideEntity(CLIENT_SIDE_ENTITIES.PANEL_URL);
                        return location.pathname;
                    }
                    if(throwWarnings) {
                        console.warn(`clientSideProxy should only be used to access these variables: ${Object.values(CLIENT_SIDE_ENTITIES).join(', ')}`);
                    }
                }
            }
        )
    };
}