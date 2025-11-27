# Walkthrough - Goudaguchi OS

## Complete Feature Set

### Phase 1: Story Diagnosis (3 Episodes)
**Episode 1: 締切の夜** (Work vs Play)
- Tests impulse control, planning, and risk tolerance
- Scenario: Deadline night + drinking invitation

**Episode 2: 給料日の誘惑** (Money Management)
- Tests money sense, impulse shopping, and self-control
- Scenario: Payday temptation + online shopping

**Episode 3: 断りづらい頼み事** (Boundaries)
- Tests boundary-setting, empathy, and self-advocacy
- Scenario: Friend asking for favor when you're exhausted

**Continuous Flow System:**
- All 3 episodes play sequentially without manual selection
- Progress bar shows current episode (e.g., "Episode 2/3")
- Accumulated status across all episodes
- Final comprehensive result screen

### Phase 2: Daily Tools
1. **3-Minute Buffer** - Impulse post prevention
2. **Recovery Protocol** - Mental health checklist

## How It Works
1. User clicks "OS診断を受ける"
2. Episode 1 starts automatically
3. After Episode 1 ends → Episode 2 starts immediately
4. After Episode 2 ends → Episode 3 starts
5. After all 3 episodes → Comprehensive result screen with radar chart

## Technical Implementation
- `scenarios.json`: All 3 episodes with different themes
- `StoryEngine.jsx`: Auto-progression logic with episode tracking
- Progress bar animation with Framer Motion
- Status accumulation across episodes

## Verification
✅ All 3 episodes flow seamlessly
✅ Progress bar updates correctly
✅ Status accumulates across episodes
✅ Final result reflects all choices made

## Next Steps
- Add Episodes 4-5 (SNS behavior, health/sleep patterns)
- Enhance result screen with personalized insights
- Add data persistence to track diagnosis history
