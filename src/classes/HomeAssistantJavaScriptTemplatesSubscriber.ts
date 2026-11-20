import {
    CancelSubscription,
    Extras,
    RenderingFunction,
    RenderingFunctionsMap,
    SubscriberCallback,
    SubscribeEntityEvent,
    SubscriptionsMap
} from '@types';
import {
    CLIENT_SIDE_ENTITIES,
    ENTITY_REGEXP,
    EVENT,
    NAMESPACE
} from '@constants';

interface SubscriptionEntityIds {
    homeAssistant: string[];
    custom: string[];
}

interface UpdateSubscriptions {
    homeAssistant: boolean;
    custom: boolean;
}

export class HomeAssistantJavaScriptTemplatesSubscriber {

    constructor(callback: SubscriberCallback) {
        this._callback = callback;
        this._subscriptions = new Map<string, RenderingFunctionsMap>();
        this._panelUrlCallbackBinded = this._panelUrlCallback.bind(this);
        this._langCallbackBinded = this._langCallback.bind(this);
    }

    private _callback: SubscriberCallback;
    private _subscriptions: SubscriptionsMap;
    private _cancelWebSocketSubscription?: Promise<CancelSubscription | void>;
    private _clientSideEntities = Object.values<string>(CLIENT_SIDE_ENTITIES);
    private _updateSubscriptionsTimeoutTimer: number | undefined = undefined;
    private _updateSubscriptionsTimeoutDelay = 1;

    private _panelUrlCallbackBinded: () => void;
    private _langCallbackBinded: () => void;

    private _buildSubscribeEntityEvent(id: string): SubscribeEntityEvent {
        return {
            c: {
                [id]: {}
            }
        }
    }

    private _isHomeAssistantEntity(id: string): boolean {
        return ENTITY_REGEXP.test(id);
    }

    private _isClientSideEntity(id: string): boolean {
        return this._clientSideEntities.includes(id);
    }

    private _getSubscriptionsEntityIds(entityIds: string[]): SubscriptionEntityIds {
        const homeAssistant: string[] = [];
        const custom: string[] = [];
        entityIds.forEach((id: string) => {
            if (this._isHomeAssistantEntity(id)) {
                homeAssistant.push(id);
            }
            if (this._isClientSideEntity(id)) {
                custom.push(id);
            }
        });
        return {
            homeAssistant,
            custom
        };
    }

    private _getNotSubscribedEntities(entities: string[]): UpdateSubscriptions {
        let homeAssistant = false;
        let custom = false;
        for (const entity of entities) {
            if (!this.isEntitySuscribed(entity)) {
                if (!homeAssistant && this._isHomeAssistantEntity(entity)) {
                    homeAssistant = true;
                }
                if (!custom && this._isClientSideEntity(entity)) {
                    custom = true;
                }
            }
            if (homeAssistant && custom) {
                break;
            }
        }
        return {
            homeAssistant,
            custom
        };
    }

    private _insertSubscription(
        id: string,
        template: string,
        mapEntry: [RenderingFunction, Extras]
    ): void {
        this.addSubscription(
            id,
            new Map([
                [
                    template,
                    new Map([mapEntry])
                ]
            ])
        );
    }

    private _panelUrlCallback(): void {
        this._callback(
            this._buildSubscribeEntityEvent(CLIENT_SIDE_ENTITIES.PANEL_URL)
        );
    }

    private _langCallback(): void {
        this._callback(
            this._buildSubscribeEntityEvent(CLIENT_SIDE_ENTITIES.LANG)
        );
    }

    private _updateWebSocketSubscription(entityIds: string[]): void {
        const subscribe = async (): Promise<CancelSubscription | void> => {
            try {
                if (entityIds.length > 0) {
                    const hassConnection = await window.hassConnection;
                    return await hassConnection.conn.subscribeMessage<SubscribeEntityEvent>(
                        (event) => this._callback(event),
                        {
                            type: EVENT.SUBSCRIBE_ENTITIES,
                            entity_ids: entityIds
                        }
                    );
                }
            } catch (error: unknown) {
                console.error(`${NAMESPACE}: ${error}`);
            }
        };
        clearTimeout(this._updateSubscriptionsTimeoutTimer);
        this._updateSubscriptionsTimeoutTimer = window.setTimeout(() => {
            this._cancelWebSocketSubscription
                ?.then((cancel: CancelSubscription | void): void => {
                    cancel?.();
                });
            this._cancelWebSocketSubscription = subscribe();
        }, this._updateSubscriptionsTimeoutDelay);
    }

    private _updateClientSideEntitiesSubscriptions(entityIds: string[]): void {
        if (entityIds.includes(CLIENT_SIDE_ENTITIES.PANEL_URL)) {
            window.addEventListener(EVENT.LOCATION_CHANGED, this._panelUrlCallbackBinded);
            window.addEventListener(EVENT.POPSTATE, this._panelUrlCallbackBinded);
        } else {
            window.removeEventListener(EVENT.LOCATION_CHANGED, this._panelUrlCallbackBinded);
            window.removeEventListener(EVENT.POPSTATE, this._panelUrlCallbackBinded);
        }
        if (entityIds.includes(CLIENT_SIDE_ENTITIES.LANG)) {
            window.addEventListener(EVENT.TRANSLATIONS_UPDATED, this._langCallbackBinded);
        } else {
            window.removeEventListener(EVENT.TRANSLATIONS_UPDATED, this._langCallbackBinded);
        }
    }

    private _updateSubscriptions(updateSubscriptions: UpdateSubscriptions): void {
        const entityIds = this._getSubscriptionsEntityIds([...this._subscriptions.keys()]);
        if (updateSubscriptions.homeAssistant) {
            this._updateWebSocketSubscription(entityIds.homeAssistant);
        }
        if (updateSubscriptions.custom) {
            this._updateClientSideEntitiesSubscriptions(entityIds.custom);
        }
    }

    public isEntitySuscribed(id: string): boolean {
        return this._subscriptions.has(id);
    }

    public getEntitySubscriptionRenderingFunctionMap(id: string): RenderingFunctionsMap | undefined {
        return this._subscriptions.get(id);
    }

    public addSubscription(id: string, renderingFunctionMap: RenderingFunctionsMap): void {
        this._subscriptions.set(
            id,
            renderingFunctionMap
        );
    }

    public addSubscriptions(
        template: string,
        renderingFunction: RenderingFunction,
        entities: string[],
        extras: Extras
    ) {
        const notSubscribedEntities = this._getNotSubscribedEntities(entities);
        entities.forEach((id: string): void => {
            const mapEntry: [RenderingFunction, Extras] = [
                renderingFunction,
                extras
            ];
            if (this.isEntitySuscribed(id)) {
                const renderingFunctionMap = this.getEntitySubscriptionRenderingFunctionMap(id)!;
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
                this._insertSubscription(
                    id,
                    template,
                    mapEntry
                );
            }
        });
        if (
            notSubscribedEntities.homeAssistant ||
            notSubscribedEntities.custom
        ) {
            this._updateSubscriptions(notSubscribedEntities);
        }
    }

    public deleteSubscription(id: string): void {
        if (this.isEntitySuscribed(id)) {
            this._subscriptions.delete(id);
            this._updateSubscriptions({
                homeAssistant: this._isHomeAssistantEntity(id),
                custom: this._isClientSideEntity(id)
            });
        }
    }

    public deleteSubscriptions(): void {
        this._subscriptions.clear();
        this._updateSubscriptions({
            homeAssistant: true,
            custom: true
        });
    }

    public removeSubscriptionByTemplateAndRenderingFunction(
        template: string,
        renderingFunction: RenderingFunction
    ): void {
        const subscriptionsDeleted: string[] = [];
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
                        subscriptionsDeleted.push(id);
                    }
                }
            }
        });
        const updateSubscriptions = this._getSubscriptionsEntityIds(subscriptionsDeleted);
        const homeAssistant = updateSubscriptions.homeAssistant.length > 0;
        const custom = updateSubscriptions.custom.length > 0;
        if (
            homeAssistant ||
            custom
        ) {
            this._updateSubscriptions({
                homeAssistant,
                custom
            });
        }
    }

}
