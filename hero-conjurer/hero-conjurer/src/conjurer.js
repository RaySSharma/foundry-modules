import { preloadHandlebarsTemplates } from "../templates/tab-templates.js";

export class HeroConjurer extends FormApplication {
    constructor(options = {}) {
        super(options);

        this.data = {
            race: {
                'hide_options': 'hidden'
            },
            class: {},
            abilities: {
                'str': 8,
                'dex': 8,
                'con': 8,
                'int': 8,
                'wis': 8,
                'cha': 8
            },
            abilitiesForm: {
                'str': 8,
                'dex': 8,
                'con': 8,
                'int': 8,
                'wis': 8,
                'cha': 8
            },
            background: {
                'hide_options': 'hidden'
            },
            spells: {
                'levels': [],
                'restrict_spells': 'checked',
                'spells': []
            },
            equipment: {
                'items': [],
                'gp': 0,
                'sp': 0,
                'cp': 0
            },
            bio: {
                'biography': '',
                'personality': ''
            },
            summary: {}
        };
        this.info = {};

        Handlebars.registerHelper('upperCase', function (str) {
            return str.toUpperCase();
        });
        Handlebars.registerHelper('pointBuySum', function (json) {
            return 27 - (Object.values(json).reduce(function (a, b) {
                return parseInt(a) + parseInt(b);
            }, 0) - 48);
        });
        Handlebars.registerHelper('canCastSpells', function (str) {
            if (str == 'none') {
                return false;
            }
            else {
                return true;
            }
        });
        Handlebars.registerHelper('countLevels', function (spellLevels, levelToCount) {
            let count = 0;
            spellLevels.forEach((level) => {
                if (level == levelToCount) {
                    count += 1;
                }
            });
            return count;
        });
        Handlebars.registerHelper('isFolder', function (obj) {
            return (Array.isArray(obj)) ? true : false;
        });
        Handlebars.registerHelper('stripHTML', this._stripHTML);
        Handlebars.registerHelper('stripSubtext', this._stripSubtext);
        Handlebars.registerHelper('getSubtext', this._getSubtext);
        Handlebars.registerHelper('range', function (n, block) {
            var accum = '';
            for (var i = 0; i < n; ++i)
                accum += block.fn(i);
            return accum;
        });
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            title: "Hero Conjurer",
            id: 'hero-conjurer',
            template: 'modules/hero-conjurer/templates/start.html',
            closeOnSubmit: false,
            submitOnClose: false,
            submitOnChange: true,
            width: 941,
            height: 800,
            tabs: [{ navSelector: ".tabs", contentSelector: ".content", initial: "start" },
            { navSelector: ".subtabs", contentSelector: ".subcontent", initial: "spells" }]
        });
    }

    async getData() {
        if (jQuery.isEmptyObject(this.info)) {
            await this.readDataFiles();
        }
        return mergeObject(super.getData(), {
            options: this.options,
            data: this.data,
            info: this.info
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        html[0].render = this.render;

        $('.race-dropdown').change(function (event) {
            if (event.target.id == 'race') {
                this.data.race.hide_options = '';
            }
            else if (event.target.name == 'feat') {

                let selectedFeat = this.data.sheet.data.items.find(x => x.name === event.target.value);
                let selectedName = this._stripSubtext(selectedFeat.name);
                let lastFeatAdded = this.data.race.feats[this.data.race.feats.length - 1];
                let lastFeatAddedName = (lastFeatAdded.name) ? this._stripSubtext(lastFeatAdded.name) : '';

                if (selectedName === lastFeatAddedName) {
                    this.data.race.feats.pop();
                }
                this.data.race.feats.push(selectedFeat);
            }
            this._submitAndRender();
        }.bind(this));

        $('.background-dropdown').change(function (event) {
            if (event.target.name == 'background') {
                this.data.background.hide_options = '';
            }
            this._submitAndRender();
        }.bind(this));

        $('.increment-button').click(this._abilityScoreIncrementDecrement.bind(this));

        $('.ability-score').change(function (event) {
            let abilityScore = parseInt(event.target.value);
            if (abilityScore) {
                this.data.abilities[event.target.name] = abilityScore;
                this._calculateAbilityScores(true);
            }
        }.bind(this));

        $('.load-template').click(this._loadDataTemplate.bind(this));

        $('.selector').click(function (event) {
            if (event.target.name == "class") {
                var target = this.info.class[event.target.id];
                var targetAndNonTargets = this.info.class;
            }
            else if (event.target.name == "spells") {
                let spellLevel = this.info.spells.find(x => x.name == event.target.id).level;
                var target = this.data.class.spells[spellLevel].find(x => x.name == event.target.id);
                var targetAndNonTargets = this.data.class.spells[spellLevel].filter(x => x.name != event.target.id);
            }
            else {
                return;
            }

            for (let key of Object.keys(targetAndNonTargets)) {
                targetAndNonTargets[key].border = 'none';
            }
            target.border = '0 0 18px red';
            this._submitAndRender();
        }.bind(this));

        $('.drag-remove')
            .on('dragend', function (event) {
                let eventType = $(event.target).attr('name');
                let triggerName = $(event.target).attr('id');

                if (eventType == 'item') {
                    let obj = this.data.equipment.items.find(x => x.name == triggerName);
                    let index = this.data.equipment.items.indexOf(obj);
                    if (index !== -1) { this.data.equipment.items.splice(index, 1); };
                }
                else if (eventType == 'spell') {
                    let obj = this.data.spells.spells.find(x => x.name == triggerName);
                    let index = this.data.spells.spells.indexOf(obj);
                    if (index !== -1) {
                        this.data.spells.spells.splice(index, 1);
                        this.data.spells.levels.splice(index, 1);
                    }
                }

                this._submitAndRender();
            }.bind(this));

        $('.draggable')
            .attr('draggable', 'true')
            .on('dragstart', function (event) {
                let eventType = $(event.target).attr('name');
                let triggerName = $(event.target).attr('id');

                let data;
                if (eventType == 'item') {
                    data = this.info.items.find(x => x.data.name == triggerName);
                }
                else if (eventType == 'spell') {
                    data = this.info.spells.find(x => x.data.name == triggerName);
                }
                event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
                    data: data,
                    type: eventType
                }));
            }.bind(this));

        $('.droppable-pane')
            .on('drop', function (event) {
                let data = event.originalEvent.dataTransfer.getData('text/plain');
                if (data) {
                    data = JSON.parse(data);
                    if (data.type == 'item') {
                        this.data.equipment.items.push(data.data);
                    }
                    else if (data.type == 'spell') {
                        if (!this.data.spells.spells.find(x => x.name == data.data.name)) {
                            let extraSpellInfo = this.info.spells.find(x => x.name == data.data.name);
                            this.data.spells.spells.push(data.data);
                            this.data.spells.levels.push(extraSpellInfo.labels.level);
                        }
                    }
                    this._submitAndRender();
                }
            }.bind(this))
            .on('dragover', function (event) {
                $(this).css({
                    "outline": "3px solid black"
                });

            })
            .on('dragleave', function (event) {
                $(this).css({
                    "outline": ""
                });
            });

        $(".render-sheet")
            .click(function (event) {
                let eventType = $(event.target).parent().attr('name');
                let triggerName = $(event.target).parent().attr('id');

                let data;
                if (eventType == 'item') {
                    data = this.info.items.find(x => x.name == triggerName);
                }
                else if (eventType == 'spell') {
                    data = this.info.spells.find(x => x.data.name == triggerName);
                }
                data.sheet.render(true);
            }.bind(this));

        $('input[name="skill-choice"]').on('change', function (event) {
            let limit = this.data.class.data.num_skills;
            if ($('input[name="skill-choice"]:checked').length > limit) {
                event.target.checked = false;
            }
        }.bind(this));

        $('input[name="spell-restrict"]').on('change', function (event) {
            if (event.target.checked) {
                this.data.spells.restrict_spells = 'checked';
            }
            else {
                this.data.spells.restrict_spells = '';
            }
            this._submitAndRender();
        }.bind(this));

        $('.search-bar').keyup(function (event) {
            let entries = $(this).parent().siblings().children();
            let searchValue = $(this).val().toLowerCase();
            entries.filter(function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(searchValue) > -1);
            });
        });

        $('.random-choice').click(function (event) {
            let arr = this.data.background.data[event.target.id];
            let choice = arr[Math.floor(Math.random() * arr.length)];
            this.data.background[event.target.id] = choice;
            this._submitAndRender();
        }.bind(this));

        $('.money-input').change(function (event) {
            if (event.target.value < 0) {
                event.target.value = 0;
            }
            this.data.equipment[event.target.id] = event.target.value;
        }.bind(this));

        $('.convert-gp').click(function (event) {
            let itemName = $(event.target).parent().attr('id');
            let item = this.data.equipment.items.find(x => x.data.name == itemName);
            let itemPrice = parseInt(item.data.price);

            let index = this.data.equipment.items.indexOf(item);
            if (index !== -1) {
                this.data.equipment.items.splice(index, 1);
                this.data.equipment.gp += Math.ceil(0.5 * itemPrice);
            };
            this._submitAndRender();
        }.bind(this));

        $('input[name="bio"').on('change', function (event) {
            this._submitAndRender();
        }.bind(this));

        $('button.finish').click(async function (event) {
            let data = await this._pipeIntoSheet();

            let items = this.data.equipment.items;
            items.forEach(function (item) {
                let compendium = this.info.items.find(x => x.name == item.name).compendium.collection;
                data.importItemFromCollection(compendium, item._id);
            }.bind(this));

            let spells = this.data.spells.spells;
            spells.forEach(function (spell) {
                let compendium = this.info.spells.find(x => x.name == spell.name).compendium.collection;
                data.importItemFromCollection(compendium, spell._id);
            }.bind(this));

            data.prepareData();

        }.bind(this));
    }

    _updateObject(event, formData) {
        event.preventDefault();

        this.data.sheet = (this.currentSheet == 'race') ? this.info.race.find(x => x.data.name == formData.race[0]) : this.data.sheet;

        this.data.race = (this.currentSheet == 'race') ? {
            'name': formData.race[0],
            'alignment': formData.race[1],
            'size': this.data.sheet.data.data.traits.size,
            'speed': this.data.sheet.data.data.attributes.speed.value,
            'template': this._getRaceTemplate(formData.race[0]),
            'hide_options': this.data.race.hide_options,
            'languages': this.data.sheet.data.data.traits.languages.value,
            'feats': this._packRaceFeats(this.data.sheet.data.items.filter(x => x.type == 'feat')),
            'extra_languages': this._countExtraLanguages(this.data.sheet.data.items.filter(x => x.type == 'feat'))
        } : this.data.race;

        if (this.currentSheet == 'race') {
            this._calculateAbilityScores(false);
        }

        this.data.class = (this.currentSheet == 'class') ? {
            'name': this.data.class.name,
            'data': this.info.class[this.data.class.name],
            'skills': formData.skill,
            'template': this.data.class.template,
            'spells': this.info.class[this.data.class.name].spellList,
            'caster_type': this.info.class[this.data.class.name].caster_type,
            'num_spells': this.info.class[this.data.class.name].num_spells,
            'description': this.info.class[this.data.class.name].description,
            'hit_dice': this.info.class[this.data.class.name].hit_dice,
            'hp': this.data.class.hp,
            'img': this.info.class[this.data.class.name].img,
            'feats': this._getClassFeats(this.info.class[this.data.class.name].feats),
            "extra_languages": this.info.class[this.data.class.name].extra_languages,
            'spellcasting': 'int'
        } : this.data.class;

        this.data.background = (this.currentSheet == 'background') ? {
            'name': formData.background,
            'data': this.info.background[formData.background],
            'template': this.info.background[formData.background].template,
            'skills': this.info.background[formData.background].skills,
            'hide_options': this.data.background.hide_options,
            'trait': this.data.background.trait,
            'ideal': this.data.background.ideal,
            'bond': this.data.background.bond,
            'flaw': this.data.background.flaw
        } : this.data.background;

        this.data.spells = this.currentSheet.includes('spells') ? {
            'levels': this.data.spells.levels,
            'restrict_spells': this.data.spells.restrict_spells,
            'spells': this.data.spells.spells
        } : this.data.spells;

        this.data.equipment = (this.currentSheet == 'equipment') ? {
            'items': this.data.equipment.items,
            'gp': this.data.equipment.gp,
            'sp': this.data.equipment.sp,
            'cp': this.data.equipment.cp
        } : this.data.equipment;

        this.data.bio = (this.currentSheet == 'biography') ? {
            'name': formData.bio[0],
            'age': formData.bio[1],
            'height': formData.bio[2],
            'weight': formData.bio[3],
            'eyes': formData.bio[4],
            'hair': formData.bio[5],
            'skin': formData.bio[6],
            'biography': this.data.bio.biography,
            'personality': this.data.bio.personality
        } : this.data.bio;
    }

    _onChangeTab(event, tabs, active) {
        super._onChangeTab();
        this.currentSheet = active;
    }

    _createEditor(target, editorOptions, initialContent) {
        editorOptions.min_height = 200;
        super._createEditor(target, editorOptions, initialContent);
    }

    _onEditorSave(target, element, content) {
        super._onEditorSave(target, element, content);
    }

    async _pipeIntoSheet() {
        let newChar = await game.dnd5e.entities.Actor5e.create({
            name: "New Actor",
            type: "character",
            img: "icons/svg/mystery-man.svg",
            data: {},
            token: {},
            items: [],
            flags: {}
        });
        let data = {
            'data': {
                'name': this.data.bio.name,
                'data': {
                    'abilities': {
                        'str': { 'value': this.data.abilities.str },
                        'dex': { 'value': this.data.abilities.dex },
                        'con': { 'value': this.data.abilities.con },
                        'wis': { 'value': this.data.abilities.wis },
                        'int': { 'value': this.data.abilities.int },
                        'cha': { 'value': this.data.abilities.cha }
                    },
                    'attributes': {
                        'hp': { 'value': this.data.class.hp },
                        'speed': { 'value': this.data.race.speed },
                        'spellcasting': this.data.class.spellcasting
                    },
                    'details': {
                        'alignment': this.data.race.alignment,
                        'background': this.data.background.name,
                        'biography': { 'value': this.data.bio.biography },
                        'trait': this.data.background.trait,
                        'ideal': this.data.background.ideal,
                        'bond': this.data.background.bond,
                        'flaw': this.data.background.flaw
                    },
                    'traits': {
                        'size': this.data.race.size
                    },
                    'currency': {
                        'gp': this.data.equipment.gp,
                        'sp': this.data.equipment.sp,
                        'cp': this.data.equipment.cp
                    }
                }
            }
        };
        newChar = mergeObject(newChar, data);
        return newChar;
    }

    /**
     * Load iframe templates for specific data entries, e.g, class information
     *
     * @param {*} event
     * @memberof HeroConjurer
     */
    _loadDataTemplate(event) {
        let templateType = event.target.name;
        let templateChild = event.target.id;
        this.data[templateType].template = this.info[templateType][templateChild].template;
        this.data[templateType].name = templateChild;
    }

    _getRaceTemplate(name) {
        let raceName = this._stripSubtext(name);
        if (raceName in this.info.extraRaceInfo) {
            return this.info.extraRaceInfo[raceName].template;
        }
        else {
            return '';
        }
    }

    _getClassFeats(feats) {
        let featData = {};
        for (let i = 0; i < feats.length; i++) {
            let feat = feats[i];
            let featEntry = this.info.classFeatures.find(x => x.data.name === feat);
            if (featEntry) {
                featData[feat] = featEntry.data;
            }
        }
        return featData;
    }

    _packRaceFeats(feats) {
        let featNames = feats.map(feat => this._stripSubtext(feat.name));
        let uniqueFeatNames = [...new Set(featNames)];
        let packagedFeats = [];
        uniqueFeatNames.forEach((unique) => {
            let whichFeatsToPackage = [];
            for (let i = 0; i < featNames.length; i++) {
                if (featNames[i] === unique) {
                    whichFeatsToPackage.push(i);
                }
            }

            if (whichFeatsToPackage.length > 1) {
                let pack = [];
                whichFeatsToPackage.forEach((index) => {
                    pack.push(feats[index]);
                });
                packagedFeats.push(pack);
            }
            else {
                packagedFeats.push(feats[featNames.indexOf(unique)]);
            }
        });
        return packagedFeats;
    }

    _countExtraLanguages(feats) {
        let count = 0;
        for (let i = 0; i < feats.length; i++) {
            let feat = feats[i];
            let featName = this._stripSubtext(feat.name);
            if (featName == 'Extra Language') {
                count += 1;
            }
        }
        return count;
    }

    _submitAndRender() {
        this.submit();
        this.render();
    }

    /**
     * Initial reading of data included with module, or compendium data.
     *
     * @memberof HeroConjurer
     */
    async readDataFiles() {
        this.info.extraRaceInfo = await fetch('modules/hero-conjurer/data/races.json').then(response => response.json());
        this.info.alignment = await fetch('modules/hero-conjurer/data/alignments.json').then(response => response.json());
        this.info.class = await fetch('modules/hero-conjurer/data/classes.json').then(response => response.json());
        this.info.background = await fetch('modules/hero-conjurer/data/backgrounds.json').then(response => response.json());
        this.info.extraSpellInfo = await fetch('modules/hero-conjurer/data/spells.json').then(response => response.json());

        /* Pull out item compendia */
        this.info.itemsCompendia = ['dnd5e.items', 'dnd5e.trade goods'];
        this.info.items = await this._unpackCompendia(this.info.itemsCompendia);

        /* Pull out class feature compendia */
        this.info.classFeatureCompendia = ['dnd5e.classfeatures'];
        this.info.classFeatures = await this._unpackCompendia(this.info.classFeatureCompendia);

        /* Pull out race compendia */
        this.info.raceCompendia = ['hero-conjurer.races-srd'];
        this.info.race = await this._unpackCompendia(this.info.raceCompendia);
        this.info.raceFeatureCompendia = ['hero-conjurer.racial-features-srd'];
        this.info.raceFeatures = await this._unpackCompendia(this.info.raceFeatureCompendia);

        /* Pull out spell data compendia */
        this.info.spellCompendia = ['dnd5e.spells'];
        this.info.spells = await this._unpackCompendia(this.info.spellCompendia);

        /* Add additional info to spell data if its missing, currently classes and spell levels*/
        this.info.spells.forEach((spell) => {
            if (!spell.tags) {
                let extraSpellInfo = this.info.extraSpellInfo.filter(e => e.name == spell.name, this)[0];
                if (extraSpellInfo) {
                    spell.tags = extraSpellInfo.tags;
                    spell.level = extraSpellInfo.level;
                }
            }
        });

        this.info.spells = this.info.spells.filter(s => s.tags, this);


        /* Generate general spell-lists */
        this.info.spellList = {
            'cantrip': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': [], '9': []
        };
        for (let spellLevel of Object.keys(this.info.spellList)) {
            this.info.spellList[spellLevel] = this.info.spells.filter(function (spell) {
                return (spell.level == spellLevel);
            });
        }

        /* Generate class-specific spell-lists */
        for (let classname of Object.keys(this.info.class)) {
            this.info.class[classname].spellList = {
                'cantrip': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': [], '9': []
            };
            for (let spellLevel of Object.keys(this.info.class[classname].spellList)) {
                this.info.class[classname].spellList[spellLevel] = this.info.spells.filter(function (spell) {
                    return (spell.tags.includes(classname.toLowerCase())) & (spell.level == spellLevel);
                });
            }
        }
    }

    /**
     * Get content from list of compendia
     *
     * @param {*} compendia
     * @returns
     * @memberof HeroConjurer
     */
    async _unpackCompendia(compendia) {
        let unpacked = [];
        await Promise.all(compendia.map(async (c) => {
            let pack = game.packs.find(x => x.collection === c);
            if (pack) {
                pack = await pack.getContent();
                unpacked.push(...pack);
            }
        }));
        return unpacked;
    }

    /**
     * Gather all relevant inputs and calculate ability scores
     *
     * @memberof HeroConjurer
     */
    _calculateAbilityScores(scoresManuallyInput = false) {
        if (!scoresManuallyInput) {
            let recalculated = {
                'str': 0,
                'dex': 0,
                'con': 0,
                'int': 0,
                'wis': 0,
                'cha': 0
            };
            if (this.data.race.name) {
                for (let key of Object.keys(this.data.sheet.data.data.abilities)) {
                    recalculated[key.toLowerCase()] += this.data.sheet.data.data.abilities[key].value;
                }
            }
            for (let [key, value] of Object.entries(this.data.abilitiesForm)) {
                if (parseInt(value)) {
                    recalculated[key.toLowerCase()] += parseInt(value);
                }
            }
            this.data.abilities = recalculated;
        }
        this._submitAndRender();
    }

    /**
     * Add or subtract from ability scores, for Abilities tab
     *
     * @param {*} event
     * @memberof HeroConjurer
     */
    _abilityScoreIncrementDecrement(event) {
        let $button = $(event.target);
        let abilityTracker = $button.siblings().find('input.ability-score');

        let abilityName = abilityTracker[0].name;

        if ($button.hasClass('increment')) {
            this.data.abilitiesForm[abilityName] += 1;
        }
        else if ($button.hasClass('decrement')) {
            // Don't allow decrementing below zero
            if (this.data.abilitiesForm[abilityName] > 0) {
                this.data.abilitiesForm[abilityName] -= 1;
            }
        }
        this._calculateAbilityScores(false);
    }

    /**
     * Strip HTML tags and nbsp tags
     *
     * @param {*} html
     * @returns
     * @memberof HeroConjurer
     */
    _stripHTML(html) {
        if (html) {
            return html.replace(/<(.|\n)*?>/g, '').replace(/&nbsp;/g, '');
        }
    }

    /**
     * Strip text within parentheses
     *
     * @param {*} str
     * @returns
     * @memberof HeroConjurer
     */
    _stripSubtext(str) {
        return str.replace(/\((.|\n)*?\)/g, '').trim();
    }
    _getSubtext(str) {
        if (str.split('(').length > 1) {
            return str.split('(')[1].split(')')[0].trim();
        }
        else {
            return str;
        }
    }
}

Hooks.once("init", () => {
    preloadHandlebarsTemplates();
});

Hooks.on("renderDialog", (app, html, data) => {
    let existingButton = $(html).find('.dialog-button');
    if (existingButton) {
        if (existingButton.text().trim() == "Create Actor") {
            let newButton = $(
                '<button class="dialog-button"><i class="fas fa-hat-wizard"></i>Hero Conjurer</button>'
            );
            newButton.on('click', function (event) {
                let newApp = new HeroConjurer(game.actors);
                newApp.render(true);
                app.close();
            });
            existingButton.parent().append(newButton);
        }
    }
});

