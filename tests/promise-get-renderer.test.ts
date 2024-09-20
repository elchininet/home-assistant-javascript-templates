import HomeAssistantJavaScriptTemplates from '../src';
import { HOME_ASSISTANT_ELEMENT, HASS } from './constants';
import { SUBSCRIBE_EVENTS, STATE_CHANGE_EVENT } from '../src/constants';

describe('promise instance', () => {

    let subscribeMessage: jest.Mock;

    beforeEach(() => {
        subscribeMessage = jest.fn();
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage
            }
        });
    });

    it('getRenderer method should return a valid promise', () => {
        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        expect(compiler.getRenderer()).toBeInstanceOf(Promise);
    });

    it('getRenderer promise should resolve in a valid HomeAssistantJavaScriptTemplatesRenderer', async () => {
        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        const renderer = await compiler.getRenderer();
        expect(renderer.renderTemplate('user_name')).toBe('ElChiniNet');
    });

    it('hassConnection.conn.subscribeMessage should be called', async () => {
        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        const renderer = await compiler.getRenderer();
        expect(subscribeMessage).toHaveBeenCalledWith(
            expect.any(Function),
            {
                type: SUBSCRIBE_EVENTS,
                event_type: STATE_CHANGE_EVENT
            }
        );
    });

    describe('getRenderer promise rejection', () => {

        const  rejectionMessage = 'The provided element doesn\'t contain a proper or initialised hass object';
        const delay = 6000;

        it('should reject if areas cannot be retrieved', async () => {
            const compiler = new HomeAssistantJavaScriptTemplates({
                ...HOME_ASSISTANT_ELEMENT,
                hass: {
                    ...HASS,
                    areas: undefined
                }
            });
            await expect(
                async () => await compiler.getRenderer()
            ).rejects.toThrow(rejectionMessage);
        }, delay);
    
        it('should reject if devices cannot be retrieved', () => {
            const compiler = new HomeAssistantJavaScriptTemplates({
                ...HOME_ASSISTANT_ELEMENT,
                hass: {
                    ...HASS,
                    devices: undefined
                }
            });
            expect(
                async () => await compiler.getRenderer()
            ).rejects.toMatch(rejectionMessage);
        }, delay);

        it('should reject if devices cannot be retrieved', () => {
            const compiler = new HomeAssistantJavaScriptTemplates({
                ...HOME_ASSISTANT_ELEMENT,
                hass: {
                    ...HASS,
                    entities: undefined
                }
            });
            expect(
                async () => await compiler.getRenderer()
            ).rejects.toMatch(rejectionMessage);
        }, delay);

        it('should reject if states cannot be retrieved', () => {
            const compiler = new HomeAssistantJavaScriptTemplates({
                ...HOME_ASSISTANT_ELEMENT,
                hass: {
                    ...HASS,
                    states: undefined
                }
            });
            expect(
                async () => await compiler.getRenderer()
            ).rejects.toMatch(rejectionMessage);
        }, delay);

        it('should reject if user cannot be retrieved', () => {
            const compiler = new HomeAssistantJavaScriptTemplates({
                ...HOME_ASSISTANT_ELEMENT,
                hass: {
                    ...HASS,
                    user: undefined
                }
            });
            expect(
                async () => await compiler.getRenderer()
            ).rejects.toMatch(rejectionMessage);
        }, delay);

    });

});