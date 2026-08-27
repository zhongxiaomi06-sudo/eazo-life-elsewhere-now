import snapshot from './data-snapshot.json';

export type Topic = 'food'|'commute'|'school'|'work'|'home'|'health'|'leisure'|'income'|'urban-rural'|'migration'|'climate'|'conflict-context';
export type AgeBand = 'child'|'teen'|'adult'|'older-adult';
export type RegionId = keyof typeof snapshot.regions;
export type IndicatorId = 'IT.NET.USER.ZS'|'SP.URB.TOTL.IN.ZS'|'EG.ELC.ACCS.ZS'|'SH.H2O.BASW.ZS';

export type LifeTemplate = {
  id: string;
  topic: Topic;
  regionId: RegionId;
  ageBand: AgeBand;
  narrative: string;
  indicatorId: IndicatorId;
  sensitivity: 'normal'|'review'|'high';
  reviewedBy: string;
  reviewedAt: string;
  forbiddenCombinations: string[];
};

export const SNAPSHOT_SHA256 = 'd791b6dcfdb7cccf98f1be1326acc015554ca974a3f16d86fb3a87ec947e8cb4';

export const indicatorRegistry: Record<IndicatorId, {
  name: string; definition: string; unit: string; sourceUrl: string; version: string;
  coverage: string; transform: string; rounding: string; license: string; definitionHash: string;
}> = {
  'IT.NET.USER.ZS': { name: 'People using the internet', definition: 'Share of people who used the internet from any location in the previous three months.', unit: '% of population', sourceUrl: 'https://data.worldbank.org/indicator/IT.NET.USER.ZS', version: snapshot.snapshotVersion, coverage: 'National estimate represented by a broad regional label; never an individual prediction.', transform: 'Latest non-null 2024 observation selected per country.', rounding: 'Rounded to one decimal place.', license: snapshot.license, definitionHash: 'wdi-it-net-user-zs-v1' },
  'SP.URB.TOTL.IN.ZS': { name: 'Urban population', definition: 'Share of the population living in areas classified as urban by national statistical offices.', unit: '% of population', sourceUrl: 'https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS', version: snapshot.snapshotVersion, coverage: 'National estimate represented by a broad regional label; definitions vary by country.', transform: '2024 observation selected per country.', rounding: 'Rounded to one decimal place.', license: snapshot.license, definitionHash: 'wdi-sp-urb-totl-in-zs-v1' },
  'EG.ELC.ACCS.ZS': { name: 'Access to electricity', definition: 'Share of the population with access to electricity.', unit: '% of population', sourceUrl: 'https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS', version: snapshot.snapshotVersion, coverage: 'National estimate; it does not describe reliability, affordability, or any individual household.', transform: '2024 observation selected per country.', rounding: 'Rounded to one decimal place.', license: snapshot.license, definitionHash: 'wdi-eg-elc-accs-zs-v1' },
  'SH.H2O.BASW.ZS': { name: 'At least basic drinking water', definition: 'Share using an improved drinking-water source with a collection time of no more than 30 minutes round trip.', unit: '% of population', sourceUrl: 'https://data.worldbank.org/indicator/SH.H2O.BASW.ZS', version: snapshot.snapshotVersion, coverage: 'National estimate; it does not determine any individual household situation.', transform: '2024 observation selected per country.', rounding: 'Rounded to one decimal place.', license: snapshot.license, definitionHash: 'wdi-sh-h2o-basw-zs-v1' },
};

const topics: Array<{ topic: Topic; indicatorId: IndicatorId; sensitivity: LifeTemplate['sensitivity']; lines: [string,string,string,string]; ages: [AgeBand,AgeBand,AgeBand,AgeBand] }> = [
  { topic:'food', indicatorId:'SH.H2O.BASW.ZS', sensitivity:'normal', ages:['adult','teen','older-adult','adult'], lines:['A breakfast is being packed before the street fully wakes.','Someone is saving the crispiest piece for the last bite.','A kettle clicks off while a familiar recipe is recalled from memory.','Lunch is being divided into containers for a long day.'] },
  { topic:'commute', indicatorId:'SP.URB.TOTL.IN.ZS', sensitivity:'normal', ages:['adult','teen','adult','older-adult'], lines:['A bus window turns the neighborhood into a moving strip of color.','A school bag is shifted from one shoulder to the other at a crossing.','Someone times the walk by the songs in a favorite album.','A familiar route is taken slowly enough to notice a new shop sign.'] },
  { topic:'school', indicatorId:'IT.NET.USER.ZS', sensitivity:'normal', ages:['child','teen','adult','older-adult'], lines:['A pencil margin fills with tiny stars between two lessons.','A study group is arguing kindly about the best way to explain an answer.','Someone is learning a new tool after work, one short lesson at a time.','A community class begins with everyone helping to arrange the chairs.'] },
  { topic:'work', indicatorId:'IT.NET.USER.ZS', sensitivity:'normal', ages:['adult','adult','adult','older-adult'], lines:['A repair is nearly finished after one stubborn screw finally turns.','A shop counter is being prepared for the first customer.','Two coworkers trade the quiet nod that means a problem is solved.','A notebook holds a checklist polished by years of practice.'] },
  { topic:'home', indicatorId:'EG.ELC.ACCS.ZS', sensitivity:'normal', ages:['adult','child','older-adult','adult'], lines:['A window is opened to decide whether today feels warm or cool.','A blanket fort has temporarily changed the shape of the room.','A radio fills the kitchen while plants are given water.','The last clean cup is set upside down beside the sink.'] },
  { topic:'health', indicatorId:'SH.H2O.BASW.ZS', sensitivity:'review', ages:['adult','teen','older-adult','adult'], lines:['A short walk is being fitted between two ordinary errands.','A water bottle is refilled before an afternoon outside.','Someone stretches carefully while waiting for the kettle.','A reminder is moved to a place where it will actually be seen.'] },
  { topic:'leisure', indicatorId:'IT.NET.USER.ZS', sensitivity:'normal', ages:['teen','adult','child','older-adult'], lines:['A favorite chorus is replayed for the third time.','A half-finished puzzle has claimed the best part of the table.','A game invents new rules every few minutes.','A friend is being sent a photograph of an unexpectedly good cloud.'] },
  { topic:'income', indicatorId:'EG.ELC.ACCS.ZS', sensitivity:'review', ages:['adult','adult','older-adult','adult'], lines:['A weekly list is being rearranged so the important things fit first.','A small repair is chosen over replacing something that still works.','Someone compares two prices, then checks the unit size once more.','A jar holds change for a plan that is still taking shape.'] },
  { topic:'urban-rural', indicatorId:'SP.URB.TOTL.IN.ZS', sensitivity:'normal', ages:['adult','teen','older-adult','adult'], lines:['The day begins with traffic noise arriving before the sunlight.','A familiar path passes more trees than storefronts.','Someone recognizes three neighbors during one short errand.','A delivery route moves between dense blocks and open edges.'] },
  { topic:'migration', indicatorId:'IT.NET.USER.ZS', sensitivity:'review', ages:['adult','teen','older-adult','adult'], lines:['A voice message keeps two time zones connected.','A new route is starting to feel less like a map and more like habit.','An old phrase is explained to someone hearing it for the first time.','Two versions of a recipe meet in the same pan.'] },
  { topic:'climate', indicatorId:'EG.ELC.ACCS.ZS', sensitivity:'review', ages:['adult','teen','older-adult','adult'], lines:['A curtain is closed before the afternoon heat reaches the room.','The sky is checked before deciding how to travel.','A rain barrel is inspected after a dry week.','A fan, a shaded seat, and a glass of water shape the next hour.'] },
  { topic:'conflict-context', indicatorId:'SH.H2O.BASW.ZS', sensitivity:'high', ages:['adult','adult','older-adult','adult'], lines:['A community noticeboard lists services available this week.','A long-distance call is planned around a changing connection.','A familiar routine is kept because ordinary things still matter.','Neighbors exchange practical information without turning anyone into a statistic.'] },
];

const regionIds = Object.keys(snapshot.regions) as RegionId[];

export const templates: LifeTemplate[] = topics.flatMap((entry, topicIndex) => entry.lines.map((narrative, variant) => ({
  id: `LIFE-${String(topicIndex * 4 + variant + 1).padStart(3,'0')}`,
  topic: entry.topic,
  regionId: regionIds[(topicIndex + variant) % regionIds.length]!,
  ageBand: entry.ages[variant]!,
  narrative,
  indicatorId: entry.indicatorId,
  sensitivity: entry.sensitivity,
  reviewedBy: 'Eazo Content Review',
  reviewedAt: '2026-08-27',
  forbiddenCombinations: ['appearance->region','appearance->wealth','child->victim-narrative','individual->national-destiny'],
})));

export const regions = snapshot.regions;
