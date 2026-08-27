# Elsewhere, Now — visual contrast and motion research

Date: 2026-08-27  
Scope: high-contrast, multi-element opening composition and rights-cleared motion media

## Research result

Recent short-form creator guidance repeatedly emphasizes a recognizable first-frame pattern interrupt, readable kinetic captions, vertical-native framing, split-screen contrast, and an immediate visual promise. These are editing patterns, not a license to reuse viral clips. Direct TikTok tag pages were blocked by robots.txt and the last-30-days social run had partial Reddit coverage plus a YouTube timeout, so no popularity claim from those failed sources is treated as evidence.

The implemented design translates the useful patterns into an original product composition:

- macro versus micro: orbital Earth footage beside three small ordinary-life fragments;
- motion versus stillness: a ten-second ISS night loop behind stable evidence and controls;
- light versus dark, near versus far: explicit visual rails and contrasting signal colors;
- first-frame hook: `ORBIT / 10 SEC`, `LIVE-FEEL · NOT LIVE`, three cuts, then the `48` scene anchor;
- vertical-native mobile: three equal-width cuts at 320–430 px, not a scaled desktop rail;
- attention without coercion: no endless feed, audio, auto-advance, countdown, fake live claim, or reused creator clip.

## Production media decision

Selected source: NASA JSC Crew Earth Observations, “Night pass over Africa and India,” Expedition 61, 2019-10.

- Canonical source: https://eol.jsc.nasa.gov/videos/crewearthobservationsvideos/
- Source file: https://eol.jsc.nasa.gov/videos/crewearthobservationsvideos/videos/Nightpass-Africa-and-India_ISS061_2019-10/Nightpass-Africa-and-India_ISS061_2019-10.mp4
- NASA media guidance: https://www.nasa.gov/nasa-brand-center/images-and-media/
- NASA SVS usage clarification: https://svs.gsfc.nasa.gov/help/
- Local transform: ten-second excerpt, muted, 960 × 640, H.264, contrast/saturation adjustment, 535,794 bytes.
- Product behavior: autoplay only when reduced-motion is not requested and data-saver is not enabled; static credited Earth poster otherwise.

## Trend references used for pattern study only

- YouTube hook analysis, 2026: https://www.youtube.com/watch?v=5A6XVQUopYA
- Short-form video trend summary, 2026: https://prodshort.com/blog/short-form-video-trends
- Hook-template survey, 2026: https://blitzcutai.com/blog/best-tiktok-hooks-2026
- Instagram motion-design hook example: https://www.instagram.com/reel/DVe2Kj3jW6s/

No audio, creator footage, template file, thumbnail, logo, or copyrighted viral clip from these references was copied into the product.

## Verification

- Desktop browser visual audit: 1440 × 900.
- Mobile browser visual audits: 390 × 844 and 320 × 568.
- Horizontal overflow: none in product content.
- Video: loaded, playing, and contained within the mobile cinematic panel.
- Automated suite: 17/17 Vitest checks and 10/10 Playwright checks passed.
- Production build: CSS gzip 5.52 KB; JavaScript gzip 290.21 KB; mandatory content 5,959,285 bytes.
