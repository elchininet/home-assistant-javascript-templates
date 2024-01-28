import HomeAssistantJavaScriptTemplates from '../src';
import { HOME_ASSISTANT_ELEMENT } from './constants';

describe('Complex templates tests', () => {

    let compiler: HomeAssistantJavaScriptTemplates;
    
    beforeEach(() => {
        compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
    });

    it('templates', () => {

        expect(
            compiler.renderTemplate(`
                const allStates = states["binary_sensor"];
                const filter = allStates.filter((item) => {
                    return item.state === 'off';
                });
                return "(" + filter[0].entity_id + ")";
            `)
        ).toBe('(binary_sensor.internetverbinding)');

        expect(
            compiler.renderTemplate(`
                const state = states("sensor.slaapkamer_luchtvochtigheid");
                if (+state > 50) {
                    return 'High';
                }
                return 'Low';
            `)
        ).toBe('Low');

        expect(
            compiler.renderTemplate(`
                const deviceId = device_id("binary_sensor.koffiezetapparaat_aan");
                const serialNumber = device_attr(deviceId, "serial_number");
                return \`sn: \${serialNumber}\`
            `)
        ).toBe('sn: 123456789');

    });

});