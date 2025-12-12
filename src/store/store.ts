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
    transfrom?: Transform;
  }[];
  shaders?: {
    id: number;
    name: string;
    code: string;
  }[];
  grabbing: boolean;
  workArea: {
    scale: number;
    mousePos: {x: number; y: number;};
    pos: {x: number; y: number;};
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
  grabbing: false,
  workArea: {
    scale: 1,
    mousePos: { x: 0, y: 0 },
    pos: {x: 0, y: 0}
  },
  animations: [],
  selectedImage: null,
  selectedFrames: null,
  selectedAnimation: null,
  mousePos: {x: 0, y: 0},
  nextFramesId: 0,
  nextAnimationId: 0,
  canvasColor: localStorage.getItem("canvasColor") ?? "#000"
});

let prevFiles: File[] = [];
subscribe(() => store.files.length, async () => {
  // Cleanup prev
  const orphanFiles = prevFiles.filter(f => !store.files.some(ff => ff === f));

  const cleaned: ImageAsset[] = [];
  for (const i of store.images) {
    if (orphanFiles.some(f => i.file === f)) {
      i.bitmap.close();
      i.texture.destroy(true);
      cleaned.push(i);
    }
  }

  store.images = store.images.filter(i => !cleaned.some(ia => ia === i));

  // Add new
  const newImages: ImageAsset[] = [];
  for (const file of store.files) {
    if (file.type.includes("image")) {
      if (!store.images.some(i => i.file === file)) {
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

  prevFiles = [...store.files];
});

subscribe(() => store.canvasColor, () => {
  localStorage.setItem("canvasColor", store.canvasColor);
});

const useWatch = createReactHook(useEffect, useState);

(window as any).store = store;

export default store

export {useWatch, ImageAsset}