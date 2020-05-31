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
      'modules/hero-conjurer/templates/parts/spells/spells-cantrip.html',
      'modules/hero-conjurer/templates/parts/spells/spells-first.html',
      'modules/hero-conjurer/templates/feats.html',
      'modules/hero-conjurer/templates/bio.html',
      'modules/hero-conjurer/templates/summary.html'
    ];
  
    // Load the template parts
    return loadTemplates(templatePaths);
};