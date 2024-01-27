import HomeAssistantJavaScriptTemplates from '../src';
import { HASS } from './constants';

describe('Basic templates tests', () => {

    let compiler: HomeAssistantJavaScriptTemplates;
    
    beforeEach(() => {
        compiler = new HomeAssistantJavaScriptTemplates(HASS);
    });

    it('hass', () => {
        expect(
            compiler.renderTemplate('hass')
        ).toBe(
            HASS
        );
    }),

    it('states', () => {

        expect(
            compiler.renderTemplate('states["sensor.non_existent"]')
        ).toBe(undefined);

        expect(
            compiler.renderTemplate('states["light.woonkamer_lamp"].state')
        ).toBe('off');

        expect(
            compiler.renderTemplate('states["binary_sensor.koffiezetapparaat_verbonden"].state')
        ).toBe('on');

        expect(
            compiler.renderTemplate('states["binary_sensor.koffiezetapparaat_verbonden"].state')
        ).toBe(
            compiler.renderTemplate('states("binary_sensor.koffiezetapparaat_verbonden")')
        );

        expect(
            compiler.renderTemplate('states("light.non_existent")')
        ).toBe(undefined);

        expect(
            compiler.renderTemplate('states["sensor"]')
        ).toHaveLength(2);

        expect(
            compiler.renderTemplate('states["sensor"]')
        ).toMatchObject(
            [
                HASS.states['sensor.slaapkamer_temperatuur'],
                HASS.states['sensor.slaapkamer_luchtvochtigheid']
            ]
        );

        // expect(
        //     compiler.renderTemplate('states["battery"]')
        // ).toBe(undefined);

    });

    it('is_state', () => {

        expect(
            compiler.renderTemplate('is_state("sensor.slaapkamer_luchtvochtigheid", "45")')
        ).toBe(true);

        expect(
            compiler.renderTemplate('is_state("sensor.slaapkamer_temperatuur", "10")')
        ).toBe(false);

        expect(
            compiler.renderTemplate('is_state("sensor.non_existent", "10")')
        ).toBe(false);

    });

    it('state_attr', () => {

        expect(
            compiler.renderTemplate('state_attr("sensor.slaapkamer_luchtvochtigheid", "state_class")')
        ).toBe('measurement');

        expect(
            compiler.renderTemplate('state_attr("sensor.slaapkamer_temperatuur", "friendly_name")')
        ).toBe('Slaapkamer Temperatuur');

        expect(
            compiler.renderTemplate('state_attr("sensor.non_existent", "device_class")')
        ).toBe(undefined);

    });

    it('is_state_attr', () => {

        expect(
            compiler.renderTemplate('is_state_attr("binary_sensor.koffiezetapparaat_verbonden", "device_class", "connectivity")')
        ).toBe(true);

        expect(
            compiler.renderTemplate('is_state_attr("sensor.slaapkamer_luchtvochtigheid", "state_class", "battery")')
        ).toBe(false);

        expect(
            compiler.renderTemplate('is_state_attr("sensor.non_existent", "name", "fake")')
        ).toBe(false);

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

    });

    it('device_attr', () => {

        expect(
            compiler.renderTemplate('device_attr("706ad0ebe27e105d7cd0b73386deefdd", "manufacturer")')
        ).toBe('Synology');

        expect(
            compiler.renderTemplate('device_attr("4d584585f0eb89172ce1a71c8b0e74ae", "model")')
        ).toBe('HHCCJCY01');

        expect(
            compiler.renderTemplate('device_attr("b8c1c9dd23cb82bbfa09b5657f41d04f", "attr")')
        ).toBe(undefined);

        expect(
            compiler.renderTemplate('device_attr("012345", "attr")')
        ).toBe(undefined);

    });

    it('is_device_attr', () => {

        expect(
            compiler.renderTemplate('is_device_attr("706ad0ebe27e105d7cd0b73386deefdd", "manufacturer", "Synology")')
        ).toBe(true);

        expect(
            compiler.renderTemplate('is_device_attr("4d584585f0eb89172ce1a71c8b0e74ae", "model", "HHCCJCY01")')
        ).toBe(true);

        expect(
            compiler.renderTemplate('is_device_attr("b8c1c9dd23cb82bbfa09b5657f41d04f", "attr", "value")')
        ).toBe(false);

        expect(
            compiler.renderTemplate('is_device_attr("012345", "attr", "value")')
        ).toBe(false);

    });

    it('device_id', () => {

        expect(
            compiler.renderTemplate('device_id("light.woonkamer_lamp")')
        ).toBe('4d584585f0eb89172ce1a71c8b0e74ae');

        expect(
            compiler.renderTemplate('device_id("binary_sensor.internetverbinding")')
        ).toBe('a121a9414241f03ce6b3108b2716f9be');

        expect(
            compiler.renderTemplate('device_id("sensor.non_existent")')
        ).toBe(undefined);

    });

    it('areas', () => {

        expect(
            compiler.renderTemplate('areas()')
        ).toHaveLength(3);

        expect(
            compiler.renderTemplate('areas()')
        ).toMatchObject([
            HASS.areas.eetkamer.area_id,
            HASS.areas.slaapkamer.area_id,
            HASS.areas.woonkamer.area_id
        ]);

    });

    it('area_id', () => {

        expect(
            compiler.renderTemplate('area_id("4d584585f0eb89172ce1a71c8b0e74ae")')
        ).toBe('woonkamer');

        expect(
            compiler.renderTemplate('area_id("binary_sensor.koffiezetapparaat_verbonden")')
        ).toBe('eetkamer');

        expect(
            compiler.renderTemplate('area_id("Slaapkamer")')
        ).toBe('slaapkamer');

        expect(
            compiler.renderTemplate('area_id("NonExistent")')
        ).toBe(undefined);

    });

    it('area_name', () => {

        expect(
            compiler.renderTemplate('area_name("4d584585f0eb89172ce1a71c8b0e74ae")')
        ).toBe('Woonkamer');

        expect(
            compiler.renderTemplate('area_name("binary_sensor.koffiezetapparaat_verbonden")')
        ).toBe('Eetkamer');

        expect(
            compiler.renderTemplate('area_name("slaapkamer")')
        ).toBe('Slaapkamer');

        expect(
            compiler.renderTemplate('area_name("non_existent")')
        ).toBe(undefined);

    });

    it('area_entities', () => {

        expect(
            compiler.renderTemplate('area_entities("eetkamer")')
        ).toMatchObject([
            'binary_sensor.koffiezetapparaat_aan',
            'binary_sensor.koffiezetapparaat_verbonden',
            'light.eetkamer_lampje'
        ]);

        expect(
            compiler.renderTemplate('area_entities("Woonkamer")')
        ).toMatchObject([
            'light.woonkamer_lamp'
        ]);

        expect(
            compiler.renderTemplate('area_entities("keuken")')
        ).toMatchObject([]);

    });

    it('area_devices', () => {

        expect(
            compiler.renderTemplate('area_devices("eetkamer")')
        ).toMatchObject([
            '706ad0ebe27e105d7cd0b73386deefdd',
            'b8c1c9dd23cb82bbfa09b5657f41d04f',
            '720a719fe7db1460b0e4cc9ffbb1488d'
        ]);

        expect(
            compiler.renderTemplate('area_devices("Woonkamer")')
        ).toMatchObject([
            '4d584585f0eb89172ce1a71c8b0e74ae'
        ]);

        expect(
            compiler.renderTemplate('area_devices("keuken")')
        ).toMatchObject([]);

    });

});