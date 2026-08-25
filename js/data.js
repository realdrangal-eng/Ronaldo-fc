/* ============================================================
   RONALDO FC — card + pack database
   Every card in this game is Cristiano Ronaldo. That is the game.
   ============================================================ */

/* Rarity tiers drive the pack-opening animation intensity. */
const TIERS = {
  rare:      { key:'rare',      label:'RARE',       c1:'#7f6bff', c2:'#c9b6ff', glow:'#8b7bff', suspense: 700,  walkout:false, confetti:0  },
  epic:      { key:'epic',      label:'EPIC',       c1:'#ffb43d', c2:'#fff0b8', glow:'#ffc451', suspense: 1000, walkout:false, confetti:0  },
  icon:      { key:'icon',      label:'ICON',       c1:'#ff7a18', c2:'#ffd9a0', glow:'#ff9333', suspense: 1500, walkout:true,  confetti:40 },
  legendary: { key:'legendary', label:'LEGENDARY',  c1:'#00e0ff', c2:'#b6f6ff', glow:'#2ee9ff', suspense: 2100, walkout:true,  confetti:70 },
  ultimate:  { key:'ultimate',  label:'ULTIMATE',   c1:'#ff2bd1', c2:'#8affff', glow:'#ff4ddb', suspense: 2800, walkout:true,  confetti:120 }
};

/* The ten cards, in ascending overall. */
const CARDS = [
  { id:'cr90',  ovr:90,  pos:'ST', title:'World Cup Qatar 2022', club:'Portugal',        tier:'rare',
    img:'assets/cards/cr90-worldcup.png',
    stats:{ PAC:84, SHO:91, PAS:79, DRI:85, DEF:34, PHY:77 },
    note:'The armband, the last dance, the roar of Lusail.' },

  { id:'cr93',  ovr:93,  pos:'ST', title:'Signature Series',     club:'Manchester United', tier:'rare',
    img:'assets/cards/cr93-signature.png',
    stats:{ PAC:86, SHO:93, PAS:81, DRI:86, DEF:35, PHY:80 },
    note:'Signed, sealed, top corner delivered.' },

  { id:'cr94',  ovr:94,  pos:'ST', title:'Trophy Hunter',        club:'Manchester United', tier:'epic',
    img:'assets/cards/cr94-hero.png',
    stats:{ PAC:87, SHO:94, PAS:82, DRI:87, DEF:36, PHY:82 },
    note:'Old Trafford remembered exactly who he was.' },

  { id:'cr96',  ovr:96,  pos:'ST', title:'Team of the Year',     club:'Manchester United', tier:'epic',
    img:'assets/cards/cr96-toty.png',
    stats:{ PAC:88, SHO:96, PAS:84, DRI:88, DEF:38, PHY:84 },
    note:'Voted in by the world. Naturally.' },

  { id:'cr100', ovr:100, pos:'ST', title:'Team of the Season',   club:'Manchester United', tier:'epic',
    img:'assets/cards/cr100-tots.png',
    stats:{ PAC:90, SHO:99, PAS:86, DRI:90, DEF:40, PHY:87 },
    note:'A hundred. Round number, ridiculous player.' },

  { id:'cr105', ovr:105, pos:'ST', title:'Golden Hero',          club:'Portugal',        tier:'icon',
    img:'assets/cards/cr105-hero.png',
    stats:{ PAC:92, SHO:104, PAS:88, DRI:92, DEF:42, PHY:90 },
    note:'Gold shirt, gold boots, gold everything.' },

  { id:'cr106', ovr:106, pos:'ST', title:'World Cup Legend',     club:'Portugal',        tier:'icon',
    img:'assets/cards/cr106-worldcup.png',
    stats:{ PAC:92, SHO:105, PAS:89, DRI:92, DEF:43, PHY:91 },
    note:'Five World Cups. One flag. No arguments.' },

  { id:'cr112', ovr:112, pos:'ST', title:'TOTS Portugal',        club:'Portugal',        tier:'legendary',
    img:'assets/cards/cr112-tots.png',
    stats:{ PAC:95, SHO:111, PAS:92, DRI:95, DEF:46, PHY:94 },
    note:'Kissing the ball before it disappears into the net.' },

  { id:'cr114', ovr:114, pos:'ST', title:'Future Stars',         club:'Al Nassr',        tier:'legendary',
    img:'assets/cards/cr114-futures.png',
    stats:{ PAC:96, SHO:113, PAS:93, DRI:96, DEF:47, PHY:95 },
    note:'Forty and still accelerating. Explain that.' },

  { id:'cr117', ovr:117, pos:'ST', title:'SIUUU Prime',          club:'Al Nassr',        tier:'ultimate',
    img:'assets/cards/cr117-neon.png',
    stats:{ PAC:97, SHO:117, PAS:94, DRI:97, DEF:49, PHY:96 },
    note:'The one you tell people about. SIUUUUU.' }
];

const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]));

/* ------------------------------------------------------------
   Packs. `odds` maps card id -> weight. Weights are relative.
   `guarantee` forces at least one pull of that overall or better.
   ------------------------------------------------------------ */
const PACKS = [
  {
    id:'bronze', name:'STARTER PACK', tagline:'Everybody starts somewhere.',
    cost:{ coins:750 }, pulls:1, color:'#b0762f', color2:'#f0c68a',
    guarantee:90,
    odds:{ cr90:52, cr93:26, cr94:13, cr96:6, cr100:2.4, cr105:0.4, cr106:0.15, cr112:0.04, cr114:0.008, cr117:0.002 }
  },
  {
    id:'gold', name:'GOLD PACK', tagline:'3 cards. At least one 93+.',
    cost:{ coins:3200 }, pulls:3, color:'#e0a52a', color2:'#fff2bd',
    guarantee:93,
    odds:{ cr90:34, cr93:28, cr94:18, cr96:11, cr100:5.5, cr105:2, cr106:1, cr112:0.35, cr114:0.12, cr117:0.03 }
  },
  {
    id:'icon', name:'ICON PACK', tagline:'3 cards. At least one 100+.',
    cost:{ coins:14000 }, pulls:3, color:'#ff7a18', color2:'#ffd9a0',
    guarantee:100,
    odds:{ cr90:12, cr93:15, cr94:18, cr96:20, cr100:17, cr105:9, cr106:6, cr112:2.2, cr114:0.7, cr117:0.1 }
  },
  {
    id:'tots', name:'TOTS MEGA PACK', tagline:'5 cards. At least one 105+.',
    cost:{ coins:42000 }, pulls:5, color:'#2f6bff', color2:'#a8e2ff',
    guarantee:105,
    odds:{ cr90:5, cr93:8, cr94:12, cr96:16, cr100:20, cr105:17, cr106:13, cr112:6, cr114:2.6, cr117:0.4 }
  },
  {
    id:'ultimate', name:'ULTIMATE SIU PACK', tagline:'5 cards. Guaranteed 112+. The big one.',
    cost:{ gems:150 }, pulls:5, color:'#ff2bd1', color2:'#8affff',
    guarantee:112, premium:true,
    odds:{ cr96:6, cr100:12, cr105:18, cr106:20, cr112:22, cr114:16, cr117:6 }
  }
];

const PACK_BY_ID = Object.fromEntries(PACKS.map(p => [p.id, p]));

/* Duplicate conversion: coins refunded when you already own a card. */
const DUPE_COINS = { rare:400, epic:1400, icon:4500, legendary:12000, ultimate:30000 };

/* Training: each duplicate adds a star, each star is +1 OVR, max 5. */
const MAX_STARS = 5;
