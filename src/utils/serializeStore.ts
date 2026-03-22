import { deproxify } from "../libs/proxy-state";
import type { Store } from "../store/store";
import type { JsonFullExport } from "./jsonFullExport";

export default function serializeStore(
  store: Store,
  /** Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read. */
  space?: string | number | undefined
) {
  const imagesSet = new Set<string>();
  store.animations.forEach(a => a.frames.forEach(f => imagesSet.add(f.image)));
  const transparenciesMap: {
    [imageName: string]: {colour: {r: number; g: number; b: number;}, threshold: number;}[];
  } = {};
  for (const im of imagesSet) {
    if (store.transMaps[im]) {
      transparenciesMap[im] = store.transMaps[im].map(c => {
        return {
          colour: {r: c[0].r / 255, g: c[0].g / 255, b: c[0].b / 255},
          threshold: c[1] / 100
        };
      });
    }
  }
  const images = [...imagesSet];

  const json: JsonFullExport = {
    images,
    transparenciesMap,
    _grid: deproxify(store.frames),
    animations: deproxify(store.animations).map(a => {
      const w = a.frames.reduce((acc,c,i) => {
        const f = a.frames[i];
        let r = a.transfrom?.rotation ?? 0;
        r += f?.transfrom?.rotation ?? 0;
        const w = (r === 90 || r === 270 ? c.bounds[3] : c.bounds[2]) + (f?.offset.x ?? 0);
        return w > acc ? w : acc;
      }, 0);
      const h = a.frames.reduce((acc,c,i) => {
        const f = a.frames[i];
        let r = a.transfrom?.rotation ?? 0;
        r += f?.transfrom?.rotation ?? 0;
        const h = (r === 90 || r === 270 ? c.bounds[2] : c.bounds[3]) + (f?.offset.y ?? 0);
        return h > acc ? h : acc;
      }, 0);
      return {
        name: a.name,
        fps: a.fps,
        loop: !!a.loop,
        pingPong: a.pingPong ? {
          noFirst: !!a.pingPong.noFirst,
          noLast: !!a.pingPong.noLast
        } : null,
        transform: a.transfrom && (a.transfrom.rotation !== undefined || a.transfrom.mirror) ? {
          rotation: a.transfrom.rotation ?? null,
          mirror: a.transfrom.mirror ? {
            x: !!a.transfrom.mirror.x,
            y: !!a.transfrom.mirror.y
          } : null
        } : null,
        frameDimensions: {w,h},
        frames: a.frames.map(f => {
          return {
            i: images.findIndex(i => i === f.image),
            d: f.duration,
            t: f.transfrom && (f.transfrom.rotation !== undefined || f.transfrom.mirror) ? {
              r: f.transfrom.rotation ?? null,
              m: f.transfrom.mirror ? {
                x: !!f.transfrom.mirror.x,
                y: !!f.transfrom.mirror.y
              } : null
            } : null,
            b: {x: f.bounds[0], y: f.bounds[1], w: f.bounds[2], h: f.bounds[3]},
            o: f.offset
          }
        }),
        framesLength: a.frames.length + (a.pingPong ? a.frames.length : 0) - (a.pingPong?.noFirst ? 1 : 0) - (a.pingPong?.noLast ? 1 : 0),
        _colLim: a.columnLimit,
        _pad: a.padding,
      };
    })
  };

  return JSON.stringify(json,null,space);
}