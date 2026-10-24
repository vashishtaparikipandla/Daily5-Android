import { uid, monthKey, todayStr, type Book, type DayLog, type Entry, type CategoryId } from './data';
import { saveBooks, getSeedVersion, setSeedVersion } from './storage';

const SEED_VERSION = 2;

const SAMPLE_DAYS: { date: string; entries: { text: string; cat: CategoryId; photos: string[] }[] }[] = [
  {
    date: '2026-04-12',
    entries: [
      { text: 'Morning matcha by the stone garden at Ryoan-ji. Rain tapping the wooden veranda.', cat: 'travel', photos: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80'] },
      { text: 'Got lost along the Philosopher’s Path under falling cherry petals.', cat: 'travel', photos: [] },
      { text: 'Warm bowl of soba in Gion with broth so clear you could see the noodles.', cat: 'food', photos: [] },
      { text: 'Quiet dusk walk past antique paper lanterns glowing amber.', cat: 'other', photos: [] },
    ],
  },
  {
    date: '2026-04-13',
    entries: [
      { text: 'Climbed through a thousand vermilion torii gates at Fushimi Inari at dawn.', cat: 'travel', photos: ['https://images.unsplash.com/photo-1478436127897-769e00d0c715?w=800&q=80'] },
      { text: 'Found an eighty-year-old tea shop serving roasted hojicha.', cat: 'food', photos: [] },
      { text: 'Resting sore feet on the tatami floor, listening to wind chimes.', cat: 'health', photos: [] },
      { text: 'Sent postcards home written with an old fountain pen.', cat: 'people', photos: [] },
    ],
  },
  {
    date: '2026-04-14',
    entries: [
      { text: 'Bamboo forest at Arashiyama swaying like a green sea in the morning breeze.', cat: 'travel', photos: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80'] },
      { text: 'Talked with a woodblock carver about grain and patience.', cat: 'learning', photos: [] },
      { text: 'Crispy yuba tofu hot pot near the riverbank as dusk fell.', cat: 'food', photos: [] },
      { text: 'We agreed this was the most peaceful day of the year.', cat: 'love', photos: [] },
    ],
  },
  {
    date: '2026-04-15',
    entries: [
      { text: 'Watching tea masters prepare ceremonial bowls with absolute stillness.', cat: 'learning', photos: [] },
      { text: 'Stumbled onto a small hidden temple courtyard with moss cushions.', cat: 'travel', photos: ['https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=800&q=80'] },
      { text: 'Sweet red bean wagashi shaped like miniature spring leaves.', cat: 'food', photos: [] },
      { text: 'Packed our linen bags for the bullet train ride tomorrow.', cat: 'home', photos: [] },
    ],
  },
];

export async function seedDemoData(): Promise<void> {
  const version = await getSeedVersion();
  if (version >= SEED_VERSION) return;

  const now = new Date();
  const currentMk = monthKey(now);

  // Single sample exploration book
  const sampleBook: Book = {
    monthKey: 'sample_kyoto_2026',
    title: 'Sample Book · Kyoto Journey',
    description: 'A sample travel volume illustrating how printed Dear Day books look.',
    coverColor: '#2D3F2A',
    isCustom: true,
    isSample: true,
    locked: true,
    days: SAMPLE_DAYS.map(day => ({
      date: day.date,
      entries: day.entries.map(e => ({
        id: uid(),
        text: e.text,
        category: e.cat,
        photos: e.photos,
      })),
      extras: [],
    })),
    hiddenDays: [],
  };

  // Fresh, clean active month for the user
  const currentBook: Book = {
    monthKey: currentMk,
    locked: false,
    days: [],
    hiddenDays: [],
  };

  await saveBooks([currentBook, sampleBook]);
  await setSeedVersion(SEED_VERSION);
}
