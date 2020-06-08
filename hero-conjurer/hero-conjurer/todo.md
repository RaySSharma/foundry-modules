# Todo List

* SRD Content
  * [x] Race
  * [ ] Class
  * [x] Abilities
  * [ ] Backgrounds
  * [ ] Equipment
  * [x] Spells
  * [ ] Feats
  * [ ] Bio
  * [ ] Review

* [x] Template format
* [x] Pipe inputs into backend
* [ ] Integration with existing compendia
* [ ] Allow for custom races etc without compendium entries
* [x] Button to open Conjurer
  * [x] Integrate into *Create Actor*
  * [x] Add temporary button
* [x] Move to TabsV2
* [ ] Pipe inputs into character sheet
* [x] Prettify HTML
* [ ] Move away from multiple submits
* [ ] Clean CSS
* [ ] Add settings menu
  * [ ] Add ability to specify compendia
* [ ] Sanitize inputs
* [ ] Compatibility with alternate sheets (probably just Sky5e, Tidy5e)
* [x] Licensing under 5e SRD rules
* [ ] Allow for localization

* Flow
  * User interacts with template, which determines input data
    * Use a socket to connect template to JS?
    * Button onClick initiates script to pass in relevant data, into the correct template
    * Every submit should carry an identifier for the originating sheet
      * Prevents data model from updating undefined items
  * Each tab get its own template to be used with TabsV2

* Data Model
  * Race
    * [x] Subrace
    * [x] Size
    * [x] Speed
    * [x] Language
    * [x] Racial Feats
    * [x] *Add* ability bonuses to total ability scores (including possible subrace bonuses)
    * [x] Information Panel
  * Class
    * [x] Weapon prof
    * [x] Armor prof
    * [x] Skill prof
      * [x] Limit with num_skills
    * [ ] Class feats
    * [x] Starting equipment
    * [x] Hit die
    * [x] Information Panel
    * [x] Move away from using class compendia
      * [x] Use class data file instead
  * Abilities
    * [x] Input scores
    * [x] Add/remove points
    * [x] *Add* ability bonuses to total ability scores
    * [x] Display point-buy points
    * [ ] Recommended abilities
  * Background
    * [x] Skill prof
    * [ ] Language prof
    * [x] Personality traits
    * [x] Ideal
    * [x] Bond
    * [x] Flaw
    * [x] Equipment
    * [x] Information Panel
  * Equipment
    * [ ] Choose equipment or starting wealth
  * Spells
    * [x] Cantrips
    * [x] 1st Level Spells
    * [x] Restrict to Spell List
      * [x] Sort through Vorpalhex tables per class
    * [x] Spellbook
    * [x] Change to spellbook format
      * [x] Tab for each spell level
      * [x] Drag and drop spells onto the spellbook
    * [x] Rethink spell data model
      * Use spell data from Foundry
      * Foundry does not have class restrictions for spells
        * Use external file for class restrictions
        * If spell is not on list, let it show up on all spellcasters' lists
      * Read in compendium spells, read in JSON, match with JSON to get generate caster lists
    * [x] Restrict templating to casters
    * [x] Add ability to turn off class restrictions
    * [x] Add search bar
    * [ ] Counter for class-granted spell levels
  * Racial Features
    * Data model
      * Draw from a feat pool
      * There are multiple names for the same feat
        * Alias to a parent feat
      * "Passive" feats can be applied during character creation
      * "Active" feats apply to e.g, combat
        * Only store name, description, img?
    * Passive Features
      * Ability score increases
      * Proficiencies
      * Speed increases
      * Additional languages
      * Skill increases
      * Resistances
      * Additional spells
      * Additional weapon (Breath weapon may need to be a compendium...)
      * Don't need to be stored but should be flags + functions/functionality
    * Active Features
      * Add combat skills, triggers
    * Class Features exist in compendia
  * Bio
    * [x] Name
    * [x] Age
    * [x] Height
    * [x] Weight
    * [x] Eyes
    * [x] Hair
    * [x] Skin
    * [ ] Rearrange input fields
  * Gather data and pipe into character sheet
