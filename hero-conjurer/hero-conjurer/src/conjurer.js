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
            'feats': 'modules/hero-conjurer/templates/feats.html',
            'bio': 'modules/hero-conjurer/templates/bio.html',
            'summary': 'modules/hero-conjurer/templates/summary.html'
        };
        this.readDataFiles();

        Handlebars.registerHelper("objectLength", function (json) {
            return Object.keys(json).length;
        });
        Handlebars.registerHelper("pointBuySum", function (json) {
            return 27 - (Object.values(json).reduce(function (a, b) {
                return parseInt(a) + parseInt(b);
            }, 0) - 48);
        });

        Handlebars.registerHelper('range', function(n, block) {
            var accum = '';
            for(var i = 0; i < n; ++i)
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

        let navigate = html.find('.navigate');
        for (var i = 0; i < navigate.length; i++) {
            navigate[i].addEventListener('click', this._loadNavigationTemplate.bind(this));
        }

        let submit = html.find('.submit');
        for (var i = 0; i < submit.length; i++) {
            submit[i].addEventListener('change', this._submitAndRender.bind(this));
        }

        let abilityCounter = html.find('#HC-abilities .square');
        for (var i = 0; i < abilityCounter.length; i++) {
            abilityCounter[i].addEventListener('click', this._abilityIncrementDecrement.bind(this));
        }

        let abilityInput = html.find('#HC-abilities .score');
        for (var i = 0; i < abilityInput.length; i++) {
            abilityInput[i].addEventListener('change', function (event) {
                let $button = $(event.target);
                $button.next().val($button.val());
                this._submitAndRender();
            }.bind(this));
        }

        let classInput = html.find('#HC-content .class-img');
        for (var i = 0; i < classInput.length; i++) {
            classInput[i].addEventListener('click', this._loadClassTemplate.bind(this));
        }

    }

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

    _loadClassTemplate(event) {
        let template = this.info.class[event.target.name].template
        this.info.classTemplate = template;
        this.data.class.class = event.target.name;
        this._submitAndRender();
    }

    _submitAndRender() {
        this.submit();
        this.render();
    }

    _updateObject(event, formData) {
        event.preventDefault();
        this.data.race = (formData.sheet == 'race') ? {
            'race': formData.race,
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
            'class': this.data.class.class,
            'pack': this.info.classData.find(x => x.name == this.data.class.class).data,
            'data': this.info.class[this.data.class.class],
            'skills': formData.skill
        } : this.data.class;
    }

    async readDataFiles() {
        this.info.race = await fetch('modules/hero-conjurer/data/races.json').then(response => response.json());
        this.info.alignment = await fetch('modules/hero-conjurer/data/alignments.json').then(response => response.json());
        this.info.class = await fetch('modules/hero-conjurer/data/classes.json').then(response => response.json());

        let packNames = [];
        for (let value of Object.values(this.info.class)) {
            packNames.push(value.pack);
        }
        this.info.packNames = [...new Set(packNames)];

        this.info.classData = [];
        for (let i = 0; i < this.info.packNames.length; i++) {
            let packName = this.info.packNames[i];
            let pack = await game.packs.find(x => x.collection === packName).getContent();
            this.info.classData = this.info.classData.concat(pack);
        }
    }

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

    _abilityIncrementDecrement(event) {
        let $button = $(event.target);
        let abilityTrackers = $button.siblings().find("input");
        for (let i = 0; i < 2; i++) {

            let oldValue = $(abilityTrackers[i]).val();
            let newVal = undefined;

            if ($button.hasClass("increment")) {
                newVal = parseFloat(oldValue) + 1;
            }
            else if ($button.hasClass("decrement")) {
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