
class RTB extends Application {
    constructor(options = {}) {
        super(options);
    }

    /**
     * Adds button to chat controls and adds functionality
     */
    addChatControl() {
        const chatControlLeft = document.getElementsByClassName("roll-type-select")[0];
        let tableNode = document.getElementById("RTB-button");

        if (chatControlLeft && !tableNode) {

            const chatControlLeftNode = chatControlLeft.children[1];
            tableNode = document.createElement("label");
            tableNode.innerHTML = `<i id="RTB-button" class="fas fa-bullseye"></i>`;
            tableNode.onclick = this.openDialog;
            chatControlLeft.insertBefore(tableNode, chatControlLeftNode);
        }
    }

    /**
     * Opens dialog menu for selecting roll tables
     */
    openDialog() {
        let $dialog = $('.RTB-window');
        if ($dialog.length > 0) {
            $dialog.remove();
            return;
        }

        const templateData = { data: [] };
        const templatePath = "modules/rolltable-buttons/templates/rolltable-menu.html";
        const rollTableFolders = game.folders.filter(b => b.type === "RollTable");

        if (rollTableFolders.length > 0) {
            for (let i = 0; i < rollTableFolders.length; i++) {
                let folder = rollTableFolders[i];
                let folderContents = game.tables.filter(b => (b.data.folder === folder.data._id) && (b.data.displayRoll) && ((game.user.hasPermission(b)) || (game.user.hasRole(b.permission))));

                let data = { folder: folder, contents: folderContents };
                if (folderContents.length > 0) {
                    templateData.data.push(data);
                }
            }
            RTB.renderMenu(templatePath, templateData);
        }
        else {
            const rollTables = game.tables.filter(b => (b.data.displayRoll) && ((game.user.hasPermission(b)) || (game.user.hasPermission(b.permission))));
            
            if (rollTables.length > 0) {
                let dummyFolder = {name:"Rollable Tables"}
                let data = { folder: dummyFolder, contents: rollTables}
                templateData.data.push(data);
                RTB.renderMenu(templatePath, templateData);
            }
        }
    }

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

    static _openFolder(data) {
        let contents = data.contents;
        contents.map(x => x.color = data.folder.color);

        let html = '{{#each contents}}<button onclick="RTB.draw(' + "'{{this.name}}')" + '" class="RTB-entry" style="background-color:{{this.color}}">{{this.name}}</button>{{/each}}';
        let template = Handlebars.compile(html);
        let compiled = template({ contents });
        document.getElementById("RTB-menu").innerHTML = compiled;
    }
}

class RTBControl {

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
