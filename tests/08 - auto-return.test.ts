import HomeAssistantJavaScriptTemplates, { HomeAssistantJavaScriptTemplatesRenderer } from '../src';
import { HOME_ASSISTANT_ELEMENT } from './constants';

describe('autoReturn', () => {

    let compiler: HomeAssistantJavaScriptTemplatesRenderer;
    
    beforeEach(async () => {   
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn()
            }
        });     
        compiler = await new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT, { autoReturn: false }).getRenderer();
    });

    it('if there is no return the template should return undefined', () => {
        expect(
            compiler.renderTemplate('states["light.woonkamer_lamp"].state')
        ).toBe(undefined);
    });

});