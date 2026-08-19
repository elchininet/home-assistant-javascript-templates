import {
    HomeAssistantJavaScriptTemplates,
    HomeAssistantJavaScriptTemplatesRenderer
} from '../src/classes';
import { HOME_ASSISTANT_ELEMENT } from './constants';
import { EVENT } from '../src/constants';

describe('promise instance', () => {

    describe('Home Assistant hassConnection errors', () => {

        it('if hassConnection fails, subscribed should be set to false', async () => {
            window.hassConnection = Promise.reject('hassConnection error');
            const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
            const renderer = await compiler.getRenderer();
            await expect(
                renderer.init()
            ).rejects.toMatch('hassConnection error');
            expect(renderer.subscribed).toBeFalsy();
        });

        it('if subscribeMessage fails, subscribed should be set to false', async () => {
            window.hassConnection = Promise.resolve({
                conn: {
                    subscribeMessage: jest.fn(() => Promise.reject('subscribeMessage error'))
                }
            });
            const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
            const renderer = await compiler.getRenderer();
            await expect(
                renderer.init()
            ).rejects.toMatch('subscribeMessage error');
            expect(renderer.subscribed).toBeFalsy();
        });

    });

    describe('Home Assistant hassConnection success', () => {

        let renderer: HomeAssistantJavaScriptTemplatesRenderer;
        let cancelSubscription: jest.Mock;
        let subscribeMessage: jest.Mock;

        beforeEach(async () => {
            cancelSubscription = jest.fn();
            subscribeMessage = jest.fn(() => Promise.resolve(cancelSubscription));
            window.hassConnection = Promise.resolve({
                conn: {
                    subscribeMessage
                }
            });
            const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
            renderer = await compiler.getRenderer();
        });

        it('init method should return a promise that resolves to the same renderer', async () => {
            const instance = await renderer.init();
            expect(renderer).toBe(instance);
        });

        it('hassConnection.conn.subscribeMessage should not be called if init is not called', async () => {
            await new Promise(process.nextTick);
            expect(subscribeMessage).not.toHaveBeenCalled();
        });

        it('hassConnection.conn.subscribeMessage should be called after init is called', async () => {
            renderer.init();
            await new Promise(process.nextTick);
            expect(subscribeMessage).toHaveBeenCalledWith(
                expect.any(Function),
                {
                    type: EVENT.SUBSCRIBE_EVENTS,
                    event_type: EVENT.STATE_CHANGE_EVENT
                }
            );
        });

        it('should throw an error if stop is called without calling init first', async () => {
            expect(
                () => renderer.stop()
            ).toThrow('You cannot call stop method without init being called');
            expect(cancelSubscription).not.toHaveBeenCalled();
        });

        it('should throw an error if init is called without calling stop first', async () => {
            renderer.init();
            await new Promise(process.nextTick);
            await expect(
                renderer.init()
            ).rejects.toThrow('You cannot call init method consecutively, call stop first');
        });

        it('should not throw an error if init is called after calling stop', async () => {
            renderer.init();
            await new Promise(process.nextTick);
            renderer.stop();
            await new Promise(process.nextTick);
            expect(cancelSubscription).toHaveBeenCalled();
            renderer.init();
        });

        it('parseTemplate should return the correct shape', async () => {
            const parsed = renderer.parseTemplate('user_name');
            expect(parsed).toEqual({
                result: 'ElChiniNet',
                entities: []
            });
        });

        it('parseTemplate should return only the tracked entities', async () => {
            const parsed = renderer.parseTemplate(`
                const stateKoffiezetapparaat = states('binary_sensor.koffiezetapparaat_aan');
                const deviceId = device_id('sensor.slaapkamer_temperatuur');
                if (stateKoffiezetapparaat === 'off') {
                    const stateWoonkamerLamp = states('light.woonkamer_lamp');
                    return stateWoonkamerLamp;
                }
                return stateKoffiezetapparaat + ' / ' + deviceId;
            `);
            expect(parsed).toEqual({
                result: 'on / dea1c4475b8dc901b7b33c7eac09896d',
                entities: ['binary_sensor.koffiezetapparaat_aan', 'sensor.slaapkamer_temperatuur']
            });
        });

    });

});