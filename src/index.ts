import { getPromisableResult } from 'get-promisable-result';
import {
    Extras,
    HomeAssistant,
    Hass,
    HassConnection,
    Options,
    RenderingFunction,
    RenderingFunctionsMap,
    SubscriberEvent,
    Scopped,
    SubscriptionsMap,
    Vars
} from '@types';
import {
    CLIENT_SIDE_ENTITIES,
    DEFAULT_REFS_VARIABLE_NAME,
    EVENT,
    STRICT_MODE
} from '@constants';
import { createScoppedFunctions, getRefId } from '@utilities';

class HomeAssistantJavaScriptTemplatesRenderer {

    constructor(
        ha: HomeAssistant,
        options: Options
    ) {
        const {
            throwErrors = false,
            throwWarnings = true,
            variables = {},
            refs = {},
            refsVariableName = DEFAULT_REFS_VARIABLE_NAME,
            autoReturn = true
        } = options;
        this._throwErrors = throwErrors;
        this._throwWarnings = throwWarnings;
        this._variables = variables;
        this._refs = refs;
        this._refsVariableName = refsVariableName;
        this._autoReturn = autoReturn;
        this._subscriptions = new Map<string, RenderingFunctionsMap>();
        this._clientSideEntitiesRegExp = new RegExp(
            `(^|[ \\?(+:\\{\\[><,])(${Object.values(CLIENT_SIDE_ENTITIES).join('|')})($|[ \\?)+:\\}\\]><.,])`,
            'gm'
        );

        this._scopped = createScoppedFunctions(
            ha,
            throwErrors,
            throwWarnings
        );
        this._watchForPanelUrlChange();
        this._watchForEntitiesChange();
        this._watchForLanguageChange();
    }

    private _throwErrors: boolean;
    private _throwWarnings: boolean;
    private _variables: Vars;
    private _refs: Vars;
    private _refsVariableName: string;
    private _autoReturn: boolean;
    private _clientSideEntitiesRegExp: RegExp;
    private _subscriptions: SubscriptionsMap;
    private _scopped: Scopped;

    private _executeRenderingFunctions(id: string): void {
        this._subscriptions
            .get(id)
            .forEach((functions: Map<RenderingFunction, Vars>, template: string): void => {
                functions.forEach((extras: Extras, renderingFunction: RenderingFunction) => {
                    this.trackTemplate(
                        template,
                        renderingFunction,
                        extras
                    );
                });
            });
    }

    private _watchForPanelUrlChange() {
        window.addEventListener(EVENT.LOCATION_CHANGED, (): void => {
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

    private _watchForLanguageChange() {
        window.addEventListener(EVENT.TRANSLATIONS_UPDATED, () => {
            if (this._subscriptions.has(CLIENT_SIDE_ENTITIES.LANG)) {
                this._executeRenderingFunctions(CLIENT_SIDE_ENTITIES.LANG);
            }
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

    private _storeTracked(
        template: string,
        renderingFunction: RenderingFunction,
        extras: Extras
    ): void {
        this._scopped.tracked.forEach((id: string): void => {
            const mapEntry: [RenderingFunction, Extras] = [
                renderingFunction,
                extras
            ];
            if (this._subscriptions.has(id)) {
                const renderingFunctionMap = this._subscriptions.get(id);
                if (renderingFunctionMap.has(template)) {
                    const functions = renderingFunctionMap.get(template);
                    if (!functions.has(renderingFunction)) {
                        functions.set(...mapEntry);
                    }
                } else {
                    renderingFunctionMap.set(
                        template,
                        new Map([mapEntry])
                    );
                }
            } else {
                this._subscriptions.set(
                    id,
                    new Map([
                        [
                            template,
                            new Map([mapEntry])
                        ]
                    ])
                );
            }
        });
    }

    private _untrackTemplate(template: string, renderingFunction: RenderingFunction): void {
        this._subscriptions.forEach((
            renderingFunctionMap: RenderingFunctionsMap,
            id: string
        ): void => {
            if (renderingFunctionMap.has(template)) {
                const functions = renderingFunctionMap.get(template);
                functions.delete(renderingFunction);
                if (functions.size === 0) {
                    renderingFunctionMap.delete(template);
                    if (renderingFunctionMap.size === 0) {
                        this._subscriptions.delete(id);
                    }
                }
            }
        });
    }

    public renderTemplate(
        template: string,
        extras: Extras = {}
    ): any {
        try {
            const {
                variables: extraVariables = {},
                refs: extraRefs = {}
            } = extras;
            const variables = new Map(
                Object.entries({
                    ...this._variables,
                    ...extraVariables
                })
            );
            const refs = {
                ...this._refs,
                ...extraRefs
            };
            const trimmedTemplate = template
                .trim()
                .replace(
                    this._clientSideEntitiesRegExp,
                    '$1clientSide.$2$3'
                );
            
            const functionBody = trimmedTemplate.includes('return') || !this._autoReturn
                ? trimmedTemplate
                : `return ${trimmedTemplate}`;

            const templateFunction = new Function(
                'hass',
                'states',
                'state_translated',
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
                'device_name',
                'areas',
                'area_id',
                'area_name',
                'area_entities',
                'area_devices',
                'user_name',
                'user_is_admin',
                'user_is_owner',
                'user_agent',
                'clientSide',
                'ref',
                'unref',
                this._refsVariableName,
                ...Array.from(variables.keys()),
                `${STRICT_MODE} ${functionBody}`
            );

            return templateFunction(
                this._scopped.hass,
                this._scopped.states,
                this._scopped.state_translated.bind(this._scopped),
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
                this._scopped.device_name.bind(this._scopped),
                this._scopped.areas.bind(this._scopped),
                this._scopped.area_id.bind(this._scopped),
                this._scopped.area_name.bind(this._scopped),
                this._scopped.area_entities.bind(this._scopped),
                this._scopped.area_devices.bind(this._scopped),
                this._scopped.user_name,
                this._scopped.user_is_admin,
                this._scopped.user_is_owner,
                this._scopped.user_agent,
                this._scopped.clientSideProxy,
                this._scopped.ref.bind(
                    this._scopped,
                    this._entityWatchCallback.bind(this)
                ),
                this._scopped.unref.bind(
                    this._scopped,
                    this.cleanTracked.bind(this)
                ),
                this._scopped.buildRefsVariables.bind(
                    this._scopped,
                    this._entityWatchCallback.bind(this)
                )(refs),
                ...Array.from(variables.values()),
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

    public trackTemplate(
        template: string,
        renderingFunction: RenderingFunction,
        extras: Extras = {}
    ): () => void {
        this._scopped.cleanTracked();
        const result = this.renderTemplate(template, extras);
        this._storeTracked(
            template,
            renderingFunction,
            extras
        );
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

    public get variables(): Vars {
        return this._variables;
    }

    public set variables(value: Vars) {
        this._variables = value;
    }

    public get refs(): Vars {
        return this._refs;
    }

    public set refs(value: Vars) {
        const refs = this._scopped.refsVariables;
        Array.from(refs.keys()).forEach((name: string): void => {
            this.cleanTracked(
                getRefId(name, true)
            );
        });
        this._scopped.cleanRefsVariables();
        this._refs = value;
    }

}

export default class HomeAssistantJavaScriptTemplates {
    constructor(
        ha: HomeAssistant,
        options: Options = {}
    ) {
        this._renderer = getPromisableResult(
            () => ha.hass,
            (hass: Hass): boolean => !!(
                hass &&
                hass.areas &&
                hass.devices &&
                hass.entities &&
                hass.states &&
                hass.user
            ),
            {
                retries: 100,
                delay: 50,
                rejectMessage: 'The provided element doesn\'t contain a proper or initialised hass object'
            }
        )
            .then(() => new HomeAssistantJavaScriptTemplatesRenderer(ha, options))
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