import {
    HomeAssistantJavaScriptTemplates,
    HomeAssistantJavaScriptTemplatesRenderer
} from '../src/classes';
import { Hass, HomeAssistant } from '../src/types';
import { HASS, HOME_ASSISTANT_ELEMENT } from './constants';
import { EVENT, NAMESPACE } from '../src/constants';
import { waitForDelay } from './utilities';

describe('promise instance', () => {

    describe('Home Assistant hassConnection errors', () => {

        let consoleErrorMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;

        beforeEach(() => {
            consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();
        });

        afterEach(() => {
            consoleErrorMock.mockRestore();
        });

        it('if hassConnection fails, trackTemplate should throw a console error but it should execute the rendering function', async () => {
            const errorMessage = 'hassConnection error';
            window.hassConnection = Promise.reject(errorMessage);
            const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
            const renderer = await compiler.getRenderer();
            const renderingFunction = jest.fn();
            renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction);
            await waitForDelay();
            expect(renderingFunction).toHaveBeenNthCalledWith(1, false);
            expect(consoleErrorMock).toHaveBeenNthCalledWith(1, `${NAMESPACE}: ${errorMessage}`);
        });

        it('if subscribeMessage fails, trackTemplate should throw a console error but it should execute the rendering function', async () => {
            const errorMessage = 'subscribeMessage error';
            window.hassConnection = Promise.resolve({
                conn: {
                    subscribeMessage: jest.fn(() => Promise.reject(errorMessage))
                }
            });
            const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
            const renderer = await compiler.getRenderer();
            const renderingFunction = jest.fn();
            renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction);
            await waitForDelay();
            expect(renderingFunction).toHaveBeenNthCalledWith(1, false);
            expect(consoleErrorMock).toHaveBeenNthCalledWith(1, `${NAMESPACE}: ${errorMessage}`);
        });

    });

    describe('Home Assistant hassConnection and subscribeMessage success', () => {

        let renderer: HomeAssistantJavaScriptTemplatesRenderer;
        let cancelSubscription: jest.Mock;
        let subscribeMessage: jest.Mock;
        let hassClone: Hass;

        beforeEach(async () => {
            cancelSubscription = jest.fn();
            subscribeMessage = jest.fn(() => Promise.resolve(cancelSubscription));
            window.hassConnection = Promise.resolve({
                conn: {
                    subscribeMessage
                }
            });
            hassClone = JSON.parse(JSON.stringify(HASS));
            const compiler = new HomeAssistantJavaScriptTemplates({
                hass: hassClone
            } as HomeAssistant);
            renderer = await compiler.getRenderer();
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

        it('trackTemplate called multiple times should create a debounced subscription with all the entities tracked', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction1);
            renderer.trackTemplate('is_state("binary_sensor.koffiezetapparaat_verbonden", "on")', renderingFunction2);
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, false);
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, true);
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenNthCalledWith(
                1,
                expect.any(Function),
                {
                    type: EVENT.SUBSCRIBE_ENTITIES,
                    entity_ids: ['light.woonkamer_lamp', 'binary_sensor.koffiezetapparaat_verbonden']
                }
            );
            expect(subscribeMessage).not.toHaveBeenCalledTimes(2);
            expect(cancelSubscription).not.toHaveBeenCalled();
        });

        it('trackTemplate should cancel the previous subscription and create a new one', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction1);
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, false);
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenNthCalledWith(
                1,
                expect.any(Function),
                {
                    type: EVENT.SUBSCRIBE_ENTITIES,
                    entity_ids: ['light.woonkamer_lamp']
                }
            );
            expect(cancelSubscription).not.toHaveBeenCalled();
            renderer.trackTemplate('is_state("binary_sensor.koffiezetapparaat_verbonden", "on")', renderingFunction2);
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, true);
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenNthCalledWith(
                2,
                expect.any(Function),
                {
                    type: EVENT.SUBSCRIBE_ENTITIES,
                    entity_ids: ['light.woonkamer_lamp', 'binary_sensor.koffiezetapparaat_verbonden']
                }
            );
            expect(cancelSubscription).toHaveBeenCalledTimes(1);
        });

        it('trackTemplate should not create any subscription if cleanTracked is called with the tracked entity immediately', async () => {
            const renderingFunction = jest.fn();
            renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction);
            renderer.cleanTracked('light.woonkamer_lamp');
            expect(renderingFunction).toHaveBeenNthCalledWith(1, false);
            await waitForDelay();
            expect(subscribeMessage).not.toHaveBeenCalled();
        });

        it('trackTemplate should not create any subscription if cleanTracked is called without entities immediately', async () => {
            const renderingFunction = jest.fn();
            renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction);
            renderer.cleanTracked();
            expect(renderingFunction).toHaveBeenNthCalledWith(1, false);
            await waitForDelay();
            expect(subscribeMessage).not.toHaveBeenCalled();
        });

        it('trackTemplate should not create any subscription if its cleaning function is called immediately', async () => {
            const renderingFunction = jest.fn();
            const clean = renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction);
            clean();
            expect(renderingFunction).toHaveBeenNthCalledWith(1, false);
            await waitForDelay();
            expect(subscribeMessage).not.toHaveBeenCalled();
        });

        it('trackTemplate with the same tracked entities should not create a new subscription', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction1);
            await waitForDelay();
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, false);
            expect(subscribeMessage).toHaveBeenNthCalledWith(
                1,
                expect.any(Function),
                {
                    type: EVENT.SUBSCRIBE_ENTITIES,
                    entity_ids: ['light.woonkamer_lamp']
                }
            );
            renderer.trackTemplate('states("light.woonkamer_lamp")', renderingFunction2);
            await waitForDelay();
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, 'off');
            expect(subscribeMessage).not.toHaveBeenCalledTimes(2);
            expect(cancelSubscription).not.toHaveBeenCalled();
        });

        it('trackTemplate with a template containing home assistant entities and client side entities should subscribe only the home assistant entity', async () => {
    
            renderer.trackTemplate(
                `
                    const isOn = is_state("light.woonkamer_lamp", "on");
                    if (lang === "es") {
                        return isOn ? 'Encendido' : 'Apagado';
                    } else {
                        return isOn ? 'On' : 'Off';
                    }
                `,
                jest.fn()
            );
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenNthCalledWith(
                1,
                expect.any(Function),
                {
                    type: EVENT.SUBSCRIBE_ENTITIES,
                    entity_ids: ['light.woonkamer_lamp']
                }
            );
            expect(cancelSubscription).not.toHaveBeenCalled();
            
        });

        it('should not resubscribe to the entities when a template with lang or panel_url is tracked or untracked', async () => {
    
            renderer.trackTemplate('states("light.woonkamer_lamp")', jest.fn());
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenNthCalledWith(
                1,
                expect.any(Function),
                {
                    type: EVENT.SUBSCRIBE_ENTITIES,
                    entity_ids: ['light.woonkamer_lamp']
                }
            );

            const untrackLang = renderer.trackTemplate('return lang', jest.fn());
            const untrackPanelUrl = renderer.trackTemplate('return panel_url', jest.fn());
            await waitForDelay();

            untrackLang();
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenCalledTimes(1);
            expect(cancelSubscription).not.toHaveBeenCalled();

            untrackPanelUrl();
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenCalledTimes(1);
            expect(cancelSubscription).not.toHaveBeenCalled();
            
        });

        it('cleanTracked with an entity id should create a new subscription excluding the cleaned entity id', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction1);
            renderer.trackTemplate('is_state("binary_sensor.koffiezetapparaat_verbonden", "on")', renderingFunction2);
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, false);
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, true);
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenNthCalledWith(
                1,
                expect.any(Function),
                {
                    type: EVENT.SUBSCRIBE_ENTITIES,
                    entity_ids: ['light.woonkamer_lamp', 'binary_sensor.koffiezetapparaat_verbonden']
                }
            );
            expect(cancelSubscription).not.toHaveBeenCalled();
            renderer.cleanTracked('binary_sensor.koffiezetapparaat_verbonden');
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenNthCalledWith(
                2,
                expect.any(Function),
                {
                    type: EVENT.SUBSCRIBE_ENTITIES,
                    entity_ids: ['light.woonkamer_lamp']
                }
            );
            expect(cancelSubscription).toHaveBeenCalledTimes(1);
        });

        it('cleanTracked with a client side entity should not unsubscribe or create a new subscription', async () => {
            renderer.trackTemplate('states("light.woonkamer_lamp")', jest.fn());
            renderer.trackTemplate('return lang', jest.fn());
            renderer.trackTemplate('return panel_url', jest.fn());
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenNthCalledWith(
                1,
                expect.any(Function),
                {
                    type: EVENT.SUBSCRIBE_ENTITIES,
                    entity_ids: ['light.woonkamer_lamp']
                }
            );

            renderer.cleanTracked('lang');
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenCalledTimes(1);
            expect(cancelSubscription).not.toHaveBeenCalled();
            
            renderer.cleanTracked('panel_url');
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenCalledTimes(1);
            expect(cancelSubscription).not.toHaveBeenCalled();
        });

        it('cleanTracked without an entity id should clean the subscription and not create a new one', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction1);
            renderer.trackTemplate('is_state("binary_sensor.koffiezetapparaat_verbonden", "on")', renderingFunction2);
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, false);
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, true);
            await waitForDelay();
            expect(subscribeMessage).toHaveBeenNthCalledWith(
                1,
                expect.any(Function),
                {
                    type: EVENT.SUBSCRIBE_ENTITIES,
                    entity_ids: ['light.woonkamer_lamp', 'binary_sensor.koffiezetapparaat_verbonden']
                }
            );
            expect(cancelSubscription).not.toHaveBeenCalled();
            renderer.cleanTracked();
            await waitForDelay();
            expect(subscribeMessage).not.toHaveBeenCalledTimes(2);
            expect(cancelSubscription).toHaveBeenCalledTimes(1);
        });

        it('tracking templates with client side variables should not create any subscription', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            renderer.trackTemplate('lang === "en"', renderingFunction1);
            renderer.trackTemplate('panel_url === "/lovelace"', renderingFunction2);
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, true);
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, false);
            await waitForDelay();
            expect(subscribeMessage).not.toHaveBeenCalled();
        });

        it('tracking templates with refs should not create any subscription', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            renderer.trackTemplate(
                `
                    const name = ref('name');
                    return name.value;
                `,
                renderingFunction1
            );
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, undefined);
            renderer.trackTemplate(
                `
                    const name = ref('name');
                    name.value = 'Boss';
                    return true;
                `,
                renderingFunction2
            );
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, true);
            expect(renderingFunction1).toHaveBeenNthCalledWith(2, 'Boss');
            await waitForDelay();
            expect(subscribeMessage).not.toHaveBeenCalled();
        });

    });

});