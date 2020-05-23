# Todo List

* SRD Content
  * [] Race
  * [] Class
  * [] Abilities
  * [] Backgrounds
  * [] Equipment
  * [] Spells
  * [] Feats
  * [] Bio
  * [] Review

* [x] Template format
* [x] Pipe inputs into backend
* [] Integration with existing compendiums
* [x] Button to open Conjurer
  * [] Integrate into *Create Actor*
  * [x] Add temporary button
* [ ] Pipe inputs into character sheet
* [ ] Compatibility with alternate sheets (probably just Sky5e)
* [ ] Licensing under 5e SRD rules

* Better name
  * Hero Conjurer
  * Hero Builder

* Flow
  * User interacts with template, which determines input data
    * Use a socket to connect template to JS?
    * Button onClick initiates script to pass in relevant data, into the correct template
  * Each tab get its own template, with the same button templates

* Data Model
  * Race
    * Subrace, size, speed, language, racial feats, bonus info?
  * Class
    * Weapon prof, armor prof, skill prof, class reats, starting equipment, hit die, bonus info?
  * Abilities
    * Input scores
    * Maybe give option for different point systems?
  * Background
    * Skill prof, language prof, personality traits, ideal, bond, flaw, equipment
  * Equipment
    * Choose equipment or starting wealth
  * Spells
    * Cantrips
  * Feats
    * Does anyone get level 1 feats?
  * Bio
  * Gather data and pipe into character sheet