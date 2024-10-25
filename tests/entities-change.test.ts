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
            window.addEventListener(CUSTOM_EVENT, ((event: CustomEvent): void => {
                callback(event.detail);
            }) as EventListener);
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

    it('tracking a template should call the renderingFunction after storing the tracking', async () => {
        const renderingFunction = jest.fn();
        renderer.trackTemplate('states["light.woonkamer_lamp"].state', renderingFunction);
        expect(renderingFunction).toHaveBeenCalledWith('off');
    });

    it('tracking a template with panel_url should call the rendering function when HA location-changed event is fired', () => {
        const renderingFunction = jest.fn();
        renderer.trackTemplate(
            `
                return panel_url === "/path/test"
                    ? "yes"
                    : "no"
            `,
            renderingFunction
        );
        expect(renderingFunction).toHaveBeenNthCalledWith(1, "no");
        location.assign('/path/test');
        window.dispatchEvent(
            new CustomEvent(EVENT.LOCATION_CHANGED)
        );
        expect(renderingFunction).toHaveBeenNthCalledWith(2, "yes");
    });

    it('tracking a template with panel_url should call the rendering function when popstate event is fired', () => {
        const renderingFunction = jest.fn();
        renderer.trackTemplate(
            `
                return panel_url === "/path/test"
                    ? "yes"
                    : "no"
            `,
            renderingFunction
        );
        expect(renderingFunction).toHaveBeenNthCalledWith(1, "no");
        window.dispatchEvent(new Event(EVENT.POPSTATE));
        expect(renderingFunction).toHaveBeenNthCalledWith(2, "no");
        location.assign('/path/test');
        window.dispatchEvent(new Event(EVENT.POPSTATE));
        expect(renderingFunction).toHaveBeenNthCalledWith(3, "yes");
    });

    it('tracking the same template with multiple fucntions should call all of them', async () => {
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

    it('tracking a template should call an update of the renderingFunction when an entity changes', async () => {
        const renderingFunction = jest.fn();
        renderer.trackTemplate('states["light.woonkamer_lamp"].state', renderingFunction);
        expect(renderingFunction).toHaveBeenNthCalledWith(1, 'off');
        hassClone.states['light.woonkamer_lamp'].state = 'on';
        window.dispatchEvent(
            getSubscribeCustomEvent('light.woonkamer_lamp')
        );
        expect(renderingFunction).toHaveBeenNthCalledWith(2, 'on');
        expect(renderingFunction).not.toHaveBeenCalledTimes(3);
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
        expect(renderingFunction).toHaveBeenNthCalledWith(2, '17.4');
        window.dispatchEvent(
            getSubscribeCustomEvent('sensor.slaapkamer_temperatuur')
        );
        expect(renderingFunction).toHaveBeenNthCalledWith(3, '17.4');
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