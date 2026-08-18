import {
    HomeAssistantJavaScriptTemplates,
    HomeAssistantJavaScriptTemplatesRenderer
} from '../src/classes';
import { HOME_ASSISTANT_ELEMENT, HASS } from './constants';

describe('promise instance', () => {

    beforeEach(() => {
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn(
                    () => Promise.resolve(
                        jest.fn()
                    )
                )
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
        expect(renderer).toBeInstanceOf(HomeAssistantJavaScriptTemplatesRenderer);
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