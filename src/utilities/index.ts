import {
    HomeAssistant,
    State,
    ProxiedStates,
    Scopped
} from '@types';
import { STATE_VALUES, ATTRIBUTES } from '@constants';

const arrayFromEntries = <T = unknown>(entries: [string, T][]): T[] => {
    return entries.reduce((acc: T[], entry: [string, T]): T[] => {
        const [, value] = entry;
        acc = [...acc, value]
        return acc;
    }, [] as T[]);
};

export function createScoppedFunctions(ha: HomeAssistant): Scopped {

    const areasEntries = () => Object.entries(ha.hass.areas);
    const statesEntries = () => Object.entries(ha.hass.states);
    const devicesEntries = () => Object.entries(ha.hass.devices);
    const entitiesEntries = () => Object.entries(ha.hass.entities);

    return {
        get hass() {
            return ha.hass;
        },
        // ---------------------- States
        states: new Proxy(
            (entityId: string): string | undefined => {
                if (entityId.includes('.')) {
                    return ha.hass.states[entityId]?.state
                }
                throw SyntaxError('[home-assistant-javascript-templates]: states method cannot be used with a domain, use it as an object instead.');
            }, 
            {
                get(__target, entityId: string): State[] | State | undefined {
                    if (entityId.includes('.')) {
                        return ha.hass.states[entityId];
                    }
                    return arrayFromEntries(
                        statesEntries().filter(([id]): boolean => {
                            return id.startsWith(entityId);
                        })
                    );
                }
            }
        ) as ProxiedStates,
        is_state(entityId: string, value: string): boolean {
            return ha.hass.states[entityId]?.state === value;
        },
        state_attr(entityId: string, attr: string): unknown {
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

        // ---------------------- Devices
        device_attr(deviceId: string, attr: string): unknown {
            return ha.hass.devices[deviceId]?.[attr];
        },
        is_device_attr(deviceId: string, attr: string, value: unknown): boolean {
            return this.device_attr(deviceId, attr) === value;
        },
        device_id(entityId: string): string {
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
        }
    };
}