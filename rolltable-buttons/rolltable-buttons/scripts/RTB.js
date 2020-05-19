
class RTB extends Application {
    constructor(options = {}) {
        super(options);
    }

    /**
     * Opens dialog menu for selecting roll tables
     *
     * @returns
     * @memberof RTB
     */
    openDialog() {
        let $dialog = $('.RTB-window');
        if ($dialog.length > 0) {
            $dialog.remove();
            return;
        }

        const templateData = { data: [] };
        const templatePath = "modules/rolltable-buttons/templates/rolltable-menu.html";
        const rollTables = game.tables.filter(x => (x.data.displayRoll) && ((x.data.permission.default >= CONST.ENTITY_PERMISSIONS.LIMITED) || (x.data.permission[game.user.id] >= CONST.ENTITY_PERMISSIONS.LIMITED) || (game.user.isGM)));
        const folders = game.folders.filter(x => x.data.type == "RollTable");

        for (let i = 0; i < rollTables.length; i++) {
            let rollTable = rollTables[i];
            if (!rollTable.folder) {
                templateData.data.push(rollTable);
            }
        }
        for (let i = 0; i < folders.length; i++) {
            let folder = Object.assign({}, folders[i]);
            folder.content = folders[i].content.filter(x => (x.data.displayRoll) && ((x.data.permission.default >= CONST.ENTITY_PERMISSIONS.LIMITED) || (x.data.permission[game.user.id] >= CONST.ENTITY_PERMISSIONS.LIMITED) || (game.user.isGM)));
            folder.name = folders[i].name;
            folder.folder = true;
            templateData.data.push(folder);
        }
        RTB.renderMenu(templatePath, templateData);
    }

    /**
     * Render dialog menu with input data
     *
     * @static
     * @param {String} path
     * @param {Object} data
     * @memberof RTB
     */
    static renderMenu(path, data) {
        const dialogOptions = {
            width: 200,
            top: event.clientY - 80,
            left: window.innerWidth - 510,
            classes: ['RTB-window']
        };
        renderTemplate(path, data).then(dlg => {
            new Dialog({
                title: game.i18n.localize('RTB.DialogTitle'),
                content: dlg,
                buttons: {}
            }, dialogOptions).render(true);
        });
    }

    /**
     * Convenience function for stripping HTML tags from input string
     *
     * @static
     * @param {String} html
     * @returns
     * @memberof RTB
     */
    static _removeHTMLTags(html) {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    }

    /**
     * Finds and rolls input roll table, then outputs to chat according to type of outcome
     *
     * @static
     * @param {String} rollTableName
     * @returns
     * @memberof RTB
     */
    static draw(rollTableName) {
        const rollTable = game.tables.entities.find(b => b.name === rollTableName);

        if (rollTable.data.results.length > 0) {
            const result = rollTable.roll().results[0];
            const tableName = rollTable.data.name;
            let outcomeName = null;
            let outcomeContent = null;
            if ((result.type === CONST.TABLE_RESULT_TYPES.ENTITY) && (result.collection === "JournalEntry")) {
                outcomeName = RTB._removeHTMLTags(result.text);
                outcomeContent = game.journal.entities.find(b => b._id === result.resultId).data.content;
                outcomeContent = RTB._removeHTMLTags(outcomeContent);
            } else if (result.type === CONST.TABLE_RESULT_TYPES.TEXT) {
                outcomeContent = RTB._removeHTMLTags(result.text);
            } else {
                let speaker = ChatMessage.getSpeaker({ user: game.user });
                rollTable._displayChatResult(result, speaker);
                return result;
            }
            RTB._addChatMessage(tableName, outcomeName, outcomeContent).then();
            return result;
        }
    }

    /**
     * Outputs roll table parameters to chat
     *
     * @static
     * @param {String} tableName
     * @param {String} outcomeName
     * @param {String} outcomeContent
     * @memberof RTB
     */
    static async _addChatMessage(tableName, outcomeName, outcomeContent) {
        let content = await renderTemplate("modules/rolltable-buttons/templates/chat-card.html", {
            tableName: tableName,
            outcomeName: outcomeName,
            outcomeContent: outcomeContent
        });
        let speaker = ChatMessage.getSpeaker({ user: game.user });
        let chatData = {
            user: game.user._id,
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            sound: CONFIG.sounds.dice,
            speaker: speaker
        };
        let rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperIDs("GM");
        if (rollMode === "blindroll") chatData["blind"] = true;

        await ChatMessage.create(chatData, {});
    }


    /**
     * Open Folder to get RollTables within
     *
     * @static
     * @param {Object} data
     * @memberof RTB
     */
    static _openFolder(data) {
        let folder = game.folders.entities.find(x => x._id === data[0].folder);
        data.map(x => x.color = folder.data.color);
        let html = '{{#each data}}<button onclick="RTB.draw(' + "'{{this.name}}')" + '" class="RTB-entry" style="background-color:{{this.color}}">{{this.name}}</button>{{/each}}';
        let template = Handlebars.compile(html);
        let compiled = template({ data });
        document.getElementById("RTB-menu").innerHTML = compiled;
    }
}

class RTBControl {

    /**
     * Adds button to chat controls and sets button functionality
     *
     * @memberof RTB
     */
    static addChatControl() {
        const chatControlLeft = document.getElementsByClassName("roll-type-select")[0];
        let tableNode = document.getElementById("RTB-button");

        if (chatControlLeft && !tableNode) {
            const chatControlLeftNode = chatControlLeft.children[1];

            tableNode = document.createElement("label");
            tableNode.innerHTML = `<i id="RTB-button" class="fas fa-bullseye"></i>`;
            tableNode.onclick = RTBControl.initializeRTB;
            chatControlLeft.insertBefore(tableNode, chatControlLeftNode);
        }
    }

    static initializeRTB() {
        if (this.rtb === undefined) {
            this.rtb = new RTB();
        }
        this.rtb.openDialog();
    }
}

Handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context).replace(/"/g, '&quot;');
});

Hooks.on('canvasReady', RTBControl.addChatControl);
