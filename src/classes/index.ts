import { getPromisableResult } from 'get-promisable-result';
import {
    CancelSubscription,
    Extras,
    HomeAssistant,
    Hass,
    HassConnection,
    Options,
    ParsedTemplate,
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
import { createScoppedFunctions } from '@utilities';

export class HomeAssistantJavaScriptTemplatesRenderer {

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
        this._subscribed = false;
        this._throwErrors = throwErrors;
        this._throwWarnings = throwWarnings;
        this._variables = variables;
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
        this.refs = refs;
        this._panelUrlWatchCallbackBinded = this._panelUrlWatchCallback.bind(this);
        this._watchForLanguageChangeCallbackBinded = this._watchForLanguageChangeCallback.bind(this);
    }

    private _subscribed: boolean;
    private _throwErrors!: boolean;
    private _throwWarnings!: boolean;
    private _variables!: Vars;
    private _refsVariableName!: string;
    private _autoReturn!: boolean;
    private _clientSideEntitiesRegExp!: RegExp;
    private _subscriptions!: SubscriptionsMap;
    private _scopped!: Scopped;

    private _cancelSubscription?: CancelSubscription;
    private _panelUrlWatchCallbackBinded: () => void;
    private _watchForLanguageChangeCallbackBinded: () => void;

    private _executeRenderingFunctions(id: string): void {
        this._subscriptions
            .get(id)!
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
        window.addEventListener(EVENT.LOCATION_CHANGED, this._panelUrlWatchCallbackBinded);
        window.addEventListener(EVENT.POPSTATE, this._panelUrlWatchCallbackBinded);
    }

    private _stopWatchForPanelUrlChange() {
        window.removeEventListener(EVENT.LOCATION_CHANGED, this._panelUrlWatchCallbackBinded);
        window.removeEventListener(EVENT.POPSTATE, this._panelUrlWatchCallbackBinded);
    }

    private _panelUrlWatchCallback() {
        if (this._subscriptions.has(CLIENT_SIDE_ENTITIES.PANEL_URL)) {
            this._executeRenderingFunctions(CLIENT_SIDE_ENTITIES.PANEL_URL);
        }
    }

    private _watchForLanguageChange() {
        window.addEventListener(EVENT.TRANSLATIONS_UPDATED, this._watchForLanguageChangeCallbackBinded);
    }

    private _stopWatchForLanguageChange() {
        window.removeEventListener(EVENT.TRANSLATIONS_UPDATED, this._watchForLanguageChangeCallbackBinded);
    }

    private _watchForLanguageChangeCallback() {
        if (this._subscriptions.has(CLIENT_SIDE_ENTITIES.LANG)) {
            this._executeRenderingFunctions(CLIENT_SIDE_ENTITIES.LANG);
        }
    }

    private async _watchForEntitiesChange(): Promise<HomeAssistantJavaScriptTemplatesRenderer> {
        if (this._subscribed) {
            throw new Error('You cannot call init method consecutively, call stop first');
        }
        this._subscribed = true;
        try {
            const hassConnection = await window.hassConnection;
            const cancelSubscription = await hassConnection.conn.subscribeMessage<SubscriberEvent>(
                (event) => this._entityWatchCallback(event),
                {
                    type: EVENT.SUBSCRIBE_EVENTS,
                    event_type: EVENT.STATE_CHANGE_EVENT
                }
            );
            this._cancelSubscription = cancelSubscription;
            return this;
        } catch (error: unknown) {
            this._subscribed = false;
            throw error;
        }
	}

    private _stopWatchForEntitiesChange() {
        if (!this._subscribed) {
            throw new Error('You cannot call stop method without init being called');
        }
        this._subscribed = false;
        this._cancelSubscription!();
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
        entities: string[],
        extras: Extras
    ): void {
        entities.forEach((id: string): void => {
            const mapEntry: [RenderingFunction, Extras] = [
                renderingFunction,
                extras
            ];
            if (this._subscriptions.has(id)) {
                const renderingFunctionMap = this._subscriptions.get(id)!;
                if (renderingFunctionMap.has(template)) {
                    const functions = renderingFunctionMap.get(template)!;
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
                const functions = renderingFunctionMap.get(template)!;
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

    public async init(): Promise<HomeAssistantJavaScriptTemplatesRenderer> {
        this._watchForPanelUrlChange();
        this._watchForLanguageChange();
        return this._watchForEntitiesChange();
    }

    public stop() {
        this._stopWatchForPanelUrlChange();
        this._stopWatchForLanguageChange();
        this._stopWatchForEntitiesChange();
    }

    public parseTemplate(
        template: string,
        extras: Extras = {}
    ): ParsedTemplate {
        try {
            this._scopped.cleanTracked();
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
                'state_attr_translated',
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

            const result = templateFunction(
                this._scopped.hass,
                this._scopped.states,
                this._scopped.state_translated.bind(this._scopped),
                this._scopped.is_state.bind(this._scopped),
                this._scopped.state_attr.bind(this._scopped),
                this._scopped.state_attr_translated.bind(this._scopped),
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
                this._scopped.refs(
                    this._entityWatchCallback.bind(this),
                    this.cleanTracked.bind(this),
                    extraRefs
                ),
                ...Array.from(variables.values()),
            );

            return {
                result,
                entities: [...this._scopped.tracked]
            };

        } catch (error) {
            if (this._throwErrors) {
                throw error;
            } else {
                if (this._throwWarnings) {
                    console.warn(error);
                }
                return {
                    result: undefined,
                    entities: []
                };
            }
        }

    }

    public renderTemplate(
        template: string,
        extras: Extras = {}
    ): any {
        const { result } = this.parseTemplate(template, extras);
        return result;
    }

    public trackTemplate(
        template: string,
        renderingFunction: RenderingFunction,
        extras: Extras = {}
    ): () => void {
        const { result, entities } = this.parseTemplate(template, extras);
        this._storeTracked(
            template,
            renderingFunction,
            entities,
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
        return this._scopped.refs(
            this._entityWatchCallback.bind(this),
            this.cleanTracked.bind(this)
        );
    }

    public set refs(value: Vars) {
        this._scopped.cleanRefs(
            this.cleanTracked.bind(this)
        );
        this._scopped.refs(
            this._entityWatchCallback.bind(this),
            this.cleanTracked.bind(this),
            value
        );
    }

    public get subscribed(): boolean {
        return this._subscribed;
    }

}

export class HomeAssistantJavaScriptTemplates {
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