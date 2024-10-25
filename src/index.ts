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
    CLIENT_SIDE_ENTITIES,
    EVENT
} from '@constants';
import { createScoppedFunctions, getPromisableElement } from '@utilities';

class HomeAssistantJavaScriptTemplatesRenderer {

    constructor(
        ha: HomeAssistant,
        options: Options
    ) {
        const {
            throwErrors = false,
            throwWarnings = true,
            variables = {}
        } = options;
        this._throwErrors = throwErrors;
        this._throwWarnings = throwWarnings;
        this._variables = new Map(
            Object.entries(variables)
        );
        this._subscriptions = new Map<
            string,
            Map<
                string,
                Set<RenderingFunction>
            >
        >();
        this._scopped = createScoppedFunctions(ha, throwWarnings);
        this._watchForPanelUrlChange();
        this._watchForEntitiesChange();
    }

    private _throwErrors: boolean;
    private _throwWarnings: boolean;
    private _variables: Map<string, unknown>;
    private _subscriptions: Map<
        string,
        Map<
            string,
            Set<RenderingFunction>
        >
    >;
    private _scopped: Scopped;

    private _executeRenderingFunctions(id: string): void {
        this._subscriptions
            .get(id)
            .forEach((functions: Set<RenderingFunction>, template: string): void => {
                functions.forEach((renderingFunction: RenderingFunction) => {
                    this.trackTemplate(template, renderingFunction);
                });
            });
    }

    private _watchForPanelUrlChange() {
        window.addEventListener(EVENT.LOCATION_CHANGED, (event: CustomEvent): void => {
            this._panelUrlWatchCallback();
        });
        window.addEventListener(EVENT.POPSTATE, () => {
            this._panelUrlWatchCallback();
        });
    }

    private _panelUrlWatchCallback() {
        if (this._subscriptions.has(CLIENT_SIDE_ENTITIES.PANEL_URL)) {
            this._executeRenderingFunctions(CLIENT_SIDE_ENTITIES.PANEL_URL);
        }
    }

    private _watchForEntitiesChange() {
		window.hassConnection
            .then((hassConnection: HassConnection): void => {
                hassConnection.conn.subscribeMessage<SubscriberEvent>(
                    (event) => this._entityWatchCallback(event),
                    {
                        type: EVENT.SUBSCRIBE_EVENTS,
                        event_type: EVENT.STATE_CHANGE_EVENT
                    }
                );
            });
	}

	private _entityWatchCallback(event: SubscriberEvent) {        
		if (this._subscriptions.size) {
			const id = event.data.entity_id;
            if (this._subscriptions.has(id)) {
                this._executeRenderingFunctions(id);
            }
		}
	}

    private _storeTracked(template: string, renderingFunction: RenderingFunction): void {
        this._scopped.tracked.forEach((id: string): void => {
            if (this._subscriptions.has(id)) {
                const renderingFunctionMap = this._subscriptions.get(id);
                if (renderingFunctionMap.has(template)) {
                    const functions = renderingFunctionMap.get(template);
                    if (!functions.has(renderingFunction)) {
                        functions.add(renderingFunction);
                    }
                } else {
                    renderingFunctionMap.set(
                        template,
                        new Set<RenderingFunction>(
                            [renderingFunction]
                        )
                    );
                }
            } else {
                this._subscriptions.set(
                    id,
                    new Map([
                        [
                            template,
                            new Set([
                                renderingFunction
                            ])
                        ]
                    ])
                );
            }
        });
    }

    private _untrackTemplate(template: string, renderingFunction: RenderingFunction): void {
        this._subscriptions.forEach((
            renderingFunctionMap: Map<
                string,
                Set<RenderingFunction>
            >,
            id: string
        ): void => {
            if (renderingFunctionMap.has(template)) {
                const functions = renderingFunctionMap.get(template);
                if (functions.has(renderingFunction)) {
                    functions.delete(renderingFunction);
                }
                if (functions.size === 0) {
                    renderingFunctionMap.delete(template);
                    if (renderingFunctionMap.size === 0) {
                        this._subscriptions.delete(id);
                    }
                }
            }
        });
    }

    public renderTemplate(template: string): any {

        try {

            const trimmedTemplate = template.trim();

            const functionBody = trimmedTemplate.includes('return')
                ? trimmedTemplate
                : `return ${trimmedTemplate}`;

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
                'panel_url',
                'user_agent',
                ...Array.from(this._variables.keys()),
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
                this._scopped.panel_url,
                this._scopped.user_agent,
                ...Array.from(this._variables.values()),
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

    public trackTemplate(template: string, renderingFunction: RenderingFunction): () => void {
        this._scopped.cleanTracked();
        const result = this.renderTemplate(template);
        this._storeTracked(template, renderingFunction);                  
        renderingFunction(result);
        return () => this._untrackTemplate(template, renderingFunction);
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