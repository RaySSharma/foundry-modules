class RollTableTools {
    static init() {
        // Register module configuration settings
        game.settings.register("rolltable", "enableRollTableButtons", {
            name: game.i18n.localize('RTB.Title'),
            hint: game.i18n.localize('RTB.Description'),
            scope: "world",
            config: true,
            default: true,
            type: Boolean,
            onChange: () => window.location.reload()
        });
    }

    /**
     * Adds button to chat controls and adds functionality
     */
    static addChatControl() {
        const chatControlLeft = document.getElementsByClassName("roll-type-select")[0];
        let tableNode = document.getElementById("RTB-button");
        if (chatControlLeft && !tableNode) {
            const chatControlLeftNode = chatControlLeft.children[1];
            tableNode = document.createElement("label");
            tableNode.innerHTML = `<i id="RTB-button" class="fas fa-bullseye"></i>`;
            tableNode.onclick = RollTableTools.openDialog;
            chatControlLeft.insertBefore(tableNode, chatControlLeftNode);
        }
    }
    /**
     * Opens dialog menu for selecting roll tables
     */
    static openDialog() {
        const templateData = {entities: []};
        for (let i = 0; i < game.tables.entities.length; i++) {
            let relevantEntity = game.tables.entities[i];
            let userPermission = relevantEntity.data.permission[game.user.id];
            let defaultPermission = relevantEntity.data.permission.default;

            if (relevantEntity.data.results.length > 0) {
                if (userPermission || defaultPermission >= CONST.ENTITY_PERMISSIONS.LIMITED) {
                    templateData.entities.push(game.tables.entities[i]);
                }
            }
        }
        const templatePath = "modules/rolltable-buttons/templates/rolltable-menu.html";
        const dialogOptions = {
            width: 200,
            top: event.clientY - 80,
            left: window.innerWidth - 510,
            classes: ['RTB-menu']
        };
        renderTemplate(templatePath, templateData).then(dlg => {
            new Dialog({
                title: game.i18n.localize('RTB.DialogTitle'),
                content: dlg,
                buttons: {}
            }, dialogOptions).render(true);
        });
    }

    /**
     * Convenience function for stripping HTML tags from input string
     * @param html {String}
     */
    static removeHTMLTags(html) {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    }

    /**
     * Finds and rolls input roll table, then outputs to chat according to type of outcome
     * @param rollTableName {String} - Name of roll table.
     */
    static roll(rollTableName) {
        const rollTable = game.tables.entities.find(b => b.name === rollTableName);
        if (rollTable.data.results.length > 0) {
            const rollTableOutcome = rollTable.roll();

            if (rollTableOutcome[1].collection === "JournalEntry") {
                let tableName = rollTable.data.name;
                let outcomeName = rollTableOutcome[1].text;
                let outcomeContent = game.journal.entities.find(b => b._id === rollTableOutcome[1].resultId).data.content;
                outcomeName = RollTableTools.removeHTMLTags(outcomeName);
                outcomeContent = RollTableTools.removeHTMLTags(outcomeContent);
                RollTableTools.addChatMessage(tableName, outcomeName, outcomeContent).then();
            } else if (rollTableOutcome[1].type === 0) {
                let tableName = rollTable.data.name;
                let outcomeName = null;
                let outcomeContent = rollTableOutcome[1].text;
                outcomeContent = RollTableTools.removeHTMLTags(outcomeContent);
                RollTableTools.addChatMessage(tableName, outcomeName, outcomeContent).then();
            } else {
                let speaker = ChatMessage.getSpeaker({user: game.user});
                rollTable._displayChatResult(rollTableOutcome[1], speaker).then()
            }
        }
    }

    /**
     * Outputs roll table parameters to chat
     * @param tableName {String} - Name of roll table.
     * @param outcomeName {String} - Title of roll table outcome
     * @param outcomeContent {String} - Text entry of roll table outcome
     */
    static async addChatMessage(tableName, outcomeName, outcomeContent) {

        let content = await renderTemplate("modules/rolltable-buttons/templates/chat-card.html", {
            tableName: tableName,
            outcomeName: outcomeName,
            outcomeContent: outcomeContent
        });
        let chatData = {
            user: game.user._id,
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: CONFIG.sounds.dice
        };
        await ChatMessage.create(chatData, {});
    }
}
Hooks.on('init', RollTableTools.init);
Hooks.on('renderChatMessage', RollTableTools.addChatControl);
