import HomeAssistantJavaScriptTemplates, { HomeAssistantJavaScriptTemplatesRenderer } from '../src';
import { SubscriberEvent, HomeAssistant } from '../src/types';
import { HOME_ASSISTANT_ELEMENT, HASS } from './constants';
import { SUBSCRIBE_EVENTS, STATE_CHANGE_EVENT } from '../src/constants';

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