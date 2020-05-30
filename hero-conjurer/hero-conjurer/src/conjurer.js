
class HeroConjurer extends FormApplication {
    constructor(options = {}) {
        super(options);

        this.data = {
            race: {},
            class: {},
            abilities: {
                'Str': 0,
                'Dex': 0,
                'Con': 0,
                'Int': 0,
                'Wis': 0,
                'Cha': 0
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
            spells: {},
            feats: {},
            bio: {},
            summary: {}
        };
        this.info = {};
        this.pages = {
            'race': 'modules/hero-conjurer/templates/race.html',
            'class': 'modules/hero-conjurer/templates/class.html',
            'abilities': 'modules/hero-conjurer/templates/abilities.html',
            'background': 'modules/hero-conjurer/templates/background.html',
            'equipment': 'modules/hero-conjurer/templates/equipment.html',
            'spells': 'modules/hero-conjurer/templates/spells.html',
            'spells-cantrip': 'modules/hero-conjurer/templates/parts/spells/spells-cantrip.html',
            'spells-first': 'modules/hero-conjurer/templates/parts/spells/spells-first.html',
            'feats': 'modules/hero-conjurer/templates/feats.html',
            'bio': 'modules/hero-conjurer/templates/bio.html',
            'summary': 'modules/hero-conjurer/templates/summary.html'
        };

        this.readDataFiles();

        Handlebars.registerHelper('objectLength', function (json) {
            return Object.keys(json).length;
        });
        Handlebars.registerHelper('pointBuySum', function (json) {
            return 27 - (Object.values(json).reduce(function (a, b) {
                return parseInt(a) + parseInt(b);
            }, 0) - 48);
        });
        Handlebars.registerHelper('upperCase', function (str) {
            return str.toUpperCase();
        });

        Handlebars.registerHelper('range', function (n, block) {
            var accum = '';
            for (var i = 0; i < n; ++i)
                accum += block.fn(i);
            return accum;
        });

    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = 'Hero Conjurer';
        options.id = 'hero-conjurer';
        options.template = 'modules/hero-conjurer/templates/start.html';
        options.closeOnSubmit = false;
        options.submitOnClose = true;
        options.popOut = true;
        options.width = 'auto';
        options.height = 'auto';
        return options;
    }

    async getData() {
        return {
            options: this.options,
            data: this.data,
            info: this.info
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html[0].render = this.render;

        $('.navigate').click(this._loadNavigationTemplate.bind(this));

        $('.submit').change(this._submitAndRender.bind(this));

        $('#HC-abilities .square').click(this._abilityIncrementDecrement.bind(this));

        $('#HC-abilities .score').change(function (event) {
            let $button = $(event.target);
            $button.next().val($button.val());
            this._submitAndRender();
        }.bind(this));

        $('.data-click').click(this._loadDataTemplate.bind(this));
        $('.selector').click(function(event) {
            if (event.target.name == "class") {
                var target = this.info.classData.find(x => x.name == event.target.id)
                var nonTarget = this.info.classData.filter(x => x.name != event.target.id)
            }
            else if (event.target.name == "spell") {
                var target = this.info.spellData.find(x => x.name == event.target.id)
                var nonTarget = this.info.spellData.filter(x => x.name != event.target.id)
            }
            else{
                return
            }
            target.border = '0 0 18px red'
            nonTarget.forEach(x => x.border = 'none')
        }.bind(this))

        $('.spell-selector').change(function (event) {

            $('.spell-selector').children(':not([hidden])').removeAttr('disabled');
            $(event.target).children().removeAttr('selected');

            let option = $(event.target).prop('selectedOptions')[0];
            $(option).attr('selected', 'selected');
            $(option).attr('disabled', 'disabled');

            $('.spell-selector').children('[selected]:not([hidden])').each(function () {
                let name = $(this).attr('name');
                $('.spell-selector').children("[name='" + name + "']").attr('disabled', 'disabled');
            });

            let value = option.value.split(':')[1];
            this.info.spellData.find(x => x.name == value);

        }.bind(this));
    }

    _updateObject(event, formData) {
        event.preventDefault();
        this.data.race = (formData.sheet == 'race') ? {
            'name': formData.race,
            'data': this.info.race[formData.race],
            'size': this.info.race[formData.race].size,
            'speed': this.info.race[formData.race].speed,
            'alignment': formData.alignment,
            'subrace': formData.subrace
        } : this.data.race;

        this.data.abilitiesForm = (formData.sheet == 'abilities') ? {
            'Str': formData.Str,
            'Dex': formData.Dex,
            'Con': formData.Con,
            'Int': formData.Int,
            'Wis': formData.Wis,
            'Cha': formData.Cha
        } : this.data.abilitiesForm;

        this.data.bio = (formData.sheet == 'bio') ? {
            'name': formData.name,
            'age': formData.age,
            'height': formData.height,
            'weight': formData.weight,
            'eyes': formData.eyes,
            'hair': formData.hair,
            'skin': formData.skin
        } : this.data.bio;
        this._calculateAbilityScores();

        this.data.class = (formData.sheet == 'class') ? {
            'name': this.data.class.name,
            'pack': this.info.classData.find(x => x.name == this.data.class.name).data,
            'data': this.info.class[this.data.class.name],
            'skills': formData.skill,
            'template': this.data.class.template,
            'spells': this.info.class[this.data.class.name].spellList,
            'caster_type': this.info.class[this.data.class.name].caster_type,
            'num_spells': this.info.class[this.data.class.name].num_spells
        } : this.data.class;

        this.data.background = (formData.sheet == 'background') ? {
            'name': formData.background,
            'data': this.info.background[formData.background],
            'template': this.info.background[formData.background].template,
            'skills': this.info.background[formData.background].skills
        } : this.data.background;

        this.data.spells = (formData.sheet == 'spells') ? {
            'names': formData.spell
        } : this.data.spells;
    }

    /**
     * Navigate and page templates for each tab
     *
     * @param {*} event
     * @memberof HeroConjurer
     */
    _loadNavigationTemplate(event) {
        let classlist = event.currentTarget.classList;
        if (classlist.contains('next') | classlist.contains('prev')) {
            /* This will change when next/prev buttons are fixed */
        }
        else {
            let template = this.pages[classlist[2]];
            this.options.template = template;
        }
        this._submitAndRender();
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

        if (templateType == "spells") {
            this.data[templateType].template = this.info.spellData.find(x => x.name == templateChild).data.data.description.value
            this.data[templateType].name = templateChild;
        }
        else {
            this.data[templateType].template = this.info[templateType][templateChild].template;
            this.data[templateType].name = templateChild;
        }

        this._submitAndRender();
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
        if (this.data.race.race) {

            let raceInfo = this.info.race[this.data.race.race];
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
Hooks.on('getSceneControlButtons', ConjureButton.getSceneControlButtons);