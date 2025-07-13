import HomeAssistantJavaScriptTemplates, { HomeAssistantJavaScriptTemplatesRenderer } from '../src';
import { HOME_ASSISTANT_ELEMENT, HASS } from './constants';

describe('Basic templates tests', () => {

    let compiler: HomeAssistantJavaScriptTemplatesRenderer;
    let consoleWarnMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
    
    beforeEach(async () => {
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn()
            }
        });
        consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
        compiler = await new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT).getRenderer();
    });

    afterEach(() => {
        jest.resetAllMocks();
        consoleWarnMock.mockRestore();
    });

    describe('hass object', () => {
        it('hass object should be the same as the hass object inside the home assistant HTMLElement ', () => {
            expect(
                compiler.renderTemplate('hass')
            ).toBe(
                HASS
            );
        });
    });

    describe('states', () => {

        it('states object and states method should return undefined if the device id doesn\'t exist', () => {
            expect(
                compiler.renderTemplate('states["sensor.non_existent"]')
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith('Entity sensor.non_existent used in a JavaScript template doesn\'t exist');
            expect(
                compiler.renderTemplate('states("light.non_existent")')
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith('Entity light.non_existent used in a JavaScript template doesn\'t exist');
        });

        describe('with_units', () => {

            it('states method with with_unit as false should not return the units', () => {
                expect(
                    compiler.renderTemplate('states("sensor.slaapkamer_temperatuur", { with_unit: false })')
                ).toBe('17.456');
            });

            it('states method with with_unit as true should return the units', () => {
                expect(
                    compiler.renderTemplate('states("sensor.slaapkamer_temperatuur", { with_unit: true })')
                ).toBe('17.456 ºC');
            });

            it('if there are no units states method with with_unit as true should return the state value without any units', () => {
                expect(
                    compiler.renderTemplate('states("light.woonkamer_lamp", { with_unit: true })')
                ).toBe('off');
            });

        });

        describe('rounded', () => {

            it('states method with rounded in true should round the number to 1 decimal', () => {
                expect(
                    compiler.renderTemplate('states("sensor.slaapkamer_temperatuur", { rounded: true })')
                ).toBe('17.5');
            });

            it('states method with rounded in false should not round the number', () => {
                expect(
                    compiler.renderTemplate('states("sensor.slaapkamer_temperatuur", { rounded: false })')
                ).toBe('17.456');
            });

            it('states method with rounded as a number should round the number to the number of decimals', () => {
                expect(
                    compiler.renderTemplate('states("sensor.slaapkamer_temperatuur", { rounded: 2 })')
                ).toBe('17.46');
            });

            it('states method with rounded as 0 should round the number without decimals', () => {
                expect(
                    compiler.renderTemplate('states("sensor.slaapkamer_temperatuur", { rounded: 0 })')
                ).toBe('17');
            });

            it('if the states value is not a number states method with rounded in true should not do anything', () => {
                expect(
                    compiler.renderTemplate('states("light.woonkamer_lamp", { rounded: true })')
                ).toBe('off');
            });

            it('if the states value is not a number states method with rounded in false should not do anything', () => {
                expect(
                    compiler.renderTemplate('states("light.woonkamer_lamp", { rounded: false })')
                ).toBe('off');
            });

            it('if the states value is not a number states method with rounded as a number should not do anything', () => {
                expect(
                    compiler.renderTemplate('states("light.woonkamer_lamp", { rounded: 2 })')
                ).toBe('off');
            });

        });

        describe('state_with_unit', () => {

            it('if states object is queried with an entity id with state_with_unit should return a formatted number with units', () => {
                expect(
                    compiler.renderTemplate('states["sensor.slaapkamer_temperatuur"].state_with_unit')
                ).toBe('17.5 ºC');
            });

            it('if states object is queried with an entity id that is not a number with state_with_unit should return the regular state', () => {
                expect(
                    compiler.renderTemplate('states["light.woonkamer_lamp"].state_with_unit')
                ).toBe('off');
            });

            it('if states object is queried with a domain and an id with state_with_unit should return a formatted number with units', () => {
                expect(
                    compiler.renderTemplate('states.sensor.slaapkamer_temperatuur.state_with_unit')
                ).toBe('17.5 ºC');
            });

            it('if states object is queried with a domain and an id that is not a number with state_with_unit should return the regular state', () => {
                expect(
                    compiler.renderTemplate('states.light.woonkamer_lamp.state_with_unit')
                ).toBe('off');
            });

        });

        it('states object should return the right states', () => {
            expect(
                compiler.renderTemplate('states["light.woonkamer_lamp"].state')
            ).toBe('off');
            expect(
                compiler.renderTemplate('states["binary_sensor.koffiezetapparaat_verbonden"].state')
            ).toBe('on');
        });

        it('states as an object or as a method should return the same result', () => {
            expect(
                compiler.renderTemplate('states["binary_sensor.koffiezetapparaat_verbonden"].state')
            ).toBe(
                compiler.renderTemplate('states("binary_sensor.koffiezetapparaat_verbonden")')
            );
        });

        it('states object should return the same result if it queried with a decice id or first the domain and then the device id', () => {
            expect(
                compiler.renderTemplate('states.light.woonkamer_lamp')
            ).toBeDefined();
    
            expect(
                compiler.renderTemplate('states.light.woonkamer_lamp')
            ).toEqual(
                compiler.renderTemplate('states["light.woonkamer_lamp"]')
            );
        });

        it('states object should return all the states of a domain', () => {
            expect(
                { ...compiler.renderTemplate('states.sensor') }
            ).toEqual({
                slaapkamer_temperatuur: HASS.states['sensor.slaapkamer_temperatuur'],
                slaapkamer_luchtvochtigheid: HASS.states['sensor.slaapkamer_luchtvochtigheid']
            });
    
            expect(
                { ...compiler.renderTemplate('states.binary_sensor') }
            ).toEqual({
                koffiezetapparaat_aan: HASS.states['binary_sensor.koffiezetapparaat_aan'],
                koffiezetapparaat_verbonden: HASS.states['binary_sensor.koffiezetapparaat_verbonden'],
                internetverbinding: HASS.states['binary_sensor.internetverbinding']
            });
        });

        it('states object should return an empty object if the domain doesn\'t exist', () => {
            expect(
                { ...compiler.renderTemplate('states["battery"]') }
            ).toEqual({});
            expect(consoleWarnMock).toHaveBeenCalledWith('Domain battery used in a JavaScript template doesn\'t exist');
        });

    });

    describe('state_translated', () => {

        describe.each(
            Object.keys(HASS.states)
        )('for entity id %s', (entityId: string) => {
            it('should send the proper state to the formatEntityState function', () => {
                compiler.renderTemplate(`state_translated("${entityId}")`);
                expect(HASS.formatEntityState).toHaveBeenNthCalledWith(1, HASS.states[entityId]);
            });
        });

        it('should return undefined if the entity id doesn\'t exist', () => {
            const result = compiler.renderTemplate('state_translated("sensor.non_existent")');
            expect(HASS.formatEntityState).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

    });

    describe('is_state', () => {

        describe('value as string', () => {

            it('is_state should return true if the value coincides', () => {
                expect(
                    compiler.renderTemplate('is_state("sensor.slaapkamer_luchtvochtigheid", "45")')
                ).toBe(true);
            });

            it('is_state should return false if the value doesn\'t coincide', () => {
                expect(
                    compiler.renderTemplate('is_state("sensor.slaapkamer_temperatuur", "10")')
                ).toBe(false);
            });

            it('is_state should return false if the entity id doesn\'t exist', () => {
                expect(
                    compiler.renderTemplate('is_state("sensor.non_existent", "45")')
                ).toBe(false);
                expect(consoleWarnMock).toHaveBeenCalledWith('Entity sensor.non_existent used in a JavaScript template doesn\'t exist');
            });

        });

        describe('value as array', () => {

            it('is_state should return true if the value is contained inside the array', () => {
                expect(
                    compiler.renderTemplate('is_state("sensor.slaapkamer_luchtvochtigheid", ["15", "45", "56"])')
                ).toBe(true);
            });

            it('is_state should return false if the value isn\'t contained inside the array', () => {
                expect(
                    compiler.renderTemplate('is_state("sensor.slaapkamer_temperatuur", ["5", "10", "28", "100"])')
                ).toBe(false);
            });

            it('is_state should return false if the entity id doesn\'t exist', () => {
                expect(
                    compiler.renderTemplate('is_state("sensor.non_existent", ["17", "45", "2"])')
                ).toBe(false);
                expect(consoleWarnMock).toHaveBeenCalledWith('Entity sensor.non_existent used in a JavaScript template doesn\'t exist');
            });

        });

    });

    describe('state_attr', () => {

        it('state_attr should return the right value', () => {
            expect(
                compiler.renderTemplate('state_attr("sensor.slaapkamer_luchtvochtigheid", "state_class")')
            ).toBe('measurement');
    
            expect(
                compiler.renderTemplate('state_attr("sensor.slaapkamer_temperatuur", "friendly_name")')
            ).toBe('Slaapkamer Temperatuur');
        });

        it('state_attr should return undefined if the entity doesn\'t exist', () => {
            expect(
                compiler.renderTemplate('state_attr("sensor.non_existent", "device_class")')
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith('Entity sensor.non_existent used in a JavaScript template doesn\'t exist');
        });

    });

    describe('is_state_attr', () => {

        it('is_state_attr should return true if the attribute has the proper value', () => {
            expect(
                compiler.renderTemplate('is_state_attr("binary_sensor.koffiezetapparaat_verbonden", "device_class", "connectivity")')
            ).toBe(true);
        });

        it('is_state_attr should return false if the attribute doesn\'t have the proper value', () => {
            expect(
                compiler.renderTemplate('is_state_attr("sensor.slaapkamer_luchtvochtigheid", "state_class", "battery")')
            ).toBe(false);
        });

        it('is_state_attr should return false if the entity doesn\'t exist', () => {
            expect(
                compiler.renderTemplate('is_state_attr("sensor.non_existent", "name", "fake")')
            ).toBe(false);
            expect(consoleWarnMock).toHaveBeenCalledWith('Entity sensor.non_existent used in a JavaScript template doesn\'t exist');
        });

    });

    it('has_value', () => {

        expect(
            compiler.renderTemplate('has_value("binary_sensor.koffiezetapparaat_verbonden")')
        ).toBe(true);

        expect(
            compiler.renderTemplate('has_value("button.knopje")')
        ).toBe(false);

        expect(
            compiler.renderTemplate('has_value("camera.keukencamera")')
        ).toBe(false);

        expect(
            compiler.renderTemplate('has_value("sensor.non_existent")')
        ).toBe(false);
        expect(consoleWarnMock).toHaveBeenCalledWith('Entity sensor.non_existent used in a JavaScript template doesn\'t exist');

    });

    describe('entities', () => {

        it('entities method without any parameter should return all the entities', () => {
            expect(
                compiler.renderTemplate('entities()')
            ).toEqual(HASS.entities);
        });

        it('entities method specifying a domain should return all the entities of that domain', () => {
            expect(
                { ...compiler.renderTemplate('entities("light")') }
            ).toEqual({
                'woonkamer_lamp': {
                    area_id: 'woonkamer',
                    device_id: '4d584585f0eb89172ce1a71c8b0e74ae'
                },
                'eetkamer_lampje': {
                    area_id: 'eetkamer',
                    device_id: '720a719fe7db1460b0e4cc9ffbb1488d'
                },
            });
        });

        it('entities method specifying an entity id should return that specific entity', () => {
            expect(
                compiler.renderTemplate('entities("binary_sensor.koffiezetapparaat_verbonden")')
            ).toEqual(HASS.entities['binary_sensor.koffiezetapparaat_verbonden']);
        });

        it('entities method with a non-existent domain should return an empty object', () => {
            expect(
                { ...compiler.renderTemplate('entities("update")') }
            ).toEqual({});
            expect(consoleWarnMock).toHaveBeenCalledWith('Domain update used in a JavaScript template doesn\'t exist');
        });

        it('entities method with a non-existent entity should return undefined', () => {
            expect(
                compiler.renderTemplate('entities("sensor.non_existent")')
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith('Entity sensor.non_existent used in a JavaScript template doesn\'t exist');
        });

        it('entities object should return the same domains as the entity method', () => {
            expect(
                { ...compiler.renderTemplate('entities.light') }
            ).toEqual(
                { ...compiler.renderTemplate('entities("light")') }
            );
        });

        it('entities object should return the same entity than the entity method', () => {
            expect(
                compiler.renderTemplate('entities.binary_sensor.koffiezetapparaat_verbonden')
            ).toEqual(
                compiler.renderTemplate('entities("binary_sensor.koffiezetapparaat_verbonden")')
            );
        });

        it('entities object should return en empty object if the domain doesn\t exist', () => {
            expect(
                { ...compiler.renderTemplate('entities.update') }
            ).toEqual({});
            expect(consoleWarnMock).toHaveBeenCalledWith('Domain update used in a JavaScript template doesn\'t exist');
        });

        it('entities object should return undefined if the entity doesn\t exist', () => {
            expect(
                compiler.renderTemplate('entities.sensor.non_existent')
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith('Entity sensor.non_existent used in a JavaScript template doesn\'t exist');
        });

    });

    describe('entity_prop', () => {

        it('entity_prop should return the proper attribute value', () => {
            expect(
                compiler.renderTemplate('entity_prop("binary_sensor.koffiezetapparaat_aan", "device_id")')
            ).toBe('706ad0ebe27e105d7cd0b73386deefdd');
        });

        it('entity_prop should return undefined if the attribute doesn\'t exist', () => {
            expect(
                compiler.renderTemplate('entity_prop("binary_sensor.koffiezetapparaat_aan", "unexistent")')
            ).toBe(undefined);
        });

        it('entity_prop should return undefined if the entity doesn\'t exist', () => {
            expect(
                compiler.renderTemplate('entity_prop("sensor.non_existent", "area_id")')
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith('Entity sensor.non_existent used in a JavaScript template doesn\'t exist');
        });

    });

    describe('is_entity_prop', () => {

        it('is_entity_prop should return true if the entity attribute has the proper value', () => {
            expect(
                compiler.renderTemplate('is_entity_prop("binary_sensor.internetverbinding", "device_id", "a121a9414241f03ce6b3108b2716f9be")')
            ).toBe(true);
        });

        it('is_entity_prop should return false if the entity attribute doesn\'t have the proper value', () => {
            expect(
                compiler.renderTemplate('is_entity_prop("light.eetkamer_lampje", "area_id", "woonkamer")')
            ).toBe(false);
        });

        it('is_entity_prop should return false if the entity doesn\'t exist', () => {
            expect(
                compiler.renderTemplate('is_entity_prop("sensor.non_existent", "area_id", "eetkamer")')
            ).toBe(false);
            expect(consoleWarnMock).toHaveBeenCalledWith('Entity sensor.non_existent used in a JavaScript template doesn\'t exist');
        });

    });

    describe('devices', () => {

        it('devices method without any parameters should return all the devices', () => {
            expect(
                compiler.renderTemplate('devices()')
            ).toEqual(HASS.devices);
        });

        it('devices method should return the proper device', () => {
            expect(
                compiler.renderTemplate('devices("0c1c9c65040cbf3563c76dc376d072f3")')
            ).toEqual(
                HASS.devices['0c1c9c65040cbf3563c76dc376d072f3']
            );
        });

        it('devices method with a non-existent device should return undefined', () => {
            expect(
                compiler.renderTemplate('devices("40cbf3563c76dc376d072f30c1c9c650")')
            ).toBe(undefined);
        });

        it('devices object should return the proper device', () => {
            expect(
                compiler.renderTemplate('devices["0c1c9c65040cbf3563c76dc376d072f3"]')
            ).toEqual(
                compiler.renderTemplate('devices("0c1c9c65040cbf3563c76dc376d072f3")')
            );
        });

        it('devices object with a non-existent device should return undefined', () => {
            expect(
                compiler.renderTemplate('devices["40cbf3563c76dc376d072f30c1c9c650"]')
            ).toBe(undefined);
        });

    });

    describe('device_attr', () => {

        it('device_attr should return the proper value', () => {
            expect(
                compiler.renderTemplate('device_attr("706ad0ebe27e105d7cd0b73386deefdd", "manufacturer")')
            ).toBe('Synology');
            expect(
                compiler.renderTemplate('device_attr("4d584585f0eb89172ce1a71c8b0e74ae", "model")')
            ).toBe('HHCCJCY01');
        });

        it('device_attr should return undefined if the attribute doesn\'t exist', () => {
            expect(
                compiler.renderTemplate('device_attr("b8c1c9dd23cb82bbfa09b5657f41d04f", "attr")')
            ).toBe(undefined);
        });

        it('device_attr should return undefined if the device doesn\'t exist', () => {
            expect(
                compiler.renderTemplate('device_attr("012345", "attr")')
            ).toBe(undefined);
        });

    });

    describe('is_device_attr', () => {

        it('is_device_attr should return true if the attribute has the proper value', () => {
            expect(
                compiler.renderTemplate('is_device_attr("706ad0ebe27e105d7cd0b73386deefdd", "manufacturer", "Synology")')
            ).toBe(true);
    
            expect(
                compiler.renderTemplate('is_device_attr("4d584585f0eb89172ce1a71c8b0e74ae", "model", "HHCCJCY01")')
            ).toBe(true);
        });

        it('is_device_attr should return false if the attribute doesn\'t have the proper value', () => {
            expect(
                compiler.renderTemplate('is_device_attr("dea1c4475b8dc901b7b33c7eac09896d", "area_id", "woonkamer")')
            ).toBe(false);
        });

        it('is_device_attr should return false if the attribute doesn\'t exist', () => {
            expect(
                compiler.renderTemplate('is_device_attr("b8c1c9dd23cb82bbfa09b5657f41d04f", "attr", "value")')
            ).toBe(false);
        });

        it('is_device_attr should return false if the device doesn\'t exist', () => {
            expect(
                compiler.renderTemplate('is_device_attr("012345", "attr", "value")')
            ).toBe(false);
        });       

    });

    describe('device_id', () => {

        it('device_id should return the proper device id', () => {
            expect(
                compiler.renderTemplate('device_id("light.woonkamer_lamp")')
            ).toBe('4d584585f0eb89172ce1a71c8b0e74ae');
    
            expect(
                compiler.renderTemplate('device_id("binary_sensor.internetverbinding")')
            ).toBe('a121a9414241f03ce6b3108b2716f9be');
        });

        it('device_id should return undefined if the device doesn\'t exist', () => {
            expect(
                compiler.renderTemplate('device_id("sensor.non_existent")')
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith('Entity sensor.non_existent used in a JavaScript template doesn\'t exist');
        });

    });

    describe('areas', () => {

        it('areas should return the proper areas', () => {
            expect(
                compiler.renderTemplate('areas()')
            ).toEqual([
                HASS.areas.eetkamer.area_id,
                HASS.areas.slaapkamer.area_id,
                HASS.areas.woonkamer.area_id
            ]);
        });

    });

    describe('area_id', () => {

        it('area_id should return the proper area id if a device id is sent', () => {
            expect(
                compiler.renderTemplate('area_id("4d584585f0eb89172ce1a71c8b0e74ae")')
            ).toBe('woonkamer');
        });

        it('area_id should return the proper area id if an entity id is sent', () => {
            expect(
                compiler.renderTemplate('area_id("binary_sensor.koffiezetapparaat_verbonden")')
            ).toBe('eetkamer');
        });

        it('area_id should return the proper area id if an area name is sent', () => {
            expect(
                compiler.renderTemplate('area_id("Slaapkamer")')
            ).toBe('slaapkamer');
        });

        it('area_id should return undefined if no valid device id, entity id or area name is sent', () => {
            expect(
                compiler.renderTemplate('area_id("NonExistent")')
            ).toBe(undefined);
        });        

    });

    describe('area_name', () => {

        it('area_name should return the proper area name if a device id is sent', () => {
            expect(
                compiler.renderTemplate('area_name("4d584585f0eb89172ce1a71c8b0e74ae")')
            ).toBe('Woonkamer');
        });

        it('area_name should return the proper area name if anentity id is sent', () => {
            expect(
                compiler.renderTemplate('area_name("binary_sensor.koffiezetapparaat_verbonden")')
            ).toBe('Eetkamer');
        });

        it('area_name should return the proper area name if an area id is sent', () => {
            expect(
                compiler.renderTemplate('area_name("slaapkamer")')
            ).toBe('Slaapkamer');
        });
        
        it('area_name should return undefined if no valid device id, entity id or area id is sent', () => {
            expect(
                compiler.renderTemplate('area_name("non_existent")')
            ).toBe(undefined);
        });

    });

    describe('area_entities', () => {

        it('area_entities should return the proper entities ids in an area if an area id is sent', () => {
            expect(
                compiler.renderTemplate('area_entities("eetkamer")')
            ).toEqual([
                'binary_sensor.koffiezetapparaat_aan',
                'binary_sensor.koffiezetapparaat_verbonden',
                'light.eetkamer_lampje'
            ]);
        });

        it('area_entities should return the proper entities ids in an area if an area name is sent', () => {
            expect(
                compiler.renderTemplate('area_entities("Woonkamer")')
            ).toEqual([
                'light.woonkamer_lamp'
            ]);
        });

        it('area_entities should return an empty array if no valid area id or area name is sent', () => {
            expect(
                compiler.renderTemplate('area_entities("keuken")')
            ).toEqual([]);
        });

    });

    describe('area_devices', () => {

        it('area_devices should return all the devices ids in an area if an area id is sent', () => {
            expect(
                compiler.renderTemplate('area_devices("eetkamer")')
            ).toEqual([
                '706ad0ebe27e105d7cd0b73386deefdd',
                'b8c1c9dd23cb82bbfa09b5657f41d04f',
                '720a719fe7db1460b0e4cc9ffbb1488d'
            ]);
        });

        it('area_devices should return all the devices ids in an area if an area name is sent', () => {
            expect(
                compiler.renderTemplate('area_devices("Woonkamer")')
            ).toEqual([
                '4d584585f0eb89172ce1a71c8b0e74ae'
            ]);
        });

        it('area_devices should return an empty array if no valid area id or area name is sent', () => {
            expect(
                compiler.renderTemplate('area_devices("keuken")')
            ).toEqual([]);
        });

    });

    describe('user_name, user_is_admin, user_is_owner', () => {

        it('should return the proper user name', () => {
            expect(
                compiler.renderTemplate('user_name')
            ).toBe('ElChiniNet');
        });
        
        it('should return if the user is admin', () => {
            expect(
                compiler.renderTemplate('user_is_admin')
            ).toBe(true);
        });

        it('should return if the user is owner', () => {
            expect(
                compiler.renderTemplate('user_is_owner')
            ).toBe(false);
        });

    });

    describe('user_agent', () => {
        it('should return the proper user agent of the browser', () => {
            expect(compiler.renderTemplate('user_agent')).toBe('Custom/Agent');
        });
    });

    describe('panel_url', () => {

        it('panel_url should return the default location.pathname', () => {
            expect(compiler.renderTemplate('panel_url')).toBe('/');
        });

        it('panel_url should return the current location', () => {
            location.assign('/path/test');
            expect(compiler.renderTemplate('panel_url')).toBe('/path/test'); 
        });

    });

});