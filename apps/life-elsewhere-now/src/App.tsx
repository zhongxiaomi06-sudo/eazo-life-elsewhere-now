import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { share } from '@eazo/sdk';
import { selectHostAdapter } from '@eazo/platform';
import { compareScenes, pickDuelOpponent, publicSharePayload, scheduleScenes, type Scene } from './engine';
import { indicatorRegistry, regions, SNAPSHOT_SHA256, templates } from './content';
import { postcardForRegion, postcards } from './postcards';
import { isMuted, play, setMuted } from './sound';

type View = 'home'|'scene'|'compare'|'method'|'summary';
type DuelState = 'ask'|'reveal';
type Side = 'left'|'right';
const COLLECTION_KEY = 'life-elsewhere-collection-v1';
const loadCollection = (): Scene[] => { try { return JSON.parse(globalThis.localStorage?.getItem(COLLECTION_KEY) ?? '[]') as Scene[]; } catch { return []; } };

function Portrait({ scene }: { scene: Scene }) {
  const card = postcardForRegion(scene.regionId);
  return <figure className="portrait"><img src={card.img} alt={`Synthetic postcard from ${card.country} — ${card.caption}`} loading="lazy"/></figure>;
}

function SourceNote({ scene, hidden, highlight }: { scene: Scene; hidden?: boolean|undefined; highlight?: boolean|undefined }) {
  const indicator=indicatorRegistry[scene.indicatorId];
  return <div className="source-note">{hidden?<span className="duel-blank">· · ·</span>:<span className={highlight?'duel-highlight':undefined}>{scene.value.toFixed(1)}%</span>}<div><strong>{indicator.name}</strong><small>{scene.year} · national estimate</small></div></div>;
}

function DuelCard({ scene, hidden, winner, onPick }: { scene: Scene; hidden?: boolean|undefined; winner?: 'win'|'lose'|undefined; onPick?: (()=>void)|undefined }) {
  return <div className={`duel-card${onPick?' pickable':''}${winner?' duel-'+winner:''}`} role={onPick?'button':undefined} tabIndex={onPick?0:undefined} onClick={onPick} onKeyDown={onPick?((event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onPick();}}):undefined} aria-label={`${scene.regionLabel} — guess this one is higher`}>
    <Portrait scene={scene}/>
    <p className="pair-place">{scene.regionLabel} · {scene.localTime}</p>
    <h2>{scene.narrative}</h2>
    <SourceNote scene={scene} hidden={hidden} highlight={winner==='win'}/>
  </div>;
}

export function App(){
  const coverImage=`${import.meta.env.BASE_URL}cover.jpg`;
  const [view,setView]=useState<View>('home');
  const [lens]=useState('everyday');
  const [sessionSeed,setSessionSeed]=useState('first-visit');
  const [position,setPosition]=useState(0);
  const [collection,setCollection]=useState<Scene[]>(loadCollection);
  const [notice,setNotice]=useState('');
  const [host,setHost]=useState<{mode:'web'|'eazo';share:boolean}>({mode:'web',share:false});
  const scenes=useMemo(()=>scheduleScenes(`${sessionSeed}:${lens}`,Object.keys(regions).length),[sessionSeed,lens]);
  const scene=scenes[position % scenes.length]!;
  const earthImage=`${import.meta.env.BASE_URL}earth-at-night.webp`;

  // 对决状态:进入 Pair 时以当前场景为锚点,选同指标对手,猜哪边数值更高。
  const [duelAnchor,setDuelAnchor]=useState<Scene>(scene);
  const [duelOpponent,setDuelOpponent]=useState<Scene>(scene);
  const [duelState,setDuelState]=useState<DuelState>('ask');
  const [duelGuess,setDuelGuess]=useState<Side|null>(null);
  const [pairCorrect,setPairCorrect]=useState(0);
  const [pairAsked,setPairAsked]=useState(0);

  // 区域集邮:滑到新区域即点亮徽章,并给短暂提示。
  const [regionsFound,setRegionsFound]=useState<string[]>([]);
  const [regionFlash,setRegionFlash]=useState('');
  const [soundOn,setSoundOn]=useState<boolean>(()=>!isMuted());

  const resolveOpponent=(anchor:Scene)=>pickDuelOpponent(scenes,anchor) ?? scenes.find((item)=>item.id!==anchor.id) ?? anchor;
  useEffect(()=>{
    if(view!=='compare')return;
    setDuelAnchor(scene);
    setDuelOpponent(resolveOpponent(scene));
    setDuelState('ask');
    setDuelGuess(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[view]);

  useEffect(()=>{
    if(view!=='scene'||regionsFound.includes(scene.regionId))return;
    const completesAtlas=regionsFound.length+1>=Object.keys(regions).length;
    setRegionsFound((prev)=>[...prev,scene.regionId]);
    setRegionFlash(scene.regionLabel);
    play(completesAtlas?'complete':'collect');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[scene.regionId,view]);
  useEffect(()=>{
    if(!regionFlash)return;
    const timer=setTimeout(()=>setRegionFlash(''),2800);
    return()=>clearTimeout(timer);
  },[regionFlash]);

  // Eazo 宿主探测:检测注入的宿主桥,并在宿主支持时用宿主缓存预取明信片资源。
  useEffect(()=>{
    let alive=true;
    (async()=>{
      const adapter=selectHostAdapter();
      const caps=await adapter.getCapabilities();
      if(!alive)return;
      const inHost=caps.share||caps.remix||caps.cacheBundle;
      setHost({mode:inHost?'eazo':'web',share:Boolean(caps.share)});
      if(caps.cacheBundle){
        const urls=[earthImage,...postcards.map(card=>card.img)];
        void adapter.cacheBundle({appId:'life-elsewhere-now',version:'1.0.0-rc.2',urls,expectedBytes:24_000_000}).catch(()=>{});
      }
    })().catch(()=>{});
    return()=>{alive=false};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useLayoutEffect(()=>{ globalThis.scrollTo?.(0,0); },[view]);

  // 场景/首页锁定整屏:禁止上下滚动,左右滑动(切换场景)保留;其余页面可滚动。
  useEffect(()=>{
    const locked=view==='home'||view==='scene';
    const html=document.documentElement;
    const body=document.body;
    const prevHtml=html.style.overflow;
    const prevBody=body.style.overflow;
    if(locked){html.style.overflow='hidden';body.style.overflow='hidden';}
    return()=>{html.style.overflow=prevHtml;body.style.overflow=prevBody;};
  },[view]);

  const begin=()=>{play('begin');setSessionSeed(globalThis.crypto?.randomUUID?.() ?? String(Date.now()));setPosition(0);setRegionsFound([]);setPairCorrect(0);setPairAsked(0);setView('scene')};
  const save=()=>{
    if(collection.some(item=>item.id===scene.id)){setNotice('Already in your pair collection.');return}
    const nextCollection=[...collection,scene].slice(-20);setCollection(nextCollection);globalThis.localStorage?.setItem(COLLECTION_KEY,JSON.stringify(nextCollection));setNotice('Saved on this device.');play('save');
  };
  const sharePair=async()=>{
    const payload=publicSharePayload(view==='compare'?[duelAnchor,duelOpponent]:[scene]);
    const text=`Somewhere else, ordinary looks different. ${scene.regionLabel}: ${scene.narrative} Synthetic scene · ${scene.year} reference data. Try your own perspective.`;
    if(!host.share){
      try { await globalThis.navigator?.clipboard?.writeText(`${text}\n${JSON.stringify(payload)}`); setNotice('Share text copied. Eazo sharing is available in the mobile app.'); }
      catch { setNotice('Eazo sharing is available in the mobile app.'); }
      return;
    }
    try { const result=await share.compose({text,sourceAppId:'life-elsewhere-now',targetPath:'/?from=share'}); setNotice(result.accepted?'Opened in Eazo. Review before publishing.':'Eazo sharing is available in the mobile app. The text is ready to copy.'); }
    catch { await globalThis.navigator?.clipboard?.writeText(`${text}\n${JSON.stringify(payload)}`); setNotice('Share was unavailable, so a privacy-safe version was copied.'); }
  };

  // 单手玩法:首页上滑开始,场景页左右滑动切换;键盘方向键同效。
  const step=(delta:number)=>{play('tick');setPosition((current)=>(current+delta+scenes.length)%scenes.length)};
  const [touchStart,setTouchStart]=useState<{x:number;y:number}|null>(null);
  const onTouchStart=(event:React.TouchEvent)=>{const point=event.touches[0];if(point)setTouchStart({x:point.clientX,y:point.clientY});};
  const onTouchEnd=(event:React.TouchEvent)=>{
    const start=touchStart;if(!start)return;
    const point=event.changedTouches[0];if(!point)return;
    const dx=point.clientX-start.x;const dy=point.clientY-start.y;
    setTouchStart(null);
    if(view==='home'){if(dy<-70)begin();return;}
    if(view==='scene'&&Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>64)step(dx<0?1:-1);
  };
  useLayoutEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      if(view==='home'&&event.key==='ArrowUp'){event.preventDefault();begin();}
      else if(view==='scene'&&event.key==='ArrowRight'){event.preventDefault();step(1);}
      else if(view==='scene'&&event.key==='ArrowLeft'){event.preventDefault();step(-1);}
    };
    globalThis.addEventListener('keydown',handler);
    return()=>globalThis.removeEventListener('keydown',handler);
  });

  // 对决判定与文案
  const duelResult=compareScenes(duelAnchor,duelOpponent);
  const duelWinnerSide: Side|null=duelResult.ranking==='left'?'left':duelResult.ranking==='right'?'right':null;
  const duelIndicator=indicatorRegistry[duelAnchor.indicatorId];
  const guess=(side:Side)=>{
    if(duelState!=='ask')return;
    setDuelGuess(side);
    setDuelState('reveal');
    setPairAsked((count)=>count+1);
    play(duelResult.ranking===side?'win':'lose');
    if(duelResult.ranking===side)setPairCorrect((count)=>count+1);
  };
  const nextDuel=()=>{
    play('tick');
    const index=scenes.indexOf(duelAnchor);
    const anchor=scenes[(index+1)%scenes.length]!;
    setDuelAnchor(anchor);
    setDuelOpponent(resolveOpponent(anchor));
    setDuelState('ask');
    setDuelGuess(null);
  };
  const duelOutcomeText=()=>{
    if(duelResult.ranking==='same')return `= It's a tie — both regions at ${duelAnchor.value.toFixed(1)}%.`;
    const high=duelWinnerSide==='left'?duelAnchor:duelOpponent;
    const low=duelWinnerSide==='left'?duelOpponent:duelAnchor;
    const correct=duelGuess===duelWinnerSide;
    return `${correct?'✓ +1':'✗'} — ${high.regionLabel} is higher on ${duelIndicator.name} (${high.value.toFixed(1)}% vs ${low.value.toFixed(1)}%).`;
  };
  const atlasComplete=regionsFound.length>=Object.keys(regions).length;

  return <div className="world-app" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <a className="skip-link" href="#main">Skip to experience</a>
    <main id="main" tabIndex={-1}>
      {view==='home'&&<section className="landing">
        <figure className="cover">
          <img src={coverImage} alt="Cover — Migrant Mother, Dorothea Lange (1936)"/>
          <div className="cover-shade"/>
          <div className="cover-copy">
            <h1>Right now, elsewhere, life is ordinary.</h1>
            <p className="swipe-hint">10 region-matched postcards — swipe up to begin</p>
            <button className="primary-action" onClick={begin}>Start <span>↗</span></button>
          </div>
        </figure>
      </section>}
      {view==='scene'&&<section className="encounter" aria-live="polite">
        <div className="scene-index"><span>{String(position+1).padStart(2,'0')}</span><i/><small>OF {scenes.length} THIS VISIT</small></div>
        <div className="scene-canvas" key={position}>
          <img src={earthImage} alt=""/><div className="portrait-wrap"><Portrait scene={scene}/><span className="synthetic-stamp">SYNTHETIC<br/>SCENE</span></div>
          {regionFlash&&<div className="region-toast" aria-hidden="true">✦ New region — {regionFlash}</div>}
        </div>
        <article className="scene-story"><p className="how-it-works">✦ Region-matched picture · real indicator · synthetic person — one postcard per region</p><div className="place-row"><p>{scene.regionLabel}</p><time>{scene.localTime}</time></div><SourceNote scene={scene}/><div className="scene-actions"><button onClick={save}>＋ Save</button><button onClick={sharePair}>Share</button></div><div className="scene-progress" role="progressbar" aria-label={`Scene ${position+1} of ${scenes.length}`} aria-valuemin={1} aria-valuemax={scenes.length} aria-valuenow={position+1}><span style={{width:`${((position+1)/scenes.length)*100}%`}}/></div>{position===scenes.length-1?<button className="finish-journey" onClick={()=>{play('journey');setView('summary')}}>Finish journey <span>→</span></button>:<small className="swipe-tip">{atlasComplete?`✦ Atlas complete — all ${Object.keys(regions).length} regions today`:`${regionsFound.length}/${Object.keys(regions).length} regions · swipe to explore`}</small>}</article>
      </section>}
      {view==='compare'&&<section className="comparison-page"><header><p className="section-label">Atlas duel</p><h1>Guess the higher number.</h1><p className="duel-score">SCORE {pairCorrect} · {pairAsked} played · same indicator, same year</p></header>{duelState==='ask'?<p className="duel-prompt">Two regions, one indicator. Which is higher on “{duelIndicator.name}”?</p>:<p className="duel-result">{duelOutcomeText()}<small>Numbers, not verdicts.</small></p>}<div className="pair-grid duel">{duelState==='ask'
          ?<><DuelCard scene={duelAnchor} hidden onPick={()=>guess('left')}/><div className="pair-mark" aria-hidden="true">vs</div><DuelCard scene={duelOpponent} hidden onPick={()=>guess('right')}/></>
          :<><DuelCard scene={duelAnchor} winner={duelWinnerSide?duelWinnerSide==='left'?'win':'lose':undefined}/><div className="pair-mark" aria-hidden="true">vs</div><DuelCard scene={duelOpponent} winner={duelWinnerSide?duelWinnerSide==='right'?'win':'lose':undefined}/></>}</div><div className="comparison-rule"><strong>Numbers, not verdicts</strong><span>Same indicator, same definition, same year — the higher value wins this round. We still never label either life “higher” or “lower.”</span></div><div className="scene-actions">{duelState==='reveal'&&<button className="primary-action" onClick={nextDuel}>Next pair <span>→</span></button>}<button onClick={sharePair}>Share this pair via Eazo <span>↗</span></button><button onClick={()=>{setPosition(0);setView('scene')}}>Back to the visit</button></div></section>}
      {view==='summary'&&<section className="summary-page"><header><p className="section-label">This visit</p><h1>The atlas, in numbers.</h1></header><div className="summary-grid"><div className="summary-stat"><span>{scenes.length}</span><strong>postcards seen</strong></div><div className="summary-stat"><span>{regionsFound.length}/{Object.keys(regions).length}</span><strong>regions discovered</strong></div><div className="summary-stat"><span>{pairCorrect}/{pairAsked}</span><strong>duels won</strong></div><div className="summary-stat"><span>{pairCorrect}</span><strong>duel score</strong></div></div><div className="region-badges">{Object.entries(regions).map(([id,region])=><span key={id} className={`region-badge${regionsFound.includes(id)?' on':''}`}>{region.label}</span>)}</div><p className="summary-note">Every visit reshuffles the atlas. The numbers are real; the people are synthetic; no scene ranks a life.</p><button className="primary-action" onClick={begin}>Begin another visit <span>↗</span></button></section>}
      {view==='method'&&<section className="method-page"><header><p className="section-label">Readable by design</p><h1>How the atlas is made.</h1></header><ol className="method-steps"><li><span>01</span><div><strong>Reviewed template</strong><p>{templates.length} templates, 12 themes.</p></div></li><li><span>02</span><div><strong>Check evidence</strong><p>Indicator, year and license complete.</p></div></li><li><span>03</span><div><strong>Independent portrait</strong><p>No region, income or identity seeds.</p></div></li><li><span>04</span><div><strong>State the limits</strong><p>Context, never a prediction.</p></div></li></ol><div className="source-ledger"><div className="ledger-head"><span>INDICATOR</span><span>DEFINITION & COVERAGE</span><span>SOURCE</span></div>{Object.entries(indicatorRegistry).map(([id,item])=><article key={id}><div><code>{id}</code><strong>{item.name}</strong><small>{item.unit} · {item.version}</small></div><p>{item.definition}<small>{item.coverage} {item.transform} {item.rounding}</small></p><div><a href={item.sourceUrl} target="_blank" rel="noreferrer">World Bank ↗</a><small>License: {item.license}</small><small>Definition hash: {item.definitionHash}</small></div></article>)}</div><div className="build-note"><div><span>SNAPSHOT</span><strong>{templates.length} / {templates.length} reviewed</strong></div><div><span>DATA VERSION</span><code>{indicatorRegistry['IT.NET.USER.ZS']?.version}</code></div><div><span>SNAPSHOT SHA-256</span><code>{SNAPSHOT_SHA256}</code></div><div><span>RUNTIME</span><strong>{host.mode==='eazo'?'Eazo host bridge active':'Web fallback active'}</strong></div></div></section>}
      <p className="sr-only" role="status">{notice}</p>
    </main>
    {(view==='scene'||view==='compare'||view==='method')&&<footer><nav aria-label="More pages"><button onClick={()=>setView('compare')}>Pair</button><button onClick={()=>setView('method')}>Method</button><button className={`sound-toggle${soundOn?'':' off'}`} onClick={()=>{const next=!soundOn;setSoundOn(next);setMuted(!next);}} aria-label={soundOn?'Mute sound':'Unmute sound'} aria-pressed={soundOn}>Sound {soundOn?'on':'off'}</button></nav></footer>}
  </div>
}
