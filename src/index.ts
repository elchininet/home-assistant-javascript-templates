import {
    HomeAssistant,
    Hass,
    Options,
    Scopped,
    RenderingFunction,
    HassConnection,
    SubscriberEvent
} from '@types';
import {
    STRICT_MODE,
    SUBSCRIBE_EVENTS,
    STATE_CHANGE_EVENT
} from '@constants';
import { createScoppedFunctions, getPromisableElement } from '@utilities';

class HomeAssistantJavaScriptTemplatesRenderer {

    constructor(
        ha: HomeAssistant,
        options: Options
    ) {
        const {
            throwErrors = false,
            throwWarnings = true
        } = options;
        this._throwErrors = throwErrors;
        this._throwWarnings = throwWarnings;
        this._subscriptions = new Map<
            string,
            Map<string, RenderingFunction>
        >();
        this._scopped = createScoppedFunctions(ha, throwWarnings);
        this._watchForEntitiesChange();
    }

    private _throwErrors: boolean;
    private _throwWarnings: boolean;
    private _subscriptions: Map<
        string,
        Map<string, RenderingFunction>
    >;
    private _scopped: Scopped;

    private _watchForEntitiesChange() {
		window.hassConnection
            .then((hassConnection: HassConnection): void => {
                hassConnection.conn.subscribeMessage<SubscriberEvent>(
                    (event) => this._entityWatchCallback(event),
                    {
                        type: SUBSCRIBE_EVENTS,
                        event_type: STATE_CHANGE_EVENT
                    }
                );
            });
	}

	private _entityWatchCallback(event: SubscriberEvent) {        
		if (this._subscriptions.size) {
			const id = event.data.entity_id;
            if (this._subscriptions.has(id)) {
                this._subscriptions
                    .get(id)
                    .forEach((renderingFunction: RenderingFunction, template: string): void => {
                        this.trackTemplate(template, renderingFunction);
                    });
            }
		}
	}

    private _storeTracked(template: string, renderingFunction: RenderingFunction): void {
        this._scopped.tracked.forEach((id: string): void => {
            if (this._subscriptions.has(id)) {
                const renderingFunctionMap = this._subscriptions.get(id);
                if (!renderingFunctionMap.has(template)) {
                    renderingFunctionMap.set(template, renderingFunction);
                }
            } else {
                this._subscriptions.set(
                    id,
                    new Map([
                        [template, renderingFunction]
                    ])
                );
            }
        });
    }

    public renderTemplate(template: string): any {

        try {

            const functionBody = template.includes('return')
                ? template
                : `return ${template}`;

            const templateFunction = new Function(
                'hass',
                'states',
                'is_state',
                'state_attr',
                'is_state_attr',
                'has_value',
                'entities',
                'entity_prop',
                'is_entity_prop',
                'devices',
                'device_attr',
                'is_device_attr',
                'device_id',
                'areas',
                'area_id',
                'area_name',
                'area_entities',
                'area_devices',
                'user_name',
                'user_is_admin',
                'user_is_owner',
                'user_agent',
                `${STRICT_MODE} ${functionBody}`
            );

            return templateFunction(
                this._scopped.hass,
                this._scopped.states,
                this._scopped.is_state.bind(this._scopped),
                this._scopped.state_attr.bind(this._scopped),
                this._scopped.is_state_attr.bind(this._scopped),
                this._scopped.has_value.bind(this._scopped),
                this._scopped.entities,
                this._scopped.entity_prop,
                this._scopped.is_entity_prop.bind(this._scopped),
                this._scopped.devices,
                this._scopped.device_attr.bind(this._scopped),
                this._scopped.is_device_attr.bind(this._scopped),
                this._scopped.device_id.bind(this._scopped),
                this._scopped.areas.bind(this._scopped),
                this._scopped.area_id.bind(this._scopped),
                this._scopped.area_name.bind(this._scopped),
                this._scopped.area_entities.bind(this._scopped),
                this._scopped.area_devices.bind(this._scopped),
                this._scopped.user_name,
                this._scopped.user_is_admin,
                this._scopped.user_is_owner,
                this._scopped.user_agent
            );

        } catch (error) {
            if (this._throwErrors) {
                throw error;
            } else {
                if (this._throwWarnings) {
                    console.warn(error);
                }
                return undefined;
            }
        }

    }

    public trackTemplate(template: string, renderingFunction: RenderingFunction): void {
        this._scopped.cleanTracked();
        const result = this.renderTemplate(template);
        this._storeTracked(template, renderingFunction);                  
        renderingFunction(result);
    }

    public cleanTracked(entityId?: string): void {
        if (!entityId) {
            this._subscriptions.clear();
        } else if(this._subscriptions.has(entityId)) {
            this._subscriptions.delete(entityId);
        }   
    }

}

export default class HomeAssistantJavaScriptTemplates {
    constructor(
        ha: HomeAssistant,
        options: Options = {}
    ) {
        this._renderer = getPromisableElement(
            () => ha.hass,
            (hass: Hass): boolean => !!(
                hass &&
                hass.areas &&
                hass.devices &&
                hass.entities &&
                hass.states &&
                hass.user
            )
        )
            .then(() => new HomeAssistantJavaScriptTemplatesRenderer(ha, options))
            .catch(() => {
                throw new Error('The provided element doesn\'t contain a proper or initialised hass object');
            });;
    }

    private _renderer: Promise<HomeAssistantJavaScriptTemplatesRenderer>;

    getRenderer(): Promise<HomeAssistantJavaScriptTemplatesRenderer> {
        return this._renderer;
    }
}

export type {
    HomeAssistant,
    HomeAssistantJavaScriptTemplatesRenderer,
    HassConnection,
    Hass
};