import {
    Extras,
    HomeAssistant,
    Options,
    ParsedTemplate,
    RenderingFunction,
    RenderingFunctionsMap,
    SubscribeEntityEvent,
    Scopped,
    Vars
} from '@types';
import {
    CLIENT_SIDE_ENTITIES,
    DEFAULT_REFS_VARIABLE_NAME,
    STRICT_MODE
} from '@constants';
import { createScoppedFunctions } from '@utilities';
import { HomeAssistantJavaScriptTemplatesSubscriber } from './HomeAssistantJavaScriptTemplatesSubscriber';

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
        this._templateSubscriber = new HomeAssistantJavaScriptTemplatesSubscriber(this._entityWatchCallback.bind(this));
        this._throwErrors = throwErrors;
        this._throwWarnings = throwWarnings;
        this._variables = variables;
        this._refsVariableName = refsVariableName;
        this._autoReturn = autoReturn;
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
    }

    private _throwErrors!: boolean;
    private _throwWarnings!: boolean;
    private _variables!: Vars;
    private _refsVariableName!: string;
    private _autoReturn!: boolean;
    private _clientSideEntitiesRegExp!: RegExp;
    private _templateSubscriber: HomeAssistantJavaScriptTemplatesSubscriber;
    private _scopped!: Scopped;

    private _executeRenderingFunctions(renderingFunctionsMap: RenderingFunctionsMap): void {
        renderingFunctionsMap.forEach((functions: Map<RenderingFunction, Vars>, template: string): void => {
            functions.forEach((extras: Extras, renderingFunction: RenderingFunction) => {
                this.trackTemplate(
                    template,
                    renderingFunction,
                    extras
                );
            });
        });
    }

    private _executeRenderingFunctionsByEntityId(id: string): void {
        const renderingFunctions = this._templateSubscriber.getEntitySubscriptionRenderingFunctionMap(id);
        if (renderingFunctions) {
            this._executeRenderingFunctions(renderingFunctions);
        }
    }

	private _entityWatchCallback(event: SubscribeEntityEvent) {        
		if (event.c) {
            for (const id in event.c) {
                this._executeRenderingFunctionsByEntityId(id);
            }            
		}
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
        this._templateSubscriber.addSubscriptions(
            template,
            renderingFunction,
            entities,
            extras
        );
        renderingFunction(result);
        return () => this._templateSubscriber.removeSubscriptionByTemplateAndRenderingFunction(template, renderingFunction);
    }

    public cleanTracked(entityId?: string): void {
        if (!entityId) {
            this._templateSubscriber.deleteSubscriptions();
        } else {
            this._templateSubscriber.deleteSubscription(entityId);
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

}
