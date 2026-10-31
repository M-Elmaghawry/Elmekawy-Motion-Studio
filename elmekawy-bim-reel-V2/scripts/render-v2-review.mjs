import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync, writeFileSync} from 'node:fs';
import {basename, resolve} from 'node:path';
import {getCompositions, openBrowser, renderStill} from '@remotion/renderer';

assert.equal(basename(process.cwd()), 'elmekawy-bim-reel-V2', 'Run from V2 only');
const serveUrl = resolve('build');
mkdirSync('out/review', {recursive: true});
const browser = await openBrowser('chrome');
try {
  const compositions = await getCompositions({serveUrl, inputProps: {}, puppeteerInstance: browser});
  const composition = compositions.find(({id}) => id === 'ElmekawyBIMIntroV2');
  const baseline = compositions.find(({id}) => id === 'ElmekawyBIMIntro');
  assert.ok(composition && baseline);
  assert.deepEqual([composition.width, composition.height, composition.fps, composition.durationInFrames], [1080, 1920, 30, 360]);
  assert.equal(baseline.durationInFrames, 900);
  const frames = [0, 45, 59, 60, 110, 134, 135, 165, 200, 224, 225, 245, 285, 299, 300, 345, 359];
  const hashes = {};
  const render = async (frame, name, config = composition) => {
    const {buffer} = await renderStill({serveUrl, composition: config, puppeteerInstance: browser,
      frame, imageFormat: 'png', output: null, inputProps: {}});
    assert.ok(buffer);
    writeFileSync(`out/review/${name}.png`, buffer);
    return createHash('sha256').update(buffer).digest('hex');
  };
  for (const frame of frames) {
    hashes[frame] = await render(frame, `v2-${String(frame).padStart(3, '0')}`);
    console.log(`Rendered V2 frame ${frame}`);
  }
  for (const frame of [200, 45, 345, 110]) {
    assert.equal(await render(frame, `seek-${frame}`), hashes[frame], `Seek changed frame ${frame}`);
  }
  const fallback = {...composition, props: {assets: {structural: false, logo: false, before: false, after: false}}};
  await render(110, 'fallback-structural', fallback);
  await render(345, 'fallback-mark', fallback);
  await render(45, 'baseline-v1', baseline);
  const report = {compositions: compositions.map(({id, width, height, fps, durationInFrames}) => ({id, width, height, fps, durationInFrames})),
    detectedV2Assets: composition.props.assets, frames, seekChecks: [200, 45, 345, 110], hashes,
    result: 'PASS: registration, 17 sampled frames, four nonsequential repeated PNG hashes, two missing-asset fallbacks, copied V1 still'};
  writeFileSync('out/review/render-checks.json', JSON.stringify(report, null, 2));
  console.log(report.result);
} finally {
  await browser.close({silent: true});
}
