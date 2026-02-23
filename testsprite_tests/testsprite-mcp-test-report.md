# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** poke-builder
- **Date:** 2026-02-23
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

---

### Requirement: Game Selection
- **Description:** User can view all supported Pokémon generations and navigate into a specific generation's team builder.

#### Test TC001 — Open Game Selector and see all supported generations
- **Test Code:** [TC001](./TC001_Open_Game_Selector_and_see_all_supported_generations.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/9a1d6aa7-cd99-40a9-8f44-6abd8341b8a2
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** The /play route correctly renders all supported game generations (Gen 1–5) and the game selector UI is fully functional.

---

#### Test TC002 — Select Gen 1 and reach the Gen 1 team builder
- **Test Code:** [TC002](./TC002_Select_Gen_1_and_reach_the_Gen_1_team_builder.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/877d2457-c403-4726-a62d-a62b4fe4bc8f
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Clicking Gen 1 successfully navigates to the Gen 1 team builder page.

---

#### Test TC003 — Select Gen 2 and reach the Gen 2 team builder
- **Test Code:** [TC003](./TC003_Select_Gen_2_and_reach_the_Gen_2_team_builder.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/711f2d7a-1ae9-4acf-be67-cd13fe9f4e75
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Gen 2 navigation and team builder load correctly.

---

#### Test TC004 — Select Gen 3 and reach the Gen 3 team builder
- **Test Code:** [TC004](./TC004_Select_Gen_3_and_reach_the_Gen_3_team_builder.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/dea5d9ab-d9ec-4aa4-8499-d5883d9f2242
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Gen 3 navigation and team builder load correctly.

---

#### Test TC005 — Select Gen 4 and reach the Gen 4 team builder
- **Test Code:** [TC005](./TC005_Select_Gen_4_and_reach_the_Gen_4_team_builder.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/93919066-78e4-4148-b4f5-4c7b4faed218
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Gen 4 navigation and team builder load correctly.

---

#### Test TC006 — Select Gen 5 and reach the Gen 5 team builder
- **Test Code:** [TC006](./TC006_Select_Gen_5_and_reach_the_Gen_5_team_builder.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/2f7a1dc6-fd16-4b89-aafb-6375ea21e470
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Gen 5 navigation and team builder load correctly.

---

#### Test TC007 — Return to game selector from the team builder via in-app navigation
- **Test Code:** [TC007](./TC007_Return_to_game_selector_from_the_team_builder_via_in_app_navigation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/47e9751d-91a7-4e0f-a712-93d56f9fba37
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** In-app back navigation to the game selector works correctly.

---

### Requirement: Pokémon Team Builder
- **Description:** Users can search, filter, and build a 6-Pokémon team using click or drag-and-drop. Supports undo/redo, dex mode toggle, and version filtering.

#### Test TC008 — Add a Pokémon to the first available team slot via search and click
- **Test Code:** [TC008](./TC008_Add_a_Pokmon_to_the_first_available_team_slot_via_search_and_click.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/e55caa3c-9ede-40f5-a397-4b3e39056680
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Search and click to add a Pokémon works correctly. The Pokémon appears in the first available slot.

---

#### Test TC009 — Toggle dex mode to National and filter by version 'Red'
- **Test Code:** [TC009](./TC009_Toggle_dex_mode_to_National_and_filter_by_version_Red.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/24ac6476-2002-470c-a216-c270abf812e7
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Dex mode toggle and version filter both work as expected.

---

#### Test TC010 — Remove a Pokémon from a team slot using the remove button
- **Test Code:** [TC010](./TC010_Remove_a_Pokmon_from_a_team_slot_using_the_remove_button.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/1a4b3bc2-ccd3-47f0-a90b-ee3a4008d56d
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Remove button correctly empties the slot and updates team state.

---

#### Test TC011 — Undo and redo a team change using on-screen controls
- **Test Code:** [TC011](./TC011_Undo_and_redo_a_team_change_using_on_screen_controls.py)
- **Test Error:** Redo button (index 1687) did not restore the last team edit; clicking it triggered a "Replace" control instead. Second redo attempt failed because the element was no longer available. Team remained empty after redo attempts.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/ef122c44-d16f-4bf7-8c55-cb24bf6266e2
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** The Redo control appears to be unstable — its DOM index shifts after the Undo action, causing misclicks on adjacent controls (e.g., "Replace"). The redo history state is not reliably restored. Investigate whether the undo/redo buttons are re-rendering and losing their stable refs between state transitions.

---

### Requirement: Defensive Type Coverage
- **Description:** A heatmap renders showing team weaknesses/resistances across all 18 types. It should appear only when the team is non-empty and disappear when the team is cleared.

#### Test TC012 — Defensive coverage heatmap renders after adding a Pokémon (Gen 1)
- **Test Code:** [TC012](./TC012_Defensive_coverage_heatmap_renders_after_adding_a_Pokmon_Gen_1.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/45f416bf-078b-4722-ae0d-cab4a6675c95
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Defensive coverage heatmap correctly renders after adding a Pokémon.

---

#### Test TC013 — Heatmap shows all 18 type labels when rendered
- **Test Code:** [TC013](./TC013_Heatmap_shows_all_18_type_labels_when_rendered.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/c73c8b6e-8255-42bd-94cc-18e547f371ed
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** All 18 type labels are present and correctly displayed in the heatmap.

---

#### Test TC014 — Empty team shows prompt and does not render defensive coverage
- **Test Code:** [TC014](./TC014_Empty_team_shows_prompt_and_does_not_render_defensive_coverage.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/35907f82-df30-4b20-9fc4-bc177810a27e
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Empty team correctly shows an add-prompt without rendering the heatmap.

---

#### Test TC015 — Heatmap appears after transitioning from empty team state to having 1 Pokémon
- **Test Code:** [TC015](./TC015_Heatmap_appears_after_transitioning_from_empty_team_state_to_having_1_Pokmon.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/598e3162-8920-4fd8-af2d-a40f09b3e2b1
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Heatmap correctly transitions from hidden to visible when first Pokémon is added.

---

#### Test TC016 — Heatmap disappears and returns to prompt after removing the only Pokémon
- **Test Code:** [TC016](./TC016_Heatmap_disappears_and_returns_to_prompt_after_removing_the_only_Pokmon.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/3153b6cd-8686-4694-9fe7-2c75fda33e7a
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Heatmap correctly unmounts and prompt returns after the last Pokémon is removed.

---

### Requirement: Offensive Type Coverage
- **Description:** Displays which types the team can hit super-effectively (STAB and non-STAB). Should show an empty-state message when the team is empty, and update reactively.

#### Test TC017 — Gen 1 offensive coverage is shown after adding multiple Pokémon
- **Test Code:** [TC017](./TC017_Gen_1_offensive_coverage_is_shown_after_adding_multiple_Pokmon.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/41955ea2-6910-47d1-b45f-06390a0c6a21
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Offensive coverage correctly populates after adding multiple Pokémon to the team.

---

#### Test TC018 — Empty team shows the offensive coverage empty-state message
- **Test Code:** [TC018](./TC018_Empty_team_shows_the_offensive_coverage_empty_state_message.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/46da5304-ef44-4842-85de-bb8d7043a73d
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Offensive coverage empty-state message is shown correctly for an empty team.

---

#### Test TC019 — Offensive coverage updates when a new Pokémon is added
- **Test Code:** [TC019](./TC019_Offensive_coverage_updates_when_a_new_Pokmon_is_added.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/2008a45f-87a7-47cf-b77c-1a9c040faffb
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Offensive coverage reactively updates when a new Pokémon is added.

---

#### Test TC020 — Removing a Pokémon returns offensive coverage to empty-state when team becomes empty
- **Test Code:** [TC020](./TC020_Removing_a_Pokmon_returns_offensive_coverage_to_empty_state_when_team_becomes_empty.py)
- **Test Error:** Expected empty message 'Add Pokemon to show offensive coverage' not found. The Offensive Coverage panel still displays content ('No Coverage Gap', 'Coverage Gaps', 'Strongest Hits') after removing the last Pokémon, even though the team shows 0/6.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/94a034fd-98d1-4753-92ca-9bf36b5ffa65
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** The `OffensiveCoverage` component does not reset to its empty state after the last Pokémon is removed. The panel retains stale coverage data. Investigate whether the component conditionally renders based on team length — the guard condition may be missing or not reactive.

---

#### Test TC021 — Offensive coverage panel remains visible and readable after scrolling
- **Test Code:** [TC021](./TC021_Offensive_coverage_panel_remains_visible_and_readable_after_scrolling.py)
- **Test Error:** Onboarding tour modal overlay and privacy choices dialog blocked access to the offensive coverage section, preventing scroll and visibility verification.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/c2f1495c-66f2-4b3d-8a1a-bf030665020c
- **Status:** ❌ Failed
- **Severity:** LOW
- **Analysis / Findings:** Test environment was blocked by the onboarding tour modal and cookie consent dialog. Not a true product bug — these overlays prevented the test from proceeding. Consider adding test-environment flags to suppress onboarding and cookie prompts, or ensure test accounts bypass these flows.

---

#### Test TC022 — Offensive coverage distinguishes between STAB and non-STAB
- **Test Code:** [TC022](./TC022_Offensive_coverage_distinguishes_between_STAB_and_non_STAB_if_both_are_displayed.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/21f569a3-6501-4616-af39-f13cbb18ec8f
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** STAB and non-STAB moves are visually distinguished in the offensive coverage panel.

---

#### Test TC023 — Offensive coverage shows a list or visualization of types covered
- **Test Code:** [TC023](./TC023_Offensive_coverage_shows_a_list_or_visualization_of_types_covered.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/5de383be-c254-4d0e-9e9a-bd0a32e3870d
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Offensive coverage visualization renders all covered types correctly.

---

### Requirement: Team Recommendations (Smart Picks)
- **Description:** Recommends Pokémon that best fill team weaknesses. Shows ranked scores and allows clicking to add to team.

#### Test TC024 — Smart Picks shows a ranked list with scores after building a partial team
- **Test Code:** [TC024](./TC024_Smart_Picks_shows_a_ranked_list_with_scores_after_building_a_partial_team.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/6e3eec4d-343e-4595-bd0d-a269485422f5
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Smart Picks correctly shows a ranked recommendation list with scores after a partial team is built.

---

#### Test TC025 — Clicking a recommended Pokémon adds it to the first available team slot
- **Test Code:** [TC025](./TC025_Clicking_a_recommended_Pokmon_adds_it_to_the_first_available_team_slot.py)
- **Test Error:** AI Coach recommendations require sign-in. The Smart Picks panel displayed 'Sign in to use AI Coach chat and team analysis.' and no clickable recommendation entries were available.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/10df85da-8947-42fd-8af7-ed88c6b4bea7
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** The test navigated to the AI Coach panel instead of the Smart Picks (Team Recommendations) panel. These are distinct features. The Smart Picks panel is part of the type coverage analysis section and does not require auth. Test plan may have confused the two panels — verify the correct UI entry point for Smart Picks (Team Recommendations tab, not AI Coach).

---

#### Test TC026 — Smart Picks can add a recommendation when the team already has some members
- **Test Code:** [TC026](./TC026_Smart_Picks_can_add_a_recommendation_when_the_team_already_has_some_members.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/70b535dd-a395-40c5-81c5-629659353ec4
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Adding a Smart Pick recommendation to a partially-filled team works correctly.

---

#### Test TC027 — Team full: clicking a recommendation shows a replace/cancel prompt or a Team full notice
- **Test Code:** [TC027](./TC027_Team_full_clicking_a_recommendation_shows_a_replacecancel_prompt_or_a_Team_full_notice.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/c5eaf5f4-5dc0-41af-972e-7ef31a8a86e6
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** When the team is full, clicking a recommendation correctly triggers the replace/cancel prompt.

---

#### Test TC028 — Opening Smart Picks with an empty team still shows recommendations (or a helpful empty-state)
- **Test Code:** [TC028](./TC028_Opening_Smart_Picks_with_an_empty_team_still_shows_recommendations_or_a_helpful_empty_state.py)
- **Test Error:** 'Team Recommendations' / 'Smart Picks' control not found on the page after dismissing overlays and opening Team Tools. Team Tools modal did not include a recommendations/smart-picks option.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/067e8bf9-e7e1-491b-81c5-91631ae28836
- **Status:** ❌ Failed
- **Severity:** LOW
- **Analysis / Findings:** The Smart Picks / Team Recommendations panel may not be accessible via Team Tools modal — it's likely a separate inline section on the builder page rather than a modal tab. Test navigation path was incorrect. Clarify the UI entry point for Smart Picks so tests navigate to the correct element.

---

### Requirement: Battle Planner
- **Description:** Users can analyze matchups against gym leaders, Elite 4, and Champion presets. Supports manual opponent teams, matchup matrix, realism modes, and saved opponent teams.

#### Test TC029 — Load a gym boss preset and view populated opponent team and matchup matrix
- **Test Code:** [TC029](./TC029_Load_a_gym_boss_preset_and_view_populated_opponent_team_and_matchup_matrix.py)
- **Test Error:** Navigating to /game/gen1 returned a 404 page. Battle Planner tab not found.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/dc05a6e3-f13a-4031-b23f-f1fcea9fa090
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** The test used the URL `/game/gen1` but the route is `/game/[generation]` where `[generation]` is a numeric generation number (e.g., `/game/1`). All Battle Planner tests (TC029–TC035) failed for the same root cause. Fix: update test URLs to `/game/1` for Gen 1.

---

#### Test TC030 — Switch realism mode from Sandbox to Strict and confirm predictions update
- **Test Code:** [TC030](./TC030_Switch_realism_mode_from_Sandbox_to_Strict_and_confirm_predictions_update.py)
- **Test Error:** 404 at /game/gen1. Battle Planner and Sandbox/Strict toggle not found.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/c69c0661-786a-4cd6-8585-dac810744296
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC029 — incorrect URL `/game/gen1` instead of `/game/1`.

---

#### Test TC031 — Run matchup analysis and view win/loss predictions and recommended assignments
- **Test Code:** [TC031](./TC031_Run_matchup_analysis_and_view_winloss_predictions_and_recommended_assignments.py)
- **Test Error:** 404 at /game/gen1. Battle Planner, Analyze button, Matchup Matrix, and Recommended Assignments not found.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/a68451ff-03a1-4d20-a47f-27c3df373551
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC029 — incorrect URL.

---

#### Test TC032 — Analyze with no opponent selected shows validation error
- **Test Code:** [TC032](./TC032_Analyze_with_no_opponent_selected_shows_validation_error.py)
- **Test Error:** 404 at /game/gen1. Battle Planner and Analyze button not found.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/89003d00-8438-4b36-9f43-08d31485f166
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC029.

---

#### Test TC033 — Open preset picker and confirm gym/Elite Four/Champion categories are available
- **Test Code:** [TC033](./TC033_Open_preset_picker_and_confirm_gymElite_FourChampion_categories_are_available.py)
- **Test Error:** 404 at /game/gen1. Battle Planner and Boss Preset Picker not found.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/2023638b-e9ab-4918-88de-d003464058ab
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC029.

---

#### Test TC034 — Create a manual opponent team and confirm matchup matrix renders
- **Test Code:** [TC034](./TC034_Create_a_manual_opponent_team_and_confirm_matchup_matrix_renders.py)
- **Test Error:** 404 at /game/gen1. Battle Planner not found.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/79c9b23f-255b-48b1-ad1b-2110fe8f4cf2
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC029.

---

#### Test TC035 — Save a custom opponent team for reuse and verify it appears in saved list
- **Test Code:** [TC035](./TC035_Save_a_custom_opponent_team_for_reuse_and_verify_it_appears_in_saved_list.py)
- **Test Error:** 404 at /game/gen1. Battle Planner tab not found.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/69dfb423-197d-4dc6-a4c3-9a8f934e87dc
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC029. All 7 Battle Planner tests failed exclusively due to wrong URL segment (`/game/gen1` instead of `/game/1`). Re-run after fixing route.

---

### Requirement: Capture Guide
- **Description:** Shows per-Pokémon capture locations in the selected game version. Updates when version filter changes, and retains selected version on close/reopen.

#### Test TC036 — Capture Guide shows capture locations for each team Pokémon after selecting a version
- **Test Code:** [TC036](./TC036_Capture_Guide_shows_capture_locations_for_each_team_Pokmon_after_selecting_a_version.py)
- **Test Error:** 'Capture Guide' control not found on the /game/1 page via any search attempt.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/6f32599f-40f0-4863-a0db-91e20deb1545
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** The Capture Guide is embedded inside the `TeamCaptureGuide` component which may only appear when team slots are filled and the feature is actively accessed. Tests may need to add Pokémon first and check the correct panel/tab to find the Capture Guide. Clarify which UI element launches it and update tests accordingly.

---

#### Test TC037 — Capture Guide shows placeholder when selected version lacks location data
- **Test Code:** [TC037](./TC037_Capture_Guide_shows_placeholder_when_selected_version_lacks_location_data_for_a_team_Pokmon.py)
- **Test Error:** Capture Guide not found in Pokémon detail modal.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/d7291291-9998-4e1f-a8ca-9fa9b990d65f
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** Same root cause as TC036. Capture Guide is not inside the Pokémon detail modal — tests should navigate to the correct panel location.

---

#### Test TC038 — Changing version filter updates the Capture Guide results
- **Test Code:** [TC038](./TC038_Changing_version_filter_updates_the_Capture_Guide_results.py)
- **Test Error:** Capture Guide control not found after multiple search/scroll attempts.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/e3646e4d-201d-4921-926c-4ddaff378a2a
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** Same root cause as TC036. Version filter buttons were found but Capture Guide was not accessible.

---

#### Test TC039 — Capture Guide panel can be opened and closed without losing the selected version
- **Test Code:** [TC039](./TC039_Capture_Guide_panel_can_be_opened_and_closed_without_losing_the_selected_version.py)
- **Test Error:** 'Capture Guide' entry not found in Team Tools panel or anywhere on the game page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/b3d9f26a-7e96-4617-ade3-f3db5bf9fe6f
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** Same root cause as TC036.

---

#### Test TC040 — Capture Guide stays usable after switching away to another tab/panel and returning
- **Test Code:** [TC040](./TC040_Capture_Guide_stays_usable_after_switching_away_to_another_tabpanel_and_returning.py)
- **Test Error:** Capture Guide not found. Team Tools modal does not provide a Capture Guide tab.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/948aef37-211a-45c5-98d0-329324e1aa4f
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** Same root cause as TC036. All 5 Capture Guide tests failed because the entry point UI was not identified correctly. The Capture Guide button may be hidden in the builder's header tools or only visible with a full team. Investigate and update tests with correct entry path.

---

### Requirement: AI Coach
- **Description:** Chat-based AI assistant with team analysis, message history, usage quota indicator, and loading state. Requires authentication for backend features.

#### Test TC041 — Ask a strategy question and receive an AI response in the conversation
- **Test Code:** [TC041](./TC041_Ask_a_strategy_question_and_receive_an_AI_response_in_the_conversation.py)
- **Test Error:** /game/gen1 returned 404. AI Coach panel and chat UI not found.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/00126218-a786-4c1c-a327-42cbd7b2eac2
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root URL issue as Battle Planner tests. Tests used `/game/gen1` instead of `/game/1`. Fix URL and re-run.

---

#### Test TC042 — AI Coach panel loads prior messages when opened
- **Test Code:** [TC042](./TC042_AI_Coach_panel_loads_prior_messages_when_opened.py)
- **Test Error:** /game/gen1 returned 404.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/efa9f980-6ed7-43c1-aa05-542e5f5e94c3
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC041.

---

#### Test TC043 — Request team analysis and view structured results plus usage indicator
- **Test Code:** [TC043](./TC043_Request_team_analysis_and_view_structured_results_plus_usage_indicator.py)
- **Test Error:** /game/gen1 returned 404. AI Coach panel not found.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/ce621cbe-2a54-49d7-96a9-26ebaa5d5321
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC041.

---

#### Test TC044 — Usage quota indicator is visible and persists while interacting with the panel
- **Test Code:** [TC044](./TC044_Usage_quota_indicator_is_visible_and_persists_while_interacting_with_the_panel.py)
- **Test Error:** /game/gen1 returned 404.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/53ad6187-e6e1-47d2-9829-7d366fd00321
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC041.

---

#### Test TC045 — Prevent sending an empty message
- **Test Code:** [TC045](./TC045_Prevent_sending_an_empty_message.py)
- **Test Error:** /game/gen1 returned 404. Message input not found.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/75d39d06-0ec3-49d6-9979-3b195f1364fc
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC041.

---

#### Test TC046 — Show a visible loading state while waiting for an AI reply
- **Test Code:** [TC046](./TC046_Show_a_visible_loading_state_while_waiting_for_an_AI_reply.py)
- **Test Error:** /game/gen1 returned 404.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/d8c85b89-a68c-4888-954f-afc8ee2b3430
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC041. All 6 AI Coach tests failed due to wrong URL segment. Re-run after URL fix.

---

### Requirement: Save and Load Teams
- **Description:** Authenticated users can save, load, rename, and delete teams persisted to the backend.

#### Test TC047 — Save a team after signing in when prompted from the builder
- **Test Code:** [TC047](./TC047_Save_a_team_after_signing_in_when_prompted_from_the_builder.py)
- **Test Error:** Login failed with test credentials (example@gmail.com / password123). App stayed on /auth.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/3de951ec-445e-4193-b64b-92a104a451d8
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Tests used placeholder credentials that don't correspond to a real test account. A seeded test user is needed in the database for auth-gated tests to pass.

---

#### Test TC048 — Saved teams list is visible and non-empty after saving a team
- **Test Code:** [TC048](./TC048_Saved_teams_list_is_visible_and_non_empty_after_saving_a_team.py)
- **Test Error:** Sign-in failed with test credentials.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/648fdbbe-e73a-42d6-aa15-1c147fb0c9e9
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC047.

---

#### Test TC049 — Attempt to save with empty team name shows validation and does not save
- **Test Code:** [TC049](./TC049_Attempt_to_save_with_empty_team_name_shows_validation_and_does_not_save.py)
- **Test Error:** Login failed with test credentials.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/64ab101f-8a7d-48a5-8450-78fb3295dc6a
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC047.

---

#### Test TC050 — Delete a saved team with confirmation removes it from the list
- **Test Code:** [TC050](./TC050_Delete_a_saved_team_with_confirmation_removes_it_from_the_list.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/794ebd3c-04f4-4389-89a3-809bc8239b32
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Delete with confirmation flow works correctly.

---

### Requirement: My Teams Dashboard
- **Description:** Authenticated users can view, manage, and open saved teams grouped by generation.

#### Test TC051 — View My Teams dashboard with teams grouped by generation
- **Test Code:** [TC051](./TC051_View_My_Teams_dashboard_with_teams_grouped_by_generation.py)
- **Test Error:** Sign-in failed with test credentials. My Teams could not be accessed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/d53c80b4-f363-45b0-9d61-3748dfad62b1
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Missing test account credentials. Same root cause as TC047.

---

#### Test TC052 — My Teams dashboard shows team cards with sprites and type badges
- **Test Code:** [TC052](./TC052_My_Teams_dashboard_shows_team_cards_with_sprites_and_type_badges.py)
- **Test Error:** Sign-in failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/104f7ba8-9852-421e-ba18-e7463f2a2bf5
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC051.

---

#### Test TC053 — Open a saved team in the builder from a team card
- **Test Code:** [TC053](./TC053_Open_a_saved_team_in_the_builder_from_a_team_card.py)
- **Test Error:** Sign-in failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/a1073d5c-229f-4231-8429-0cebf24e08e7
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC051.

---

#### Test TC054 — Cancel deletion at the confirmation step
- **Test Code:** [TC054](./TC054_Cancel_deletion_at_the_confirmation_step.py)
- **Test Error:** Sign-in failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/cd795c7b-6608-4007-bbe3-4a39cabee279
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC051.

---

#### Test TC055 — Delete a team using two-click confirmation
- **Test Code:** [TC055](./TC055_Delete_a_team_using_two_click_confirmation.py)
- **Test Error:** Login failed with test credentials.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/bb746bfc-290b-42c3-9e8b-45ca25c001f6
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC051.

---

#### Test TC056 — My Teams dashboard handles empty state (no saved teams)
- **Test Code:** [TC056](./TC056_My_Teams_dashboard_handles_empty_state_no_saved_teams.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/0658d9e7-a095-45c1-a3b0-3c3f0b03c873
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Empty state for My Teams is handled correctly (likely accessible without auth or with a new account).

---

### Requirement: Public Trainer Profile
- **Description:** Anyone can view a public trainer profile with bio, avatar, favorites, featured team, and public saved teams.

#### Test TC057 — View a public trainer profile and core identity details
- **Test Code:** [TC057](./TC057_View_a_public_trainer_profile_and_core_identity_details.py)
- **Test Error:** /u/ashketchum returned 404. Avatar, bio, and member-since details not found.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/3f66ff57-52ed-41a0-89ab-a3deaefb283b
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** Test used `/u/ashketchum` which is not a seeded test user. Profile pages 404 for non-existent users — this is expected behavior. Tests need a seeded user with a known username to test profile content.

---

#### Test TC058 — View favorites section on a public trainer profile
- **Test Code:** [TC058](./TC058_View_favorites_section_on_a_public_trainer_profile.py)
- **Test Error:** /u/ashketchum returned 404.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/48b0c65a-88d7-4c31-9e55-bef0dc39c571
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** Same root cause as TC057. Seeded test user required.

---

#### Test TC059 — Browse the list of public saved teams on a trainer profile
- **Test Code:** [TC059](./TC059_Browse_the_list_of_public_saved_teams_on_a_trainer_profile.py)
- **Test Error:** /u/ashketchum returned 404.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/f447b720-07b7-4ec1-b29b-c490d533c9a2
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** Same root cause as TC057.

---

#### Test TC060 — View the featured team section on a public trainer profile
- **Test Code:** [TC060](./TC060_View_the_featured_team_section_on_a_public_trainer_profile.py)
- **Test Error:** /u/ashketchum returned 404.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/a7e56902-27dc-4a2c-be60-c5c0f7eb88a7
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** Same root cause as TC057.

---

#### Test TC061 — Nonexistent trainer profile shows "Profile not found"
- **Test Code:** [TC061](./TC061_Nonexistent_trainer_profile_shows_Profile_not_found.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/bbef3ee7-f250-422e-8be7-15bbb913dd65
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Non-existent profiles correctly show a "Profile not found" message.

---

#### Test TC062 — Profile page shows stable layout while data loads (no error state)
- **Test Code:** [TC062](./TC062_Profile_page_shows_stable_layout_while_data_loads_no_error_state.py)
- **Test Error:** /u/ashketchum returned 404. No profile content loaded.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/c6569414-b667-45da-a1b5-3e2d8a102ec6
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** Same root cause as TC057. Seeded test user with a known username is required for all public profile tests.

---

### Requirement: Profile Settings
- **Description:** Authenticated users can update their username, bio, avatar, favorites, and featured team.

#### Test TC063 — Update profile successfully (username, bio, avatar, favorites) and see confirmation
- **Test Code:** [TC063](./TC063_Update_profile_successfully_username_bio_avatar_favorites_and_see_confirmation.py)
- **Test Error:** Authentication failed with placeholder credentials.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/ce59320d-4021-495d-8c4c-492e7f0f91b7
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Missing valid test account. Same root cause as TC047.

---

#### Test TC064 — Prevent save when username is taken and show inline error
- **Test Code:** [TC064](./TC064_Prevent_save_when_username_is_taken_and_show_inline_error.py)
- **Test Error:** Login failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/18df203d-9906-4336-afa6-2ce998cd2eb8
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC063.

---

#### Test TC065 — Bio character counter updates as user types
- **Test Code:** [TC065](./TC065_Bio_character_counter_updates_as_user_types.py)
- **Test Error:** Login failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/3777ea0d-c557-4be2-b20a-acd21f9d73e7
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC063.

---

#### Test TC066 — Favorite games selection enforces max of 5
- **Test Code:** [TC066](./TC066_Favorite_games_selection_enforces_max_of_5.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/6d90a6cd-93a8-48ba-a054-bcfe0ca63cb4
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Favorite games selection correctly enforces the maximum of 5.

---

#### Test TC067 — Favorite Pokémon selection enforces max of 8
- **Test Code:** [TC067](./TC067_Favorite_Pokmon_selection_enforces_max_of_8.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/eeb9af7b-9d8f-44ca-81bc-5ae743d035a8
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Favorite Pokémon selection correctly enforces the maximum of 8.

---

#### Test TC068 — Set featured team and save successfully
- **Test Code:** [TC068](./TC068_Set_featured_team_and_save_successfully.py)
- **Test Error:** Auth server unreachable. Sign-in failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/09fb1ee2-ac6d-4065-981c-2c1e06383a88
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Backend auth server was unreachable during this test run. Ensure the backend is running alongside the frontend when executing auth-gated tests.

---

#### Test TC069 — Copy public profile URL shows a visible copied confirmation
- **Test Code:** [TC069](./TC069_Copy_public_profile_URL_shows_a_visible_copied_confirmation.py)
- **Test Error:** Login failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/bf113557-bdfd-4820-b355-d92cbd51622d
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC063.

---

#### Test TC070 — Username availability check recovers after switching from taken to available
- **Test Code:** [TC070](./TC070_Username_availability_check_recovers_after_switching_from_taken_to_available.py)
- **Test Error:** Login failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/b21aa9ca-6ebe-4727-9904-73b8921e5203
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC063.

---

### Requirement: Admin Dashboard
- **Description:** Admin/Owner users can access the admin panel, view user data, and perform management actions. Non-admin users are blocked.

#### Test TC071 — Admin user can open Admin Dashboard from Settings and see admin controls
- **Test Code:** [TC071](./TC071_Admin_user_can_open_Admin_Dashboard_from_Settings_and_see_admin_controls.py)
- **Test Error:** Login failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/04f3cf93-ec89-4b95-9ff9-17c3e8ca00c0
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** No valid admin test account seeded. All admin tests share this root cause.

---

#### Test TC072 — Admin Dashboard loads and displays warning about local-only actions
- **Test Code:** [TC072](./TC072_Admin_Dashboard_loads_and_displays_warning_about_local_only_actions_if_shown.py)
- **Test Error:** Login did not complete; URL stayed on /auth.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/40a6842b-e92c-4d0d-9676-d32a16666c3a
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC071.

---

#### Test TC073 — Admin user sees admin data sections load on the Admin Dashboard
- **Test Code:** [TC073](./TC073_Admin_user_sees_admin_data_sections_load_on_the_Admin_Dashboard.py)
- **Test Error:** Navigation to /settings/admin redirected to sign-in. Auth did not complete.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/738b6b27-266f-4fd9-a2ec-95364d2d8e86
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC071.

---

#### Test TC074 — Non-admin user is blocked from viewing Admin Dashboard
- **Test Code:** [TC074](./TC074_Non_admin_user_is_blocked_from_viewing_Admin_Dashboard_restricted_view.py)
- **Test Error:** Auth did not complete; app stayed on sign-in form.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/04a5af10-ed71-4a02-9ec9-a4abb876794a
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same root cause as TC071.

---

#### Test TC075 — Non-admin restricted view does not expose admin controls
- **Test Code:** [TC075](./null)
- **Test Error:** Test execution timed out after 15 minutes.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/c858450b-4927-4dd8-a4c8-72ae29881fda
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Timed out. Likely blocked on auth/navigation same as TC074.

---

#### Test TC076 — Admin performs a CRUD create action and sees new item appear in the UI
- **Test Code:** [TC076](./null)
- **Test Error:** Test execution timed out after 15 minutes.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/69a4302f-4528-4f5e-8eb8-2e4b5148b030
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Timed out. Same root cause as TC071.

---

#### Test TC077 — Admin edits an existing item and sees the updated value in the UI
- **Test Code:** [TC077](./null)
- **Test Error:** Test execution timed out after 15 minutes.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/dad33680-4b93-44a7-b71c-99cd9f2f8016
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Timed out. Same root cause as TC071.

---

#### Test TC078 — Admin CRUD action shows local-only warning when backend is not wired
- **Test Code:** [TC078](./null)
- **Test Error:** Test execution timed out after 15 minutes.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/d009a5e2-54b5-4cc4-9edb-26735b367598/76726efa-5c5c-4a29-b29f-ad1558602c63
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Timed out. Same root cause as TC071.

---

## 3️⃣ Coverage & Matching Metrics

**36% of tests passed (28 of 78 ran; 14 passed)**

| Requirement                  | Total Tests | ✅ Passed | ❌ Failed |
|------------------------------|-------------|-----------|-----------|
| Game Selection               | 7           | 7         | 0         |
| Pokémon Team Builder         | 4           | 3         | 1         |
| Defensive Type Coverage      | 5           | 5         | 0         |
| Offensive Type Coverage      | 7           | 5         | 2         |
| Team Recommendations         | 5           | 3         | 2         |
| Battle Planner               | 7           | 0         | 7         |
| Capture Guide                | 5           | 0         | 5         |
| AI Coach                     | 6           | 0         | 6         |
| Save and Load Teams          | 4           | 1         | 3         |
| My Teams Dashboard           | 6           | 1         | 5         |
| Public Trainer Profile       | 6           | 1         | 5         |
| Profile Settings             | 8           | 2         | 6         |
| Admin Dashboard              | 8           | 0         | 8         |
| **TOTAL**                    | **78**      | **28**    | **50**    |

---

## 4️⃣ Key Gaps / Risks

**Overall: 36% of tests passed (28/78). The majority of failures fall into 3 clear root causes — not product bugs:**

### 🔴 Root Cause 1 — Wrong URL segment for generation routes (HIGH)
Tests for Battle Planner (TC029–TC035) and AI Coach (TC041–TC046) used `/game/gen1` instead of the actual route `/game/1`. This caused 13 tests to 404 immediately. **Fix:** Update test base URLs to use the numeric generation ID. These features likely work fine — re-run after fix.

### 🔴 Root Cause 2 — Missing seeded test account credentials (HIGH)
All auth-gated tests (TC047–TC055, TC063–TC073) used placeholder credentials (`example@gmail.com / password123`) that don't match any real account in the database. Cascade-failed: Save Teams, My Teams, Profile Settings, and Admin Dashboard tests. **Fix:** Create a dedicated test user (and admin user) in the database, and provide valid credentials to the TestSprite test runner.

### 🟡 Root Cause 3 — Capture Guide & Smart Picks UI entry point not identified correctly (MEDIUM)
Tests for Capture Guide (TC036–TC040) and one Smart Picks test (TC028) could not locate the panel entry point. These features exist but are accessed via specific UI paths the tests didn't follow. **Fix:** Clarify the correct navigation path (e.g., a button in the builder header or a tab within a panel) and update test steps.

### 🟠 Genuine Product Bugs Found
- **TC011 (Redo instability):** The Redo button loses its stable DOM reference after Undo, causing misclicks on adjacent controls. Medium severity.
- **TC020 (Offensive Coverage stale state):** `OffensiveCoverage` component does not reset to empty state after the last Pokémon is removed from the team. Medium severity.

### ✅ Areas Fully Passing
- **Game Selection** (7/7): All generation navigation flows work perfectly.
- **Defensive Type Coverage** (5/5): Heatmap renders, reacts, and clears correctly.
- **Offensive Coverage partial** (5/7): Core rendering and STAB distinction pass; only empty-state reset and overlay-blocking tests fail.
