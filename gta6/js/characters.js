/* ============================================================
   GTA VI — выбор персонажа: мигрант и полиция
   ============================================================ */

/**
 * Два playable-персонажа с разными правилами розыска, миссиями и
 * стартовым снаряжением. Всё, что зависит от выбора, читается отсюда,
 * а не зашито в game.js.
 */
const CHARACTERS = {
  migrant: {
    id: 'migrant',
    name: 'МИГРАНТ',
    role: 'Вне закона',
    blurb: 'Приехал в Леониду без денег. Всё, что не прибито — твоё. ' +
           'Полиция считает преступлением каждый твой шаг.',
    perks: ['Быстрее бегает', 'Спортивная тачка на старте', 'Грабит прохожих'],
    shirt: '#f2f2f7',
    pants: '#2b3350',
    skin: SKINS[1],
    accent: '#ff4fa3',

    hp: 100,
    armor: 0,
    cash: 500,
    footSpeed: 1.14,        // множитель скорости пешком
    startVehicle: 'sports',
    startColor: '#35d0d6',
    lootMultiplier: 1.6,    // сколько падает с прохожих
    missions: ['delivery', 'rampage', 'escape'],

    /** Сколько звёзд добавить за убийство: у мигранта преступление — всё. */
    wantedFor(ped) {
      return ped.isCop ? 3 : 2;
    },
    /** Награда за убийство. */
    bountyFor() {
      return 0;
    }
  },

  police: {
    id: 'police',
    name: 'ПОЛИЦИЯ',
    role: 'Патрульный',
    blurb: 'Жетон, броня и служебный крузер. Преступники помечены красным — ' +
           'за них платят. За стрельбу по мирным придёт отдел внутренних дел.',
    perks: ['Броня и больше HP', 'Крузер с мигалками', 'Премия за преступников'],
    shirt: '#1f2b52',
    pants: '#141a30',
    skin: SKINS[0],
    accent: '#35d0d6',

    hp: 130,
    armor: 50,
    cash: 1200,
    footSpeed: 1.0,
    startVehicle: 'police',
    startColor: '#f4f6fb',
    lootMultiplier: 1.0,
    missions: ['raid', 'delivery', 'escape'],

    /**
     * Преступник — законная цель. Мирный житель или коллега — нет,
     * и внутренние дела реагируют жёстче.
     */
    wantedFor(ped) {
      if (ped.criminal) return 0;
      return ped.isCop ? 4 : 3;
    },
    bountyFor(ped) {
      return ped.criminal ? randInt(250, 600) : 0;
    }
  }
};

const CHARACTER_ORDER = ['migrant', 'police'];

/** Доля прохожих, помеченных как преступники (цели для полиции). */
const CRIMINAL_RATE = 0.2;
