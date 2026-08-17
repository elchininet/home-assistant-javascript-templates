import HomeAssistantJavaScriptTemplates, { HomeAssistantJavaScriptTemplatesRenderer } from '../src';
import { SubscriberEvent, HomeAssistant } from '../src/types';
import { EVENT } from '../src/constants';
import { HASS } from './constants';

const CUSTOM_EVENT = 'subscribe_events';
const getSubscribeCustomEvent = (id: string) => {
    return new CustomEvent(
        CUSTOM_EVENT,
        {
            detail: {
                data: {
                    entity_id: id
                }
            }
        }
    );
};

describe('promise instance', () => {

    let subscribeMessage: jest.Mock;
    let hassClone: any;
    let renderer: HomeAssistantJavaScriptTemplatesRenderer;

    beforeEach(async () => {
        subscribeMessage = jest.fn((callback: (event: SubscriberEvent) => void, __config: Record<string, string>) => {
            const subscribeCallback = (event: Event): void => {
                callback((event as CustomEvent).detail);
            };
            window.addEventListener(CUSTOM_EVENT, subscribeCallback);
            return Promise.resolve(jest.fn(() => {
                window.removeEventListener(CUSTOM_EVENT, subscribeCallback);
            }));
        });
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

    afterEach(() => {
        renderer.cleanTracked();
    });

    it('tracking a template should call the renderingFunction', async () => {
        const renderingFunction = jest.fn();
        renderer.trackTemplate('states["light.woonkamer_lamp"].state', renderingFunction);
        expect(renderingFunction).toHaveBeenCalledWith('off');
    });

    describe('tracking a template with panel_url', () => {

        let renderingFunction: jest.Mock;

        beforeEach(() => {
            renderingFunction = jest.fn();
            renderer.trackTemplate(
                `
                    return panel_url === '/path/test'
                        ? 'yes'
                        : 'no'
                `,
                renderingFunction
            );
        });

        afterEach(() => {
            window.location.pathname = '/';
        });

        it('should not call the rendering function when HA location-changed event is fired if init has not been called before', () => {
            window.location.pathname = '/path/test';
            window.dispatchEvent(
                new CustomEvent(EVENT.LOCATION_CHANGED)
            );
            expect(renderingFunction).not.toHaveBeenCalledTimes(2);
        });

        it('should call the rendering function when HA location-changed event is fired if init has been called before', async () => {
            expect(renderer.initialized).toBeFalsy();
            renderer.init();
            await new Promise(process.nextTick);
            expect(renderer.initialized).toBeTruthy();
            window.location.pathname = '/path/test';
            window.dispatchEvent(
                new CustomEvent(EVENT.LOCATION_CHANGED)
            );
            expect(renderingFunction).toHaveBeenNthCalledWith(2, 'yes');
        });

        it('should stop calling the rendering function when HA location-changed event is fired if stopWtach has been called before', async () => {
            expect(renderer.initialized).toBeFalsy();
            renderer.init();
            await new Promise(process.nextTick);
            expect(renderer.initialized).toBeTruthy();
            window.location.pathname = '/path/test';
            window.dispatchEvent(
                new CustomEvent(EVENT.LOCATION_CHANGED)
            );
            expect(renderingFunction).toHaveBeenNthCalledWith(2, 'yes');
            renderer.stop();
            expect(renderer.initialized).toBeFalsy();
            window.dispatchEvent(
                new CustomEvent(EVENT.LOCATION_CHANGED)
            );
            expect(renderingFunction).not.toHaveBeenCalledTimes(3);
        });

        it('should not call the rendering function when popstate event is fired if init has not been called before', () => {
            window.dispatchEvent(new Event(EVENT.POPSTATE));
            expect(renderingFunction).not.toHaveBeenCalledTimes(2);
        });

        it('should call the rendering function when popstate event is fired if init has been called before', async () => {
            expect(renderer.initialized).toBeFalsy();
            renderer.init();
            await new Promise(process.nextTick);
            expect(renderer.initialized).toBeTruthy();
            window.location.pathname = '/path/test';
            window.dispatchEvent(new Event(EVENT.POPSTATE));
            expect(renderingFunction).toHaveBeenNthCalledWith(2, 'yes');
        });

        it('should stop calling the rendering function when popstate event is fired if stopWtach has been called before', async () => {
            expect(renderer.initialized).toBeFalsy();
            renderer.init();
            await new Promise(process.nextTick);
            expect(renderer.initialized).toBeTruthy();
            window.location.pathname = '/path/test';
            window.dispatchEvent(new Event(EVENT.POPSTATE));
            expect(renderingFunction).toHaveBeenNthCalledWith(2, 'yes');
            renderer.stop();
            expect(renderer.initialized).toBeFalsy();
            window.dispatchEvent(
                new CustomEvent(EVENT.LOCATION_CHANGED)
            );
            expect(renderingFunction).not.toHaveBeenCalledTimes(3);
        });

    });

    describe('tracking a template with lang', () => {

        let renderingFunction: jest.Mock;

        beforeEach(() => {
            renderingFunction = jest.fn();
            renderer.trackTemplate(
                `
                    return lang === 'es'
                        ? 'sí'
                        : 'yes'
                `,
                renderingFunction
            );
        });

        it ('should not call the rendering function when the event translations-updated is triggered if init has not been called before', () => {
            hassClone.language = 'es';
            window.dispatchEvent(new Event(EVENT.TRANSLATIONS_UPDATED));
            expect(renderingFunction).not.toHaveBeenCalledTimes(2);
        });

        it ('should call the rendering function when the event translations-updated is triggered if init has been called before', async () => {
            expect(renderer.initialized).toBeFalsy();
            renderer.init();
            await new Promise(process.nextTick);
            expect(renderer.initialized).toBeTruthy();
            hassClone.language = 'es';
            window.dispatchEvent(new Event(EVENT.TRANSLATIONS_UPDATED));
            expect(renderingFunction).toHaveBeenNthCalledWith(2, 'sí');
        });

        it('should stop calling the rendering function when the event translations-updated is triggered if stopWtach has been called before', async () => {
            expect(renderer.initialized).toBeFalsy();
            renderer.init();
            await new Promise(process.nextTick);
            expect(renderer.initialized).toBeTruthy();
            hassClone.language = 'es';
            window.dispatchEvent(new Event(EVENT.TRANSLATIONS_UPDATED));
            expect(renderingFunction).toHaveBeenNthCalledWith(2, 'sí');
            renderer.stop();
            expect(renderer.initialized).toBeFalsy();
            window.dispatchEvent(new Event(EVENT.TRANSLATIONS_UPDATED));
            expect(renderingFunction).not.toHaveBeenCalledTimes(3);
        });

    });

    describe('tracking a template when an entity changes', () => {

        let renderingFunction: jest.Mock;

        beforeEach(() => {
            renderingFunction = jest.fn();
            renderer.trackTemplate('states["light.woonkamer_lamp"].state', renderingFunction);
        });

        it ('should not call the rendering function when the entity changes if init has not been called before', () => {
            hassClone.states['light.woonkamer_lamp'].state = 'on';
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction).not.toHaveBeenCalledTimes(2);
        });

        it ('should call the rendering function when the entity changes if init has been called before', async () => {
            expect(renderer.initialized).toBeFalsy();
            renderer.init();
            await new Promise(process.nextTick);
            expect(renderer.initialized).toBeTruthy();
            hassClone.states['light.woonkamer_lamp'].state = 'on';
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction).toHaveBeenNthCalledWith(2, 'on');
            expect(renderingFunction).not.toHaveBeenCalledTimes(3);
        });

        it('should stop calling the rendering function when an entity changes if stopWtach has been called before', async () => {
            expect(renderer.initialized).toBeFalsy();
            renderer.init();
            await new Promise(process.nextTick);
            expect(renderer.initialized).toBeTruthy();
            hassClone.states['light.woonkamer_lamp'].state = 'on';
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction).toHaveBeenNthCalledWith(2, 'on');
            renderer.stop();
            expect(renderer.initialized).toBeFalsy();
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction).not.toHaveBeenCalledTimes(3);
        });

    });

    describe('entity changes and rendering functions', () => {

        beforeEach(async () => {
            renderer.init();
            await new Promise(process.nextTick);
        });

        it('tracking the same template with multiple functions should call all of them', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            const renderingFunction3 = jest.fn();
            const template = 'states["light.woonkamer_lamp"].state';
            renderer.trackTemplate(template, renderingFunction1);
            renderer.trackTemplate(template, renderingFunction2);
            renderer.trackTemplate(template, renderingFunction3);
            expect(renderingFunction1).toHaveBeenCalledWith('off');
            expect(renderingFunction2).toHaveBeenCalledWith('off');
            expect(renderingFunction3).toHaveBeenCalledWith('off');
        });

        it('tracking the same template with multiple functions should call an update of all the renderingFunctions when an entity changes', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            const renderingFunction3 = jest.fn();
            const template = 'states["light.woonkamer_lamp"].state';
            renderer.trackTemplate(template, renderingFunction1);
            renderer.trackTemplate(template, renderingFunction2);
            renderer.trackTemplate(template, renderingFunction3);
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, 'off');
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, 'off');
            expect(renderingFunction3).toHaveBeenNthCalledWith(1, 'off');
            hassClone.states['light.woonkamer_lamp'].state = 'on';
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction1).toHaveBeenNthCalledWith(2, 'on');
            expect(renderingFunction1).not.toHaveBeenCalledTimes(3);
            expect(renderingFunction2).toHaveBeenNthCalledWith(2, 'on');
            expect(renderingFunction2).not.toHaveBeenCalledTimes(3);
            expect(renderingFunction3).toHaveBeenNthCalledWith(2, 'on');
            expect(renderingFunction3).not.toHaveBeenCalledTimes(3);
        });

        it('tracking a template with an unreached entity should not call renderingFunction if that entity changes', async () => {
            const renderingFunction = jest.fn();
            renderer.trackTemplate(
                `
                    if (is_state('light.woonkamer_lamp', 'on')) {
                        return states('sensor.slaapkamer_temperatuur');
                    }
                    return '0';
                `,
                renderingFunction
            );
            expect(renderingFunction).toHaveBeenNthCalledWith(1, '0');
            hassClone.states['light.woonkamer_lamp'].state = 'on';
            window.dispatchEvent(
                getSubscribeCustomEvent('sensor.slaapkamer_temperatuur')
            );
            expect(renderingFunction).not.toHaveBeenCalledTimes(2);
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction).toHaveBeenNthCalledWith(2, '17.456');
            window.dispatchEvent(
                getSubscribeCustomEvent('sensor.slaapkamer_temperatuur')
            );
            expect(renderingFunction).toHaveBeenNthCalledWith(3, '17.456');
        });

        it('tracking a multiple templates with the same entity id should call all the renderingFunctions', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            renderer.trackTemplate(
                `
                    if (is_state('light.woonkamer_lamp', 'on')) {
                        return 'yes';
                    }
                    return 'no';
                `,
                renderingFunction1
            );
            renderer.trackTemplate('states("light.woonkamer_lamp")', renderingFunction2);

            expect(renderingFunction1).toHaveBeenNthCalledWith(1, 'no');
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, 'off');
            hassClone.states['light.woonkamer_lamp'].state = 'on';
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction1).toHaveBeenNthCalledWith(2, 'yes');
            expect(renderingFunction2).toHaveBeenNthCalledWith(2, 'on');
        });

        it('if the untrack function that trackTemplate returns is called then it should clean all the trackings for that template/rendering function', () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            const untrack1 = renderer.trackTemplate(
                `
                    if (is_state('light.woonkamer_lamp', 'on')) {
                        return 'yes';
                    }
                    return 'no';
                `,
                renderingFunction1
            );
            const untrack2 = renderer.trackTemplate(
                'states("light.woonkamer_lamp")',
                renderingFunction2
            );
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, 'no');
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, 'off');
            untrack1();
            hassClone.states['light.woonkamer_lamp'].state = 'on';
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction1).toHaveBeenCalledTimes(1);
            expect(renderingFunction2).toHaveBeenNthCalledWith(2, 'on');
            untrack2();
            hassClone.states['light.woonkamer_lamp'].state = 'off';
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction1).toHaveBeenCalledTimes(1);
            expect(renderingFunction2).toHaveBeenCalledTimes(2);
        });

        it('calling the untrack function that trackTemplate returns multiple times should not generate any errors even if the templates were already cleaned', () => {
            const template1 = `
                if (is_state('light.woonkamer_lamp', 'on')) {
                    return 'yes';
                }
                return 'no';
            `.trim();
            const template2 = `is_state('light.woonkamer_lamp', 'on')`;
            const renderingFunction1 = jest.fn();
            const renderingFunction1_2 = jest.fn();
            const renderingFunction2 = jest.fn();
            const renderingFunction2_2 = jest.fn();
            const untrack1 = renderer.trackTemplate(template1, renderingFunction1);
            const untrack1_2 = renderer.trackTemplate(template1, renderingFunction1_2);
            const untrack2 = renderer.trackTemplate(template2, renderingFunction2);
            const untrack2_2 = renderer.trackTemplate(template2, renderingFunction2_2);
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, 'no');
            expect(renderingFunction1_2).toHaveBeenNthCalledWith(1, 'no');
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, false);
            expect(renderingFunction2_2).toHaveBeenNthCalledWith(1, false);
            untrack1();
            hassClone.states['light.woonkamer_lamp'].state = 'on';
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction1).toHaveBeenCalledTimes(1);
            expect(renderingFunction1_2).toHaveBeenNthCalledWith(2, 'yes');
            expect(renderingFunction2).toHaveBeenNthCalledWith(2, true);
            expect(renderingFunction2_2).toHaveBeenNthCalledWith(2, true);
            expect(
                () => untrack1()
            ).not.toThrow();
            untrack2();
            hassClone.states['light.woonkamer_lamp'].state = 'off';
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction1).toHaveBeenCalledTimes(1);
            expect(renderingFunction1_2).toHaveBeenNthCalledWith(3, 'no');
            expect(renderingFunction2).toHaveBeenCalledTimes(2);
            expect(renderingFunction2_2).toHaveBeenNthCalledWith(3, false);
            expect(
                () => untrack1()
            ).not.toThrow();
            expect(
                () => untrack2()
            ).not.toThrow();
            untrack1_2();
            hassClone.states['light.woonkamer_lamp'].state = 'on';
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction1).toHaveBeenCalledTimes(1);
            expect(renderingFunction1_2).toHaveBeenCalledTimes(3);
            expect(renderingFunction2).toHaveBeenCalledTimes(2);
            expect(renderingFunction2_2).toHaveBeenNthCalledWith(4, true);
            expect(
                () => untrack1()
            ).not.toThrow();
            expect(
                () => untrack2()
            ).not.toThrow();
            expect(
                () => untrack1_2()
            ).not.toThrow();
            untrack2_2();
            expect(renderingFunction1).toHaveBeenCalledTimes(1);
            expect(renderingFunction1_2).toHaveBeenCalledTimes(3);
            expect(renderingFunction2).toHaveBeenCalledTimes(2);
            expect(renderingFunction2_2).toHaveBeenCalledTimes(4);
            expect(
                () => untrack1()
            ).not.toThrow();
            expect(
                () => untrack2()
            ).not.toThrow();
            expect(
                () => untrack1_2()
            ).not.toThrow();
            expect(
                () => untrack2_2()
            ).not.toThrow();
            expect(renderingFunction1).toHaveBeenCalledTimes(1);
            expect(renderingFunction1_2).toHaveBeenCalledTimes(3);
            expect(renderingFunction2).toHaveBeenCalledTimes(2);
            expect(renderingFunction2_2).toHaveBeenCalledTimes(4);
        });

        it('after executing cleanTracked the rendering functions should not be called anymore', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            renderer.trackTemplate(
                `
                    if (is_state('light.woonkamer_lamp', 'on')) {
                        return 'yes';
                    }
                    return 'no';
                `,
                renderingFunction1
            );
            renderer.trackTemplate('states("light.woonkamer_lamp")', renderingFunction2);
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, 'no');
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, 'off');
            renderer.cleanTracked();
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            expect(renderingFunction1).not.toHaveBeenCalledTimes(2);
            expect(renderingFunction2).not.toHaveBeenCalledTimes(2);
        });

        it('if cleanTracked is executed sending an entity id only that entity should be cleaned', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction1);
            renderer.trackTemplate('is_state("binary_sensor.koffiezetapparaat_verbonden", "on")', renderingFunction2);
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, false);
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, true);
            hassClone.states['light.woonkamer_lamp'].state = 'on';
            hassClone.states['binary_sensor.koffiezetapparaat_verbonden'].state = 'off';
            renderer.cleanTracked('binary_sensor.koffiezetapparaat_verbonden');
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            window.dispatchEvent(
                getSubscribeCustomEvent('binary_sensor.koffiezetapparaat_verbonden')
            );
            expect(renderingFunction1).toHaveBeenNthCalledWith(2, true);
            expect(renderingFunction2).not.toHaveBeenNthCalledWith(2, false);
        });

        it('if cleanTracked is executed sending a non-tracked entity id it should not clean any tracked entity', async () => {
            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            renderer.trackTemplate('is_state("light.woonkamer_lamp", "on")', renderingFunction1);
            renderer.trackTemplate('is_state("binary_sensor.koffiezetapparaat_verbonden", "on")', renderingFunction2);
            expect(renderingFunction1).toHaveBeenNthCalledWith(1, false);
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, true);
            hassClone.states['light.woonkamer_lamp'].state = 'on';
            hassClone.states['binary_sensor.koffiezetapparaat_verbonden'].state = 'off';
            renderer.cleanTracked('light.eetkamer_lampje');
            window.dispatchEvent(
                getSubscribeCustomEvent('light.woonkamer_lamp')
            );
            window.dispatchEvent(
                getSubscribeCustomEvent('binary_sensor.koffiezetapparaat_verbonden')
            );
            expect(renderingFunction1).toHaveBeenNthCalledWith(2, true);
            expect(renderingFunction2).toHaveBeenNthCalledWith(2, false);
        });

    });

});