import type { RegionId } from './content';

// One region-matched, project-controlled postcard per runtime region.
// These are editorial atmosphere images, not depictions of the synthetic person.
const BASE = import.meta.env.BASE_URL;

export type Postcard = {
  regionId: RegionId;
  country: string;
  place: string;
  caption: string;
  img: string;
};

export const postcards: Postcard[] = [
  { regionId: 'BRA', country: 'Brazil', place: 'Salvador', caption: 'The street keeps the beat.', img: `${BASE}postcards/brazil.png` },
  { regionId: 'CAN', country: 'Canada', place: 'Western Canada', caption: 'Late light across the foothills.', img: `${BASE}postcards/canada-v2.webp` },
  { regionId: 'ESP', country: 'Spain', place: 'Eastern Spain', caption: 'An ordinary afternoon near the coast.', img: `${BASE}postcards/spain-v2.webp` },
  { regionId: 'IND', country: 'India', place: 'Southern India', caption: 'A festival afternoon.', img: `${BASE}postcards/india.png` },
  { regionId: 'JPN', country: 'Japan', place: 'Central Japan', caption: 'Rest on a quiet lane.', img: `${BASE}postcards/japan.png` },
  { regionId: 'KEN', country: 'Kenya', place: 'Central Kenya', caption: 'Dusk settles over the highlands.', img: `${BASE}postcards/kenya-v2.webp` },
  { regionId: 'MEX', country: 'Mexico', place: 'Central Mexico', caption: 'Candles for the ones remembered.', img: `${BASE}postcards/mexico.png` },
  { regionId: 'EGY', country: 'Egypt', place: 'Northern Egypt', caption: 'Evening light beside the river.', img: `${BASE}postcards/egypt-v2.webp` },
  { regionId: 'IDN', country: 'Indonesia', place: 'Western Indonesia', caption: 'A break among the terraces.', img: `${BASE}postcards/indonesia.png` },
  { regionId: 'VNM', country: 'Vietnam', place: 'Southern Vietnam', caption: 'Crossing the flooded fields.', img: `${BASE}postcards/vietnam.png` },
];

const byRegion = new Map(postcards.map((postcard) => [postcard.regionId, postcard]));

export const postcardForRegion = (regionId: RegionId): Postcard => {
  const postcard = byRegion.get(regionId);
  if (!postcard) throw new Error(`Missing postcard for region ${regionId}`);
  return postcard;
};
