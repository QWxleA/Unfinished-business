# Unfinished-business
Move unfinished tasks to today, Logseq plugin

With great power comes great responsibility.

This plugin moves blocks from one place tothe other. 

## Installation FIXME

- `git clone https://github.com:QWxleA/logseq-serendipity.git`
- open Logseq Desktop client and turn on `Developer mode` in the user settings panel (`Esc t s`)
- open the toolbar dot menu and navigate to the plugins page (`Esc t p`)
- click `Load unpacked package` button, then select the `logseq-random-note` directory

## Configuration FIXME

Under **Settings** (which can be found on the plugin's card in the left lower corner), or under **Settings**:

- *Include journals* will show any page *or* journal as a random page
- *Show entire graph or tagged pages* makes it possible to limit the choice to only **pages** with a specific tag
- *Specific tag to search* tag to limit the search to. These are page tags: (`tags::` straight under the title)

## Usage FIXME

![screenshot](./screenshot.png)

1. Press the button to show a random page (what it shows depends on settings).

2. Using the keybinding: `s r` shows any random page
3. Using the keybinding: `s j` shows a random journal page
4. Using the keybinding: `s n` shows random page, anything but a journal page
5. Using the keybinding: `s s` shows random tagged page

6. Use the *command palette* `Ctrl+Shift+p` and then `Show random page`
7. Use the *command palette* `Ctrl+Shift+p` and then `Show random journal page`
8. Use the *command palette* `Ctrl+Shift+p` and then `Show random page, anything but a journal page`
9. Use the *command palette* `Ctrl+Shift+p` and then `Show random tagged page`

## Template FIXME

The plugin makes it possible to add a random quote (or any other tag) in a template.

Usage:

type: `/Insert Serendipity`, and it will insert a code-snippet that will then be run with the template.

The code snippets looks like this `{{renderer :seredipity, quote}}`, and is supposed to be used in a template (it will work anywhere, but will immediately insert a random block).

The part you can alter is `quote`, use any tag you want, and it will randomly pull a block with that tag.

### Notes

This plugin is a partial is inspired by FIXME

## Licence

MIT

### Font License

[OFL](./OFL.txt)