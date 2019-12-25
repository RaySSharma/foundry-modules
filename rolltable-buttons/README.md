# Roll Table Buttons

- **Author:** RaySSharma
- **Version:** 0.0.2
- **Foundry VTT Compatibility:** 0.4.3+
- **Module Requirement(s):** None
- **Module Conflicts:** None

### Link to Module
- [https://github.com/RaySSharma/foundry-modules/tree/master/rolltable-buttons](https://github.com/RaySSharma/foundry-modules/tree/master/rolltable-buttons)

### Description

This module adds a button to the chat controls for easier access to rolltables. Came about as a way to add critical-hit decks for players.

### Installation

#### Method 1
- Download the .zip file in this repository.
- Extract the contents of the zip to your dataPath, `/Data/modules/`
- Restart Foundry.

#### Method 2
- Start up Foundry and click "Install Module" in the "Add-On Modules" tab.
- Paste the link: `https://raw.githubusercontent.com/RaySSharma/foundry-modules/master/rolltable-buttons/rolltable-buttons/module.json`
- Click "Install" and it should appear in your modules list.

### Updates
- 0.0.1
    - Added buttons to Token scene controls for rolling all available rolltables.
- 0.0.2
    - Moved button to chat controls.
    - Added dialog box with rolltables, roll-able on click.
    - Added handling of different rolltable entry-types.
        - Text and JournalEntry entries now have a custom chat card
        - All other entry-types use the default rolltable chat output.
    - Added en localization (pretty minimal).
    
### License
The source code is licensed under GPL-3.0.
