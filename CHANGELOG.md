# Guild of the Nine Sequences — Audit Changelog

## v17.1 — Display-only modifiers and dead mechanics

`node tests/effects-behavior.js` — **129 passed, 0 failed**. `node tests/balance.js` — **150 passed, 2 failed** (the two same-path balance spread checks; balance work is intentionally not part of this release).

**Engine bugs (effects that never ran)**
- `applyStructuredAbility` had dangling `else` branches (cleanse, status, debuff_hit): shield, heal, buff, debuff, status, steals and revive did nothing, and the catch-all effects threw. Braces added.
- `evade` / `untargetable` were applied to the enemy; buff, heal, shield and cleanse hit the whole party. They now target the caster.
- Buffs, speed debuffs, SP/cooldown penalties and dodge were stored on the unit but read from the agent (never applied to player characters). Mirrored via `syncUnitToAgent`.
- Buffs, debuffs, vulnerability, counter and dodge never expired and stacked multiplicatively. They are now non-stacking and expire after 2 rounds.
- `next_attack_miss`, `next_crit_fail`, `debuff_hit` were applied to / read from the wrong unit; `debuff_hit` also stored the wrong value. `transfer_debuffs` moved debuffs in the wrong direction. `skill_misfire` read the wrong field. `status` effects ignored `chance`.
- Hybrid damage formula dropped the primary ATK term when `damage_component` effects existed (affected abilities dealt 4–15% of intended damage).
- Shield was set but never consumed anywhere.
- Fool engine code referenced the retired id `marionettist_thread` (current id `thread_binding`), so the Thread mechanic never ran.
- Support-only ability kits cast heals at full HP and re-cast utility every cooldown; the chooser now only casts support abilities that would do something.

**Display-only modifiers now live**
- Passive +HP, passive DEF, passive damage-taken reductions, Hit Chance (reduces target dodge), `immunity`, passive `debuff` auras (Hanged Man 1), `untargetable`, `root`.

**New / reworked mechanics (design decisions)**
- Incoming damage pipeline: negate -> shield absorbs -> damage reduction on the remainder -> HP -> reflect. Damage reduction applies to all damage types and to the final damage.
- `reflect` effect (replaces `counter` / `lethal_redirect` on the six reflect abilities). Casting grants a reflect buff that lasts until the caster's next turn and reflects every hit in that window. `mode: stat` = fixed hit from the caster's INT/ATK (Paper Figurine 100% INT Fire, Thunder God 80% ATK Lightning, Prophetic 150% INT Magic); `mode: share` = share of the damage taken (Scroll Gate 50%, Flesh Mutation 30%, Deceive Impact 100%). Deceive Impact and Prophetic Intervention also negate the hit. Reflected damage cannot itself be reflected.
- `damage_taken` from actives lasts until the caster's next turn (Paper Figurine 50%, Distort Impact 40%, Guardian Stance 20%, Matter Fortification 20%). Paper Figurine and Distort Impact now use real damage reduction instead of a DEF buff.
- `taunt` effect (Guardian Stance, Provocation): enemies must target the taunter for 2 rounds; Visionary 2 is immune.
- `spell_penetration` passive (Combat Analysis 15%, Omniscient Eye 25%): INT-scaled spells ignore that % of target DEF, in addition to the INT bonus.
- Spirit Vision (Fool 9): +10% INT and +0.10 crit multiplier (1.50 -> 1.60). The unused Spectator reveal code was removed.
- `status_resistance` and `immunity` mechanisms for `fear` / `illusion` statuses are in place (immunity to illusion added to Visionary 2 and Omniscient Eye); abilities that inflict them are still to be added.
- Elemental damage with no element averages fire/water/lightning/frost resistance; `crimson` -> blood and `slashing` -> physical resistance aliases.

**Per-effect durations**: every timed effect now states its own `duration` in the ability JSON (rounds, or `"next_turn"`), with defaults in `balance.json` `effect_durations`. The shared per-unit timer (which cleared all buffs together and was refreshed by any new buff) was replaced by independent per-effect timers; current values are rebuilt from the live timers. 61 effects were stamped (25 from the description text, 36 from defaults). Holy Flash's accuracy debuff now lasts the 2 rounds its description states (it was effectively 1). Analysis Weakness's 30% DEF bypass is now a real 2-round buff on the caster's strikes (before, it only applied to the cast's own non-existent damage). New tests: independent expiry, next_turn, defaults, and a description-vs-duration consistency check.

**Data corrections**: Systemic Glitch (420% INT true + steals), Omniscient Rewrite (280% INT heal), Hunter's Instinct / Combat Analysis (+10% hit chance), Martial Mastery (+15% ATK), Dawn Guardian Barrier (20% shield), Psychological Invisibility (+30% next spell), Unshadowed Execution (+50% vs corrupted), Moon 5 / Paragon 4 speed buffs, Darkness 9 sleep immunity, Sun 9 fear immunity.

**Tests**: new `tests/effects-behavior.js`; fixed stale Seq 0 stat-table probe (its trait is not neutral); reputation-gate check now tries 20 seeds.

**Known / not done**: statuses with no mechanic yet: `confused`, `charmed`, `polymorphed`, `banished` (Instigation and Conceptual Unseal & Seal have no effects that apply their described confusion/seal); Dream Tether's 'prevents death for 1 round' and Miracle Rebirth's 'Spiritual Exhaustion' are not implemented; Parasitic Contagion drains SP once, not per turn; same-path balance spreads (Death, Darkness, Wheel at Seq 5; Moon at Seq 9); fear resistance (Darkness 9) and illusion immunity (White Tower 3 is wired, no ability inflicts illusion yet); `lethal_redirect` removed; the legacy 61-case `runActiveAbility` switch is unused dead code; the AI picks the first matching Heal/Defense ability below 50% HP, so Flesh Mutation is rarely cast by Mother.

## v9 — Sequence stat table

`node tests/balance.js` — **87 passed, 0 failed**.

- **STAT_TABLE** (Sequences 9–0 x Physical / Agility / Caster) now drives HP, ATK, DEF, INT and base Pathway Speed. Final Stat = table x individual +/-10% variance x trait.
- **PATH_ARCHETYPE**: Physical = Twilight Giant, Red Priest, Tyrant, Sun; Agility = Door, Demoness, Wheel of Fortune; Caster = Visionary, Hermit, Fool.
- Advancement scales a character's own stats by the table ratio between Sequences, so variance and trait carry forward.
- Speed = table base speed + 0.2 x INT + 0.1 x ATK. Initiative bonuses are now percentages.
- Enemies use the same table pipeline as player characters; ordinary humans are scaled to sit well below Sequence 9.
- **Bug fix:** the combat round loop closed too early, so every fight ended after one round. Fights now run multiple rounds.
- Rebalanced for table scale: global enemy damage (COMBAT_BALANCE), per-Pathway combat multipliers, Fool thread timing/attempt budget/resistance, relative dodge/counter formulas, Bleed = 3% Max HP per tick.
- Save version 9 with automatic v8 migration (stats rebuilt from the table; progress kept).
- Only Seq 9–5 were balance-tuned; quests never spawn enemies below Seq 5.

## Verification snapshot

`node tests/balance.js` — **68 passed, 0 failed** after the trait replacement.

| Check | Result |
|---|---|
| Save/reload | PASS — canonical state identical after migration |
| Fresh mixed Seq-9 party | **72.6% win**, **0.30 deaths/quest** |
| Enemy progression | **74.4% → 52.8% → 52.7% → 0.0%** for enemy Seq 9→8→7→6; the zero is reserved for the 3-Sequence authority gap |
| Same-Path Seq 9 | **7.8 percentage-point spread** |
| Same-Path Seq 5 | **6.0 percentage-point spread** |
| Fool thread Seq 5 | **29.8% completion** |
| Fool thread Seq 4 | **44.0% completion** |
| Advancement probability | **5%–95%** at every advancement tier |
| Path meters | All 10 meters gain and persist |
| Reputation gates | Seq 7 at ~30, Seq 6 at ~50, Seq 5 at ~80 |
| Mundane farm | **£45 average reward** at reputation 0; **20.7%** complications in the 1,000-case test |
| Rarity at reputation 30 | Seq 7: **2,857**, Seq 6: **1,427**, Seq 5: **716** in 5,000 samples |

## Fixes by audit item

### 1. Save corruption
- `commit()` now saves the new draft state instead of calling `saveGame()` with no argument.
- Added `SAVE_VERSION = 6`.
- `loadGame()` reads the current save plus previous v2–v5 keys and migrates them into the current schema.
- Migration fills missing meters, statuses, abilities, weapons, and recruitment/quest fields without discarding a valid roster.

### 2. One stat scale
- Agents and enemies now use the same pipeline: human stats → Pathway profile → Sequence growth.
- Enemy Sequence is no longer ignored.
- Human/Sequence-10 enemies remain weak.
- A hostile-quality scalar is applied after the common formula: **2.6× for Sequence 7–9 threats and 2.1× for Sequence 4–6 threats**. This is a threat-quality scalar, not a separate stat-generation formula.

### 3. Cumulative abilities
- Removed wording/regex-based `abilityType()` detection.
- Every tier now has explicit `type`, `effectId`, `modifier`, and text data.
- Passive effects are accumulated; active abilities are accumulated and considered in combat in addition to the basic attack.
- The progression test confirms no Pathway becomes weaker at a stronger Sequence.

### 4. Path meters
Single source of truth: `PATH_METERS`.

- Door — Records
- Twilight Giant — Resolve
- Visionary — Insight
- Red Priest — War Momentum
- Demoness — Corruption
- Hermit — Knowledge
- Wheel of Fortune — Fortune
- Tyrant — Wrath
- Sun — Radiance
- Fool — Thread Control

Every meter has a defined gain rule, spend rule and full-meter effect. Meter values are written back through quest consequences.

### 5. Fool Spirit Body Threads
- Sequence 5+ Fool/Seer can seize Spirit Body Threads.
- Slots are **1 / 1 / 2 / 2 / 3 / 4** at Sequences 5→0.
- Slots are counted per owner, not party-wide.
- A dead target, broken thread, dead owner, owner CC, or range break frees the slot.
- Statuses now have duration and source metadata.
- Range was increased to **16m / 24m / 35m / 50m / 80m / 120m** for Sequences 5→0.
- Thread resistance uses Sequence and INT.
- Equal-power single-target completion tests: **29.8% at Seq 5** and **44.0% at Seq 4**.
- Marionette stats are **55%** of the source enemy.
- Marionettes cannot advance and require their owner to be in the deployed party; deployment is capped by the owner's thread slots.

### 6. Madness and injuries
- Madness and injuries are 0–100.
- Injury reduces effective combat stats by up to **30%**.
- Madness at 50+ can cost an action; 100 causes permanent corruption/death.
- Successful quests reduce Madness slightly; healing costs funds/materials and reduces Madness as well as clearing injuries.

### 7. Approach choices
- Scout: reveals count/type, grants initiative and prevents an opening ambush.
- Investigate: costs **2 days** instead of 1, reveals stats/Path/weakness when a specialist is present, and grants **20%** damage against the identified weakness.
- Force: no advance information, enemy damage gets **+10%**, but rewards get **+15%**.

### 8. Other mechanics
- Weapon uses now consume inventory counts after the contract.
- Battle ticker has **Fast-forward** and **Skip**.
- Reputation 30/50/80 guarantees access to Sequence 7/6/5 contract difficulty respectively; no later overwrite removes the stronger contract.

### 9. Mundane free farm
- Low-reputation contracts pay less and reputation gain approaches zero around reputation 10.
- Mundane work has an **8% base complication chance**.
- The 1,000-case test produced a £45 average reward and 20.7% observed complications with the fixed deterministic scenario.
- Once the guild has an awakened character, the board is forced to contain at least one encounter-capable contract.

### 10. Path balance
- Body Paths remain physically biased; Spirit Paths remain INT/utility biased.
- Combat output receives a small balancing tuning layer so Path identity remains visible without producing a dominant Pathway.
- Same-Path spread is **7.8pp at Seq 9** and **6.0pp at Seq 5**.
- Recommended Path still gives a **7%** awakening main-stat bonus.

### 11. Marionette power
- Marionettes are fixed at **55%** of source stats.
- Owner presence is mandatory for deployment.
- Thread-slot limits cap deployment.
- Marionettes cannot advance and have permanent death.

### 12. Progression economy
- Material cost per advancement is now **1 / 1 / 2 / 2** for the first four post-Seq-9 advancements, plus **1 awakening material**, putting the total to Sequence 5 at **7 materials** of that Pathway type.
- Contract material drops are biased toward Pathways represented by the current roster.
- Materials can be purchased for **£180 each**.
- Digest gains are roughly **12 / 16 / 20%** by threat band and receive a **1.45×** individual-contract multiplier.

### 13. Counter ring
The counter web is now a complete ring:

**Fool → Visionary → Tyrant → Hermit → Door → Demoness → Sun → Red Priest → Twilight Giant → Wheel of Fortune → Fool**

The links are based on the supplied Pathway descriptions: control/illusion is challenged by unpredictable miracle/door effects; Tyrant information/weather pressure is answered by Hermit's information control; Hermit knowledge is vulnerable to Door movement/escape; Door/space tricks are pressured by Demoness mirrors/chaos; Demoness corruption is checked by Sun purification; Sun's holy battlefield control is challenged by Red Priest's war pressure; Red Priest's battlefield dominance is checked by Twilight Giant's durability/decay; Twilight Giant's physical/decay profile is disrupted by Wheel of Fortune probability; and Wheel's probability manipulation is pressured by Fool's reality/miracle effects.

### 14. Rarity
- Recruits are always Sequence 10 / unawakened.
- Contract Sequence weights halve as the Sequence becomes stronger: at the reputation-30 cap, the observed 5,000-sample distribution was **Seq 7: 2,857; Seq 6: 1,427; Seq 5: 716**.

## Main retuning numbers

- Enemy quality: **2.6× (Seq 7–9), 2.1× (Seq 4–6)**
- Enemy damage scalar: **0.23×** before Force's +10% prepared modifier
- Solo enemy damage scalar: **0.12×** to keep equal-power single-target thread encounters viable
- Low-HP retreat threshold: **40% HP**, **95% chance** to withdraw rather than risk a fatal hit
- Recommended Path awakening bonus: **7%** to the Path's main stat
- Marionette stat retention: **55%**
- Thread slots: **1/1/2/2/3/4**
- Thread ranges: **16/24/35/50/80/120m**
- Thread target completion: approximately **29.8% / 44.0%** in the equal-power tests
- Advancement success chance: **94/90/86/81/75/68/58/48/36%**, clamped to 5–95% if future modifiers are added
- Injury maximum stat penalty: **30%**
- Healing cost: starts around **£70**, scales with injury; also reduces Madness by **15**
- Material purchase: **£180**
- Individual digestion multiplier: **1.45×**

# v8 — Enemy parity, equipment and combat readability

## User-requested fixes

1. **Enemy stat parity** — enemies now use the same human → Path profile → Sequence growth formula as agents. The previous enemy quality multiplier was removed. Headless test: same-stat construction passes for all 10 Pathways; largest deterministic difference in the parity test was 10% (Twilight Giant jitter), with no hard-coded Sequence-9 enemy base.

2. **Equipment system** — added knife, pistol, revolver, sword and club effects. Knife: +2 ATK and 18% Bleed. Pistol: +3 ATK and 16% miss chance. Equipment is exclusive: assigning removes the item from guild inventory; it stays equipped after a quest; selecting Bare Hands/unassigning returns it to inventory.

3. **Weapon mastery** — each weapon category gains mastery when used. Mastery increases weapon damage and reduces the weapon's miss chance. The dossier shows mastery.

4. **INT dodge** — dodge is now derived primarily from INT, with passive/status/equipment modifiers layered on top. Base critical chance is 15%.

5. **Combat rates** — dossier now shows Crit, Crit Damage, Dodge, Counter and Weapon Mastery. Counter chance also scales from DEF.

6. **Main-page cleanup** — removed the Roster and Materials resource banners. Reputation remains visible and is explained under Guild Ledger. The old “Starting position” and redundant Authority block were removed from the Ledger.

7. **Wanted board** — added a separate Wanted tab beside Contracts. High-Sequence contracts/warrants show a warning symbol and can be declined/removed.

8. **Enemy abilities** — enemies now receive the complete cumulative ability set for their Pathway and Sequence, not just a normal attack. Enemy-side buffs target enemy allies and enemy-side attacks target the player's side.

9. **Buff readability** — party buffs state their numerical effect in the ticker, e.g. Bard Song: +8% ATK and +5% INT; Solar Halo: +8% ATK, +5% INT and +10% DEF.

10. **Sequence ability details** — every ability remains listed under Sequence Abilities with explicit ACTIVE/PASSIVE type, effect description and modifier text.

11. **Spectator** — its revealed trait now has a mechanical benefit: the exposed weakness grants +10% damage against that target.

12. **Apprentice** — Escape one ordinary trap/lock remains a quest utility rather than a combat action, so it is no longer treated as a missing combat attack.

13. **Marionettist** — thread ownership remains per Fool, range is less punishing at first grasp, and thread progress is processed after the combat exchange. Current headless completion: Sequence 5 **39.9%**, Sequence 4 **46.0%**. Slots remain 1/1/2/2/3/4 for Sequences 5→0.

14. **Balance retuning** — Path combat tuning was narrowed while preserving stat identity. Same-Path win-rate spread is now **4.8 percentage points at Sequence 9** and **11.0 points at Sequence 5**. Fresh mixed Sequence-9 party: **68.4% win rate**, **0.11 deaths/quest**.

## Verification

The plain-Node regression suite now reports **60 passed, 0 failed**. It covers save/reload, enemy/agent stat parity, Sequence progression, Path balance, Fool threads, meters, advancement probability, reputation gates, mundane-contract complications, rarity, equipment exclusivity/persistence, enemy cumulative abilities, combat equipment data and Wanted-board creation.

## Main retunable numbers

- Knife: **+2 ATK**, **18% Bleed**.
- Pistol: **+3 ATK**, **16% miss**.
- Revolver: **+5 ATK**, **12% miss**.
- Sword: **+4 ATK**, **8% Bleed**, **3% miss**.
- Club: **+2 ATK**, **4% miss**.
- Base Crit: **15%**.
- Counter baseline: **3% + DEF/300**, capped at 35% before other modifiers.
- INT dodge: **5% + INT/250**, further modified by the INT gap and passives/statuses, capped at 55%.
- Fool Sequence 5 thread attempt: **42%**, Sequence 4: **55%**.
- Fool thread range: Sequence 5 **20m**, Sequence 4 **28m**.
- Same-Path combat tuning is intentionally used only as a small balancing layer; HP/ATK/DEF/INT remain the primary Path identity.

## v10 — Combat Rules Update (2026-09-28)

Applied the latest combat specification to the browser-only build.

1. **Turn order / Action Value** — Added `Speed = base pathway speed + 0.2×INT + 0.1×ATK` and `AV = 10,000 / Speed`. Combat now sorts by Speed/initiative instead of INT alone. Speed and AV are shown in combat reports and character combat-rate panels.
2. **INT-based dodge** — Dodge now scales directly from INT and remains compatible with equipment/passive bonuses.
3. **Crowd control** — Stun, Freeze, Sleep, Silence, Bound and Unconscious now block actions while their duration lasts. Statuses retain duration/source metadata. Sleep is removed when the target is struck.
4. **Damage-over-time** — Burn now ticks at 5% Max HP per round; Bleed ticks from the attacker's ATK and lasts a finite number of rounds. Bleed source information is retained for the duration.
5. **Enemy combat parity** — Enemies continue to use the same Pathway/Sequence stat construction and cumulative ability set as agents; combat reports reveal the full stat block once that enemy enters combat.
6. **Trait-driven decisions** — Withdrawal and initial engagement continue to use the highest characteristic as the deciding trait. A high Cruelty trait therefore overrides a lower Coward trait instead of producing conflicting behaviour. Enemy avoidance uses the same dominant-trait principle.
7. **Initiation logic** — Outside Scout, the first action is determined by the Speed/initiative calculation, with pathway passive initiative modifiers and a small deterministic combat roll; Scout explicitly gives the party the first exchange.
8. **Ability/buff display** — Party buffs now state the exact affected stats in the combat ticker (for example `ATK +8%, INT +5%`). Character panels also show Speed/AV alongside Crit, Crit Damage, Dodge and Counter.
9. **Weapon interactions retained** — Gun mastery remains 50% base accuracy and +5 percentage points per level to 100% at level 10; melee Weapon Mastery increases weapon damage/bleed; equipped weapons remain exclusive and are returned only by explicit unassignment.
10. **Regression coverage** — Added headless checks for Speed, AV, INT-derived Dodge, finite CC source/duration, and finite/source-aware DoT behaviour.

### Verification
- Headless suite: **65 passed, 0 failed**.
- Fresh mixed Sequence-9 party: **76.3% win rate**, **0.13 deaths/quest** in the existing balance suite.
- Fool thread completion: **35.0% at Sequence 5**, **42.9% at Sequence 4**.
- Same-Path Sequence-9 spread: **10.6 percentage points** in the existing suite.
- Same-Path Sequence-5 spread: **28.9 percentage points**; this remains a balance item for future tuning rather than being hidden by the new combat-rule changes.

### Retunable numbers changed in v10
- Pathway base Speed values: **46–58** depending on Pathway.
- Speed formula coefficients: **INT × 0.2**, **ATK × 0.1**.
- Dodge INT contribution remains **INT / 250**, with an increased overall dodge ceiling of **75%**.
- Burn: **5% Max HP/round**.
- Bleed: **12% of source ATK/round**, finite duration.
- Hard-CC duration remains ability-defined, normally **1–2 rounds**.


## Latest trait replacement

- Replaced the old behavioral score system (`Coward`, `Cruelty`, `Curiosity`, etc.) with eight combat traits: **Ironclad, Glass Cannon, Stout Vitality, Fervent Spirit, Stoic Mind, Swiftfoot, Bloodthirst, Madness Prone**.
- Every generated character receives fixed independent variance rolls for **HP, ATK, DEF, INT and Speed**, each from **0.90× to 1.10×**. The rolls are stored and reused instead of being rerolled on awakening.
- Sequence-9 awakening applies the Pathway profile, then individual variance, then the selected trait multiplier. Recommended Pathways retain their small awakening bonus.
- `Speed` now uses the existing Pathway base plus **0.2 × INT + 0.1 × ATK**, multiplied by the stored Speed variance and Speed trait modifier. `AV = 10,000 / Speed`.
- `Fervent Spirit` gives **+15% INT, +10% Max SP, -10% DEF**.
- `Stoic Mind` gives **+10% DEF and +25% resistance** to mental pollution/madness effects.
- `Bloodthirst` converts **8% of damage dealt into HP**.
- `Madness Prone` gives **+15% INT damage** but has a **10% per-turn Confusion chance**.
- `Ironclad`, `Glass Cannon`, `Stout Vitality`, and `Swiftfoot` affect the corresponding defensive, offensive, vitality and initiative stats.
- Old saves are migrated to the new trait model instead of being discarded.
- The dossier and recruitment panel now display the combat trait and each stored variance roll.
- Spectator reveal now reveals the enemy's actual combat trait rather than the obsolete behavioral score.

### Retunable numbers

| Number | Current value | Purpose |
|---|---:|---|
| Stat variance | ±10% | Individual character variation |
| Recommended Path bonus | +7% | Small awakening affinity bonus |
| Ironclad | +12% DEF / -5% Speed | Tank / slower initiative |
| Glass Cannon | +15% ATK / -10% HP | High damage / fragile |
| Stout Vitality | +15% HP / -5% ATK | Durability |
| Fervent Spirit | +15% INT / +10% SP / -10% DEF | Spirit caster |
| Stoic Mind | +10% DEF / +25% mental resistance | Anti-madness defense |
| Swiftfoot | +12% Speed / -5% DEF | Initiative/evasion |
| Bloodthirst | 8% lifesteal | Sustain |
| Madness Prone | +15% INT damage / 10% Confusion | High-risk caster |
| Base Sequence-9 Path speed | 46–58 | Initiative baseline by Pathway |
| Speed formula | Base + 0.2 INT + 0.1 ATK | Turn priority |
| Crit baseline | 15% | Starting critical chance |

Current headless verification: **68 passed, 0 failed**.


## v16 — JSON-first runtime and 22-Pathway refactor

- Moved Pathway definitions, abilities, formulas, stat tables, combat balance, weapons, character data and contract content into `/data/*.json`.
- Added asynchronous `fetch()` bootstrap with a progress/loading screen for GitHub Pages.
- Consolidated all 22 Pathways and expanded `PATH_COUNTERS` to all 22.
- Added the Pathways preview screen with a Pathway selector and Sequence 9→0 ability/multiplier view.
- Fixed cooldown semantics: a 1-turn cooldown now prevents use on the immediately following turn.
- Digestion scales upward for lower Sequences.
- Weapon mastery is awarded after a completed contract instead of per attack.
- Unified roster/dossier combat stat calculations so equipped weapon ATK is reflected consistently.
- Normal contracts stop appearing at reputation 10; supernatural contract tiers are reputation-gated and weighted toward the current highest available tier.
- Fixed Spirit Body Thread execution after the JSON ability refactor and kept combat log event order chronological.
- Regression suite: `152 passed, 0 failed`.

## v16.1 — Contract tier odds
- Sequence 9 contracts remain available at every guild reputation.
- Contract generation now uses reputation-based weighted sequence odds instead of hard-disabling lower-sequence contracts.
- Higher reputation shifts the board toward higher-difficulty contracts while preserving a meaningful low-sequence chance for advancing lower-sequence agents.
- The weighting model is inspired by TFT's tier-odds philosophy: higher tiers become more likely as progression increases; lower tiers become less likely rather than disappearing entirely.


## v17.0 — JSON Combat Refactor
- Replaced generic ability `scale/stat/damageType` balance fields with explicit `damage` objects and structured `effects` in `data/pathways.json`.
- Added elemental damage/resistance rules to `data/balance.json`.
- Added a centralized combat pipeline to `data/formulas.json`: scaling → modifiers → authority → resistance → DEF mitigation → final damage.
- True damage bypasses resistance and DEF.
- Pathways now supply elemental resistances in combat.
- Fixed enemy cooldown persistence so a 1-turn cooldown cannot be cast every round.
- Cooldowns are stored on the combatant and decremented once per round.

## v17.0.1 — Finalization
- `data/pathways.json` now contains 220 normalized ability records across all 22 Pathways and Sequence 9→0.
- Ability damage is represented as `damage.scaling`, `damage.multiplier`, `damage.type`, `damage.element/elements`, and `damage.formula`.
- Structured `effects` and `rules` are retained separately from damage.
- Elemental resistance is loaded from JSON and applied to elemental combat damage; multi-element abilities use the average resistance of their elements.
- True damage bypasses both resistance and DEF mitigation.
- Enemy cooldowns now persist between rounds; a 1-turn cooldown is unavailable for the immediately following round.
- Character combat units receive their Pathway resistance profile from JSON.
- Pathway preview and character dossier now display the new damage schema.
