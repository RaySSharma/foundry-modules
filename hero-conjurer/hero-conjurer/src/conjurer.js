class HeroConjurer extends FormApplication {
    constructor(options = {}) {
        super(options);

        this.data = {
            race: {},
            class: {},
            abilities: {},
            background: {},
            spells: {},
            feats: {},
            bio: {},
            summary: {}
        };
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
            data: this.data
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html[0].render = this.render;
        let header = html.find('#HC-header .tablinks')
        let navigate = html.find('#HC-navigate .submit')
        for (var i = 0; i < header.length; i++) {
            header[i].addEventListener('click', this._loadTemplate.bind(this));
        }
        for (var i = 0; i < navigate.length; i++) {
            navigate[i].addEventListener('click', this._loadTemplate.bind(this));
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
        this.submit();
        this.render();
    }

    _updateObject(event, formData) {
        event.preventDefault();
        this.data.bio = {
            'name': formData.name,
            'age': formData.age,
            'height': formData.height,
            'weight': formData.weight,
            'eyes': formData.eyes,
            'hair': formData.hair,
            'skin': formData.skin
        };
        const keys = Object.keys(formData);
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