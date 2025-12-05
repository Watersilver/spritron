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
    }[]
  };
  grabbing: boolean;
  workArea: {
    scale: number;
    mousePos: {x: number; y: number;};
    pos: {x: number; y: number;};
  };
  selectedImage: string | null;
  selectedFrames: number | null;
  mousePos: {x: number; y: number;};
  nextFramesId: 0;
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
  selectedImage: null,
  selectedFrames: null,
  mousePos: {x: 0, y: 0},
  nextFramesId: 0
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

const useWatch = createReactHook(useEffect, useState);

(window as any).store = store;

export default store

export {useWatch, ImageAsset}