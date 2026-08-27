import { useEffect, useMemo, useState } from 'react';
import { device, share } from '@eazo/sdk';
import { buildAvatarSvg, compareScenes, publicSharePayload, scheduleScenes, type Scene } from './engine';
import { indicatorRegistry, SNAPSHOT_SHA256, templates } from './content';

type View = 'home'|'scene'|'compare'|'method';
const COLLECTION_KEY = 'life-elsewhere-collection-v1';
const loadCollection = (): Scene[] => { try { return JSON.parse(globalThis.localStorage?.getItem(COLLECTION_KEY) ?? '[]') as Scene[]; } catch { return []; } };

function Portrait({ scene }: { scene: Scene }) {
  return <div className="portrait" style={{'--portrait-accent':scene.visual.top} as React.CSSProperties} dangerouslySetInnerHTML={{__html:buildAvatarSvg(scene.visual)}} />;
}

function SourceNote({ scene }: { scene: Scene }) {
  const indicator=indicatorRegistry[scene.indicatorId];
  return <div className="source-note"><span>{scene.value.toFixed(1)}%</span><div><strong>{indicator.name}</strong><small>{scene.year} · national estimate · not a personal prediction</small></div></div>;
}

export function App(){
  const [view,setView]=useState<View>('home');
  const [lens,setLens]=useState('everyday');
  const [sessionSeed,setSessionSeed]=useState('first-visit');
  const [position,setPosition]=useState(0);
  const [collection,setCollection]=useState<Scene[]>(loadCollection);
  const [online,setOnline]=useState(globalThis.navigator?.onLine ?? true);
  const [notice,setNotice]=useState('');
  const scenes=useMemo(()=>scheduleScenes(`${sessionSeed}:${lens}`,10),[sessionSeed,lens]);
  const scene=scenes[position % scenes.length]!;
  const comparison=collection.find(item=>item.id!==scene.id) ?? scenes[(position+1)%scenes.length]!;
  const comparisonResult=compareScenes(scene,comparison);

  useEffect(()=>{
    const onOnline=()=>setOnline(true); const onOffline=()=>setOnline(false);
    globalThis.addEventListener?.('online',onOnline); globalThis.addEventListener?.('offline',onOffline);
    return()=>{globalThis.removeEventListener?.('online',onOnline);globalThis.removeEventListener?.('offline',onOffline)};
  },[]);

  const begin=()=>{setSessionSeed(globalThis.crypto?.randomUUID?.() ?? String(Date.now()));setPosition(0);setView('scene')};
  const next=()=>{setPosition(value=>(value+1)%scenes.length);setNotice('A new synthetic scene is ready.')};
  const save=()=>{
    if(collection.some(item=>item.id===scene.id)){setNotice('Already in your pair collection.');return}
    const nextCollection=[...collection,scene].slice(-20);setCollection(nextCollection);globalThis.localStorage?.setItem(COLLECTION_KEY,JSON.stringify(nextCollection));setNotice('Saved on this device.');
  };
  const sharePair=async()=>{
    const payload=publicSharePayload(view==='compare'?[scene,comparison]:[scene]);
    const text=`Somewhere else, ordinary looks different. ${scene.regionLabel}: ${scene.narrative} Synthetic scene · ${scene.year} reference data. Try your own perspective.`;
    try { const result=await share.compose({text,sourceAppId:'life-elsewhere-now',targetPath:'/?from=share'}); setNotice(result.accepted?'Opened in Eazo. Review before publishing.':'Eazo sharing is available in the mobile app. The text is ready to copy.'); }
    catch { await globalThis.navigator?.clipboard?.writeText(`${text}\n${JSON.stringify(payload)}`); setNotice('Share was unavailable, so a privacy-safe version was copied.'); }
  };

  return <div className="world-app">
    <a className="skip-link" href="#main">Skip to experience</a>
    <header className="topbar"><button className="wordmark" onClick={()=>setView('home')} aria-label="Go to home"><i/>ELSEWHERE, NOW</button><nav aria-label="Primary"><button aria-current={view==='scene'} onClick={()=>setView('scene')}>Encounter</button><button aria-current={view==='compare'} onClick={()=>setView('compare')}>Pair <b>{collection.length}</b></button><button aria-current={view==='method'} onClick={()=>setView('method')}>Method</button></nav><span className={`connection ${online?'online':'offline'}`}>{online?'Live shell':'Offline ready'}</span></header>
    <main id="main" tabIndex={-1}>
      {view==='home'&&<section className="landing">
        <div className="orbital-field" aria-hidden="true"><i/><i/><i/><span className="pin p1"/><span className="pin p2"/><span className="pin p3"/><span className="pin p4"/><span className="pin p5"/><span className="pin p6"/></div>
        <div className="hero-copy"><p className="section-label">A tiny atlas of ordinary life</p><h1>Right now,<br/><em>elsewhere</em><br/>feels normal.</h1><p className="promise">Meet one of 48 carefully written, statistically grounded scenes from another part of the world—then place two moments side by side.</p><div className="truth"><strong>Every person is synthetic.</strong><span>No real identity. No live tracking. No location collected.</span></div><div className="start-row"><label>Choose a lens<select value={lens} onChange={event=>setLens(event.target.value)}><option value="everyday">Everyday rhythms</option><option value="connection">Connected life</option><option value="resources">Shared resources</option></select></label><button className="primary-action" onClick={begin}>Look across the world <span>↗</span></button></div></div>
        <aside className="edition"><span>EDITION 01</span><strong>6</strong><small>broad regions</small><strong>48</strong><small>reviewed scenes</small><p>Data snapshot<br/>27 AUG 2026</p></aside>
      </section>}
      {view==='scene'&&<section className="encounter" aria-live="polite">
        <div className="scene-index"><span>{String(position+1).padStart(2,'0')}</span><i/><small>OF 10 THIS VISIT</small></div><div className="portrait-wrap"><Portrait scene={scene}/><span className="synthetic-stamp">SYNTHETIC<br/>SCENE</span></div>
        <article className="scene-story"><div className="place-row"><p>{scene.regionLabel}</p><time>{scene.localTime}</time></div><h1>{scene.narrative}</h1><p className="context">This moment was written from a reviewed template. Its appearance is generated independently from region, wealth, religion, and circumstance.</p><SourceNote scene={scene}/><div className="scene-actions"><button className="primary-action" onClick={next}>Meet someone else <span>→</span></button><button onClick={save}>＋ Save for a pair</button><button onClick={sharePair}>Share via Eazo</button></div><button className="text-link" onClick={()=>setView('method')}>Why did this scene appear?</button></article>
      </section>}
      {view==='compare'&&<section className="comparison-page"><header><p className="section-label">Two moments, one world</p><h1>Difference without a scoreboard.</h1><p>National indicators provide context. They never decide an individual's story.</p></header><div className="pair-grid"><article><Portrait scene={scene}/><p className="pair-place">{scene.regionLabel} · {scene.localTime}</p><h2>{scene.narrative}</h2><SourceNote scene={scene}/></article><div className="pair-mark" aria-hidden="true">↔</div><article><Portrait scene={comparison}/><p className="pair-place">{comparison.regionLabel} · {comparison.localTime}</p><h2>{comparison.narrative}</h2><SourceNote scene={comparison}/></article></div><div className="comparison-rule">{comparisonResult.ranking===null?<><strong>No ranking shown</strong><span>{comparisonResult.reasonCode?.replaceAll('_',' ').toLowerCase()}. Each value keeps its own definition and year.</span></>:<><strong>Comparable context, not comparable people</strong><span>Both values use the same definition, unit, and a comparable year. We still do not label either life “higher” or “lower.”</span></>}</div><div className="scene-actions"><button className="primary-action" onClick={sharePair}>Share this pair via Eazo <span>↗</span></button><button onClick={next}>Change first scene</button></div></section>}
      {view==='method'&&<section className="method-page"><header><p className="section-label">Readable by design</p><h1>How the atlas is made.</h1><p>Versioned public statistics set a backdrop. Editorial templates supply an ordinary moment. A local generator creates a non-identifying portrait. None of those layers claims to describe a real person.</p></header><ol className="method-steps"><li><span>01</span><div><strong>Schedule a reviewed template</strong><p>48 templates cover 12 themes. High-sensitivity scenes never appear in the first three encounters.</p></div></li><li><span>02</span><div><strong>Check the evidence</strong><p>A scene is eligible only when its required indicator, definition, year, and license are complete.</p></div></li><li><span>03</span><div><strong>Create an independent portrait</strong><p>Visual seeds never receive region, religion, income, conflict, or user identity fields.</p></div></li><li><span>04</span><div><strong>Explain the limits</strong><p>Country-level estimates are context, not predictions about an individual household.</p></div></li></ol><div className="source-ledger"><div className="ledger-head"><span>INDICATOR</span><span>DEFINITION & COVERAGE</span><span>SOURCE</span></div>{Object.entries(indicatorRegistry).map(([id,item])=><article key={id}><div><code>{id}</code><strong>{item.name}</strong><small>{item.unit} · {item.version}</small></div><p>{item.definition}<small>{item.coverage} {item.transform} {item.rounding}</small></p><a href={item.sourceUrl} target="_blank" rel="noreferrer">World Bank ↗<small>{item.license}</small></a></article>)}</div><div className="build-note"><div><span>CONTENT</span><strong>{templates.length} / 48 reviewed</strong></div><div><span>SNAPSHOT SHA-256</span><code>{SNAPSHOT_SHA256}</code></div><div><span>EAZO RUNTIME</span><strong>{device.platform==='mobile'?'Mobile host connected':'Web fallback active'}</strong></div></div></section>}
      <p className="sr-only" role="status">{notice}</p>
    </main>
    <footer><span>Elsewhere, Now · Eazo Edition 01</span><span>Synthetic scenes · World Bank WDI · CC BY 4.0</span><button onClick={()=>{globalThis.localStorage?.removeItem(COLLECTION_KEY);setCollection([]);setNotice('Local collection cleared.')}}>Clear local data</button></footer>
  </div>
}
