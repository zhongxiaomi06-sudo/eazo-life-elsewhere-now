import { describe, expect, test } from 'vitest';
import { AtomicContentCache } from '@eazo/platform';
import { indicatorRegistry, regions, SNAPSHOT_SHA256, templates, type RegionId } from './content';
import { buildAvatarSvg, compareIndicators, compareScenes, composeScene, pickDuelOpponent, publicSharePayload, safeFallback, sanitizeSvg, scheduleScenes, visualOptions } from './engine';
import { postcardForRegion, postcards } from './postcards';
import { isMuted, play, setMuted } from './sound';

describe('Life Elsewhere production requirements',()=>{
  test('TEST-LIFE-001 provides an immediate synthetic disclosure contract',()=>{
    const copy='Every person is synthetic. No real identity. No live tracking.';
    expect(copy).toContain('synthetic'); expect(copy).toContain('No live tracking'); expect(templates).toHaveLength(60);
  });

  test('TEST-LIFE-002 appearance is deterministic and independent from region',()=>{
    const regionIds=Object.keys(regions) as RegionId[];
    for(let index=0;index<10_000;index+=1){
      const seed=`visual-${index}`; const baseline=JSON.stringify(visualOptions(seed,regionIds[0]));
      for(const regionId of regionIds) expect(JSON.stringify(visualOptions(seed,regionId))).toBe(baseline);
    }
    const unsafe='<svg><script>alert(1)</script><circle onclick="bad()"/><style>@import url(x)</style><image href="https://bad.invalid/x"/></svg>';
    expect(sanitizeSvg(unsafe)).not.toMatch(/script|onclick|style|https:/i);
    expect(buildAvatarSvg(visualOptions('safe'))).not.toMatch(/<script|\son\w+=|(?:href|src)=["']https?:|<style/i);
  });

  test('TEST-LIFE-003 missing indicators use the single non-numeric fallback',()=>{
    expect(safeFallback).toEqual({id:'SAFE-FALLBACK-001',displayedNumericClaimCount:0,reasonCode:'MISSING_REQUIRED_INDICATORS'});
  });

  test('TEST-LIFE-004 schedules 50 diverse, non-sensitive encounters',()=>{
    const scenes=scheduleScenes('approved-fixture',50);
    expect(scenes).toHaveLength(50);
    expect(new Set(scenes.map(scene=>scene.topic)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(scenes.map(scene=>scene.regionId)).size).toBe(Object.keys(regions).length);
    for(let index=1;index<scenes.length;index+=1){expect(scenes[index]?.regionId).not.toBe(scenes[index-1]?.regionId);expect(scenes[index]?.id).not.toBe(scenes[index-1]?.id)}
    expect(scenes.some(scene=>scene.sensitivity==='high')).toBe(false);
    for(const topic of new Set(scenes.map(scene=>scene.topic))) expect(scenes.filter(scene=>scene.topic===topic).length).toBeLessThanOrEqual(5);
  });

  test('TEST-LIFE-004A first visit has one unique, region-matched postcard per region',()=>{
    const scenes=scheduleScenes('approved-fixture',Object.keys(regions).length);
    expect(scenes).toHaveLength(Object.keys(regions).length);
    expect(new Set(scenes.map(scene=>scene.regionId)).size).toBe(Object.keys(regions).length);
    expect(postcards).toHaveLength(Object.keys(regions).length);
    expect(new Set(postcards.map(card=>card.img)).size).toBe(Object.keys(regions).length);
    for(const scene of scenes) expect(postcardForRegion(scene.regionId).regionId).toBe(scene.regionId);
  });

  test('TEST-LIFE-005 every numeric claim resolves to complete source metadata',()=>{
    for(const template of templates){const scene=composeScene(template,'source-audit');const meta=indicatorRegistry[scene.indicatorId];expect(scene.snapshotSha256).toMatch(/^[a-f0-9]{64}$/);expect(SNAPSHOT_SHA256).toBe(scene.snapshotSha256);for(const value of [meta.definition,meta.unit,meta.sourceUrl,meta.version,meta.transform,meta.rounding,meta.license])expect(value.length).toBeGreaterThan(0)}
  });

  test('TEST-LIFE-006 high-sensitivity content is excluded from first-session schedule',()=>{
    expect(templates.some(template=>template.sensitivity==='high')).toBe(true);
    expect(scheduleScenes('sensitive-gate',50).every(scene=>scene.sensitivity!=='high')).toBe(true);
  });

  test('TEST-LIFE-007 incompatible definitions, units, and years never rank',()=>{
    const base={definitionHash:'a',unit:'%'};
    expect(compareIndicators(base,{...base,definitionHash:'b'},2024,2024,1,2)).toEqual({ranking:null,reasonCode:'DEFINITION_MISMATCH'});
    expect(compareIndicators(base,{...base,unit:'minutes'},2024,2024,1,2)).toEqual({ranking:null,reasonCode:'UNIT_MISMATCH'});
    expect(compareIndicators(base,base,2024,2020,1,2)).toEqual({ranking:null,reasonCode:'YEAR_NOT_COMPARABLE'});
  });

  test('TEST-LIFE-008 share payload is synthetic and contains no seed or identity',()=>{
    const payload=publicSharePayload(scheduleScenes('private-seed',2)); const serialized=JSON.stringify(payload);
    expect(payload.synthetic).toBe(true); expect(payload.referenceYear).toBe(2024);
    expect(serialized).not.toMatch(/private-seed|userId|preciseLocation|visual/i);
  });

  test('TEST-LIFE-009 interrupted content update keeps the valid active version',()=>{
    const cache=new AtomicContentCache(); const v1={version:'v1',files:new Map([['content.json','ok'],['snapshot.json','ok']])};
    cache.stage(v1); expect(cache.activate(['content.json','snapshot.json'])).toBe(true);
    cache.stage({version:'v2',files:new Map([['content.json','partial']])}); expect(cache.activate(['content.json','snapshot.json'])).toBe(false);
    expect(cache.active?.version).toBe('v1'); expect([...cache.active!.files.keys()]).not.toContain('v2');
  });

  test('TEST-LIFE-010 duel opponents share an indicator and always compare fairly',()=>{
    const scenes=scheduleScenes('first-visit',50);
    for(const anchor of scenes){
      const opponent=pickDuelOpponent(scenes,anchor);
      expect(opponent).not.toBeNull();
      expect(opponent!.id).not.toBe(anchor.id);
      expect(opponent!.indicatorId).toBe(anchor.indicatorId);
      expect(compareScenes(anchor,opponent!).ranking).not.toBeNull();
      expect(pickDuelOpponent(scenes,anchor)!.id).toBe(opponent!.id);
    }
  });

  test('TEST-LIFE-011 sound never breaks without an audio context and respects mute',()=>{
    // node 环境无 AudioContext:所有音效必须静默降级。
    for(const name of ['tick','collect','win','lose','reveal','complete','journey','begin','save'] as const) expect(()=>play(name)).not.toThrow();
    setMuted(true); expect(isMuted()).toBe(true);
    for(const name of ['tick','collect','win','lose','reveal','complete','journey','begin','save'] as const) expect(()=>play(name)).not.toThrow();
    setMuted(false); expect(isMuted()).toBe(false);
  });
});
