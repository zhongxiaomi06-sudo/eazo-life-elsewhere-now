import{StrictMode}from'react';import{createRoot}from'react-dom/client';import'./styles.css';import'./desktop-short.css';import{App}from'./App';import{initPreviewInspector}from'./preview-inspector';
// 创作者审查工具: 仅在 URL 带 ?inspector=1 时激活,默认零影响。
initPreviewInspector();
// Service Worker 策略:
// - 生产构建:注册正式的离线 service worker(content/sw.js,网络优先 + 外壳预缓存)。
// - 开发/预览:注销任何已注册的 SW 并清空缓存,避免旧版本被缓存导致预览不更新。
if('serviceWorker'in navigator){
  if(import.meta.env.PROD){
    globalThis.addEventListener?.('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{/* 宿主不支持时静默降级,应用仍可在线使用 */})});
  }else{
    navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
    if('caches'in globalThis){caches.keys().then(ks=>ks.forEach(k=>caches.delete(k)))}
  }
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
