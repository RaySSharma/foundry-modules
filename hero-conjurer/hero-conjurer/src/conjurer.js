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
            background: {},
            spells: {},
            feats: {},
            bio: {},
            summary: {}
        };
        this.info = {};
        this.templates = {
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

        Handlebars.registerHelper("objectLength", function(json) {
            return Object.keys(json).length;
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
        let header = html.find('#HC-header .tablinks');
        let navigate = html.find('#HC-navigate .submit');
        let select = html.find('#HC-content .select');
        for (var i = 0; i < header.length; i++) {
            header[i].addEventListener('click', this._loadTemplate.bind(this));
        }
        for (var i = 0; i < navigate.length; i++) {
            navigate[i].addEventListener('click', this._loadTemplate.bind(this));
        }
        for (var i = 0; i < select.length; i++) {
            select[i].addEventListener('change', this._submitAndRender.bind(this));
        }
    }

    _loadTemplate(event) {
        let classlist = event.currentTarget.classList;
        if (classlist.contains('next') | classlist.contains('prev')) {
            /* This will change when next/prev buttons are fixed */
        }
        else {
            let template = this.templates[classlist[1]];
            this.options.template = template;
        }
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
        this.calculateAbilities();

        this.data.bio = (formData.sheet == 'bio') ? {
            'name': formData.name,
            'age': formData.age,
            'height': formData.height,
            'weight': formData.weight,
            'eyes': formData.eyes,
            'hair': formData.hair,
            'skin': formData.skin
        } : this.data.bio;

    }

    async readDataFiles() {
        this.info.race = await fetch('modules/hero-conjurer/data/races.json').then(response => response.json());
        this.info.alignment = await fetch('modules/hero-conjurer/data/alignments.json').then(response => response.json());
    }

    calculateAbilities() {
        if (this.data.race.race) {

            let raceInfo = this.info.race[this.data.race.race];
            for (let [key, value] of Object.entries(raceInfo.abilities)) {
                this.data.abilities[key] = value;
            }
            if (raceInfo.subraces[this.data.race.subrace]) {

                let subraceInfo = raceInfo.subraces[this.data.race.subrace];
                for (let [key, value] of Object.entries(subraceInfo.abilities)) {
                    this.data.abilities[key] += value;
                }
            }
        }
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