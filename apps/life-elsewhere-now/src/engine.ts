import { indicatorRegistry, regions, templates, type IndicatorId, type LifeTemplate, type RegionId, SNAPSHOT_SHA256 } from './content';

export type VisualOptions = { skin: string; hair: string; top: string; shape: number };
export type Scene = LifeTemplate & { visual: VisualOptions; value: number; year: number; regionLabel: string; localTime: string; snapshotSha256: string; displayedNumericClaimCount: 1 };

const palette = ['#f5c9a6','#d99b72','#a96744','#70422f','#4b2d22'];
const hair = ['#15100e','#4a2f25','#7a5138','#d7b17c','#34313a'];
const tops = ['#ff5b35','#ffca45','#88d9c2','#8783ff','#f58fc7','#2d78e6'];
const hash = (value: string) => [...value].reduce((total, character) => Math.imul(total ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261);

export const visualOptions = (seed: string, _regionId?: RegionId): VisualOptions => {
  const value = hash(seed);
  return { skin: palette[value % palette.length]!, hair: hair[(value >>> 3) % hair.length]!, top: tops[(value >>> 6) % tops.length]!, shape: (value >>> 9) % 4 };
};

export const sanitizeSvg = (svg: string) => svg
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/\son\w+=("[^"]*"|'[^']*')/gi, '')
  .replace(/(?:href|src)=("|')https?:[\s\S]*?\1/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '');

export const buildAvatarSvg = (visual: VisualOptions) => sanitizeSvg(`<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Abstract synthetic portrait"><rect width="240" height="240" rx="72" fill="${visual.top}"/><circle cx="120" cy="118" r="68" fill="${visual.skin}"/><path d="M52 110c5-53 35-82 71-82 41 0 68 31 69 80-25-9-45-28-57-46-17 24-48 40-83 48Z" fill="${visual.hair}"/><circle cx="94" cy="119" r="6" fill="#171318"/><circle cx="147" cy="119" r="6" fill="#171318"/><path d="M99 151c15 13 30 13 43 0" fill="none" stroke="#171318" stroke-width="6" stroke-linecap="round"/><path d="M47 240c6-50 34-75 73-75s68 25 73 75" fill="${visual.top}"/></svg>`);

const readIndicator = (regionId: RegionId, indicatorId: IndicatorId): [number, number] => regions[regionId][indicatorId] as [number,number];

export const composeScene = (template: LifeTemplate, seed: string, date = new Date()): Scene => {
  const [value,year] = readIndicator(template.regionId, template.indicatorId);
  return { ...template, visual: visualOptions(seed), value, year, regionLabel: regions[template.regionId].label, localTime: new Intl.DateTimeFormat('en-US',{timeZone:regions[template.regionId].timeZone,hour:'2-digit',minute:'2-digit'}).format(date), snapshotSha256: SNAPSHOT_SHA256, displayedNumericClaimCount: 1 };
};

export const scheduleScenes = (sessionSeed: string, count = 10): Scene[] => {
  const safe = templates.filter((template) => template.sensitivity !== 'high');
  const start = hash(sessionSeed) % safe.length;
  const chosen: LifeTemplate[] = [];
  for (let offset=0; chosen.length<count && offset<safe.length*3; offset+=1) {
    const candidate = safe[(start + offset * 7) % safe.length]!;
    const previous = chosen.at(-1);
    const topicCount = chosen.filter((item) => item.topic===candidate.topic).length;
    if (previous?.id===candidate.id || previous?.regionId===candidate.regionId || topicCount>=2) continue;
    chosen.push(candidate);
  }
  return chosen.map((template,index)=>composeScene(template,`${sessionSeed}:${index}`));
};

export const safeFallback = { id:'SAFE-FALLBACK-001', displayedNumericClaimCount:0, reasonCode:'MISSING_REQUIRED_INDICATORS' } as const;

export const compareIndicators = (leftIndicator: {definitionHash:string;unit:string}, rightIndicator: {definitionHash:string;unit:string}, leftYear:number, rightYear:number, leftValue:number, rightValue:number) => {
  if(leftIndicator.definitionHash!==rightIndicator.definitionHash) return { ranking:null, reasonCode:'DEFINITION_MISMATCH' as const };
  if(leftIndicator.unit!==rightIndicator.unit) return { ranking:null, reasonCode:'UNIT_MISMATCH' as const };
  if(Math.abs(leftYear-rightYear)>2) return { ranking:null, reasonCode:'YEAR_NOT_COMPARABLE' as const };
  return { ranking:leftValue===rightValue?'same':leftValue>rightValue?'left':'right', reasonCode:null };
};

export const compareScenes = (left: Scene, right: Scene) => {
  const leftIndicator=indicatorRegistry[left.indicatorId]; const rightIndicator=indicatorRegistry[right.indicatorId];
  return compareIndicators(leftIndicator,rightIndicator,left.year,right.year,left.value,right.value);
};

export const publicSharePayload = (scenes: Scene[]) => ({ schemaVersion:1, synthetic:true, referenceYear:Math.max(...scenes.map(scene=>scene.year)), scenes:scenes.map(({id,topic,regionLabel,value,year,indicatorId})=>({id,topic,regionLabel,value,year,indicatorId})) });
