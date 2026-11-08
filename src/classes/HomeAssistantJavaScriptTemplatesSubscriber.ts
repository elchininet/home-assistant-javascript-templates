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

export class HomeAssistantJavaScriptTemplatesSubscriber {

    constructor(callback: SubscriberCallback) {
        this._callback = callback;
        this._subscriptions = new Map<string, RenderingFunctionsMap>();
        this._panelUrlCallbackBinded = this._panelUrlCallback.bind(this);
        this._langCallbackBinded = this._langCallback.bind(this);
    }

    private _callback: SubscriberCallback;
    private _subscriptions: SubscriptionsMap;
    private _cancelWebSocketSubscription?: CancelSubscription;
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

    private _getSubscriptionsEntityIds(): { homeAssistant: string[], custom: string[] } {
        const homeAssistant: string[] = [];
        const custom: string[] = [];
        const entityIds = [
            ...this._subscriptions.keys()
        ];
        entityIds.forEach((id: string) => {
            if (ENTITY_REGEXP.test(id)) {
                homeAssistant.push(id);
            } else {
                custom.push(id);
            }
        });
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

    private _isSomeEntityNotSubscribed(entities: string[]): boolean {
        return entities.some((entity: string): boolean => !this.isEntitySuscribed(entity));
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

    private async _updateWebSocketSubscription(entityIds: string[]): Promise<void> {
        let cancelWebSocketSubscription: CancelSubscription | undefined = undefined;
        if (entityIds.length > 0) {
            try {
                const hassConnection = await window.hassConnection;
                cancelWebSocketSubscription = await hassConnection.conn.subscribeMessage<SubscribeEntityEvent>(
                    (event) => this._callback(event),
                    {
                        type: EVENT.SUBSCRIBE_ENTITIES,
                        entity_ids: entityIds
                    }
                );
            } catch (error: unknown) {
                console.error(`${NAMESPACE}: ${error}`);
            }
        }
        this._cancelWebSocketSubscription?.();
        this._cancelWebSocketSubscription = cancelWebSocketSubscription;
    }

    private _updateSubscriptions(): void {
        clearTimeout(this._updateSubscriptionsTimeoutTimer);
        this._updateSubscriptionsTimeoutTimer = window.setTimeout(
            () => {
                const entityIds = this._getSubscriptionsEntityIds();
                if (entityIds.custom.includes(CLIENT_SIDE_ENTITIES.PANEL_URL)) {
                    window.addEventListener(EVENT.LOCATION_CHANGED, this._panelUrlCallbackBinded);
                    window.addEventListener(EVENT.POPSTATE, this._panelUrlCallbackBinded);
                } else {
                    window.removeEventListener(EVENT.LOCATION_CHANGED, this._panelUrlCallbackBinded);
                    window.removeEventListener(EVENT.POPSTATE, this._panelUrlCallbackBinded);
                }
                if (entityIds.custom.includes(CLIENT_SIDE_ENTITIES.LANG)) {
                    window.addEventListener(EVENT.TRANSLATIONS_UPDATED, this._langCallbackBinded);
                } else {
                    window.removeEventListener(EVENT.TRANSLATIONS_UPDATED, this._langCallbackBinded);
                }
                this._updateWebSocketSubscription(entityIds.homeAssistant);
            },
            this._updateSubscriptionsTimeoutDelay
        );
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
        const shouldUpdateSubscription = this._isSomeEntityNotSubscribed(entities);
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
        if (shouldUpdateSubscription) {
            this._updateSubscriptions();
        }
    }

    public deleteSubscription(id: string): void {
        if (this.isEntitySuscribed(id)) {
            this._subscriptions.delete(id);
            this._updateSubscriptions();
        }
    }

    public deleteSubscriptions(): void {
        this._subscriptions.clear();
        this._updateSubscriptions();
    }

    public removeSubscriptionByTemplateAndRenderingFunction(
        template: string,
        renderingFunction: RenderingFunction
    ): void {
        const subscriptionsDeleted: Set<string> = new Set<string>();
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
                        subscriptionsDeleted.add(id);
                    }
                }
            }
        });
        if (subscriptionsDeleted.size > 0) {
            this._updateSubscriptions();
        }
    }

}
