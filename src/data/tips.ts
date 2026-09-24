import type { TargetCategory } from '../types';

export const generalTips: string[] = [
  'Before each round, take three slow breaths and let the last target go.',
  'Record your first impression before your mind starts reasoning about it.',
  'Short, regular sessions train perception better than long, tired ones.',
  'Notice the difference between what you saw and what you guessed. Only one is training.',
  'A miss is information. Write down what you perceived so you can compare it with the reveal.',
  'Stay humble with your hits and patient with your misses. Judge the pattern, not one round.',
];

export const categoryTips: Record<TargetCategory, string[]> = {
  colour: [
    'Colours often arrive as a feeling of warmth or coolness before a name. Start there.',
    'If two colours compete, pick the one that appeared first.',
  ],
  shape: [
    'Ask yourself: curved or straight? Pointed or smooth? Let the answer narrow the shape.',
    'Shapes often come as movement: tracing a line, a turn, a point.',
  ],
  word: [
    'Words may come as a picture before a label. Name the picture, then find the closest word.',
    'Do not read all four options slowly. Glance, then notice which one feels weighted.',
  ],
  object: [
    'Describe what you sense rather than naming the object: texture, temperature, weight, use.',
    'Avoid listing every possibility. Extra words raise your decoy score as much as your real one.',
  ],
  scene: [
    'Start broad: land or water, open or enclosed, busy or still. Then add detail.',
    'Sounds and temperature are often clearer than images for places. Describe them too.',
  ],
};
