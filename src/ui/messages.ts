import blessed from "blessed";
import Atom, {AtomEvent} from "./atom";
import {defaultState} from "../state/stateConstants";
import UiManager from "./uiManager";
import {updatePreset} from "../constant";
import {AppEvent} from "../app";

export enum MessagesEvent {
    ScrollPercentageChanged = "scrollPercentageChanged",

    MessageAdded = "messageAdded"
}

export default class Messages extends Atom<blessed.Widgets.BoxElement> {
    public constructor(manager: UiManager) {
        super(manager, blessed.box({
            top: "0%",
            left: "0%",
            width: "100%",
            height: "100%-3",
            scrollable: true,
            tags: true,
            padding: 1,

            style: {
                fg: defaultState.themeData.messages.foregroundColor,
                bg: defaultState.themeData.messages.backgroundColor
            }
        }));
    }

    public init(): void {
        // Extract atoms for short access alias.
        const {atoms} = this.manager;

        // Shrink once channels atom is shown.
        this.updateOn(
            atoms.channels,
            AtomEvent.Shown,
            updatePreset.shrink
        );

        // Expand once channels atom is hidden.
        this.updateOn(
            atoms.channels,
            AtomEvent.Hidden,
            updatePreset.expand
        );

        // Adjust height & position once header atom is shown.
        this.updateOn(
            atoms.header,
            AtomEvent.Shown,
            {
                top: "0%+3",
                height: "100%-6"
            }
        );

        // Expand height once header atom is hidden.
        this.updateOn(
            atoms.header,
            AtomEvent.Hidden,
            {
                top: "0%",
                height: "100%-3"
            }
        );

        this.updateOn(
            this.app,
            AppEvent.ThemeChanged,
            {
                style: {
                    fg: this.state.get().themeData.messages.foregroundColor,
                    bg: this.state.get().themeData.messages.backgroundColor
                }
            }
        );
    }

    public setScrollPercentage(percentage: number): void {
        this.element.setScrollPerc(percentage);
        this.emit(MessagesEvent.ScrollPercentageChanged, percentage);
    }

    /**
     * Set the scroll percentage to 100%.
     */
    public scroll(): void {
        this.setScrollPercentage(100);
    }

    public clearMessages(): void {
        this.element.content = "";
        this.render();
    }

    /**
     * Add a message to the message list, scroll and render atom.
     * If multiple messages are going to be added, use the bulk method
     * instead for better performance.
     */
    public addMessage(message: string): void {
        this.element.pushLine(message);
        this.emit(MessagesEvent.MessageAdded, message);
        this.scroll();
        this.render();
    }

    /**
     * Adds multiple messages while rendering only once.
     */
    public bulkAddMessages(messages: string[]): void {
        // Do not continue if no message was provided.
        if (messages.length === 0) {
            return;
        }

        // Lock the atom to prevent bulk-rendering.
        this.lock();

        // Add messages while atom is locked.
        for (const message of messages) {
            this.addMessage(message);
        }

        // Finally, release the lock.
        this.unlock();
    }
}