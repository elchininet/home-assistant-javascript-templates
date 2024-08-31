import HomeAssistantJavaScriptTemplates from '../src';
import { HOME_ASSISTANT_ELEMENT } from './constants';

describe('tracked domains and entities', () => {

    let compiler: HomeAssistantJavaScriptTemplates;
    
    beforeEach(() => {
        compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
    });

    it('test tracked entities using states as a function', () => {

        compiler.renderTemplate(`
            const state = states("binary_sensor.koffiezetapparaat_aan");
            return state;
        `);
        compiler.renderTemplate(`
            const stateLight = states("light.woonkamer_lamp");
            const stateSensor = states("sensor.slaapkamer_temperatuur");
            return stateLight === "on" || stateSensor === "on";
        `);
        compiler.renderTemplate(`
            const state = states("binary_sensor.koffiezetapparaat_verbonden");
            if (state === "off") {
                return states("binary_sensor.internetverbinding");
            }
            return state;
        `);
        expect(compiler.tracked.entities).toHaveLength(4);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_aan',
                'light.woonkamer_lamp',
                'sensor.slaapkamer_temperatuur',
                'binary_sensor.koffiezetapparaat_verbonden'
            ])
        );

        compiler.renderTemplate(`
            const state = states("binary_sensor.koffiezetapparaat_verbonden");
            if (state === "on") {
                return states("binary_sensor.internetverbinding");
            }
            return state;
        `);
        expect(compiler.tracked.entities).toHaveLength(5);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_aan',
                'light.woonkamer_lamp',
                'sensor.slaapkamer_temperatuur',
                'binary_sensor.koffiezetapparaat_verbonden',
                'binary_sensor.internetverbinding'
            ])
        );
    });

    it('test tracked entitites using states as an object', () => {
        compiler.renderTemplate(`
            const state = states["binary_sensor.koffiezetapparaat_aan"].states;
            return state;
        `);
        compiler.renderTemplate(`
            const stateLight = states["light.woonkamer_lamp"].state;
            const stateSensor = states["sensor.slaapkamer_temperatuur"].state;
            return stateLight === "on" || stateSensor === "on";
        `);
        compiler.renderTemplate(`
            const state = states["binary_sensor.koffiezetapparaat_verbonden"].state;
            if (state === "off") {
                return states["binary_sensor.internetverbinding"].state;
            }
            return state;
        `);
        expect(compiler.tracked.entities).toHaveLength(4);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_aan',
                'light.woonkamer_lamp',
                'sensor.slaapkamer_temperatuur',
                'binary_sensor.koffiezetapparaat_verbonden'
            ])
        );

        compiler.renderTemplate(`
            const state = states["binary_sensor.koffiezetapparaat_verbonden"].state;
            if (state === "on") {
                return states["binary_sensor.internetverbinding"].state;
            }
            return state;
        `);
        expect(compiler.tracked.entities).toHaveLength(5);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_aan',
                'light.woonkamer_lamp',
                'sensor.slaapkamer_temperatuur',
                'binary_sensor.koffiezetapparaat_verbonden',
                'binary_sensor.internetverbinding'
            ])
        );
    });

    it('test tracked entitites and domains using states as an object', () => {
        compiler.renderTemplate(`
            const state = states.binary_sensor.koffiezetapparaat_aan.states;
            return state;
        `);
        compiler.renderTemplate(`
            const stateLight = states.light.woonkamer_lamp.state;
            const stateSensor = states.sensor.slaapkamer_temperatuur.state;
            return stateLight === "on" || stateSensor === "on";
        `);
        compiler.renderTemplate(`
            const state = states.binary_sensor.koffiezetapparaat_verbonden.state;
            if (state === "off") {
                return states.camera.keukencamera.state;
            }
            return state;
        `);
        expect(compiler.tracked.entities).toHaveLength(4);
        expect(compiler.tracked.domains).toHaveLength(3);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_aan',
                'light.woonkamer_lamp',
                'sensor.slaapkamer_temperatuur',
                'binary_sensor.koffiezetapparaat_verbonden'
            ])
        );
        expect(compiler.tracked.domains).toEqual(
            expect.arrayContaining([
                'binary_sensor',
                'light',
                'sensor'
            ])
        );

        compiler.renderTemplate(`
            const state = states.binary_sensor.koffiezetapparaat_verbonden.state;
            if (state === "on") {
                return states.camera.keukencamera.state;
            }
            return state;
        `);
        expect(compiler.tracked.entities).toHaveLength(5);
        expect(compiler.tracked.domains).toHaveLength(4);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_aan',
                'light.woonkamer_lamp',
                'sensor.slaapkamer_temperatuur',
                'binary_sensor.koffiezetapparaat_verbonden',
                'camera.keukencamera'
            ])
        );
        expect(compiler.tracked.domains).toEqual(
            expect.arrayContaining([
                'binary_sensor',
                'light',
                'sensor',
                'camera'
            ])
        );
    });

    it('get tracked entities and domains using states as a function as an object', () => {
        compiler.renderTemplate('states("binary_sensor.koffiezetapparaat_verbonden")');
        compiler.renderTemplate(`
            const lampState = states.light.woonkamer_lamp;
            return lampState;
        `);
        compiler.renderTemplate(`
            const allButtons = states.button;
            return Object.keys(allButtons);
        `);
        compiler.renderTemplate(`
            const allSensors = states.sensor; return Object.keys(allSensors);
        `);
        compiler.renderTemplate(`
            const mySensors = states["binary_sensor"];
            return mySensors["internetverbinding"].state;
        `);
        expect(compiler.tracked.entities).toHaveLength(3);
        expect(compiler.tracked.domains).toHaveLength(4);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_verbonden',
                'light.woonkamer_lamp',
                'binary_sensor.internetverbinding'
            ])
        );
        expect(compiler.tracked.domains).toEqual(
            expect.arrayContaining([
                'light',
                'button',
                'sensor',
                'binary_sensor'
            ])
        );

        compiler.renderTemplate(`
            return states.button.knopje.state;
        `);
        expect(compiler.tracked.entities).toHaveLength(4);
        expect(compiler.tracked.domains).toHaveLength(4);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_verbonden',
                'light.woonkamer_lamp',
                'binary_sensor.internetverbinding',
                'button.knopje'
            ])
        );
        expect(compiler.tracked.domains).toEqual(
            expect.arrayContaining([
                'light',
                'button',
                'sensor',
                'binary_sensor'
            ])
        );
    });

    it('get tracked entities using is_state', () => {
        compiler.renderTemplate('return is_state("binary_sensor.internetverbinding", "on")');
        compiler.renderTemplate(`
            if (is_state("light.eetkamer_lampje", "off")) {
                return states.light.eetkamer_lampje.attributes;
            }
            return is_state("sensor.slaapkamer_temperatuur", 10);
        `);
        compiler.renderTemplate('return is_state("binary_sensor.koffiezetapparaat_verbonden", "on")');
        expect(compiler.tracked.entities).toHaveLength(4);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.internetverbinding',
                'light.eetkamer_lampje',
                'sensor.slaapkamer_temperatuur',
                'binary_sensor.koffiezetapparaat_verbonden'
            ])
        );

        compiler.renderTemplate('return is_state("light.woonkamer_lamp", "off")');
        expect(compiler.tracked.entities).toHaveLength(5);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.internetverbinding',
                'light.eetkamer_lampje',
                'sensor.slaapkamer_temperatuur',
                'binary_sensor.koffiezetapparaat_verbonden',
                'light.woonkamer_lamp'
            ])
        );
    });

    it('get tracked entities using state_attr', () => {
        compiler.renderTemplate('return state_attr("binary_sensor.koffiezetapparaat_verbonden", "friendly_name")');
        compiler.renderTemplate(`
            const attr = state_attr("sensor.slaapkamer_luchtvochtigheid", "state_class");
            return attr;
        `);
        compiler.renderTemplate('return state_attr("binary_sensor.internetverbinding", "icon")');
        expect(compiler.tracked.entities).toHaveLength(3);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_verbonden',
                'sensor.slaapkamer_luchtvochtigheid',
                'binary_sensor.internetverbinding'
            ])
        );

        compiler.renderTemplate('return state_attr("light.eetkamer_lampje", "brightness")');
        expect(compiler.tracked.entities).toHaveLength(4);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_verbonden',
                'sensor.slaapkamer_luchtvochtigheid',
                'binary_sensor.internetverbinding',
                'light.eetkamer_lampje'
            ])
        );
    });

    it('get tracked entities using is_state_attr', () => {
        compiler.renderTemplate('return is_state_attr("binary_sensor.koffiezetapparaat_verbonden", "friendly_name", "Koffiezetapparaat Verbonden")');
        compiler.renderTemplate(`
            const attr = is_state_attr("sensor.slaapkamer_luchtvochtigheid", "state_class", "battery");
            return attr;
        `);
        compiler.renderTemplate('return is_state_attr("binary_sensor.internetverbinding", "icon", "mdi:person")');
        expect(compiler.tracked.entities).toHaveLength(3);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_verbonden',
                'sensor.slaapkamer_luchtvochtigheid',
                'binary_sensor.internetverbinding'
            ])
        );

        compiler.renderTemplate('return is_state_attr("light.eetkamer_lampje", "brightness", "100")');
        expect(compiler.tracked.entities).toHaveLength(4);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'binary_sensor.koffiezetapparaat_verbonden',
                'sensor.slaapkamer_luchtvochtigheid',
                'binary_sensor.internetverbinding',
                'light.eetkamer_lampje'
            ])
        );
    });

    it('get tracked entities using has_value', () => {
        compiler.renderTemplate(`
            const hasValue = has_value("button.knopje");
            if (hasValue) {
                return "yes";
            }
            return "false";
        `);
        compiler.renderTemplate(`
            if (has_value("camera.keukencamera") && has_value("light.eetkamer_lampje")) {
                return "available";
            }
            return false;
        `);
        compiler.renderTemplate('return has_value("binary_sensor.internetverbinding")');
        expect(compiler.tracked.entities).toHaveLength(3);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'button.knopje',
                'camera.keukencamera',
                'binary_sensor.internetverbinding'
            ])
        );

        compiler.renderTemplate('return has_value("light.eetkamer_lampje")');
        expect(compiler.tracked.entities).toHaveLength(4);
        expect(compiler.tracked.domains).toHaveLength(0);
        expect(compiler.tracked.entities).toEqual(
            expect.arrayContaining([
                'button.knopje',
                'camera.keukencamera',
                'binary_sensor.internetverbinding',
                'light.eetkamer_lampje'
            ])
        );
    });

});

describe('non-existent devices and domains with trackNonExistent as false (default)', () => {

    let compiler: HomeAssistantJavaScriptTemplates;
    
    beforeEach(() => {
        compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
    });

    it('should not track any non-existent domains or entities', () => {
        compiler.renderTemplate('return states("binary_sensor.non_existent")');
        compiler.renderTemplate('return states.climate.thermostat');
        expect(compiler.tracked.entities).toHaveLength(0);
        expect(compiler.tracked.domains).toHaveLength(0);
        
        compiler.renderTemplate('return is_state("binary_sensor.my_sensor", "on")');
        expect(compiler.tracked.entities).toHaveLength(0);
        expect(compiler.tracked.domains).toHaveLength(0);

        compiler.renderTemplate('return state_attr("camera.my_camera", "friendly_name")');
        expect(compiler.tracked.entities).toHaveLength(0);
        expect(compiler.tracked.domains).toHaveLength(0);

        compiler.renderTemplate('return is_state_attr("sensor.my_sensor", "friendly_name", "My Sensor")');
        expect(compiler.tracked.entities).toHaveLength(0);
        expect(compiler.tracked.domains).toHaveLength(0);

        compiler.renderTemplate('return has_value("domain.fake")');
        expect(compiler.tracked.entities).toHaveLength(0);
        expect(compiler.tracked.domains).toHaveLength(0);
    });

});

describe('non-existent devices and domains with trackNonExistent as true (default)', () => {

    let compiler: HomeAssistantJavaScriptTemplates;
    
    beforeEach(() => {
        compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT, false, true);
    });

    it('should track all non-existent domains or entities', () => {
        compiler.renderTemplate('return states("binary_sensor.non_existent")');
        compiler.renderTemplate('return states.climate.thermostat');
        expect(compiler.tracked.entities).toHaveLength(2);
        expect(compiler.tracked.domains).toHaveLength(1);
        
        compiler.renderTemplate('return is_state("binary_sensor.my_sensor", "on")');
        expect(compiler.tracked.entities).toHaveLength(3);
        expect(compiler.tracked.domains).toHaveLength(1);

        compiler.renderTemplate('return state_attr("camera.my_camera", "friendly_name")');
        expect(compiler.tracked.entities).toHaveLength(4);
        expect(compiler.tracked.domains).toHaveLength(1);

        compiler.renderTemplate('return is_state_attr("sensor.my_sensor", "friendly_name", "My Sensor")');
        expect(compiler.tracked.entities).toHaveLength(5);
        expect(compiler.tracked.domains).toHaveLength(1);

        compiler.renderTemplate('return has_value("domain.fake")');
        expect(compiler.tracked.entities).toHaveLength(6);
        expect(compiler.tracked.domains).toHaveLength(1);

        compiler.renderTemplate('return entities("sensor")');
        expect(compiler.tracked.entities).toHaveLength(6);
        expect(compiler.tracked.domains).toHaveLength(2);

        compiler.renderTemplate('return entities.binary_sensor.non_existent_2');
        expect(compiler.tracked.entities).toHaveLength(7);
        expect(compiler.tracked.domains).toHaveLength(3);

        compiler.renderTemplate('return entity_prop("battery.my_phone", "attr")');
        expect(compiler.tracked.entities).toHaveLength(8);
        expect(compiler.tracked.domains).toHaveLength(3);

        compiler.renderTemplate('return is_entity_prop("battery.your_phone", "attr", "value")');
        expect(compiler.tracked.entities).toHaveLength(9);
        expect(compiler.tracked.domains).toHaveLength(3);

    });

});

describe('cleaning trackers', () => {

    let compiler: HomeAssistantJavaScriptTemplates;
    
    beforeEach(() => {
        compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        compiler.renderTemplate('return states("binary_sensor.koffiezetapparaat_aan")');
        compiler.renderTemplate('return states.sensor.slaapkamer_temperatuur.state');
    });

    it('cleanTrackedDomains should clean only the domains', () => {
        expect(compiler.tracked.entities).toHaveLength(2);
        expect(compiler.tracked.domains).toHaveLength(1);
        compiler.cleanTrackedDomains();
        expect(compiler.tracked.entities).toHaveLength(2);
        expect(compiler.tracked.domains).toHaveLength(0);
    });

    it('cleanTrackedEntities should clean only the entities', () => {
        expect(compiler.tracked.entities).toHaveLength(2);
        expect(compiler.tracked.domains).toHaveLength(1);
        compiler.cleanTrackedEntities();
        expect(compiler.tracked.entities).toHaveLength(0);
        expect(compiler.tracked.domains).toHaveLength(1);
    });

    it('cleanTracked should clean domain and entities', () => {
        expect(compiler.tracked.entities).toHaveLength(2);
        expect(compiler.tracked.domains).toHaveLength(1);
        compiler.cleanTracked();
        expect(compiler.tracked.entities).toHaveLength(0);
        expect(compiler.tracked.domains).toHaveLength(0);
    });

});