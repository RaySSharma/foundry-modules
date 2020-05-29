# Todo List

* SRD Content
  * [ ] Race
  * [ ] Class
  * [x] Abilities
  * [ ] Backgrounds
  * [ ] Equipment
  * [ ] Spells
  * [ ] Feats
  * [ ] Bio
  * [ ] Review

* [x] Template format
* [x] Pipe inputs into backend
* [ ] Integration with existing compendiums
* [ ] Allow for custom races etc without compendium entries
* [x] Button to open Conjurer
  * [ ] Integrate into *Create Actor*
  * [x] Add temporary button
* [ ] Pipe inputs into character sheet
* [ ] Prettify HTML
* [ ] Clean CSS
* [ ] Sanitize inputs
* [ ] Compatibility with alternate sheets (probably just Sky5e)
* [ ] Licensing under 5e SRD rules
* [ ] Allow for localization

* Flow
  * User interacts with template, which determines input data
    * Use a socket to connect template to JS?
    * Button onClick initiates script to pass in relevant data, into the correct template
  * Each tab get its own template, with the same button templates

* Data Model
  * Race
    * [x] Subrace
    * [x] Size
    * [x] Speed
    * [x] Language
    * [ ] Racial Feats
    * [x] *Add* ability bonuses to total ability scores (including possible subrace bonuses)
    * [ ] Information Panel
  * Class
    * [x] Weapon prof
    * [x] Armor prof
    * [ ] Skill prof
      * Limit with num_skills
    * [ ] Class feats
    * [x] Starting equipment
    * [x] Hit die
    * [x] Information Panel
  * Abilities
    * [x] Input scores
    * [x] Add/remove points
    * [x] *Add* ability bonuses to total ability scores
    * [x] Display point-buy points
    * [ ] Recommended abilities
  * Background
    * [x] Skill prof
    * [ ] Language prof
    * [ ] Personality traits
    * [ ] Ideal
    * [ ] Bond
    * [ ] Flaw
    * [ ] Equipment
    * [x] Information Panel
  * Equipment
    * [ ] Choose equipment or starting wealth
  * Spells
    * [x] Cantrips
    * [x] 1st Level Spells
    * [ ] Restrict to Spell List
      * [ ] Sort through Vorpalhex tables per class
    * [ ] Information Panel
  * Feats
    * [ ] Feats
  * Bio
    * [x] Name
    * [x] Age
    * [x] Height
    * [x] Weight
    * [x] Eyes
    * [x] Hair
    * [x] Skin
    * [ ] Information Panel
  * Gather data and pipe into character sheet
