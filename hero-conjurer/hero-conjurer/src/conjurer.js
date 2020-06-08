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
                'names': [],
                'data': [],
                'imgs': [],
                'levels': [],
                'restrict_spells': 'checked'
            },
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
        Handlebars.registerHelper('canCastSpells', function (str) {
            if (str == 'none') {
                return false;
            }
            else {
                return true;
            }
        });
        Handlebars.registerHelper('countLevels', function (spellLevels, levelToCount) {
            let count = 0
            spellLevels.forEach( (level) => {
                if (level == levelToCount) {
                    count += 1
                }
            })
            return count
        });
        Handlebars.registerHelper('isFolder', function (obj) {
            return (Array.isArray(obj)) ? true : false;
        });
        Handlebars.registerHelper('stripHTML', this._stripHTML);
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
            if (event.target.id == 'background') {
                this.data.background.hide_options = '';
            }
            this._submitAndRender();
        }.bind(this));

        $('#HC-abilities .increment-button').click(this._abilityScoreIncrementDecrement.bind(this));

        $('#HC-abilities .ability-score').change(function (event) {
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

        $(".info-icon")
            .click( function (event) {
                let spellName = $(event.target).siblings('img').attr('id')
                let spell = this.info.spells.find(x => x.data.name == spellName)
                spell.sheet.render(true)
            }.bind(this))

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

        $('.random-choice').click(function (event) {
            let arr = this.data.background.data[event.target.id];
            let choice = arr[Math.floor(Math.random() * arr.length)];
            this.data.background[event.target.id] = choice;
            this._submitAndRender();
        }.bind(this));

        /*$('.feat-icon').hover( function (event) {
            $(event.target).siblings('p').show()
        }.bind(this), function (event) {
            $(event.target).siblings('p').hide()
        })*/
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
            'feats': this._packRaceFeats(this.data.sheet.data.items.filter(x => x.type == 'feat'))
        } : this.data.race;

        if (this.currentSheet == 'race') {
            this._calculateAbilityScores(false);
        }

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
            'img': this.info.class[this.data.class.name].img,
            'feats': this._getClassFeats(this.info.class[this.data.class.name].feats)
        } : this.data.class;

        this.data.background = (this.currentSheet == 'background') ? {
            'name': formData.background,
            'data': this.info.background[formData.background],
            'template': this.info.background[formData.background].template,
            'skills': this.info.background[formData.background].skills,
            'hide_options': this.data.background.hide_options,
            'traits': this.data.background.traits,
            'ideals': this.data.background.ideals,
            'bonds': this.data.background.bonds,
            'flaws': this.data.background.flaws
        } : this.data.background;

        this.data.spells = ((this.currentSheet == 'spells') || (this.currentSheet == 'spells-cantrip') || (this.currentSheet == 'spells-first')) ? {
            'names': this.data.spells.names,
            'data': this.info.spells.filter(x => x.name.includes(this.data.spells.names)),
            'imgs': this.data.spells.imgs,
            'levels': this.data.spells.levels,
            'restrict_spells': this.data.spells.restrict_spells,
        } : this.data.spells;
    }

    _onChangeTab(event, tabs, active) {
        super._onChangeTab();
        this.currentSheet = active;
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
        let featData = {}
        for (let i = 0; i < feats.length; i++) {
            let feat = feats[i]
            let featEntry = this.info.classFeatures.find(x => x.data.name === feat)
            if (featEntry) {
                featData[feat] = featEntry.data
            }
        }
        return featData
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
        if (scoresManuallyInput) {
            this.data.abilities = this.data.abilities;
        }
        else {
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
        //this._submitAndRender();
    }

    /**
     * Strip HTML tags and nbsp tags
     *
     * @param {*} html
     * @returns
     * @memberof HeroConjurer
     */
    _stripHTML(html) {
        return html.replace(/<(.|\n)*?>/g, '').replace(/&nbsp;/g, '');
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

