/* =====================================================================
   foods-db.js — Offline food database for macro auto-identification.
   Indian home foods + common protein sources + packaged staples.
   Each entry: n=name, cat=category, serv=portion label, g=grams of that
   portion (for gram scaling), p/c/f=grams, k=kcal for ONE serving.
   Macros are approximate (Indian home portions). Online lookup
   (Open Food Facts) handles branded/packaged items not listed here.
   ===================================================================== */
window.FOODS_DB = [
  // ---------- Eggs ----------
  {n:'Boiled egg (whole)', cat:'Egg', serv:'1 egg', g:50, p:6, c:0.5, f:5, k:78},
  {n:'Egg white', cat:'Egg', serv:'1 white', g:33, p:3.6, c:0.2, f:0.1, k:17},
  {n:'Fried egg', cat:'Egg', serv:'1 egg', g:55, p:6, c:0.4, f:7, k:90},
  {n:'Scrambled eggs', cat:'Egg', serv:'2 eggs', g:120, p:13, c:2, f:12, k:170},
  {n:'Egg bhurji', cat:'Egg', serv:'3 eggs', g:170, p:19, c:4, f:14, k:220},
  {n:'Masala omelette', cat:'Egg', serv:'2 eggs', g:130, p:13, c:3, f:13, k:185},
  {n:'Egg curry (gravy)', cat:'Egg', serv:'2 eggs + gravy', g:220, p:14, c:7, f:13, k:210},

  // ---------- Whey / supplements ----------
  {n:'Whey protein (concentrate)', cat:'Supplement', serv:'1 scoop 30g', g:30, p:24, c:2, f:1.5, k:120},
  {n:'Whey isolate', cat:'Supplement', serv:'1 scoop 30g', g:30, p:27, c:1, f:0.5, k:115},
  {n:'Lean shake (whey+water+banana)', cat:'Supplement', serv:'1 shake', g:350, p:26, c:28, f:2, k:210},
  {n:'Mass shake (whey+milk+banana+PB)', cat:'Supplement', serv:'1 shake', g:450, p:37, c:40, f:12, k:430},
  {n:'Plant protein (pea)', cat:'Supplement', serv:'1 scoop 30g', g:30, p:22, c:3, f:2, k:115},

  // ---------- Paneer / Tofu / Soya ----------
  {n:'Paneer (raw)', cat:'Protein', serv:'100 g', g:100, p:18, c:3, f:21, k:265},
  {n:'Paneer bhurji', cat:'Protein', serv:'150 g', g:200, p:28, c:8, f:24, k:340},
  {n:'Paneer tikka', cat:'Protein', serv:'100 g', g:120, p:18, c:6, f:12, k:230},
  {n:'Tofu (firm)', cat:'Protein', serv:'100 g', g:100, p:12, c:2, f:7, k:120},
  {n:'Tofu bhurji', cat:'Protein', serv:'200 g', g:220, p:24, c:6, f:14, k:230},
  {n:'Soya chunks (dry)', cat:'Protein', serv:'50 g dry', g:50, p:26, c:17, f:0.5, k:175},
  {n:'Soya chunk curry', cat:'Protein', serv:'1 bowl', g:250, p:26, c:18, f:8, k:250},
  {n:'Soya kuzhambu', cat:'Protein', serv:'1 bowl', g:250, p:26, c:18, f:10, k:270},

  // ---------- Dals & Legumes (cooked) ----------
  {n:'Toor dal (cooked)', cat:'Legume', serv:'1 cup', g:200, p:9, c:24, f:3, k:165},
  {n:'Moong dal (cooked)', cat:'Legume', serv:'1 cup', g:200, p:10, c:23, f:1.5, k:155},
  {n:'Thick mixed dal', cat:'Legume', serv:'1.5 cup', g:300, p:14, c:32, f:6, k:230},
  {n:'Chana masala / chole', cat:'Legume', serv:'1.5 cup', g:300, p:18, c:38, f:6, k:280},
  {n:'Rajma', cat:'Legume', serv:'1.5 cup', g:300, p:17, c:35, f:4, k:250},
  {n:'Sambar (dal-heavy)', cat:'Legume', serv:'1 bowl', g:250, p:14, c:30, f:6, k:230},
  {n:'Rasam', cat:'Legume', serv:'1 bowl', g:200, p:4, c:10, f:3, k:80},
  {n:'Paruppu usili', cat:'Legume', serv:'1 cup', g:150, p:16, c:22, f:8, k:240},
  {n:'Kootu (dal+veg)', cat:'Legume', serv:'1 cup', g:200, p:12, c:24, f:8, k:220},
  {n:'Moong sprouts', cat:'Legume', serv:'1 cup', g:100, p:8, c:12, f:1, k:90},
  {n:'Sprout chaat', cat:'Legume', serv:'1 cup', g:120, p:8, c:16, f:2, k:110},
  {n:'Kondakadalai sundal', cat:'Legume', serv:'1 cup', g:150, p:12, c:28, f:5, k:200},
  {n:'Peanut/moong sundal', cat:'Legume', serv:'1 cup', g:150, p:12, c:20, f:9, k:250},
  {n:'Dal makhani', cat:'Legume', serv:'1 cup', g:220, p:11, c:25, f:14, k:280},

  // ---------- South Indian breakfast ----------
  {n:'Idli', cat:'Breakfast', serv:'1 idli', g:40, p:2, c:12, f:0.3, k:58},
  {n:'Plain dosa', cat:'Breakfast', serv:'1 dosa', g:80, p:3, c:24, f:4, k:140},
  {n:'Masala dosa', cat:'Breakfast', serv:'1 dosa', g:150, p:5, c:38, f:9, k:250},
  {n:'Egg dosa', cat:'Breakfast', serv:'1 dosa', g:120, p:9, c:21, f:6, k:175},
  {n:'Ragi dosa', cat:'Breakfast', serv:'1 dosa', g:90, p:3, c:18, f:2, k:110},
  {n:'Pesarattu', cat:'Breakfast', serv:'1 piece', g:100, p:9, c:14, f:4, k:130},
  {n:'Adai', cat:'Breakfast', serv:'1 piece', g:90, p:8, c:18, f:4, k:140},
  {n:'Moong dal chilla', cat:'Breakfast', serv:'1 piece', g:80, p:8, c:15, f:3, k:125},
  {n:'Besan chilla', cat:'Breakfast', serv:'1 piece', g:80, p:7, c:14, f:5, k:130},
  {n:'Oats-egg chilla', cat:'Breakfast', serv:'1 piece', g:120, p:12, c:13, f:7, k:185},
  {n:'Upma', cat:'Breakfast', serv:'1 cup', g:200, p:5, c:34, f:8, k:230},
  {n:'Pongal', cat:'Breakfast', serv:'1 cup', g:200, p:7, c:38, f:9, k:260},
  {n:'Poha', cat:'Breakfast', serv:'1 cup', g:180, p:4, c:38, f:6, k:230},
  {n:'Sambar', cat:'Breakfast', serv:'1 small bowl', g:150, p:6, c:14, f:3, k:110},
  {n:'Coconut chutney', cat:'Breakfast', serv:'2 tbsp', g:40, p:1, c:3, f:6, k:70},

  // ---------- North Indian breakfast / breads ----------
  {n:'Paneer paratha', cat:'Breakfast', serv:'1 paratha', g:120, p:11, c:28, f:12, k:270},
  {n:'Aloo paratha', cat:'Breakfast', serv:'1 paratha', g:120, p:5, c:34, f:10, k:250},
  {n:'Plain paratha', cat:'Breakfast', serv:'1 paratha', g:80, p:4, c:26, f:8, k:200},
  {n:'Phulka / roti', cat:'Grain', serv:'1 roti', g:35, p:3, c:15, f:1, k:80},
  {n:'Tandoori roti', cat:'Grain', serv:'1 roti', g:55, p:5, c:28, f:2, k:150},
  {n:'Naan', cat:'Grain', serv:'1 naan', g:90, p:7, c:45, f:6, k:260},
  {n:'Multigrain toast', cat:'Grain', serv:'1 slice', g:30, p:3, c:12, f:1.5, k:75},
  {n:'White bread', cat:'Grain', serv:'1 slice', g:28, p:2.5, c:14, f:1, k:75},

  // ---------- Grains / carbs ----------
  {n:'Cooked rice (white)', cat:'Grain', serv:'1 cup', g:160, p:4, c:45, f:0.5, k:205},
  {n:'Brown rice (cooked)', cat:'Grain', serv:'1 cup', g:160, p:5, c:45, f:1.5, k:215},
  {n:'Curd rice / thayir sadam', cat:'Grain', serv:'1 cup', g:220, p:9, c:38, f:6, k:250},
  {n:'Lemon rice', cat:'Grain', serv:'1 cup', g:200, p:5, c:42, f:9, k:280},
  {n:'Vegetable biryani', cat:'Grain', serv:'1 plate', g:300, p:9, c:65, f:14, k:430},
  {n:'Quinoa (cooked)', cat:'Grain', serv:'1 cup', g:185, p:8, c:39, f:4, k:220},
  {n:'Oats (dry)', cat:'Grain', serv:'50 g', g:50, p:6, c:33, f:3.5, k:190},
  {n:'Oats in milk', cat:'Grain', serv:'1 bowl', g:300, p:11, c:42, f:7, k:280},
  {n:'Ragi malt / koozh', cat:'Grain', serv:'1 glass', g:300, p:10, c:36, f:4, k:220},

  // ---------- South Indian curries / sides ----------
  {n:'Egg kuzhambu', cat:'Dish', serv:'2 eggs', g:250, p:14, c:10, f:15, k:230},
  {n:'Mor kuzhambu', cat:'Dish', serv:'1 bowl', g:200, p:8, c:14, f:9, k:170},
  {n:'Keerai masiyal', cat:'Veg', serv:'1 cup', g:150, p:9, c:14, f:5, k:140},
  {n:'Avial', cat:'Veg', serv:'1 cup', g:180, p:6, c:16, f:12, k:200},
  {n:'Cabbage poriyal', cat:'Veg', serv:'1 cup', g:120, p:4, c:12, f:6, k:120},
  {n:'Beans poriyal', cat:'Veg', serv:'1 cup', g:120, p:5, c:12, f:6, k:120},
  {n:'Vazhakkai (raw banana) poriyal', cat:'Veg', serv:'1 cup', g:120, p:2, c:24, f:6, k:150},
  {n:'Mixed veg sabzi', cat:'Veg', serv:'1 cup', g:150, p:4, c:14, f:8, k:140},
  {n:'Bhindi masala', cat:'Veg', serv:'1 cup', g:150, p:3, c:12, f:9, k:140},
  {n:'Palak (spinach) gravy', cat:'Veg', serv:'1 cup', g:200, p:6, c:10, f:9, k:150},

  // ---------- Dairy ----------
  {n:'Curd / dahi', cat:'Dairy', serv:'150 g', g:150, p:5, c:7, f:5, k:95},
  {n:'Hung curd', cat:'Dairy', serv:'100 g', g:100, p:9, c:5, f:5, k:110},
  {n:'Greek yogurt', cat:'Dairy', serv:'150 g', g:150, p:15, c:6, f:4, k:120},
  {n:'Greek yogurt + whey bowl', cat:'Dairy', serv:'1 bowl', g:400, p:42, c:38, f:10, k:420},
  {n:'Toned milk', cat:'Dairy', serv:'250 ml', g:250, p:8, c:12, f:5, k:120},
  {n:'Full cream milk', cat:'Dairy', serv:'250 ml', g:250, p:8, c:12, f:8, k:150},
  {n:'Buttermilk / chaas', cat:'Dairy', serv:'1 glass', g:200, p:3, c:5, f:2, k:60},
  {n:'Neer mor', cat:'Dairy', serv:'1 glass', g:200, p:3, c:4, f:1, k:50},
  {n:'Cheese slice', cat:'Dairy', serv:'1 slice', g:20, p:4, c:1, f:5, k:65},

  // ---------- Snacks ----------
  {n:'Roasted chana', cat:'Snack', serv:'40 g', g:40, p:7, c:22, f:2, k:140},
  {n:'Roasted makhana', cat:'Snack', serv:'30 g', g:30, p:3, c:18, f:1, k:100},
  {n:'Almonds', cat:'Nut/Fat', serv:'15 nuts', g:18, p:4, c:4, f:9, k:105},
  {n:'Peanuts', cat:'Nut/Fat', serv:'30 g', g:30, p:8, c:5, f:14, k:170},
  {n:'Walnuts', cat:'Nut/Fat', serv:'4 halves', g:16, p:2.5, c:2, f:10, k:105},
  {n:'Peanut butter', cat:'Nut/Fat', serv:'1 tbsp', g:16, p:4, c:3, f:8, k:95},
  {n:'Chia seeds', cat:'Nut/Fat', serv:'1 tbsp', g:12, p:2, c:5, f:4, k:60},
  {n:'Flax seeds', cat:'Nut/Fat', serv:'1 tbsp', g:10, p:2, c:3, f:4, k:55},
  {n:'Ghee', cat:'Nut/Fat', serv:'1 tsp', g:5, p:0, c:0, f:5, k:45},
  {n:'Cooking oil', cat:'Nut/Fat', serv:'1 tsp', g:5, p:0, c:0, f:5, k:45},
  {n:'Banana chips', cat:'Snack', serv:'30 g', g:30, p:1, c:18, f:10, k:165},
  {n:'Mixture / namkeen', cat:'Snack', serv:'30 g', g:30, p:4, c:16, f:9, k:160},
  {n:'Samosa', cat:'Snack', serv:'1 piece', g:100, p:5, c:28, f:14, k:260},
  {n:'Vada (medu)', cat:'Snack', serv:'1 vada', g:50, p:4, c:14, f:8, k:140},
  {n:'Bonda / bajji', cat:'Snack', serv:'1 piece', g:50, p:3, c:16, f:9, k:160},

  // ---------- Fruit ----------
  {n:'Banana', cat:'Fruit', serv:'1 medium', g:118, p:1.3, c:27, f:0.4, k:105},
  {n:'Apple', cat:'Fruit', serv:'1 medium', g:180, p:0.5, c:25, f:0.3, k:95},
  {n:'Orange', cat:'Fruit', serv:'1 medium', g:130, p:1, c:15, f:0.2, k:62},
  {n:'Papaya', cat:'Fruit', serv:'1 cup', g:145, p:0.7, c:16, f:0.2, k:62},
  {n:'Guava', cat:'Fruit', serv:'1 medium', g:120, p:2.6, c:14, f:1, k:68},
  {n:'Mango', cat:'Fruit', serv:'1 cup', g:165, p:1.4, c:25, f:0.6, k:100},
  {n:'Watermelon', cat:'Fruit', serv:'1 cup', g:150, p:1, c:11, f:0.2, k:46},
  {n:'Dates', cat:'Fruit', serv:'2 dates', g:16, p:0.4, c:12, f:0, k:45},
  {n:'Pomegranate', cat:'Fruit', serv:'1/2 cup', g:87, p:1.5, c:16, f:1, k:72},

  // ---------- Beverages ----------
  {n:'Black coffee', cat:'Beverage', serv:'1 cup', g:240, p:0.3, c:0, f:0, k:5},
  {n:'Coffee with milk+sugar', cat:'Beverage', serv:'1 cup', g:150, p:3, c:12, f:3, k:90},
  {n:'Masala chai', cat:'Beverage', serv:'1 cup', g:150, p:2, c:12, f:3, k:85},
  {n:'Green tea', cat:'Beverage', serv:'1 cup', g:240, p:0, c:0, f:0, k:2},
  {n:'Tender coconut water', cat:'Beverage', serv:'1 glass', g:240, p:1.7, c:9, f:0.2, k:46},
  {n:'Fresh lime soda (sweet)', cat:'Beverage', serv:'1 glass', g:250, p:0, c:20, f:0, k:80},
  {n:'Cola / soft drink', cat:'Beverage', serv:'330 ml', g:330, p:0, c:35, f:0, k:139},
  {n:'Beer', cat:'Beverage', serv:'330 ml', g:330, p:1.6, c:13, f:0, k:153},
  {n:'Whisky (peg)', cat:'Beverage', serv:'30 ml', g:30, p:0, c:0, f:0, k:70},

  // ---------- Treats / cheat foods ----------
  {n:'Gulab jamun', cat:'Sweet', serv:'1 piece', g:45, p:2, c:22, f:6, k:150},
  {n:'Rasgulla', cat:'Sweet', serv:'1 piece', g:50, p:2, c:18, f:2, k:100},
  {n:'Mysore pak', cat:'Sweet', serv:'1 piece', g:40, p:2, c:22, f:12, k:200},
  {n:'Gajar halwa', cat:'Sweet', serv:'1 bowl', g:120, p:4, c:35, f:14, k:290},
  {n:'Ice cream', cat:'Sweet', serv:'1 scoop', g:65, p:2.5, c:16, f:7, k:140},
  {n:'Dark chocolate', cat:'Sweet', serv:'2 squares', g:20, p:1.5, c:9, f:7, k:110},
  {n:'Milk chocolate', cat:'Sweet', serv:'1 small bar', g:40, p:3, c:24, f:11, k:210},
  {n:'Jalebi', cat:'Sweet', serv:'2 pieces', g:50, p:1, c:35, f:8, k:210},
  {n:'Pizza (veg slice)', cat:'Fast food', serv:'1 slice', g:110, p:9, c:30, f:10, k:260},
  {n:'Burger (veg)', cat:'Fast food', serv:'1 burger', g:170, p:10, c:40, f:15, k:330},
  {n:'Paneer roll/wrap', cat:'Fast food', serv:'1 roll', g:200, p:16, c:42, f:18, k:400},
  {n:'French fries', cat:'Fast food', serv:'medium', g:115, p:4, c:48, f:17, k:365},
  {n:'Masala fries / chips', cat:'Fast food', serv:'30 g', g:30, p:2, c:15, f:10, k:160},
  {n:'Pani puri', cat:'Fast food', serv:'6 pieces', g:120, p:4, c:36, f:8, k:230},
  {n:'Pav bhaji', cat:'Fast food', serv:'1 plate', g:350, p:9, c:55, f:22, k:450},

  // ---------- Misc protein ----------
  {n:'Boiled chickpeas', cat:'Legume', serv:'1 cup', g:160, p:15, c:45, f:4, k:270},
  {n:'Hummus', cat:'Legume', serv:'2 tbsp', g:30, p:2, c:4, f:5, k:70},
  {n:'Edamame', cat:'Legume', serv:'1 cup', g:155, p:18, c:14, f:8, k:190},
  {n:'Protein bar', cat:'Supplement', serv:'1 bar', g:60, p:20, c:22, f:7, k:230},
  {n:'Peanut chikki', cat:'Sweet', serv:'1 piece', g:30, p:5, c:15, f:7, k:140},
];
