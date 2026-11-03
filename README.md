# Blake's Game Shelf

A single-page site for browsing the collection. Open `index.html` in a browser; no build step.

## Updating the collection

All game data lives in **`games.js`**. You never need to touch `index.html` to add, remove or edit a game.

1. **Add a game:** copy the `TEMPLATE` block at the bottom of `games.js`, paste it into the right shelf section, and fill it in.
2. **Edit a game:** change the field in place.
3. **Remove a game:** delete its `{ ... }` block.
4. Run the checker before pushing:

   ```bash
   node scripts/validate-games.mjs
   ```

   It flags syntax errors, missing fields, unknown mechanic/mood/shelf codes, bad player or time formats, and duplicate games.

### Field notes

- `bgg` is the number in `boardgamegeek.com/boardgame/<ID>/...`. It drives box art and the BGG link. Use `null` if you don't know it yet; the card falls back to the emoji and the BGG button runs a search instead.
- `players` is `"2"` or `"2-4"`. The player-count filters read min/max from it automatically.
- `weight` is the BGG complexity score (1 to 5). It decides the weight category and sort order.
- Valid `mechanics`, `moods` and `shelf` codes are defined at the top of `games.js`. Add a new code there if you need one.

### Changing site behavior

Thresholds (weight categories, time buckets, compare limit, BGG fetch settings) live in the `CONFIG` object at the top of the script in `index.html`.
