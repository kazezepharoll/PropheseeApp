import type { Target, TargetCategory } from '../types';

const colours: Target[] = [
  { id: 'c-red', category: 'colour', label: 'Red', glyph: '#D64545' },
  { id: 'c-blue', category: 'colour', label: 'Blue', glyph: '#3F6FD8' },
  { id: 'c-green', category: 'colour', label: 'Green', glyph: '#3C9D5D' },
  { id: 'c-yellow', category: 'colour', label: 'Yellow', glyph: '#E8C547' },
  { id: 'c-purple', category: 'colour', label: 'Purple', glyph: '#8A56C8' },
  { id: 'c-orange', category: 'colour', label: 'Orange', glyph: '#E8833A' },
];

/** Shape glyphs are MaterialCommunityIcons names. */
const shapes: Target[] = [
  { id: 's-circle', category: 'shape', label: 'Circle', glyph: 'circle' },
  { id: 's-square', category: 'shape', label: 'Square', glyph: 'square' },
  { id: 's-triangle', category: 'shape', label: 'Triangle', glyph: 'triangle' },
  { id: 's-star', category: 'shape', label: 'Star', glyph: 'star' },
  { id: 's-heart', category: 'shape', label: 'Heart', glyph: 'heart' },
  { id: 's-cross', category: 'shape', label: 'Cross', glyph: 'cross' },
];

const words: Target[] = [
  ['Light', '💡'], ['River', '🏞️'], ['Crown', '👑'], ['Lamp', '🪔'], ['Door', '🚪'], ['Bread', '🍞'],
  ['Dove', '🕊️'], ['Fire', '🔥'], ['Mountain', '⛰️'], ['Shepherd', '🧑‍🌾'], ['Anchor', '⚓'], ['Key', '🔑'],
  ['Tree', '🌳'], ['Rain', '🌧️'], ['Stone', '🪨'], ['Ship', '⛵'], ['Seed', '🌱'], ['Sword', '🗡️'],
  ['Bell', '🔔'], ['Wheat', '🌾'], ['Well', '🪣'], ['Harp', '🎼'], ['Eagle', '🦅'], ['Lion', '🦁'],
].map(([label, glyph]) => ({ id: `w-${label.toLowerCase()}`, category: 'word' as const, label, glyph }));

const objects: Target[] = [
  {
    id: 'o-apple', category: 'object', label: 'Red apple', glyph: '🍎',
    attributes: [['red', 'crimson', 'scarlet'], ['round', 'circle', 'circular', 'sphere', 'ball'], ['fruit', 'food', 'eat', 'edible'], ['sweet', 'juicy'], ['small', 'hand', 'handheld'], ['tree', 'orchard', 'stem']],
  },
  {
    id: 'o-key', category: 'object', label: 'Brass key', glyph: '🔑',
    attributes: [['metal', 'metallic', 'brass', 'iron'], ['gold', 'golden', 'yellow', 'brass'], ['small', 'tiny', 'pocket'], ['lock', 'door', 'open', 'unlock'], ['cold', 'hard'], ['teeth', 'jagged', 'notched']],
  },
  {
    id: 'o-candle', category: 'object', label: 'Lit candle', glyph: '🕯️',
    attributes: [['flame', 'fire', 'burning', 'lit'], ['light', 'glow', 'bright'], ['wax', 'soft'], ['white', 'cream'], ['tall', 'upright', 'cylinder', 'stick'], ['warm', 'heat', 'hot']],
  },
  {
    id: 'o-book', category: 'object', label: 'Open book', glyph: '📖',
    attributes: [['paper', 'pages', 'page'], ['words', 'text', 'writing', 'letters', 'read', 'reading'], ['rectangle', 'rectangular', 'flat'], ['open', 'spread'], ['cover', 'spine', 'bound'], ['story', 'knowledge', 'study']],
  },
  {
    id: 'o-cup', category: 'object', label: 'Coffee cup', glyph: '☕',
    attributes: [['cup', 'mug', 'vessel'], ['hot', 'warm', 'steam', 'steaming'], ['drink', 'coffee', 'tea', 'liquid'], ['handle'], ['ceramic', 'china', 'porcelain'], ['brown', 'dark']],
  },
  {
    id: 'o-clock', category: 'object', label: 'Wall clock', glyph: '🕰️',
    attributes: [['time', 'hours', 'clock'], ['round', 'circle', 'circular', 'face'], ['numbers', 'numerals', 'digits'], ['ticking', 'tick', 'tock'], ['hands', 'pointer', 'arrows'], ['wall', 'hanging']],
  },
  {
    id: 'o-umbrella', category: 'object', label: 'Umbrella', glyph: '☂️',
    attributes: [['rain', 'wet', 'water', 'storm'], ['fabric', 'cloth', 'canvas'], ['open', 'dome', 'canopy'], ['handle', 'hook', 'curved'], ['shelter', 'cover', 'protect', 'shield'], ['folding', 'fold', 'spokes']],
  },
  {
    id: 'o-bicycle', category: 'object', label: 'Bicycle', glyph: '🚲',
    attributes: [['wheels', 'wheel', 'round', 'circles'], ['metal', 'frame', 'steel'], ['ride', 'riding', 'pedal', 'pedals'], ['movement', 'moving', 'travel', 'speed'], ['chain', 'gears'], ['seat', 'saddle', 'handlebars']],
  },
  {
    id: 'o-shell', category: 'object', label: 'Seashell', glyph: '🐚',
    attributes: [['sea', 'ocean', 'beach', 'shore', 'sand'], ['spiral', 'curl', 'swirl', 'coiled'], ['hard', 'smooth'], ['pink', 'white', 'cream', 'pearl'], ['small', 'hand'], ['sound', 'echo', 'hollow']],
  },
  {
    id: 'o-guitar', category: 'object', label: 'Guitar', glyph: '🎸',
    attributes: [['music', 'musical', 'song', 'sound'], ['strings', 'string'], ['wood', 'wooden'], ['curved', 'curves', 'hourglass'], ['long', 'neck'], ['play', 'playing', 'strum', 'instrument']],
  },
];

const scenes: Target[] = [
  {
    id: 'p-lighthouse', category: 'scene', label: 'Lighthouse on a rocky coast', glyph: '🗼',
    attributes: [['lighthouse', 'tower', 'beacon'], ['sea', 'ocean', 'water', 'waves'], ['rock', 'rocks', 'rocky', 'cliff', 'cliffs', 'stone'], ['light', 'lamp', 'beam', 'shining'], ['tall', 'high', 'height', 'vertical'], ['wind', 'windy', 'spray', 'storm']],
  },
  {
    id: 'p-desert', category: 'scene', label: 'Desert dunes at sunset', glyph: '🏜️',
    attributes: [['sand', 'sandy', 'dunes', 'dune'], ['dry', 'arid', 'thirst', 'dust'], ['hot', 'heat', 'warm'], ['orange', 'gold', 'golden', 'yellow', 'red'], ['sunset', 'sun', 'evening', 'dusk'], ['empty', 'vast', 'wide', 'open', 'alone']],
  },
  {
    id: 'p-waterfall', category: 'scene', label: 'Waterfall in a forest', glyph: '🌊',
    attributes: [['water', 'falling', 'waterfall', 'cascade', 'flowing'], ['loud', 'roar', 'rushing', 'noise'], ['trees', 'forest', 'woods', 'jungle'], ['green', 'lush', 'moss', 'ferns'], ['rocks', 'stone', 'cliff'], ['mist', 'spray', 'cool', 'wet']],
  },
  {
    id: 'p-city', category: 'scene', label: 'City skyline at night', glyph: '🌃',
    attributes: [['city', 'urban', 'town'], ['buildings', 'towers', 'skyscrapers', 'skyline'], ['night', 'dark', 'evening'], ['lights', 'lit', 'windows', 'neon'], ['people', 'crowd', 'busy', 'traffic'], ['tall', 'high', 'vertical']],
  },
  {
    id: 'p-mountain', category: 'scene', label: 'Snow-capped mountain', glyph: '🏔️',
    attributes: [['mountain', 'mountains', 'peak', 'summit'], ['snow', 'ice', 'white'], ['cold', 'freezing', 'cool'], ['high', 'tall', 'height', 'up'], ['sky', 'clouds', 'blue'], ['rock', 'rocky', 'stone', 'jagged']],
  },
  {
    id: 'p-market', category: 'scene', label: 'Busy outdoor market', glyph: '🧺',
    attributes: [['market', 'stalls', 'stall', 'shop', 'trade'], ['people', 'crowd', 'busy', 'many'], ['food', 'fruit', 'vegetables', 'produce'], ['noise', 'loud', 'voices', 'talking'], ['colourful', 'colorful', 'bright', 'colours', 'colors'], ['outdoor', 'outside', 'street', 'open']],
  },
  {
    id: 'p-church', category: 'scene', label: 'Stone chapel in a valley', glyph: '⛪',
    attributes: [['church', 'chapel', 'cathedral', 'temple'], ['stone', 'brick', 'old', 'ancient'], ['steeple', 'spire', 'bell', 'tower', 'cross'], ['quiet', 'peace', 'peaceful', 'still', 'calm'], ['valley', 'hills', 'green', 'fields'], ['worship', 'prayer', 'holy']],
  },
  {
    id: 'p-bridge', category: 'scene', label: 'Bridge over a river', glyph: '🌉',
    attributes: [['bridge', 'crossing', 'span'], ['river', 'water', 'flowing', 'stream'], ['arch', 'arches', 'curve', 'curved'], ['long', 'wide', 'horizontal'], ['metal', 'steel', 'cables', 'stone'], ['cars', 'traffic', 'road', 'people', 'walking']],
  },
  {
    id: 'p-field', category: 'scene', label: 'Wheat field under a wide sky', glyph: '🌾',
    attributes: [['field', 'fields', 'farm', 'meadow'], ['wheat', 'grain', 'harvest', 'crops'], ['gold', 'golden', 'yellow'], ['sky', 'clouds', 'blue', 'open'], ['wind', 'breeze', 'waving', 'swaying'], ['flat', 'wide', 'vast', 'horizon']],
  },
  {
    id: 'p-harbour', category: 'scene', label: 'Fishing boats in a harbour', glyph: '⛵',
    attributes: [['boats', 'boat', 'ships', 'ship', 'vessels'], ['harbour', 'harbor', 'port', 'dock', 'pier'], ['water', 'sea', 'ocean'], ['fish', 'fishing', 'nets', 'net'], ['ropes', 'rope', 'masts', 'mast'], ['gulls', 'birds', 'seagulls']],
  },
];

export const pools: Record<TargetCategory, Target[]> = {
  colour: colours,
  shape: shapes,
  word: words,
  object: objects,
  scene: scenes,
};

const byId = new Map<string, Target>(Object.values(pools).flat().map((t) => [t.id, t]));

export function findTarget(id: string): Target | undefined {
  return byId.get(id);
}
