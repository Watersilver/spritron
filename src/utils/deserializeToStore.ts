import type { Store } from "../store/store";
import type { JsonFullExport } from "./jsonFullExport";

type DeserErr = {
  type: 'missing images' | 'something went wrong' | 'image index fail',
  errorObj?: any
};
type DeserResult = [
  success: true, error: null, parsed: JsonFullExport
] | [
  success: false, error: DeserErr, parsed: JsonFullExport
];

function deserializeToStore(data: string, store: Store): DeserResult {
  const json: JsonFullExport = JSON.parse(data); // Good luck

  // Fail if images are missing
  if (
    json.images.length
    !== json.images
      .filter(imgName => store.images.some(img => img.file.name === imgName))
      .length
  ) {
    return [false, {type: 'missing images'}, json];
  }

  let nextColId = store.nextColId;
  const newTransMaps: typeof store.transMaps = {};
  for (const [imgName, val] of Object.entries(json.transparenciesMap)) {
    newTransMaps[imgName] = [];
    for (const v of val) {
      newTransMaps[imgName].push([
        {r: v.colour.r*255, g: v.colour.g*255, b: v.colour.b*255},
        v.threshold*100,
        nextColId
      ]);
      nextColId++;
    }
  }

  let nextFramesId = store.nextFramesId;
  const newFrames: typeof store.frames = {};
  if (json._grid) {
    for (const [key, val] of Object.entries(json._grid)) {
      newFrames[key] = val.map(v => ({...v, id: nextFramesId++}));
    }
  }

  let nextAnimationId = store.nextAnimationId;
  let nextAnimationFrameId = store.nextAnimationFrameId;
  const newAnimations: typeof store.animations = [];

  try {
    for (const anim of json.animations) {
      newAnimations.push({
        columnLimit: anim._colLim ?? 20,
        fps: anim.fps,
        id: nextAnimationId++,
        loop: anim.loop,
        name: anim.name,
        padding: anim._pad ?? 1,
        pingPong: anim.pingPong || undefined,
        transfrom: anim.transform ? {
          rotation: anim.transform.rotation || undefined,
          mirror: anim.transform.mirror || undefined
        } : undefined,
        frames: anim.frames.map(f => {
          const image = json.images[f.i];
          if (!image) {
            throw Error("Image not found!");
          }
          return {
            id: nextAnimationFrameId++,
            bounds: [f.b.x, f.b.y, f.b.w, f.b.h],
            duration: f.d,
            image,
            offset: f.o,
            transfrom: f.t ? {
              rotation: f.t.r || undefined,
              mirror: f.t.m || undefined
            } : undefined
          };
        })
      });
    }
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "Image not found!") {
        return [false, {type: 'image index fail', errorObj: e}, json];
      } else {
        return [false, {type: 'something went wrong', errorObj: e}, json];
      }
    } else {
      return [false, {type: 'something went wrong', errorObj: e}, json];
    }
  }

  store.frames = newFrames;
  store.nextFramesId = nextFramesId;
  store.animations = newAnimations;
  store.nextAnimationId = nextAnimationId;
  store.nextAnimationFrameId = nextAnimationFrameId;
  store.transMaps = newTransMaps;
  store.nextColId = nextColId;

  return [true, null, json];
}

export default deserializeToStore