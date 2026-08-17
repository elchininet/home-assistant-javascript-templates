import HomeAssistantJavaScriptTemplates from '../src';
import { HOME_ASSISTANT_ELEMENT, HASS } from './constants';
import { EVENT } from '../src/constants';

describe('promise instance', () => {

    let cancelSubscription: jest.Mock;
    let subscribeMessage: jest.Mock;

    beforeEach(() => {
        cancelSubscription = jest.fn();
        subscribeMessage = jest.fn(() => Promise.resolve(cancelSubscription));
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

    it('init method should return a promise that resolves to the same renderer', async () => {
        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        const renderer = await compiler.getRenderer();
        const instance = await renderer.init();
        expect(renderer).toBe(instance);
    });

    it('hassConnection.conn.subscribeMessage should not be called if init is not called', async () => {
        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        await compiler.getRenderer();
        await new Promise(process.nextTick);
        expect(subscribeMessage).not.toHaveBeenCalled();
    });

    it('hassConnection.conn.subscribeMessage should be called after init is called', async () => {
        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        const renderer = await compiler.getRenderer();
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
        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        const renderer = await compiler.getRenderer();
        await expect(
            async () => renderer.stop()
        ).rejects.toThrow('You cannot call stop method without init being fully executed, call init first or wait for its promise to be resolved');
        expect(cancelSubscription).not.toHaveBeenCalled();
    });

    it('should throw an error if init is called without calling stop first', async () => {
        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        const renderer = await compiler.getRenderer();
        renderer.init();
        await new Promise(process.nextTick);
        await expect(
            async () => renderer.init()
        ).rejects.toThrow('You cannot call init method consecutively, call stop first');
    });

    it('should not throw an error if init is called after calling stop', async () => {
        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        const renderer = await compiler.getRenderer();
        renderer.init();
        await new Promise(process.nextTick);
        renderer.stop();
        await new Promise(process.nextTick);
        expect(cancelSubscription).toHaveBeenCalled();
        renderer.init();
    });

    describe('getRenderer promise rejection', () => {

        const  rejectionMessage = 'The provided element doesn\'t contain a proper or initialised hass object';
        const delay = 6000;

        it('should reject if areas cannot be retrieved', async () => {
            const compiler = new HomeAssistantJavaScriptTemplates({
                ...HOME_ASSISTANT_ELEMENT,
                hass: {
                    ...HASS,
                    // @ts-ignore
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
                    // @ts-ignore
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
                    // @ts-ignore
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
                    // @ts-ignore
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
                    // @ts-ignore
                    user: undefined
                }
            });
            expect(
                async () => await compiler.getRenderer()
            ).rejects.toMatch(rejectionMessage);
        }, delay);

    });

});