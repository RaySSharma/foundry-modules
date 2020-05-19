## RollTable Buttons

* **Author:** RaySSharma#4736
* **Version:** 1.1.3
* **Foundry VTT Compatibility:** 0.5.6+
* **Module Requirement(s):** None
* **Module Conflicts:** None
* **Translation Support**: en

### Link to Module

* [https://github.com/RaySSharma/foundry-modules/tree/master/rolltable-buttons](https://github.com/RaySSharma/foundry-modules/tree/master/rolltable-buttons)
* [https://raw.githubusercontent.com/RaySSharma/foundry-modules/master/rolltable-buttons/rolltable-buttons/module.json](https://raw.githubusercontent.com/RaySSharma/foundry-modules/master/rolltable-buttons/rolltable-buttons/module.json)

### Description

This module adds a convenient way to draw from RollTables. Great for critical hit / fumble decks!

* Adds a button to the chat to draw from Roll Tables.
* Color cards according to their parent folder color.
* Takes into account `rollMode` to allow global or private roll-table results.
* Roll-tables only appear in the list if "Display in Chat" is checked.
* Adheres to user permissions.
* JournalEntry results come with a custom chat-card.

![New Button + Dialog](./images/rolltable-dialog.png? "New Button + Dialog")

### Installation

#### Method 1

* Download the .zip file in this repository.
* Extract the contents of the zip to your dataPath, `/Data/modules/`
* Restart Foundry.

#### Method 2

* Start up Foundry and click "Install Module" in the "Add-On Modules" tab.
* Paste the link: `https://raw.githubusercontent.com/RaySSharma/foundry-modules/master/rolltable-buttons/rolltable-buttons/module.json`
* Click "Install" and it should appear in your modules list.

### Updates

#### 0.0.1

* Added buttons to Token scene controls for rolling all available rolltables.

#### 0.0.2

* Moved button to chat controls.
* Added dialog box with rolltables, roll-able on click.
* Added handling of different rolltable entry-types.
  * Text and JournalEntry entries now have a custom chat card
  * All other entry-types use the default rolltable chat output.
* Added en localization (pretty minimal).

#### 0.1.0

* Added handling for empty roll tables
* Added checks for user permission to view tables

#### 0.2.0

* Changed Hook for chat button to `canvasReady`.
* Changed button style.
* Trimmed excess CSS.
* Added check for user GM status to show table buttons.

#### 0.3.0

* Refactored code to use more FoundryVTT terminology.
* Made use of `rollMode` dropdown menu to determine whether chat message is global, GM-only, etc.
* Added check for whether "Display in Chat" is marked in the rollTable form. Table button does not appear in the RTB Dialog if "Display in Chat" is not marked.

#### 0.4.0

* Forced roll-mode selection list to smaller size, so RTB button will fit.
* Updated minimum Foundry version to 0.4.7.
* Made module system-agnostic (thanks to imposeren#3557).

#### 1.0.0

* Major rewrite includes:
  * Support for folders containing roll tables.
  * Color buttons according to folder colors.
  * More robust support of user permissions.
  * Pressing chat button closes dialog.

#### 1.1.0

* RollTables and Folders containing RollTables both show up (thanks to mistamichal#5724).
* Added icon to tell Folders apart from RollTables.
* Folders no longer show unchecked DisplayRoll Tables (thanks to DocWhovian#9234).
* Added support for changes to rolling methods in FVTT 0.5.6
* Fixed handling of permissions (thanks to DoubleR#1944).

### License

The source code is licensed under GPL-3.0.
