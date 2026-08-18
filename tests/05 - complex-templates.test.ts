import { HomeAssistantJavaScriptTemplates }  from '../src/classes';
import { HOME_ASSISTANT_ELEMENT } from './constants';

describe('Complex templates tests', () => {

    it('should return the proper values', async () => {

        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn(
                    () => Promise.resolve(
                        jest.fn()
                    )
                )
            }
        });
        const renderer = await new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT).getRenderer();
        renderer.init();
        await new Promise(process.nextTick);

        expect(
            renderer.renderTemplate(`
                const allStates = states["binary_sensor"];
                const filter = Object.entries(allStates).filter(([, stateObject]) => {
                    return stateObject.state === 'off';
                });
                return "(" + filter[0][1].entity_id + ")";
            `)
        ).toBe('(binary_sensor.internetverbinding)');

        expect(
            renderer.renderTemplate(`
                const state = states.sensor.slaapkamer_luchtvochtigheid;
                if (+state > 50) {
                    return 'High';
                }
                return 'Low';
            `)
        ).toBe('Low');

        expect(
            renderer.renderTemplate(`
                const deviceId = device_id("binary_sensor.koffiezetapparaat_aan");
                const serialNumber = device_attr(deviceId, "serial_number");
                return \`sn: \${serialNumber}\`
            `)
        ).toBe('sn: 123456789');

        expect(
            renderer.renderTemplate(`

                states("binary_sensor.koffiezetapparaat_aan")
            `)
        ).toBe('on');

    });

});