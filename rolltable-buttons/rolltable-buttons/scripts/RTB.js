class RTB {
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
            tableNode.onclick = RTB._openDialog;
            chatControlLeft.insertBefore(tableNode, chatControlLeftNode);
        }
    }

    /**
     * Opens dialog menu for selecting roll tables
     */
    static _openDialog() {
        const templateData = {entities: []};
        for (let i = 0; i < game.tables.entities.length; i++) {
            let relevantEntity = game.tables.entities[i];
            let userPermission = relevantEntity.data.permission[game.user.id];
            let defaultPermission = relevantEntity.data.permission.default;
            if ((relevantEntity.data.results.length > 0) && (relevantEntity.data.displayRoll)) {
                if (game.user.isGM || (userPermission || defaultPermission >= CONST.ENTITY_PERMISSIONS.LIMITED)) {
                    templateData.entities.push(relevantEntity);
                }
            }
        }
        const templatePath = "modules/rolltable-buttons/templates/rolltable-menu.html";
        const dialogOptions = {
            width: 200,
            top: event.clientY - 80,
            left: window.innerWidth - 510,
            classes: ['RTB-container']
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
    static _removeHTMLTags(html) {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    }

    /**
     * Finds and rolls input roll table, then outputs to chat according to type of outcome
     * @param rollTableName {String} - Name of roll table.
     */
    static draw(rollTableName) {
        const rollTable = game.tables.entities.find(b => b.name === rollTableName);

        if (rollTable.data.results.length > 0) {
            const result = rollTable.roll()[1];
            const tableName = rollTable.data.name;
            let outcomeName = null
            let outcomeContent = null

            if ((result.type === CONST.TABLE_RESULT_TYPES.ENTITY) && (result.collection === "JournalEntry")) {
                outcomeName = this._removeHTMLTags(result.text);
                outcomeContent = game.journal.entities.find(b => b._id === result.resultId).data.content;
                outcomeContent = this._removeHTMLTags(outcomeContent);
            } else if (result.type === CONST.TABLE_RESULT_TYPES.TEXT) {
                outcomeContent = this._removeHTMLTags(result.text);
            } else {
                let speaker = ChatMessage.getSpeaker({user: game.user});
                rollTable._displayChatResult(result, speaker);
                return result;
            }
            this._addChatMessage(tableName, outcomeName, outcomeContent).then();
            return result;
        }
    }

    /**
     * Outputs roll table parameters to chat
     * @param tableName {String} - Name of roll table.
     * @param outcomeName {String} - Title of roll table outcome
     * @param outcomeContent {String} - Text entry of roll table outcome
     */
    static async _addChatMessage(tableName, outcomeName, outcomeContent) {
        let content = await renderTemplate("modules/rolltable-buttons/templates/chat-card.html", {
            tableName: tableName,
            outcomeName: outcomeName,
            outcomeContent: outcomeContent
        });
        let speaker = ChatMessage.getSpeaker({user: game.user});
        let chatData = {
            user: game.user._id,
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: CONFIG.sounds.dice,
            speaker: speaker
        };
        let rollMode = game.settings.get("core", "rollMode");
        if ( ["gmroll", "blindroll"].includes(rollMode) ) chatData["whisper"] = ChatMessage.getWhisperIDs("GM");
        if ( rollMode === "blindroll" ) chatData["blind"] = true;

        await ChatMessage.create(chatData, {});
    }
}
Hooks.on('canvasReady', RTB.addChatControl);
