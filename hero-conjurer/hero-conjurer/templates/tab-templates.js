export const preloadHandlebarsTemplates = async function() {

    // Define template paths to load
    const templatePaths = [
  
      // Actor Sheet Partials
      'modules/hero-conjurer/templates/race.html',
      'modules/hero-conjurer/templates/class.html',
      'modules/hero-conjurer/templates/abilities.html',
      'modules/hero-conjurer/templates/background.html',
      'modules/hero-conjurer/templates/equipment.html',
      'modules/hero-conjurer/templates/spells.html',
      'modules/hero-conjurer/templates/feats.html',
      'modules/hero-conjurer/templates/bio.html',
      'modules/hero-conjurer/templates/summary.html',
      'modules/hero-conjurer/templates/parts/spells/spells-cantrip.html',
      'modules/hero-conjurer/templates/parts/spells/spells-eighth.html',
      'modules/hero-conjurer/templates/parts/spells/spells-fifth.html',
      'modules/hero-conjurer/templates/parts/spells/spells-first.html',
      'modules/hero-conjurer/templates/parts/spells/spells-fourth.html',
      'modules/hero-conjurer/templates/parts/spells/spells-ninth.html',
      'modules/hero-conjurer/templates/parts/spells/spells-second.html',
      'modules/hero-conjurer/templates/parts/spells/spells-seventh.html',
      'modules/hero-conjurer/templates/parts/spells/spells-sixth.html',
      'modules/hero-conjurer/templates/parts/spells/spells-third.html'
    ];
  
    // Load the template parts
    return loadTemplates(templatePaths);
};