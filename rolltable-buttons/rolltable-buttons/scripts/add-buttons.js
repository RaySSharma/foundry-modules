class RollTableTools {
    static init() {
        // Register module configuration settings
        game.settings.register("rolltable", "enableRollTableButtons", {
            name: "Roll Table Buttons",
            hint: "Includes buttons to roll from roll tables, to the tool HUD.",
            scope: "world",
            config: true,
            default: true,
            type: Boolean,
            onChange: value => window.location.reload()
        });
        game.settings.register("rolltable", "enableBetterRolls5E", {
            name: "Support for Better Rolls 5E",
            hint: "Adds buttons for rolling rolltables to Better Rolls 5E chat cards.",
            scope: "world",
            config: true,
            default: true,
            type: Boolean,
            onChange: value => window.location.reload()
        });
    }

    static cleanHTML(html) {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    }

    static async roll(deck) {
        const tableRoll = game.tables.entities.find(b => b.name === deck).roll();

        let rollName = tableRoll[1].text;
        let rollEntry = game.journal.entities.find(b => b._id === tableRoll[1].resultId).data.content;
        rollName = this.cleanHTML(rollName);
        rollEntry = this.cleanHTML(rollEntry);

        let content = await renderTemplate("modules/rolltable-buttons/templates/chat-card.html", {
            deck: deck,
            rollName: rollName,
            rollJournalEntry: rollEntry
        });
        let chatData = {
            user: game.user._id,
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: CONFIG.sounds.dice
        };
        ChatMessage.create(chatData);
    }

    static getSceneControlButtons(buttons) {
        let tokenButton = buttons.find(b => b.name === "token");
        if (tokenButton) {
            for (let i = 0; i < game.tables.entities.length; i++) {
                let rollEntity = game.tables.entities[i];
                tokenButton.tools.push({
                    name: "roll-table",
                    title: "Roll Table",
                    icon: "fas fa-dice-d6",
                    tools: [],
                    onClick: () => console.log(rollEntity.name)
                })
            }
        }
    }

    static testButtons(buttons) {
        console.log(buttons)
}
}
Hooks.once('init', RollTableTools.init);
Hooks.on('getSceneControlButtons', RollTableTools.testButtons);