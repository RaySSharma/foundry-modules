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
                'imgs': [],
                'levels': [],
                'restrict_spells': 'checked'
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
        Handlebars.registerHelper('canCastSpells', function (str) {
            if (str == 'none') {
                return false;
            }
            else {
                return true;
            }
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

        html.find('.drag-remove').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragend", function (event) {
                let spellName = event.target.children.spells.id;
                let index = this.data.spells.names.findIndex(x => x == spellName);
                if (index !== -1) {
                    this.data.spells.levels.splice(index, 1);
                    this.data.spells.imgs.splice(index, 1);
                    this.data.spells.names.splice(index, 1);
                }
                this._submitAndRender();
            }.bind(this));
        });

        html.find(".draggable").each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", function (event) {
                let spellName = event.target.children.spells.id;
                let spell = this.info.spells.find(x => x.data.name == spellName);
                event.dataTransfer.setData("text/plain", JSON.stringify({
                    src: event.target.children.spells.src,
                    id: event.target.children.spells.id,
                    name: event.target.children.spells.name,
                    level: spell.labels.level
                }));
            }.bind(this));
        });

        html.find(".droppable").each((i, li) => {
            li.addEventListener("drop", function (event) {
                let data = event.dataTransfer.getData("text/plain");
                if (data) {
                    data = JSON.parse(data);
                    if (!this.data.spells.names.includes(data.id)) {
                        this.data.spells.levels.push(data.level);
                        this.data.spells.imgs.push(data.src);
                        this.data.spells.names.push(data.id);
                    }
                    this._submitAndRender();
                }

            }.bind(this));
        });

        $(".droppable")
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

        $('input[name="skill"]').on('change', function (event) {
            let limit = this.data.class.data.num_skills;
            if ($('input[name="skill"]:checked').length > limit) {
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

        $('.spell-search').keyup(function (event) {
            let spellEntries = $(this).parent().siblings();

            let searchValue = $(this).val().toLowerCase();
            spellEntries.filter(function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(searchValue) > -1);
            });

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
            'template': this.info.race[formData.race[0]].template,
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
            'data': this.info.class[this.data.class.name],
            'skills': formData.skill,
            'template': this.data.class.template,
            'spells': this.info.class[this.data.class.name].spellList,
            'caster_type': this.info.class[this.data.class.name].caster_type,
            'num_spells': this.info.class[this.data.class.name].num_spells,
            'description': this.info.class[this.data.class.name].description,
            'hit_dice': this.info.class[this.data.class.name].hit_dice,
            'img': this.info.class[this.data.class.name].img
        } : this.data.class;

        this.data.background = (this.currentSheet == 'background') ? {
            'name': formData.background,
            'data': this.info.background[formData.background],
            'template': this.info.background[formData.background].template,
            'skills': this.info.background[formData.background].skills
        } : this.data.background;

        this.data.spells = ((this.currentSheet == 'spells') || (this.currentSheet == 'spells-cantrip') || (this.currentSheet == 'spells-first')) ? {
            'names': this.data.spells.names,
            'data': this.info.spells.filter(x => x.name.includes(this.data.spells.names)),
            'imgs': this.data.spells.imgs,
            'levels': this.data.spells.levels,
            'restrict_spells': this.data.spells.restrict_spells,
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
        this.info.spells = [];

        /* Pull out class compendiums according to classes.json */

        /*let classPacks = [];
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
        }*/

        /* Pull out spell data compendiums */
        this.info.spellCompendiums = ['dnd5e.spells'];
        for (let i = 0; i < this.info.spellCompendiums.length; i++) {
            let packName = this.info.spellCompendiums[i];
            let pack = game.packs.find(x => x.collection === packName);
            if (pack) {
                pack = await pack.getContent();
                this.info.spells.push(...pack);
            }
        }

        /* Add additional info to spell data if its missing */
        for (let i = 0; i < this.info.spells.length; i++) {
            let spell = this.info.spells[i];
            if (!spell.tags) {
                let extraSpellInfo = this.info.extraSpellInfo.filter(e => e.name == spell.name, this)[0];
                if (extraSpellInfo) {
                    spell.tags = extraSpellInfo.tags;
                    spell.level = extraSpellInfo.level;
                }
            }
        }
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

    _stripHTML(html) {
        return html.replace(/<(.|\n)*?>/g, '');
    }
}

Hooks.once("init", () => {
    preloadHandlebarsTemplates();
});

Hooks.once("renderActorDirectory", (app, html, data) => {
    let existingButton = $('button.create-entity:contains("Create Actor")');
    $(existingButton).parent().addClass('dropup');
    $(existingButton).addClass('dropbtn');
    let newButton = $(
        '<button class="dropup-content"><i class="fas fa-bolt"></i>Hero Conjurer</button>'
    );
    newButton.on('click', function (event) {
        event.form = new HeroConjurer(game.actors);
        event.form.render(true);
    });
    newButton.insertAfter(existingButton);
});

