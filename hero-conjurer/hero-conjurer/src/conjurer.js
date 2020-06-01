import { preloadHandlebarsTemplates } from "../templates/tab-templates.js";

export class HeroConjurer extends FormApplication {
    constructor(options = {}) {
        super(options);

        this.data = {
            race: {
                'hide_subrace': 'hidden',
                'hide_options': 'hidden'
            },
            class: {},
            abilities: {
                'Str': 8,
                'Dex': 8,
                'Con': 8,
                'Int': 8,
                'Wis': 8,
                'Cha': 8
            },
            abilitiesForm: {
                'Str': 8,
                'Dex': 8,
                'Con': 8,
                'Int': 8,
                'Wis': 8,
                'Cha': 8
            },
            background: {},
            spells: {
                'names': [],
                'data': [],
                'imgs': []
            },
            feats: {},
            bio: {},
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
            submitOnClose: true,
            submitOnChange: true,
            popOut: true,
            width: 941,
            height: 800,
            tabs: [{ navSelector: ".tabs", contentSelector: ".content", initial: "start" },
            { navSelector: ".subtabs", contentSelector: ".subcontent", initial: "spells" }]
        });
    }

    _onChangeTab(event, tabs, active) {
        super._onChangeTab();
        this.currentSheet = active;
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

        $('.submit').change(this._submitAndRender.bind(this));
        $('.dropdown').change(function (event) {
            if (this.currentSheet == 'race') {
                if (event.target.id == 'race') {
                    let subraces = this.info.race[event.target.value].subraces;
                    if (Object.keys(subraces).length) {
                        this.data.race.hide_subrace = '';
                    }
                    else {
                        this.data.race.hide_subrace = 'hidden';
                    }
                    this.data.race.hide_options = '';
                }
            }
            this._submitAndRender();
        }.bind(this));

        $('#HC-abilities .square').click(this._abilityIncrementDecrement.bind(this));

        $('#HC-abilities .score').change(function (event) {
            let $button = $(event.target);
            $button.next().val($button.val());
            this._submitAndRender();
        }.bind(this));

        $('.load-template').click(this._loadDataTemplate.bind(this));
        $('.selector').click(function (event) {
            if (event.target.name == "class") {
                var target = this.info.classData.find(x => x.name == event.target.id);
                var nonTarget = this.info.classData.filter(x => x.name != event.target.id);
            }
            else if (event.target.name == "spells") {
                let spellLevel = this.info.spellData.find(x => x.name == event.target.id).level;
                var target = this.data.class.spells[spellLevel].find(x => x.name == event.target.id);
                var nonTarget = this.data.class.spells[spellLevel].filter(x => x.name != event.target.id);
            }
            else {
                return;
            }
            target.border = '0 0 18px red';
            nonTarget.forEach(x => x.border = 'none');
            this._submitAndRender();
        }.bind(this));

        html.find(".draggable").each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", function (event) {
                event.dataTransfer.setData("text/plain", JSON.stringify({
                    src: event.target.children.spells.src,
                    id: event.target.children.spells.id,
                    name: event.target.children.spells.name
                }));
            });
        });

        html.find(".droppable").each((i, li) => {
            li.addEventListener("drop", function (event) {
                let data = JSON.parse(event.dataTransfer.getData("text/plain"));
                if (!this.data.spells.names.includes(data.id)) {
                    this.data.spells.imgs.push(data.src);
                    this.data.spells.names.push(data.id)
                }
                this._submitAndRender();
            }.bind(this));
        });

        $(".droppable")
            .on('dragover', function (event) {
                $(this).css({
                    "outline": "3px solid black"
                })
                
            })
            .on('dragleave', function (event) {
                $(this).css({
                    "outline": ""
                })
            });
    }

    _updateObject(event, formData) {
        event.preventDefault();

        this.data.race = (this.currentSheet == 'race') ? {
            'name': formData.race[0],
            'subrace': formData.race[1],
            'alignment': formData.race[2],
            'data': this.info.race[formData.race[0]],
            'size': this.info.race[formData.race[0]].size,
            'speed': this.info.race[formData.race[0]].speed,
            'hide_subrace': this.data.race.hide_subrace,
            'hide_options': this.data.race.hide_options
        } : this.data.race;

        this.data.abilitiesForm = (this.currentSheet == 'abilities') ? {
            'Str': formData.Str,
            'Dex': formData.Dex,
            'Con': formData.Con,
            'Int': formData.Int,
            'Wis': formData.Wis,
            'Cha': formData.Cha
        } : this.data.abilitiesForm;

        this.data.bio = (this.currentSheet == 'bio') ? {
            'name': formData.name,
            'age': formData.age,
            'height': formData.height,
            'weight': formData.weight,
            'eyes': formData.eyes,
            'hair': formData.hair,
            'skin': formData.skin
        } : this.data.bio;

        this.data.class = (this.currentSheet == 'class') ? {
            'name': this.data.class.name,
            'pack': this.info.classData.find(x => x.name == this.data.class.name).data,
            'data': this.info.class[this.data.class.name],
            'skills': formData.skill,
            'template': this.data.class.template,
            'spells': this.info.class[this.data.class.name].spellList,
            'caster_type': this.info.class[this.data.class.name].caster_type,
            'num_spells': this.info.class[this.data.class.name].num_spells
        } : this.data.class;

        this.data.background = (this.currentSheet == 'background') ? {
            'name': formData.background,
            'data': this.info.background[formData.background],
            'template': this.info.background[formData.background].template,
            'skills': this.info.background[formData.background].skills
        } : this.data.background;

        this.data.spells = ((this.currentSheet == 'spells') || (this.currentSheet == 'spells-cantrip') || (this.currentSheet == 'spells-first')) ? {
            'names': this.data.spells.names,
            'data': this.info.spellData.filter(x => x.name.includes(this.data.spells.names)),
            'imgs': this.data.spells.imgs,
        } : this.data.spells;

        this._calculateAbilityScores();
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
        this.info.race = await fetch('modules/hero-conjurer/data/races.json').then(response => response.json());
        this.info.alignment = await fetch('modules/hero-conjurer/data/alignments.json').then(response => response.json());
        this.info.class = await fetch('modules/hero-conjurer/data/classes.json').then(response => response.json());
        this.info.background = await fetch('modules/hero-conjurer/data/backgrounds.json').then(response => response.json());
        this.info.extraSpellInfo = await fetch('modules/hero-conjurer/data/spells.json').then(response => response.json());

        /* Pull out class compendiums according to classes.json */
        let classPacks = [];
        for (let value of Object.values(this.info.class)) {
            classPacks.push(value.pack);
        }
        this.info.classPacks = [...new Set(classPacks)];

        this.info.classData = [];
        for (let i = 0; i < this.info.classPacks.length; i++) {
            let packName = this.info.classPacks[i];
            let pack = game.packs.find(x => x.collection === packName);

            if (pack) {
                pack = await pack.getContent();
                this.info.classData = this.info.classData.concat(pack);
            }
        }

        /* Pull out spell data compendiums */
        this.info.spellPacks = ['dnd5e.spells'];
        this.info.spellData = [];
        for (let i = 0; i < this.info.spellPacks.length; i++) {
            let packName = this.info.spellPacks[i];
            let pack = game.packs.find(x => x.collection === packName);

            if (pack) {
                pack = await pack.getContent();
                this.info.spellData = this.info.spellData.concat(pack);
            }
        }

        /* Add additional info to spell data if its missing */
        for (let i = 0; i < this.info.spellData.length; i++) {
            if (!this.info.spellData[i].tags) {
                let extraSpellInfo = this.info.extraSpellInfo.filter(spell => spell.name == this.info.spellData[i].name, this)[0];
                if (extraSpellInfo) {
                    this.info.spellData[i].tags = extraSpellInfo.tags;
                    this.info.spellData[i].level = extraSpellInfo.level;
                }
            }
        }
        this.info.spellData = this.info.spellData.filter(spell => spell.tags, this);

        /* Generate class-specific spell-lists */
        for (let key of Object.keys(this.info.class)) {
            this.info.class[key].spellList = {
                'cantrip': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': [], '9': []
            };
            this.info.class[key].spellList['cantrip'] = this.info.spellData.filter(function (spell) {
                return (spell.tags.includes(key.toLowerCase())) & (spell.level == 'cantrip');
            });
            for (let i = 1; i < 10; i++) {
                this.info.class[key].spellList[i] = this.info.spellData.filter(function (spell) {
                    return (spell.tags.includes(key.toLowerCase())) & (spell.level == i);
                });
            }
        }
    }

    /**
     * Gather all relevant inputs and calculate ability scores
     *
     * @memberof HeroConjurer
     */
    _calculateAbilityScores() {
        let recalculated = {
            'Str': 0,
            'Dex': 0,
            'Con': 0,
            'Int': 0,
            'Wis': 0,
            'Cha': 0
        };
        if (this.data.race.name) {

            let raceInfo = this.info.race[this.data.race.name];
            for (let [key, value] of Object.entries(raceInfo.abilities)) {
                recalculated[key] += value;
            }
            if (raceInfo.subraces[this.data.race.subrace]) {

                let subraceInfo = raceInfo.subraces[this.data.race.subrace];
                for (let [key, value] of Object.entries(subraceInfo.abilities)) {
                    recalculated[key] += value;
                }
            }
        }
        if (this.data.abilitiesForm) {
            for (let [key, value] of Object.entries(this.data.abilitiesForm)) {
                recalculated[key] += parseInt(value);
            }
        }
        this.data.abilities = recalculated;
    }

    /**
     * Add or subtract from ability scores, for Abilities tab
     *
     * @param {*} event
     * @memberof HeroConjurer
     */
    _abilityIncrementDecrement(event) {
        let $button = $(event.target);
        let abilityTrackers = $button.siblings().find('input');
        for (let i = 0; i < 2; i++) {

            let oldValue = $(abilityTrackers[i]).val();
            let newVal = undefined;

            if ($button.hasClass('increment')) {
                newVal = parseFloat(oldValue) + 1;
            }
            else if ($button.hasClass('decrement')) {
                // Don't allow decrementing below zero
                if (oldValue > 0) {
                    newVal = parseFloat(oldValue) - 1;
                }
                else {
                    newVal = 0;
                }
            }
            $(abilityTrackers[i]).val(newVal);
        }
        this._submitAndRender();
    }
}

class ConjureButton {
    static getSceneControlButtons(buttons) {
        let tokenButton = buttons.find(b => b.name === 'token');

        if (tokenButton && game.user.isGM) {
            tokenButton.tools.push({
                name: 'hero-conjurer',
                title: 'Hero Conjurer',
                icon: 'fas fa-bolt',
                visible: game.user.isGM,
                onClick: () => ConjureButton.openForm()
            });
        }
    }

    static openForm() {
        if (this.form === undefined) {
            this.form = new HeroConjurer(game.actors);
        }
        this.form.render(true);
    }
}
Hooks.once("init", () => {
    preloadHandlebarsTemplates();
});
Hooks.on('getSceneControlButtons', ConjureButton.getSceneControlButtons);


;
