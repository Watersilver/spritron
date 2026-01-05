import { Texture } from "pixi.js";
import { proxify, subscribe, createReactHook } from "../libs/proxy-state";
import { useEffect, useState } from "react";

class ImageAsset {
  #file: File;
  #texture: Texture;
  #bitmap: ImageBitmap;

  constructor(file: File, texture: Texture, bitmap: ImageBitmap) {
    this.#file = file;
    this.#texture = texture;
    this.#bitmap = bitmap;
  }

  get file() {return this.#file;}
  get texture() {return this.#texture;}
  get bitmap() {return this.#bitmap;}
};

type ColorHex = number;
type ColorRange = ColorHex | [ColorHex, ColorHex];

type ColorTransform = {
  shader?: string;
  transparentColors?: [];
  colorMap?: {from: ColorRange, to: ColorHex;};
};

type Transform = {
  rotation?: 90 | 180 | 270;
  mirror?: {x: boolean; y: boolean;};
};

type Store = {
  files: File[];
  images: ImageAsset[];
  frames: {
    [imageName: string]: {
      id: number;
      name: string;
      position: {x: number; y: number};
      padding: {x: number; y: number};
      dimensions: {x: number; y: number};
      grid: {x: number; y: number};
    }[];
  };
  animations: {
    id: number;
    name: string;
    frames: {
      /** Base Texture that this frame uses */
      image: string;
      /** This frame will last `durationFactor` frames */
      durationFactor: number;
      /** The actual part of the texture this frame uses */
      bounds: [x: number, y: number, w: number, h: number];
      anchor: {x: number; y: number;};
      colorTransform?: ColorTransform;
      transfrom?: Transform;
    }[];
    fps: number;
    loop?: boolean;
    pingPong?: boolean;
    // Do not apply these settings to texture itself,
    // because the user could easily do it themself
    // with something like gimp
    colorTransform?: ColorTransform;
    padding: number;
    columnLimit: number;
    transfrom?: Transform;
  }[];
  shaders?: {
    id: number;
    name: string;
    code: string;
  }[];
  workArea: {
    scale: number;
    mousePos: {x: number; y: number;};
    pos: {x: number; y: number;};
    grabbing: boolean;
    pointing: {
      framesId: number;
      x: number; y: number;
      w: number; h: number;
    } | null;
  };
  animFrames: {
    height: number;
    grabbing: boolean;
    transforms: {
      [animId: number]: {
        scale: number;
        pos: {x: number; y: number;};
      }
    };
  };
  selectedImage: string | null;
  selectedFrames: number | null;
  selectedAnimation: number | null;
  mousePos: {x: number; y: number;};
  nextFramesId: number;
  nextAnimationId: number;
  canvasColor: string;
};

const store = proxify<Store>({
  files: [],
  images: [],
  frames: {},
  workArea: {
    scale: 1,
    mousePos: { x: 0, y: 0 },
    pos: {x: 0, y: 0},
    pointing: null,
    grabbing: false
  },
  animFrames: {
    height: 33,
    grabbing: false,
    transforms: {}
  },
  animations: [],
  selectedImage: null,
  selectedFrames: null,
  selectedAnimation: null,
  mousePos: {x: 0, y: 0},
  nextFramesId: 0,
  nextAnimationId: 0,
  canvasColor: localStorage.getItem("canvasColor") ?? "#000",
});

// This horrible thing need to exist because of the await of createImageBitmap that introduces
// weird race conditions. If files length changes via push it runs a lot of times and fucks everything up.
// It would be best if async functions pased to subscribe had a way to only run in a promise
// but since no such functionality is implemented in the state library
// we have to use this workaround which prevents the relevant code to run many times
// even though the function gets called for every length change
let imagePopulationCallbackRunning = false;
let prevFiles: File[] = [];
subscribe(() => store.files.length, async () => {
  if (imagePopulationCallbackRunning) return;
  imagePopulationCallbackRunning = true;
  await Promise.resolve();

  // Cleanup prev
  const orphanFiles = prevFiles.filter(pf => !store.files.some(f => f.name === pf.name));
  prevFiles = [...store.files];

  const cleaned: ImageAsset[] = [];
  for (const i of store.images) {
    if (orphanFiles.some(f => i.file === f)) {

      // Hackery for the hack fraud gods
      // (avoids a crash because the texture migh still be in use in the texture displayer renderer)
      setTimeout(() => {
        i.bitmap.close();
        i.texture.destroy(true);
      }, 100);

      cleaned.push(i);
    }
  }

  store.images = store.images.filter(i => !cleaned.some(ia => ia === i));

  // Add new
  const newImages: ImageAsset[] = [];
  for (const file of store.files) {
    if (file.type.includes("image")) {
      if (!store.images.some(i => i.file.name === file.name)) {
        const bitmap = await createImageBitmap(file);
        const t = Texture.from(bitmap);
        newImages.push(new ImageAsset(file, t, bitmap));
      }
    }
  }
  store.images.push(...newImages);

  const lastNewAdded = newImages.pop();
  if (lastNewAdded) {
    store.selectedImage = lastNewAdded.file.name;
  }

  imagePopulationCallbackRunning = false;
});

subscribe(() => store.animations.length, () => {
  if (store.selectedAnimation === null) return;
  if (store.animations.find(a => a.id === store.selectedAnimation)) return;
  store.selectedAnimation = null;
});

// ABORTED: Reference grid (frames) so that when it changes frames change!
// REASON: Grid (frames) should be decoupled from animation frames. Leaing this here in case I change my mind.
// let prevAnims: Array<number> = [];
// const animSubs: {[sub: number]: () => void} = {};
// const animFramesSubs: {[animId: number]: (() => void)[]} = {};
// type P = {x: number; y: number};
// const prevGrid: {[gridId: number]: {p: P; d: P; g: P; pad: P;}} = {};
// subscribe(() => store.animations.length, () => {
//   const newAnims = store.animations.filter(a => !prevAnims.some(pa => a.id === pa));
//   const delAnims = prevAnims.filter(pa => !store.animations.some(a => a.id === pa));
//   prevAnims = store.animations.map(a => a.id);

//   // Unsub old
//   for (const da of delAnims) {
//     animSubs[da]?.();
//     delete animSubs[da];

//     animFramesSubs[da]?.forEach(s => s());
//     delete animFramesSubs[da];
//   }

//   // Sub new
//   for (const na of newAnims) {
//     animSubs[na.id] = subscribe(() => na.frames.length, () => {
//       // Unsub old
//       animFramesSubs[na.id]?.forEach(u => u());

//       // Sub new
//       const subs: typeof animFramesSubs[number] = [];
//       animFramesSubs[na.id] = subs;
//       for (const f of na.frames) {
//         subs.push(subscribe(() => store.frames[f.image], () => {
//           const grid = store.frames[f.image];
//           if (!grid) return;

//           const g = grid.find(g => g.id === f.gridId);
//           if (g) {
//             const pg = prevGrid[g.id];
//             if (!pg) {
//               // Cache grid if not yet cached
//               prevGrid[g.id] = {
//                 p: {...g.position},
//                 d: {...g.dimensions},
//                 g: {...g.grid},
//                 pad: {...g.padding}
//               };
//             } else {
//               // Check if grid changed and update if yes
//               let changed = false;
//               if (g.dimensions.x !== pg.d.x) {
//                 changed = true;
//                 pg.d.x = g.dimensions.x;
//               }
//               if (g.dimensions.y !== pg.d.y) {
//                 changed = true;
//                 pg.d.y = g.dimensions.y;
//               }
//               if (g.grid.x !== pg.g.x) {
//                 changed = true;
//                 pg.g.x = g.grid.x;
//               }
//               if (g.grid.y !== pg.g.y) {
//                 changed = true;
//                 pg.g.y = g.grid.y;
//               }
//               if (g.padding.x !== pg.pad.x) {
//                 changed = true;
//                 pg.pad.x = g.padding.x;
//               }
//               if (g.padding.y !== pg.pad.y) {
//                 changed = true;
//                 pg.pad.y = g.padding.y;
//               }
//               if (g.position.x !== pg.p.x) {
//                 changed = true;
//                 pg.p.x = g.position.x;
//               }
//               if (g.position.y !== pg.p.y) {
//                 changed = true;
//                 pg.p.y = g.position.y;
//               }
//               if (!changed) return;
//             }

//             const w = g.dimensions.x;
//             const h = g.dimensions.y;

//             for (let c = 0; c < g.grid.x; c++) {
//               for (let r = 0; r < g.grid.y; r++) {
//                 const x = g.position.x + (g.padding.x + w) * c;
//                 const y = g.position.y + (g.padding.y + h) * r;
//               }
//             }

//             // ABORTED: find frame index in grid and update
//           }
//         }));
//       }
//     });
//   }

// });

// // Clean unneeded prevGrid
// let prevFrames: Array<string> = [];
// subscribe(() => store.frames, () => {
//   const deletedFrames = prevFrames.filter(pf => !Object.keys(store.frames).some(f => f === pf));
//   prevFrames = Object.keys(store.frames);

//   // ABORTED: clean deleted grid cache
//   for (const d of deletedFrames) {
    
//   }
// });

subscribe(() => store.canvasColor, () => {
  localStorage.setItem("canvasColor", store.canvasColor);
});

const useWatch = createReactHook(useEffect, useState);

(window as any).store = store;

export default store

export {useWatch, ImageAsset}