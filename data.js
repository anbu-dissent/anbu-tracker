/* =====================================================================
   data.js — Anbu's meal plan, extracted verbatim from
   Anbu_Protein_Meal_Plan.md. This is the DEFAULT seed only.
   The app lets you customise everything; edits are saved to your data,
   never back to this file. "Reset to plan" restores from here.
   ===================================================================== */

window.PLAN_DATA = {
  // Daily targets (Section: header of the plan)
  targets: {
    proteinMin: 150,
    proteinMax: 165,
    protein: 157,        // working target (mid-range)
    kcalMin: 2300,
    kcalMax: 2500,
    kcal: 2400,          // working target
    waterL: 4.5,         // 4–5 L
    gymPerWeek: 4,       // Mon, Tue, Thu, Fri
  },

  // Day types drive gym scheduling + shake timing
  daySchedule: {
    Mon: { type: 'Gym',     shake: 'post-gym' },
    Tue: { type: 'Gym',     shake: 'post-gym' },
    Wed: { type: 'Rest',    shake: 'evening'  },
    Thu: { type: 'Gym',     shake: 'post-gym' },
    Fri: { type: 'Gym',     shake: 'post-gym' },
    Sat: { type: 'Cricket', shake: 'post-match (Mass)' },
    Sun: { type: 'Rest',    shake: 'evening'  },
  },

  // The meal slots that build a day (Section 1)
  slots: [
    { key: 'pre',       label: 'Pre-workout',  time: '6:00'  },
    { key: 'shake',     label: 'Shake',        time: '7:45'  },
    { key: 'breakfast', label: 'Breakfast',    time: '8:30'  },
    { key: 'midmorning',label: 'Mid-morning',  time: '11:00' },
    { key: 'lunch',     label: 'Lunch',        time: '13:30' },
    { key: 'evening',   label: 'Evening',      time: '17:30' },
    { key: 'dinner',    label: 'Dinner',       time: '20:30' },
    { key: 'bed',       label: 'Before bed',   time: '22:30' },
  ],

  /* Food macro library (Section 3).
     p=protein g, c=carb g, f=fat g, kcal. carb/fat null where the plan
     only listed protein + kcal (sides/snacks/before-bed). */
  library: [
    // --- Breakfast: North Indian / quick ---
    { id: 'bf-eggbhurji',  cat: 'breakfast', name: 'Egg bhurji (3 whole + 2 white) + 2 multigrain toast', p:30, c:26, f:17, kcal:400, prep:'10 min' },
    { id: 'bf-gybowl',     cat: 'breakfast', name: 'Greek yogurt + whey bowl (200g GY + 1 scoop + banana + chia)', p:42, c:38, f:10, kcal:420, prep:'3 min, no-cook' },
    { id: 'bf-oatseggs',   cat: 'breakfast', name: 'Oats in milk (50g) + 2 boiled eggs', p:26, c:42, f:13, kcal:410, prep:'8 min' },
    { id: 'bf-omelette',   cat: 'breakfast', name: 'Masala omelette (4 eggs) + 2 toast', p:30, c:24, f:20, kcal:430, prep:'8 min' },
    { id: 'bf-paneerprta', cat: 'breakfast', name: 'Paneer paratha ×2 (100g paneer) + curd', p:30, c:46, f:22, kcal:520, prep:'cook makes' },
    // --- Breakfast: South Indian / fermented ---
    { id: 'bf-pesarattu',  cat: 'breakfast', name: 'Pesarattu ×2 (whole green moong) + 2 eggs', p:30, c:34, f:12, kcal:360, prep:'soak overnight, grind' },
    { id: 'bf-adai',       cat: 'breakfast', name: 'Adai ×2 (mixed dal) + curd', p:22, c:40, f:9, kcal:330, prep:'batter keeps 3–4 days' },
    { id: 'bf-moongchilla',cat: 'breakfast', name: 'Moong dal chilla ×2 (+veg)', p:16, c:30, f:6, kcal:250, prep:'batter night before' },
    { id: 'bf-idli',       cat: 'breakfast', name: 'Idli ×3 + sambar + 2 boiled eggs + podi', p:22, c:50, f:11, kcal:390, prep:'steams 12 min' },
    { id: 'bf-eggdosa',    cat: 'breakfast', name: 'Egg dosa ×2', p:18, c:42, f:11, kcal:350, prep:'batter ready' },
    { id: 'bf-ragidosa',   cat: 'breakfast', name: 'Ragi dosa ×3 + sambar', p:18, c:46, f:7, kcal:330, prep:'gut + mineral dense' },
    { id: 'bf-oatsegg',    cat: 'breakfast', name: 'Oats-egg chilla (40g oats + 3 eggs + veg)', p:24, c:26, f:14, kcal:370, prep:'10 min, besan-free' },

    // --- Shakes ---
    { id: 'shake-lean',    cat: 'shake', name: 'Lean shake (whey + water + banana)', p:26, c:28, f:2, kcal:210, prep:'grab, no prep' },
    { id: 'shake-mass',    cat: 'shake', name: 'Mass shake (whey + 250ml milk + banana + 1 tbsp PB)', p:37, c:40, f:12, kcal:430, prep:'cricket / low-appetite days' },

    // --- Lunch / dinner anchors: North / general ---
    { id: 'an-soya',       cat: 'anchor', name: 'Soya chunk curry (50g dry soya)', p:26, c:18, f:8, kcal:250 },
    { id: 'an-paneer',     cat: 'anchor', name: 'Paneer bhurji / curry (150g paneer)', p:28, c:8, f:24, kcal:340 },
    { id: 'an-chole',      cat: 'anchor', name: 'Chole / chana masala (1.5 cup)', p:18, c:38, f:6, kcal:280 },
    { id: 'an-rajma',      cat: 'anchor', name: 'Rajma (1.5 cup)', p:17, c:35, f:4, kcal:250 },
    { id: 'an-eggcurry',   cat: 'anchor', name: 'Egg curry (3 eggs)', p:19, c:8, f:16, kcal:250 },
    { id: 'an-tofu',       cat: 'anchor', name: 'Tofu bhurji (200g tofu)', p:24, c:6, f:14, kcal:230 },
    { id: 'an-dal',        cat: 'anchor', name: 'Thick dal — moong + toor (1.5 cup)', p:14, c:32, f:6, kcal:230 },
    { id: 'an-sprouts',    cat: 'anchor', name: 'Add-on: 1 cup moong sprouts', p:8, c:12, f:1, kcal:90 },
    // --- Lunch / dinner anchors: South Indian ---
    { id: 'an-soyakuzh',   cat: 'anchor', name: 'Soya chunk kuzhambu (50g dry soya, South style)', p:26, c:18, f:10, kcal:270 },
    { id: 'an-usili',      cat: 'anchor', name: 'Paruppu usili (toor + chana dal + beans, 1 cup)', p:16, c:22, f:8, kcal:240 },
    { id: 'an-eggkuzh',    cat: 'anchor', name: 'Egg kuzhambu (3 eggs, coconut gravy)', p:19, c:10, f:18, kcal:280 },
    { id: 'an-sambar',     cat: 'anchor', name: 'Sambar — dal-heavy (toor 60g dry + veg)', p:14, c:30, f:6, kcal:230 },
    { id: 'an-kootu',      cat: 'anchor', name: 'Kootu (moong/chana dal + ash gourd + coconut)', p:12, c:24, f:8, kcal:220 },
    { id: 'an-morkuzh',    cat: 'anchor', name: 'Mor kuzhambu (spiced buttermilk + veg)', p:8, c:14, f:9, kcal:170 },
    { id: 'an-keerai',     cat: 'anchor', name: 'Keerai masiyal / kootu (greens + dal)', p:9, c:14, f:5, kcal:140 },
    { id: 'an-avial',      cat: 'anchor', name: 'Avial (mixed veg + curd + coconut)', p:6, c:16, f:12, kcal:200 },
    { id: 'an-thayir',     cat: 'anchor', name: 'Thayir sadam / curd rice', p:9, c:38, f:6, kcal:250 },

    // --- Carbs ---
    { id: 'carb-roti',     cat: 'carb', name: '2 phulka / roti', p:6, c:30, f:2, kcal:160 },
    { id: 'carb-rice',     cat: 'carb', name: '1 cup rice', p:4, c:45, f:0.5, kcal:200 },
    { id: 'carb-quinoa',   cat: 'carb', name: '1 cup quinoa', p:8, c:39, f:4, kcal:220 },

    // --- Sides ---
    { id: 'side-curd',     cat: 'side', name: 'Curd 150g', p:5, c:null, f:null, kcal:95 },
    { id: 'side-hungcurd', cat: 'side', name: 'Hung curd 100g', p:9, c:null, f:null, kcal:110 },
    { id: 'side-salad',    cat: 'side', name: 'Salad + roasted flax/seeds', p:3, c:null, f:null, kcal:90 },

    // --- Snacks ---
    { id: 'sn-shake',      cat: 'snack', name: 'Lean whey shake', p:26, c:null, f:null, kcal:120 },
    { id: 'sn-paneertikka',cat: 'snack', name: 'Paneer tikka 100g', p:18, c:null, f:null, kcal:230 },
    { id: 'sn-eggs',       cat: 'snack', name: '2 boiled eggs', p:12, c:null, f:null, kcal:140 },
    { id: 'sn-sproutchaat',cat: 'snack', name: 'Sprout chaat 1 cup', p:8, c:null, f:null, kcal:110 },
    { id: 'sn-makhana',    cat: 'snack', name: 'Roasted makhana 30g + 15 almonds', p:8, c:null, f:null, kcal:210 },
    { id: 'sn-chana',      cat: 'snack', name: 'Roasted chana 40g', p:7, c:null, f:null, kcal:140 },
    { id: 'sn-sundal',     cat: 'snack', name: 'Kondakadalai sundal (chana, 1 cup)', p:12, c:null, f:null, kcal:200 },
    { id: 'sn-pmsundal',   cat: 'snack', name: 'Peanut / pattani / moong sundal (1 cup)', p:12, c:null, f:null, kcal:250 },
    { id: 'sn-neermor',    cat: 'snack', name: 'Neer mor (spiced buttermilk)', p:3, c:null, f:null, kcal:50 },
    { id: 'sn-ragimalt',   cat: 'snack', name: 'Ragi malt (ragi + milk)', p:10, c:null, f:null, kcal:220 },
    { id: 'sn-chaas',      cat: 'snack', name: 'Buttermilk (chaas) 1 glass', p:3, c:null, f:null, kcal:60 },

    // --- Before bed ---
    { id: 'bed-paneer',    cat: 'bed', name: 'Paneer 80g', p:15, c:null, f:null, kcal:200 },
    { id: 'bed-hungcurd',  cat: 'bed', name: 'Hung curd 100g', p:9, c:null, f:null, kcal:110 },
    { id: 'bed-milk',      cat: 'bed', name: 'Toned milk 250ml + turmeric', p:8, c:null, f:null, kcal:120 },
  ],

  catLabels: {
    breakfast: 'Breakfast', shake: 'Shakes', anchor: 'Lunch / Dinner anchors',
    carb: 'Carbs', side: 'Sides', snack: 'Snacks', bed: 'Before bed',
  },

  // Weekly grid (Section 5) — descriptive guidance per slot per day
  weeklyPlan: {
    Mon: { breakfast: 'Pesarattu ×2 + 2 eggs', lunch: 'Soya kuzhambu + rasam rice', evening: 'Sundal', dinner: 'Paneer bhurji + sautéed greens' },
    Tue: { breakfast: 'Idli ×3 + sambar + 2 eggs', lunch: 'Rajma + sprouts', evening: 'Neer mor + 2 eggs', dinner: 'Tofu / soya stir-fry' },
    Wed: { breakfast: 'Moong dal chilla ×2 + curd', lunch: 'Chole + keerai kootu', evening: 'Paneer tikka', dinner: 'Egg kuzhambu + curd rice' },
    Thu: { breakfast: 'Egg bhurji + toast', lunch: 'Egg curry + sprouts', evening: 'Sundal', dinner: 'Paruppu usili + 2 roti' },
    Fri: { breakfast: 'Adai ×2 + curd', lunch: 'Paneer curry', evening: 'Makhana + almonds', dinner: 'Soya kuzhambu + avial' },
    Sat: { breakfast: 'Paneer paratha + curd', lunch: 'Dal-heavy sambar + extra rice + curd', evening: 'Chaas + sundal', dinner: 'Egg kuzhambu + veg' },
    Sun: { breakfast: 'Masala omelette + toast', lunch: 'Sambar + paneer / boiled egg', evening: 'Ragi malt', dinner: 'Thayir sadam (curd rice) + thick moong dal' },
  },

  days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],

  // Sunday batch-prep checklist (Section 6) — for the cook
  cookChecklist: [
    'Boil 12–14 eggs, keep in fridge (breakfasts + snacks)',
    'Ferment big batch idli/dosa batter (Sat night) + grind pesarattu (whole moong) + adai (mixed dal) batters',
    'Soak + sprout legumes (moong, chana) instead of boiling raw',
    'Soak + portion soya, rajma, chana for their days; add hing + ginger to every legume dish',
    'Hung curd + fresh curd from 1L milk; keep a jar of buttermilk ready',
    'Sundal base: boil + portion chana/peanuts for evening snacks',
    'Soak 1 tsp methi seeds each night for morning',
    'Snacks pre-portioned: roasted chana, makhana + almonds in single-serve dabbas',
    'Whey scoop pre-measured in shaker, left by the fridge each night',
    'Veg chopped for the week incl. greens (keerai) + raw banana',
    'Each evening: cook tomorrow’s lunch anchor + carb so it only needs reheating',
  ],

  // Default weekly shopping list, derived from the plan's ingredients (editable)
  shoppingDefaults: [
    { item: 'Eggs (2 trays / ~30)', cat: 'Protein' },
    { item: 'Paneer 500g', cat: 'Protein' },
    { item: 'Tofu 400g', cat: 'Protein' },
    { item: 'Whey protein (tub)', cat: 'Protein' },
    { item: 'Soya chunks 250g', cat: 'Legumes' },
    { item: 'Whole green moong 500g', cat: 'Legumes' },
    { item: 'Yellow moong dal 500g', cat: 'Legumes' },
    { item: 'Toor dal 500g', cat: 'Legumes' },
    { item: 'Chana dal 250g', cat: 'Legumes' },
    { item: 'Urad dal 250g', cat: 'Legumes' },
    { item: 'Rajma 250g', cat: 'Legumes' },
    { item: 'Kabuli chana (chole) 250g', cat: 'Legumes' },
    { item: 'Brown/black chana 250g (sundal)', cat: 'Legumes' },
    { item: 'Peanuts 250g', cat: 'Legumes' },
    { item: 'Milk (toned) 3–4 L', cat: 'Dairy' },
    { item: 'Curd / yogurt 1–2 L', cat: 'Dairy' },
    { item: 'Greek yogurt 500g', cat: 'Dairy' },
    { item: 'Ragi flour 500g', cat: 'Grains' },
    { item: 'Rice 1kg', cat: 'Grains' },
    { item: 'Quinoa 250g', cat: 'Grains' },
    { item: 'Oats 500g', cat: 'Grains' },
    { item: 'Multigrain bread 1 loaf', cat: 'Grains' },
    { item: 'Atta (roti) 1kg', cat: 'Grains' },
    { item: 'Idli/dosa rice + batter staples', cat: 'Grains' },
    { item: 'Bananas 1 dozen', cat: 'Produce' },
    { item: 'Keerai / greens 2 bunches', cat: 'Produce' },
    { item: 'Mixed veg (avial/kootu) ', cat: 'Produce' },
    { item: 'Onion, tomato, ginger, garlic', cat: 'Produce' },
    { item: 'Raw banana (vazhakkai)', cat: 'Produce' },
    { item: 'Coconut (avial/kuzhambu)', cat: 'Produce' },
    { item: 'Makhana 200g', cat: 'Snacks' },
    { item: 'Almonds 250g', cat: 'Snacks' },
    { item: 'Roasted chana 250g', cat: 'Snacks' },
    { item: 'Chia / halim seeds', cat: 'Snacks' },
    { item: 'Flax seeds', cat: 'Snacks' },
    { item: 'Peanut butter', cat: 'Snacks' },
    { item: 'Hing, methi seeds, sambar/rasam podi', cat: 'Pantry' },
    { item: 'Tamarind, pepper, jeera, saunf', cat: 'Pantry' },
  ],

  // ---- Fat-loss goal defaults (6ft / 100kg starting point) ----
  goalDefaults: {
    heightCm: 183,        // 6 ft
    age: 32,
    sex: 'male',
    startWeight: 100,
    targetWeight: 85,     // BMI ~25.4 → lean-ish; user can change
    activity: 1.5,        // office + gym 4x + cricket  (moderate-high)
    rateKgPerWeek: 0.6,   // ~0.6 kg/week fat loss
    proteinPerKg: 1.9,    // g per kg bodyweight for muscle retention in deficit
  },

  // ---- Daily habits (feed the streak + reward engine) ----
  habits: [
    { id: 'shake',  label: 'Protein shake taken',        icon: '🥤', xp: 5 },
    { id: 'water',  label: 'Hit water target',           icon: '💧', xp: 5 },
    { id: 'veg',    label: '5+ veg/plants today',         icon: '🥗', xp: 5 },
    { id: 'sleep',  label: '7+ hrs sleep',               icon: '😴', xp: 5 },
    { id: 'nojunk', label: 'No unplanned junk',          icon: '🚫', xp: 10 },
    { id: 'steps',  label: '8k+ steps / active',         icon: '🚶', xp: 5 },
  ],

  // ---- Reward / cheat-meal engine ----
  // Points are earned per day; "on-target" days build toward treat unlocks.
  scoring: {
    proteinHit: 30,     // protein >= 95% target
    underCalorie: 25,   // calories <= target (deficit respected)
    loggedDay: 10,      // >=3 items logged
    workout: 20,        // worked out on a planned day
    waterHit: 10,       // water target met
    weightLogged: 10,   // logged body weight
    // "on-target day" = logged AND proteinHit AND underCalorie
  },

  levels: [
    { lvl: 1, xp: 0,    title: 'Getting Started' },
    { lvl: 2, xp: 150,  title: 'Warming Up' },
    { lvl: 3, xp: 400,  title: 'Consistent' },
    { lvl: 4, xp: 800,  title: 'Locked In' },
    { lvl: 5, xp: 1400, title: 'Disciplined' },
    { lvl: 6, xp: 2200, title: 'Machine' },
    { lvl: 7, xp: 3200, title: 'Relentless' },
    { lvl: 8, xp: 4500, title: 'Beast Mode' },
    { lvl: 9, xp: 6000, title: 'Elite' },
    { lvl: 10,xp: 8000, title: 'Legend' },
  ],

  // Treats you EARN by stacking on-target days since your last redeem.
  treats: [
    { id: 't1', need: 3,  icon: '🍫', name: 'Small treat',      desc: 'Dark chocolate, a laddu, or a sweet you love.' },
    { id: 't2', need: 6,  icon: '🍕', name: 'Cheat meal',       desc: 'One full no-guilt meal — pizza, biryani, dosa feast.' },
    { id: 't3', need: 10, icon: '🍔', name: 'Big cheat meal',   desc: 'Go out, order what you crave. You earned it.' },
    { id: 't4', need: 14, icon: '🎉', name: 'Cheat day',        desc: 'A full relaxed day. 2 weeks of discipline = 1 day off.' },
  ],

  // Achievement badges (evaluated against your history).
  badges: [
    { id: 'first_log',   icon: '📝', name: 'First Log',        desc: 'Logged your first meal' },
    { id: 'streak3',     icon: '🔥', name: '3-Day Streak',     desc: '3 on-target days in a row' },
    { id: 'streak7',     icon: '⚡', name: 'Week Warrior',     desc: '7-day streak' },
    { id: 'streak14',    icon: '🌟', name: 'Fortnight',        desc: '14-day streak' },
    { id: 'streak30',    icon: '👑', name: 'Unstoppable',      desc: '30-day streak' },
    { id: 'protein10',   icon: '💪', name: 'Protein Beast',    desc: 'Hit protein goal 10 times' },
    { id: 'gym10',       icon: '🏋️', name: 'Gym Rat',          desc: '10 workouts logged' },
    { id: 'gym25',       icon: '🥇', name: 'Iron Habit',       desc: '25 workouts logged' },
    { id: 'lost1',       icon: '📉', name: 'First Kilo',       desc: 'Down 1 kg from start' },
    { id: 'lost3',       icon: '🎯', name: 'On Track',         desc: 'Down 3 kg from start' },
    { id: 'lost5',       icon: '🏆', name: 'Transformer',      desc: 'Down 5 kg from start' },
    { id: 'goalweight',  icon: '🎖️', name: 'Goal Crusher',     desc: 'Reached your target weight' },
    { id: 'plants30',    icon: '🌿', name: 'Plant Diversity',  desc: '30+ different plants in a week' },
    { id: 'perfectweek', icon: '💎', name: 'Perfect Week',     desc: '7/7 on-target days in a week' },
  ],
};
