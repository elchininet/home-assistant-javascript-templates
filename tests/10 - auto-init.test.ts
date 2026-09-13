import {
    HomeAssistantJavaScriptTemplates,
    HomeAssistantJavaScriptTemplatesRenderer
} from '../src/classes';
import { HOME_ASSISTANT_ELEMENT } from './constants';
import { EVENT } from '../src/constants';

describe('autoInit', () => {

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
        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT, { autoInit: true });
        renderer = await compiler.getRenderer();
        await new Promise(process.nextTick);
    });

    it('hassConnection.conn.subscribeMessage should be called automatically if autoInit is true', () => {
        expect(renderer.subscribed).toBe(true);
        expect(subscribeMessage).toHaveBeenCalledWith(
            expect.any(Function),
            {
                type: EVENT.SUBSCRIBE_ENTITIES
            }
        );
    });

    it('should throw an error if init is called with the autoInit option set without calling stop first', async () => {
        expect(subscribeMessage).toHaveBeenCalledTimes(1);
        await expect(
            renderer.init()
        ).rejects.toThrow('You cannot call init method consecutively or call it if you used the autoInit option, call stop first');
        expect(subscribeMessage).not.toHaveBeenCalledTimes(2);
    });

    it('should allow to call the init method if stop was called first', async () => {
        expect(subscribeMessage).toHaveBeenCalledTimes(1);
        renderer.stop();
        await renderer.init();
        expect(subscribeMessage).toHaveBeenNthCalledWith(
            2,
            expect.any(Function),
            {
                type: EVENT.SUBSCRIBE_ENTITIES
            }
        );
    });

});