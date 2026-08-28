import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { device, share } from '@eazo/sdk';
import { buildAvatarSvg, compareScenes, publicSharePayload, scheduleScenes, type Scene } from './engine';
import { indicatorRegistry, SNAPSHOT_SHA256, templates } from './content';

type View = 'home'|'scene'|'compare'|'method';
type SceneMotion = 'idle'|'leaving-next'|'leaving-previous'|'entering-next'|'entering-previous';
const COLLECTION_KEY = 'life-elsewhere-collection-v1';
const loadCollection = (): Scene[] => { try { return JSON.parse(globalThis.localStorage?.getItem(COLLECTION_KEY) ?? '[]') as Scene[]; } catch { return []; } };

function Portrait({ scene }: { scene: Scene }) {
  return <figure className="portrait" style={{'--portrait-accent':scene.visual.top} as React.CSSProperties}>
    <div className="portrait-art" aria-hidden="true" dangerouslySetInnerHTML={{__html:buildAvatarSvg(scene.visual)}} />
    <figcaption><b>Possible portrait</b><span>Independent visual seed · not a real person</span></figcaption>
  </figure>;
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
  const [sceneMotion,setSceneMotion]=useState<SceneMotion>('idle');
  const pointerStart=useRef<{x:number;y:number;id:number}|null>(null);
  const transitionTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const scenes=useMemo(()=>scheduleScenes(`${sessionSeed}:${lens}`,10),[sessionSeed,lens]);
  const scene=scenes[position % scenes.length]!;
  const comparison=collection.find(item=>item.id!==scene.id) ?? scenes[(position+1)%scenes.length]!;
  const comparisonResult=compareScenes(scene,comparison);
  const earthImage=`${import.meta.env.BASE_URL}earth-at-night.webp`;
  const orbitFilm=`${import.meta.env.BASE_URL}iss-night-pulse.mp4`;
  const [motionAllowed]=useState(()=>{
    const saveData=(globalThis.navigator as Navigator & {connection?:{saveData?:boolean}} | undefined)?.connection?.saveData;
    return !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches && !saveData;
  });

  useEffect(()=>{
    const onOnline=()=>setOnline(true); const onOffline=()=>setOnline(false);
    globalThis.addEventListener?.('online',onOnline); globalThis.addEventListener?.('offline',onOffline);
    return()=>{globalThis.removeEventListener?.('online',onOnline);globalThis.removeEventListener?.('offline',onOffline)};
  },[]);

  useEffect(()=>()=>globalThis.clearTimeout(transitionTimer.current),[]);

  useLayoutEffect(()=>{ globalThis.scrollTo?.(0,0); },[view]);

  const begin=()=>{setSessionSeed(globalThis.crypto?.randomUUID?.() ?? String(Date.now()));setPosition(0);setView('scene')};
  const moveScene=(delta:1|-1)=>{
    if(sceneMotion!=='idle') return;
    const direction=delta===1?'next':'previous';
    setSceneMotion(`leaving-${direction}`);
    transitionTimer.current=globalThis.setTimeout(()=>{
      setPosition(value=>(value+delta+scenes.length)%scenes.length);
      setSceneMotion(`entering-${direction}`);
      transitionTimer.current=globalThis.setTimeout(()=>setSceneMotion('idle'),260);
    },180);
    setNotice(delta===1?'A new synthetic scene is ready.':'Returned to the previous synthetic scene.');
  };
  const next=()=>moveScene(1);
  const onPointerDown=(event:React.PointerEvent<HTMLElement>)=>{
    pointerStart.current={x:event.clientX,y:event.clientY,id:event.pointerId};
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerUp=(event:React.PointerEvent<HTMLElement>)=>{
    const start=pointerStart.current;
    pointerStart.current=null;
    if(!start || start.id!==event.pointerId) return;
    const horizontal=event.clientX-start.x;
    const vertical=event.clientY-start.y;
    if(Math.abs(horizontal)>52 && Math.abs(horizontal)>Math.abs(vertical)*1.25) moveScene(horizontal<0?1:-1);
  };
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
    <header className="topbar"><button className="wordmark" onClick={()=>setView('home')} aria-label="Go to home"><i/>ELSEWHERE, NOW</button><nav aria-label="Primary"><button aria-current={view==='scene'} onClick={()=>setView('scene')}><span>Encounter</span></button><button aria-current={view==='compare'} onClick={()=>setView('compare')}><span>Pair</span> <b>{collection.length}</b></button><button aria-current={view==='method'} onClick={()=>setView('method')}><span>Method</span></button></nav><span className={`connection ${online?'online':'offline'}`}>{online?'Live shell':'Offline ready'}</span></header>
    <main id="main" tabIndex={-1}>
      {view==='home'&&<section className="landing">
        <div className="hero-copy"><p className="section-label"><i/> A live-feeling atlas, without live tracking</p><h1>Right now,<br/><em>elsewhere</em><br/>feels normal.</h1><p className="promise">Step into one ordinary moment on the other side of the world. Pair it with another and notice difference without turning life into a ranking.</p><div className="start-row"><label>Choose your lens<select value={lens} onChange={event=>setLens(event.target.value)}><option value="everyday">Everyday life</option><option value="connection">Connection</option><option value="resources">Resources</option></select></label><button className="primary-action" onClick={begin}>Begin an encounter <span>↗</span></button></div><div className="truth"><strong>Every person is synthetic.</strong><span>No real identity. No live tracking. No location collected.</span></div></div>
        <figure className="atlas-visual">
          <img src={earthImage} alt="NASA Earth Observatory composite of Earth at night"/>
          {motionAllowed&&<video className="orbit-film" autoPlay loop muted playsInline preload="metadata" poster={earthImage} aria-hidden="true"><source src={orbitFilm} type="video/mp4"/></video>}
          <div className="night-wash"/><div className="scanline"/>
          <div className="film-kicker"><span><i/> ORBIT / 10 SEC</span><b>LIVE-FEEL · NOT LIVE</b></div>
          <div className="contrast-cuts" aria-hidden="true">
            <article className="cut dawn-cut"><small>DAWN / WEST</small><strong>06:12</strong><i/><span>A room turns warm.</span></article>
            <article className="cut signal-cut"><small>SIGNAL / EAST</small><strong>•••</strong><div><i/><i/><i/><i/></div><span>A message arrives.</span></article>
            <article className="cut water-cut"><small>PAUSE / SOUTH</small><strong>½</strong><i/><span>A glass waits.</span></article>
          </div>
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="pin p1"/><span className="pin p2"/><span className="pin p3"/><span className="pin p4"/><span className="pin p5"/><span className="pin p6"/>
          <div className="world-caption"><span>THE WORLD, HELD LIGHTLY</span><strong>48</strong><small>reviewed scenes across 6 broad regions</small></div>
          <div className="contrast-rail" aria-hidden="true"><span><i/>LIGHT</span><span><i/>DARK</span><span><i/>NEAR</span><span><i/>FAR</span></div>
          <figcaption>ISS night time-lapse: NASA JSC · edited, muted, visual context only</figcaption>
        </figure>
        <aside className="edition"><span>EDITION 01 · 27 AUG 2026</span><div><strong>48</strong><small>reviewed scenes</small></div><div><strong>12</strong><small>ordinary-life themes</small></div><p>Public statistics provide context.<br/>They never predict a person.</p></aside>
      </section>}
      {view==='scene'&&<section className="encounter" aria-live="polite">
        <div className="scene-index"><span>{String(position+1).padStart(2,'0')}</span><i/><small>OF 10 THIS VISIT</small></div>
        <div className="scene-stage">
          <div className={`scene-canvas ${sceneMotion}`} role="group" aria-label={`Encounter ${position+1} of ${scenes.length}. Swipe or use arrow keys to move between scenes.`} tabIndex={0} onKeyDown={event=>{if(event.key==='ArrowRight')moveScene(1);if(event.key==='ArrowLeft')moveScene(-1)}} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={()=>{pointerStart.current=null}}>
            <img src={earthImage} alt=""/><div className="portrait-wrap"><Portrait scene={scene}/><span className="synthetic-stamp">SYNTHETIC<br/>SCENE</span></div>
            <div className="frame-meta" aria-hidden="true"><span>ELSEWHERE / FRAME {String(position+1).padStart(2,'0')}</span><span>{scene.localTime}</span></div><p>ONE POSSIBLE MOMENT<br/>NOT A REAL PERSON</p>
          </div>
          <div className="scene-transport"><button aria-label="Previous scene" onClick={()=>moveScene(-1)} disabled={sceneMotion!=='idle'}>←</button><span>SWIPE THE FRAME</span><button aria-label="Next scene" onClick={()=>moveScene(1)} disabled={sceneMotion!=='idle'}>→</button></div>
          <div className="scene-filmstrip" aria-label="This visit's encounters">{scenes.map((item,index)=><button key={item.id} aria-label={`Go to encounter ${index+1}`} aria-current={index===position} onClick={()=>{if(sceneMotion==='idle'&&index!==position){setSceneMotion(index>position?'leaving-next':'leaving-previous');transitionTimer.current=globalThis.setTimeout(()=>{setPosition(index);setSceneMotion(index>position?'entering-next':'entering-previous');transitionTimer.current=globalThis.setTimeout(()=>setSceneMotion('idle'),260)},180)}}}><i style={{background:item.visual.top}}/><span>{String(index+1).padStart(2,'0')}</span></button>)}</div>
        </div>
        <article className="scene-story"><div className="place-row"><p>{scene.regionLabel}</p><time>{scene.localTime}</time></div><h1>{scene.narrative}</h1><p className="context">This moment was written from a reviewed template. Its appearance is generated independently from region, wealth, religion, and circumstance.</p><SourceNote scene={scene}/>{collection.length>0&&<aside className="pair-dock"><div><small>YOUR CONTACT SHEET</small><strong>{collection.length} moment{collection.length===1?'':'s'} saved on this device</strong></div><button onClick={()=>setView('compare')}>Open pair <span>↗</span></button></aside>}<div className="scene-actions"><button className="primary-action" onClick={next} disabled={sceneMotion!=='idle'}>Meet someone else <span>→</span></button><button onClick={save}>＋ Save for a pair</button><button onClick={sharePair}>Share via Eazo</button></div>{notice&&<p className="scene-notice">{notice}</p>}<button className="text-link" onClick={()=>setView('method')}>Why did this scene appear?</button></article>
      </section>}
      {view==='compare'&&<section className="comparison-page"><header><p className="section-label">Two moments, one world</p><h1>Difference without a scoreboard.</h1><p>National indicators provide context. They never decide an individual's story.</p></header><div className="pair-grid"><article className={`pair-primary ${sceneMotion}`}><Portrait scene={scene}/><p className="pair-place">{scene.regionLabel} · {scene.localTime}</p><h2>{scene.narrative}</h2><SourceNote scene={scene}/></article><div className="pair-mark" aria-hidden="true">↔</div><article><Portrait scene={comparison}/><p className="pair-place">{comparison.regionLabel} · {comparison.localTime}</p><h2>{comparison.narrative}</h2><SourceNote scene={comparison}/></article></div><div className="comparison-rule">{comparisonResult.ranking===null?<><strong>No ranking shown</strong><span>{comparisonResult.reasonCode?.replaceAll('_',' ').toLowerCase()}. Each value keeps its own definition and year.</span></>:<><strong>Comparable context, not comparable people</strong><span>Both values use the same definition, unit, and a comparable year. We still do not label either life “higher” or “lower.”</span></>}</div><div className="scene-actions"><button className="primary-action" onClick={sharePair}>Share this pair via Eazo <span>↗</span></button><button onClick={next} disabled={sceneMotion!=='idle'}>Change first scene</button></div></section>}
      {view==='method'&&<section className="method-page"><header><p className="section-label">Readable by design</p><h1>How the atlas is made.</h1><p>Versioned public statistics set a backdrop. Editorial templates supply an ordinary moment. A local generator creates a non-identifying portrait. None of those layers claims to describe a real person.</p></header><ol className="method-steps"><li><span>01</span><div><strong>Schedule a reviewed template</strong><p>48 templates cover 12 themes. High-sensitivity scenes never appear in the first three encounters.</p></div></li><li><span>02</span><div><strong>Check the evidence</strong><p>A scene is eligible only when its required indicator, definition, year, and license are complete.</p></div></li><li><span>03</span><div><strong>Create an independent portrait</strong><p>Visual seeds never receive region, religion, income, conflict, or user identity fields.</p></div></li><li><span>04</span><div><strong>Explain the limits</strong><p>Country-level estimates are context, not predictions about an individual household.</p></div></li></ol><div className="source-ledger"><div className="ledger-head"><span>INDICATOR</span><span>DEFINITION & COVERAGE</span><span>SOURCE</span></div>{Object.entries(indicatorRegistry).map(([id,item])=><article key={id}><div><code>{id}</code><strong>{item.name}</strong><small>{item.unit} · {item.version}</small></div><p>{item.definition}<small>{item.coverage} {item.transform} {item.rounding}</small></p><a href={item.sourceUrl} target="_blank" rel="noreferrer">World Bank ↗<small>{item.license}</small></a></article>)}</div><div className="build-note"><div><span>CONTENT</span><strong>{templates.length} / 48 reviewed</strong></div><div><span>SNAPSHOT SHA-256</span><code>{SNAPSHOT_SHA256}</code></div><div><span>EAZO RUNTIME</span><strong>{device.platform==='mobile'?'Mobile host connected':'Web fallback active'}</strong></div></div></section>}
      <p className="sr-only" role="status">{notice}</p>
    </main>
    <footer><span>Elsewhere, Now · Eazo Edition 01</span><span>Synthetic scenes · World Bank WDI · CC BY 4.0</span><button onClick={()=>{globalThis.localStorage?.removeItem(COLLECTION_KEY);setCollection([]);setNotice('Local collection cleared.')}}>Clear local data</button></footer>
  </div>
}
