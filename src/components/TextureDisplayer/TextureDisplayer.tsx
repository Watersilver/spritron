import { autoDetectRenderer, Container, FederatedPointerEvent, Filter, Graphics, Rectangle, Sprite, Texture, type ColorSource, type Renderer } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import useResource from "../../utils/useResource";
import store, { ImageAsset, useWatch } from "../../store/store";
import { Box, type SxProps, type Theme } from "@mui/material";
import { deproxify } from "../../libs/proxy-state";


const selAnimFramesData: {w: number; h: number; frames: {x: number; y: number; id: number;}[]} = {w: 0, h: 0, frames: []};

const workAreaTransCache: {[image: string]: {x: number; y: number; scale: number;}} = {};

const transFilters: {[image: string]: Filter & {[isTransFilter]?: boolean}} = {};
const isTransFilter = Symbol();

const getPixelColor = (renderer: Renderer, p: {x: number; y: number;}, container: Container) => {
  const texture = renderer.textureGenerator.generateTexture({
    target: container,
    frame: new Rectangle(p.x,p.y,1,1)
  });
  const pxs = renderer.extract.pixels(texture);
  texture.destroy(true);
  return {r: pxs.pixels[0] ?? 0, g: pxs.pixels[1] ?? 0, b: pxs.pixels[2] ?? 0};
}

const isInElement = (m: {x: number; y: number}, el: HTMLElement | undefined): el is HTMLElement => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if ((r.x > m.x) || (r.x + r.width < m.x)) return false;
  if ((r.y > m.y) || (r.y + r.height < m.y)) return false;
  return true;
};

function generateTransFilters(maps: typeof store.transMaps) {
  for (const im of Object.keys(transFilters)) {
    transFilters[im]!.destroy(true);
    delete transFilters[im];
  }

  const vertex = `
    in vec2 aPosition;
    out vec2 vTextureCoord;

    uniform vec4 uInputSize;
    uniform vec4 uOutputFrame;
    uniform vec4 uOutputTexture;

    vec4 filterVertexPosition( void )
    {
        vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
        
        position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
        position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

        return vec4(position, 0.0, 1.0);
    }

    vec2 filterTextureCoord( void )
    {
        return aPosition * (uOutputFrame.zw * uInputSize.zw);
    }

    void main(void)
    {
        gl_Position = filterVertexPosition();
        vTextureCoord = filterTextureCoord();
    }
  `;

  for (const [im, cols] of Object.entries(maps)) {
    if (cols.length === 0) continue;
    const fragment = `
      in vec2 vTextureCoord;

      uniform sampler2D uTexture;

      void main(void)
      {
        vec4 c = texture2D(uTexture, vTextureCoord);

        if (
          ${cols.map(t => `
            (c.r >= ${(t[0].r/255 - t[1]/100).toFixed(1)}
            && c.r <= ${(t[0].r/255 + t[1]/100).toFixed(1)}
            && c.g >= ${(t[0].g/255 - t[1]/100).toFixed(1)}
            && c.g <= ${(t[0].g/255 + t[1]/100).toFixed(1)}
            && c.b >= ${(t[0].b/255 - t[1]/100).toFixed(1)}
            && c.b <= ${(t[0].b/255 + t[1]/100).toFixed(1)})
          `).join("||")}
        ) {
          gl_FragColor = vec4(0.0,0.0,0.0,0.0);
        } else {
          gl_FragColor = c;
        }
      }
    `;
    transFilters[im] = Filter.from({
      gl: {fragment, vertex},
      gpu: {fragment: {source: fragment}, vertex: {source: vertex}}
    });
    transFilters[im][isTransFilter] = true;
  }
}

function createDashedLine(
  g: Graphics, color: ColorSource,
  start: {x: number; y: number;},
  end: {x: number; y: number;},
  gapLength: number, lineLength = gapLength
) {
  const gl = gapLength;
  const ll = lineLength;

  const sp = {x: start.x, y: start.y};
  const v = {x: end.x - start.x, y: end.y - start.y};
  const magn = Math.sqrt(v.x ** 2 + v.y ** 2);
  const direction = {x: v.x / magn, y: v.y / magn};

  for (let d = 0; d < magn; d += gl + ll) {
    g.moveTo(
      sp.x + direction.x * (ll + d),
      sp.y + direction.y * (ll + d)
    );
    g.lineTo(
      sp.x + direction.x * (gl + ll + d),
      sp.y + direction.y * (gl + ll + d)
    );
  }

  g.stroke({color, pixelLine: true});
}

const boundedRect = (
  g: Graphics,
  topLeft: {x: number; y: number},
  bottomRight: {x: number; y: number},
  x: number, y: number,
  w: number, h: number,
  padding = 0.01
) => {
  const boundedX = Math.max(topLeft.x, x);
  const boundedY = Math.max(topLeft.y, y);
  const truncatedW = w + x - boundedX;
  const truncatedH = h + y - boundedY;

  const finalW = truncatedW - Math.max(0, boundedX + truncatedW - bottomRight.x);
  const finalH = truncatedH - Math.max(0, boundedY + truncatedH - bottomRight.y);

  return g.rect(
    boundedX + padding,
    boundedY + padding,
    finalW - padding * 2,
    finalH - padding * 2
  );
};

function TextureDisplayer({
  sx,
  style,
  workAreaElement,
  animFramesElement
}: {
  sx?: SxProps<Theme>;
  style?: React.CSSProperties;
  workAreaElement?: HTMLElement;
  animFramesElement?: HTMLElement;
}) {
  const canvasContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        store.eyedropTool = null;
      }
    }

    window.addEventListener("keydown", onKeyDown);

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        if (store.eyedropTool !== null) {
          e.stopPropagation();
          e.preventDefault();
          store.eyedropTool = null;
        }
      }
    }

    window.addEventListener("mousedown", onMouseDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    }
  }, []);

  // Setup/cleanup renderer and scene
  const {data: scene} = useResource({
    creator: async () => {
      const renderer = await autoDetectRenderer({});
      const stage = new Container();
      stage.eventMode = "static";
      const workArea = new Container();
      workArea.eventMode = "static";
      stage.addChild(workArea);
      const workAreaMask = new Graphics();
      workArea.mask = workAreaMask;
      stage.addChild(workAreaMask);

      const grid = new Graphics();
      grid.zIndex = 100;
      workArea.addChild(grid);


      const animFramesPos = new Container();
      stage.addChild(animFramesPos);
      const animFrames = new Container();
      animFramesPos.addChild(animFrames);
      const animFramesMask = new Graphics();
      animFramesPos.mask = animFramesMask;
      stage.addChild(animFramesMask);

      const animFramesGraphics = new Graphics();
      animFramesGraphics.zIndex = 100;
      animFramesPos.addChild(animFramesGraphics);


      return {
        renderer,
        stage,
        workArea,
        workAreaMask,
        animFrames,
        animFramesMask,
        animFramesPos,
        animFramesGraphics,
        grid,
      };
    },
    cleanup: (scene) => {
      scene.grid.destroy();
      scene.workAreaMask.destroy();
      scene.workArea.destroy();
      scene.animFramesMask.destroy();
      scene.animFrames.destroy();
      scene.animFramesGraphics.destroy();
      scene.animFramesPos.destroy();
      scene.stage.destroy();
      scene.renderer.destroy();
    },
    deps: []
  });


  // Canvas resize logic
  useEffect(() => {
    if (!scene || !canvasContainer.current) return;
    const cDiv = canvasContainer.current;

    const ro = new ResizeObserver((e) => {
      const entry = e.find(entry => entry.target === cDiv)
      if (entry) {
        const size = entry.contentBoxSize.reduce((a, c) => ({
          blockSize: a.blockSize + c.blockSize,
          inlineSize: a.inlineSize + c.inlineSize
        }), {blockSize: 0, inlineSize: 0});
        scene.renderer.resize(size.inlineSize, size.blockSize);
      }
    });

    ro.observe(cDiv);

    return () => {
      ro.disconnect();
    }
  }, [scene]);


  const images = useWatch(() => store.images.length, () => [...store.images]);

  const forceWorkAreaTrans = useRef<null | typeof workAreaTransCache[string]>(null);

  const selectedImageName = useWatch(() => store.selectedImage, () => {
    const cachedNames = Object.keys(workAreaTransCache);
    const deleted = cachedNames.filter(cn => !store.images.some(i => cn === i.file.name));
    for (const d of deleted) {
      delete workAreaTransCache[d];
    }
    if (store.selectedImage) {
      const w = workAreaTransCache[store.selectedImage];
      forceWorkAreaTrans.current = w ? {...w} : null;
    }

    return store.selectedImage;
  });


  const animations = useWatch(() => store.animations, () => deproxify(store.animations));
  const selectedAnimationId = useWatch(() => store.selectedAnimation, () => store.selectedAnimation);

  const transMaps = useWatch(() => store.transMaps, () => deproxify(store.transMaps));

  // Transparency filter
  useEffect(() => {
    if (!scene) return;
    // Remove previous transparency filters
    scene.animFrames.children.forEach(child => child.filters && (child.filters = child.filters.filter(f => !(isTransFilter in f))));
    scene.workArea.children.forEach(child => child.filters && (child.filters = child.filters.filter(f => !(isTransFilter in f))));

    // Generate new transparency filters
    generateTransFilters(transMaps);
  }, [transMaps, scene]);

  
  const dontFuckShitUpWithScale = useRef(false);

  // Create animation frames
  useEffect(() => {
    if (!scene) return;
    const a = animations.find(a => a.id === selectedAnimationId);
    if (!a) return;

    const resources: [Sprite, Texture][] = [];
    for (const f of a.frames) {
      const source = store.images.find(i => i.file.name === f.image)?.texture.source;
      if (!source) continue;
      const t = new Texture({
        source,
        frame: new Rectangle(...f.bounds)
      });
      const s = new Sprite(t);
      resources.push([s,t]);
    }
    const newAnimFrames = resources.map(r => r[0]);
    for (const anim of newAnimFrames) {
      scene.animFrames.addChild(anim);
    }
    dontFuckShitUpWithScale.current = true;

    return () => {
      for (const r of resources) {
        r[0].removeFromParent();
        r[0].destroy();
        r[1].destroy();
      }
    };
  }, [animations, selectedAnimationId, scene]);



  const [selectedSpritesheetSprite, setSelectedSpritesheetSprite] = useState<(Sprite & {
    image: ImageAsset;
  }) | null>(null);

  // Set selected spritesheet
  useEffect(() => {
    if (!scene) {
      setSelectedSpritesheetSprite(null);
      return;
    }
    const image = images.find(image => image.file.name === selectedImageName);
    if (!image) {
      setSelectedSpritesheetSprite(null);
      return;
    }
    const newSpr = Sprite.from(image.texture);
    setSelectedSpritesheetSprite(Object.assign(newSpr, {image}));
  }, [images, scene, selectedImageName]);

  // Add selected spritesheet to scene tree
  useEffect(() => {
    if (!selectedSpritesheetSprite) return;
    if (scene) {
      scene.workArea.addChild(selectedSpritesheetSprite);
    }

    return () => {
      selectedSpritesheetSprite.removeFromParent();
    };
  }, [selectedSpritesheetSprite, scene]);

  // Clean previous selected spritesheet
  useEffect(() => {
    return () => {
      if (selectedSpritesheetSprite && !selectedSpritesheetSprite.parent) {
        selectedSpritesheetSprite.destroy();
      }
    };
  }, [selectedSpritesheetSprite]);


  // Add canvas to dom
  useEffect(() => {
    if (canvasContainer.current && scene) {
      canvasContainer.current.innerHTML = "";
      if (scene.renderer.view.canvas instanceof HTMLCanvasElement) {
        canvasContainer.current.appendChild(scene.renderer.view.canvas);
      }
    }
  }, [scene]);

  // Reposition canvas areas since we have a single canvas that must fit a css grid
  const prev = useRef({x: 0, y: 0});
  useEffect(() => {
    if (!workAreaElement || !scene) return;

    const ro = new ResizeObserver((e) => {
      const entry = e.find(entry => entry.target === workAreaElement);
      if (entry) {
        const rect = workAreaElement.getBoundingClientRect();
        const diffX = rect.x - prev.current.x;
        const diffY = rect.y - prev.current.y;
        prev.current.x = rect.x;
        prev.current.y = rect.y;
        store.workArea.pos.x += diffX;
        store.workArea.pos.y += diffY;

        const size = entry.contentBoxSize.reduce((a, c) => ({
          blockSize: a.blockSize + c.blockSize,
          inlineSize: a.inlineSize + c.inlineSize
        }), {blockSize: 0, inlineSize: 0});
        scene.workAreaMask.clear();
        scene.workAreaMask
        .rect(rect.x, rect.y, size.inlineSize, size.blockSize)
        .fill(0xffffff);
      }
    });

    // Callback gets called when observing starts
    ro.observe(workAreaElement);

    return () => {
      ro.disconnect();
    };
  }, [workAreaElement, scene]);

  useEffect(() => {
    if (!animFramesElement || !scene) return;

    const ro = new ResizeObserver((e) => {
      const entry = e.find(entry => entry.target === animFramesElement);
      if (entry) {
        const rect = animFramesElement.getBoundingClientRect();
        scene.animFramesPos.x = rect.x;
        scene.animFramesPos.y = rect.y;

        const size = entry.contentBoxSize.reduce((a, c) => ({
          blockSize: a.blockSize + c.blockSize,
          inlineSize: a.inlineSize + c.inlineSize
        }), {blockSize: 0, inlineSize: 0});
        scene.animFramesMask.clear();
        scene.animFramesMask
        .rect(rect.x, rect.y, size.inlineSize, size.blockSize)
        .fill(0xffffff);
      }
    });

    // Callback gets called when observing starts
    ro.observe(animFramesElement);

    return () => {
      ro.disconnect();
    };
  }, [animFramesElement, scene]);


  const rerenderGrid = useRef(false);

  useWatch(
    [
      () => store.workArea.scale,
      () => store.workArea.pos,
      () => store.selectedFrames,
      () => store.selectedImage,
      () => store.workArea.pointing,
      () => store.eyedropTool,
      () => store.frames // Suboptimal but who cares? I don't.
    ],
    () => {
      rerenderGrid.current = true;

      // return {
      //   origin: deproxify(store.workArea.pos),
      //   grid: deproxify(store.selectedImage !== null ? store.frames[store.selectedImage]?.find(f => f.id === store.selectedFrames) ?? null : null),
      //   scale: store.workArea.scale
      // }
    }
  );

  useEffect(() => {
    if (!scene) {
      selAnimFramesData.w = 0;
      selAnimFramesData.h = 0;
      selAnimFramesData.frames.length = 0;
      return;
    }

    const {stage, renderer, workArea} = scene;

    let id: number;

    const render = () => {
      selAnimFramesData.w = 0;
      selAnimFramesData.h = 0;
      selAnimFramesData.frames.length = 0;

      if (!workAreaElement) return;
      if (!stage.destroyed) {

        workArea.position.x = store.workArea.pos.x;
        workArea.position.y = store.workArea.pos.y;

        if (workArea.scale.x !== store.workArea.scale) {

          const ratio = store.workArea.scale/workArea.scale.x;
          const oldWorkAreaMousePos = workArea.toLocal(store.mousePos);
          const newWorkAreaMousePos = oldWorkAreaMousePos.clone();
          newWorkAreaMousePos.x /= ratio;
          newWorkAreaMousePos.y /= ratio;

          let diff = newWorkAreaMousePos.clone();
          diff.x -= oldWorkAreaMousePos.x;
          diff.y -= oldWorkAreaMousePos.y;

          diff.x *= store.workArea.scale;
          diff.y *= store.workArea.scale;

          store.workArea.pos.x += diff.x;
          store.workArea.pos.y += diff.y;
          workArea.position = store.workArea.pos;

          workArea.scale = store.workArea.scale;
        }

        const si = store.selectedImage;
        if (si !== null) {
          if (!workAreaTransCache[si]) {
            workAreaTransCache[si] = {...store.workArea.pos, scale: store.workArea.scale};
          } else {
            workAreaTransCache[si].x = store.workArea.pos.x;
            workAreaTransCache[si].y = store.workArea.pos.y;
            workAreaTransCache[si].scale = store.workArea.scale;
          }
        }

        if (forceWorkAreaTrans.current) {
          workArea.position.x = forceWorkAreaTrans.current.x;
          workArea.position.y = forceWorkAreaTrans.current.y;
          workArea.scale = forceWorkAreaTrans.current.scale;
          store.workArea.pos.x = forceWorkAreaTrans.current.x;
          store.workArea.pos.y = forceWorkAreaTrans.current.y;
          store.workArea.scale = forceWorkAreaTrans.current.scale;
          forceWorkAreaTrans.current = null;
        }

        const mp = workArea.toLocal(store.mousePos);
        store.workArea.mousePos.x = mp.x;
        store.workArea.mousePos.y = mp.y;

        if (store.selectedImage !== null) {
          const transFilter = transFilters[store.selectedImage];
          if (transFilter) {
            const spr = workArea.children.find(c => c instanceof Sprite);

            if (spr) {
              if (!spr.filters) {
                spr.filters = [transFilter];
              } else if (!spr.filters.some(filter => transFilter === filter)) {
                spr.filters = [...spr.filters, transFilter];
              }
            }
          }
        }


        // Grid graphics build code
        // if (rerenderGrid.current) {
          rerenderGrid.current = false;
          if (
            store.selectedImage === null
            || store.selectedFrames === null
            || store.eyedropTool !== null
          ) {
            scene.grid.clear();
          } else {
            const grid = scene.grid;
            grid.x = 0;
            grid.y = 0;
            grid.clear();

            const f = store.frames[store.selectedImage]?.find(f => f.id === store.selectedFrames);
            if (f) {
              grid.moveTo(0, 0);

              const {
                x: waX,
                y: waY,
                width: waWidth,
                height: waHeight
              } = workAreaElement.getBoundingClientRect();

              // Global measurements converted to local
              const ls = scene.workArea.toLocal({x: waX, y: waY});
              const lw = waWidth / scene.workArea.scale.x;
              const lh = waHeight / scene.workArea.scale.y;
              const le = {x: ls.x + lw, y: ls.y + lh};

              grid.rect(ls.x, ls.y, lw, lh).fill({color: 0x000000, alpha: 0.5});

              const w = f.dimensions.x;
              const h = f.dimensions.y;

              for (let c = 0; c < f.grid.x; c++) {
                for (let r = 0; r < f.grid.y; r++) {
                  const startX = f.position.x + (f.padding.x + w) * c;
                  const startY = f.position.y + (f.padding.y + h) * r;

                  const effectiveStartX = Math.max(startX, ls.x);
                  const diffX = effectiveStartX - startX;

                  const effectiveStartY = Math.max(startY, ls.y);
                  const diffY = effectiveStartY - startY;

                  const reducedW = w - Math.max(0, diffX);
                  const reducedH = h - Math.max(0, diffY);

                  if (reducedW <= 0 || reducedH <= 0) continue;

                  const effectiveW = Math.min(effectiveStartX + reducedW, le.x) - effectiveStartX;
                  const effectiveH = Math.min(effectiveStartY + reducedH, le.y) - effectiveStartY;

                  if (effectiveW <= 0 || effectiveH <= 0) continue;

                  grid.rect(
                    effectiveStartX + 0.01,
                    effectiveStartY + 0.01,
                    effectiveW - 0.02,
                    effectiveH - 0.02
                  ).cut();
                }
              }

              for (let c = 0; c < f.grid.x; c++) {
                for (let r = 0; r < f.grid.y; r++) {
                  const startX = f.position.x + (f.padding.x + w) * c;
                  const startY = f.position.y + (f.padding.y + h) * r;

                  grid.rect(startX, startY, w, h)
                  .stroke({pixelLine: true, color: store.colours.selectedFrame});

                  if (
                    f.id === store.workArea.pointing?.framesId
                    && startX === store.workArea.pointing.x
                    && startY === store.workArea.pointing.y
                  ) {
                    grid.blendMode = 'multiply';
                    grid.fill({color: 0xffffff, alpha: 0.25});
                    grid.blendMode = 'normal';
                  }
                }
              }

              const dist = 16 / store.workArea.scale;
              createDashedLine(
                grid, store.colours.guides,
                {x: Math.floor(ls.x / dist) * dist, y: f.position.y},
                {x: ls.x + lw, y: f.position.y},
                dist * 0.5
              );
              createDashedLine(
                grid, store.colours.guides,
                {x: Math.floor(ls.x / dist) * dist, y: f.position.y + f.dimensions.y + (f.grid.y - 1) * (f.dimensions.y + f.padding.y)},
                {x: ls.x + lw, y: f.position.y + f.dimensions.y + (f.grid.y - 1) * (f.dimensions.y + f.padding.y)},
                dist * 0.5
              );
              createDashedLine(
                grid, store.colours.guides,
                {x: f.position.x, y: Math.floor(ls.y / dist) * dist},
                {x: f.position.x, y: ls.y + lh},
                dist * 0.5
              );
              createDashedLine(
                grid, store.colours.guides,
                {x: f.position.x + f.dimensions.x + (f.grid.x - 1) * (f.dimensions.x + f.padding.x), y: Math.floor(ls.y / dist) * dist},
                {x: f.position.x + f.dimensions.x + (f.grid.x - 1) * (f.dimensions.x + f.padding.x), y: ls.y + lh},
                dist * 0.5
              );
            }
          }
        // }


        if (store.workArea.grabbing || store.animFrames.grabbing) {
          // document.body.style.cursor = 'grab';
          document.body.style.cursor = 'grabbing';
        } else if (store.eyedropTool !== null && (
            isInElement({...store.mousePos}, workAreaElement)
            || isInElement({...store.mousePos}, animFramesElement)
          )) {
          document.body.style.cursor = 'crosshair';
        } else if (store.workArea.pointing || store.animFrames.pointing) {
          document.body.style.cursor = 'pointer';
        } else {
          document.body.style.cursor = 'auto';
        }


        // Animation frames container positioning
        const sa = store.selectedAnimation;
        const anim = store.animations.find(a => a.id === sa);
        const frames = scene.animFrames.children;
        if (sa !== null && anim) {
          const tallest = frames.reduce((a,c,i) => {
            const f = anim.frames[i];
            let r = anim.transfrom?.rotation ?? 0;
            r += f?.transfrom?.rotation ?? 0;
            const h = (r === 90 || r === 270 ? c.width : c.height) + (f?.offset.y ?? 0);
            return h > a ? h : a;
          }, 0);

          if (tallest > 0) {
            if (animFramesElement && !store.animFrames.transforms[sa]) {
              const {height} = animFramesElement.getBoundingClientRect();
              store.animFrames.transforms[sa] = {
                scale: height / (tallest + anim.padding * 2),
                pos: {x: 0, y: 0}
              };

              const t = store.animFrames.transforms[sa];
              const scAnFr = scene.animFrames;

              scAnFr.x = t.pos.x;
              scAnFr.y = t.pos.y;
              scAnFr.scale = t.scale;
            } else {
              const t = store.animFrames.transforms[sa];
              if (t) {
                const scAnFr = scene.animFrames;

                scAnFr.x = t.pos.x;
                scAnFr.y = t.pos.y;

                if (dontFuckShitUpWithScale.current) {
                  scAnFr.scale = t.scale;
                } else if (scAnFr.scale.x !== t.scale) {
                  const ratio = t.scale/scAnFr.scale.x;
                  const oldMousePos = scAnFr.toLocal(store.mousePos);
                  const newMousePos = oldMousePos.clone();
                  newMousePos.x /= ratio;
                  newMousePos.y /= ratio;

                  let diff = newMousePos.clone();
                  diff.x -= oldMousePos.x;
                  diff.y -= oldMousePos.y;

                  diff.x *= t.scale;
                  diff.y *= t.scale;

                  t.pos.x += diff.x;
                  t.pos.y += diff.y;
                  scAnFr.position = t.pos;

                  scAnFr.scale = t.scale;
                }
                dontFuckShitUpWithScale.current = false;
              }
            }
          } else {
            // Reset when deleting all frames
            delete store.animFrames.transforms[sa];
          }


          // Individual animation frames placement
          const widest = frames.reduce((a,c,i) => {
            const f = anim.frames[i];
            let r = anim.transfrom?.rotation ?? 0;
            r += f?.transfrom?.rotation ?? 0;
            const w = (r === 90 || r === 270 ? c.height : c.width) + (f?.offset.x ?? 0);
            return w > a ? w : a;
          }, 0);
          const globalAngle = anim.transfrom?.rotation ?? 0;
          const globalMirror = anim.transfrom?.mirror ?? {x: false, y: false};
          for (let i = 0; i < frames.length; i++) {
            const f = frames[i] as Sprite | undefined;
            const fd = anim.frames[i]; // frame data
            if (!f || !f.parent || !fd) continue;
            const angle = globalAngle + (fd.transfrom?.rotation ?? 0);
            const mirror = {
              x: globalMirror.x !== (fd.transfrom?.mirror?.x ?? false),
              y: globalMirror.y !== (fd.transfrom?.mirror?.y ?? false)
            };
            const col = i % anim.columnLimit;
            const row = Math.floor(i / anim.columnLimit);
            const w = angle % 180 === 0 ? f.width : f.height;
            const h = angle % 180 === 0 ? f.height : f.width;
            f.x = col * (widest + anim.padding) + anim.padding + Math.floor(w * 0.5) + fd.offset.x;
            f.y = row * (tallest + anim.padding) + anim.padding + Math.floor(h * 0.5) + fd.offset.y;
            f.pivot.x = Math.floor(f.width * 0.5);
            f.pivot.y = Math.floor(f.height * 0.5);
            f.angle = angle;
            f.scale.x = mirror.x ? -1 : 1;
            f.scale.y = mirror.y ? -1 : 1;

            const transFilter = transFilters[fd.image];
            if (transFilter) {
              if (!f.filters) {
                f.filters = [transFilter];
              } else if (!f.filters.some(filter => transFilter === filter)) {
                f.filters = [...f.filters, transFilter];
              }
            }
          }

          // Fuck it rerender anim frames graphics every frame
          // Change only if slow
          const afg = scene.animFramesGraphics;
          const af = scene.animFrames;
          if (store.eyedropTool !== null) {
            if (afg) {
              afg.clear();
            }
          } else if (afg && af && anim) {
            afg.clear();

            const afe = animFramesElement;
            const atr = sa !== null ? store.animFrames.transforms[sa] : null;

            if (afe && atr) {
              const {
                x: afX,
                y: afY,
                width: afWidth,
                height: afHeight
              } = afe.getBoundingClientRect();

              // local position and dimensions
              const ls = scene.animFramesPos.toLocal({x: afX, y: afY});
              const lw = afWidth / scene.animFramesPos.scale.x;
              const lh = afHeight / scene.animFramesPos.scale.y;
              const le = {x: ls.x + lw, y: ls.y + lh};

              const scaledPadding = anim.padding * atr.scale;

              const cols = Math.min(frames.length, anim.columnLimit);
              const rows = Math.floor((frames.length - 1) / anim.columnLimit) + 1;
              const totalW = cols * (widest * atr.scale + scaledPadding) + scaledPadding;
              const totalH = rows * (tallest * atr.scale + scaledPadding) + scaledPadding;

              // Darken surrounding area
              afg.rect(ls.x, ls.y, lw, lh).fill({color: 0x000000, alpha: 0.5});


              // Color padding
              boundedRect(afg,ls,le,atr.pos.x,atr.pos.y,totalW,totalH).cut();

              afg.rect(
                atr.pos.x,
                atr.pos.y,
                totalW,
                totalH
              ).stroke({
                pixelLine: true,
                color: store.colours.margin
              })
              .fill({
                color: store.colours.margin,
                alpha: 0.5
              });

              // Scale frame width and height
              const w = widest * atr.scale;
              const h = tallest * atr.scale;

              const startX = atr.pos.x + scaledPadding;
              const startY = atr.pos.y + scaledPadding;

              // Cut holes for frames in coloured padding
              for (let i = 0; i < frames.length; i++) {
                const c = i % anim.columnLimit;
                const r = Math.floor(i / anim.columnLimit);
                afg.rect(
                  startX + c * (w + scaledPadding) + 0.01,
                  startY + r * (h + scaledPadding) + 0.01,
                  w - 0.02,
                  h - 0.02
                ).cut();
              }

              selAnimFramesData.w = w;
              selAnimFramesData.h = h;
              const sDim: [x: number, y: number, w: number, h: number][] = [];
              let id: number | null = null;
              for (let i = 0; i < frames.length; i++) {
                const c = i % anim.columnLimit;
                const r = Math.floor(i / anim.columnLimit);
                const x = startX + c * (w + scaledPadding);
                const y = startY + r * (h + scaledPadding);
                const f = anim.frames[i];
                if (f) {
                  selAnimFramesData.frames.push({x,y,id: f.id});
                  id = f.id;
                  // TODO: what do about ghosts
                }
                if (store.selectedAnimFrames[sa]?.some(saf => saf === f?.id)) {
                  sDim.push([x,y,w,h]);
                } else {
                  afg.rect(
                    x,
                    y,
                    w,
                    h
                  );

                  if (id !== store.animFrames.pointing?.id) {
                    afg.fill({
                      color: 0, alpha: 0.5
                    });
                  }

                  afg.stroke({
                    color: store.colours.guides,
                    pixelLine: true
                  });
                }

                if (id === store.animFrames.pointing?.id) {
                  afg.blendMode = "multiply";
                  afg.rect(
                    x,
                    y,
                    w,
                    h
                  ).fill({
                    color: 0xffffff, alpha: 0.25
                  });
                  afg.blendMode = "normal";
                }
              }
              if (sDim.length) {
                for (const d of sDim) {
                  afg.rect(...d).stroke({
                    color: store.colours.selectedFrame,
                    pixelLine: true
                  });
                }
              }

              // const dist = 16;
              // createDashedLine(
              //   afg, 0x00ff00,
              //   {x: Math.floor(ls.x / dist) * dist, y: atr.pos.y},
              //   {x: Math.floor((ls.x + lw) / dist) * dist, y: atr.pos.y},
              //   dist * 0.5
              // );
              // createDashedLine(
              //   afg, 0x00ff00,
              //   {x: Math.floor(ls.x / dist) * dist, y: atr.pos.y + af.height + anim.padding * 2 * atr.scale},
              //   {x: Math.floor((ls.x + lw) / dist) * dist, y: atr.pos.y + af.height + anim.padding * 2 * atr.scale},
              //   dist * 0.5
              // );
              // createDashedLine(
              //   afg, 0x00ff00,
              //   {x: atr.pos.x, y: Math.floor(ls.y / dist) * dist},
              //   {x: atr.pos.x, y: Math.floor((ls.y + lh) / dist) * dist},
              //   dist * 0.5
              // );
              // createDashedLine(
              //   afg, 0x00ff00,
              //   {x: atr.pos.x + af.width + anim.padding * 2 * atr.scale, y: Math.floor(ls.y / dist) * dist},
              //   {x: atr.pos.x + af.width + anim.padding * 2 * atr.scale, y: Math.floor((ls.y + lh) / dist) * dist},
              //   dist * 0.5
              // );
            }
          }
        }


        try {
          renderer.render({
            container: stage,
            clear: true,
            clearColor: store.colours.canvas
          });
        } catch (e) {
          console.error(e);
        }

        id = requestAnimationFrame(render);
      }
    }


    id = requestAnimationFrame(render);

    return () => cancelAnimationFrame(id);
  }, [scene, workAreaElement, animFramesElement]);

  // Logic
  useEffect(() => {
    const canvas = scene?.renderer.canvas;
    if (!canvas) return;

    const grab = (el: HTMLElement) => {
      if (el === workAreaElement) {
        store.workArea.grabbing = true;
      } else {
        store.animFrames.grabbing = true;
      }
    }

    const ungrab = () => {
      store.workArea.grabbing = false;
      store.animFrames.grabbing = false;
    };

    const mouseDown = async (e: PointerEvent) => {
      const d = canvasContainer.current;
      if (!d) return;

      if (isInElement(e, workAreaElement)) {
        if (e.button === 0) {

          if (store.eyedropTool !== null) {
            const c = getPixelColor(scene.renderer, {...store.mousePos}, scene.stage);
            store.eyedropPickedCol = c;
            store.eyedropTool = null;
            return;
          }

          if (store.workArea.pointing && store.selectedAnimation !== null) {
            const a = store.animations.find(a => a.id === store.selectedAnimation);
            if (a) {
              const image = store.files.find(f => f.name === Object.entries(store.frames).find(([_, data]) => data.some(d => d.id === store.workArea.pointing?.framesId))?.[0])?.name;
              if (image !== undefined) {
                a.frames.push({
                  id: store.nextAnimationFrameId,
                  image,
                  durationFactor: 1,
                  offset: {
                    x: 0,
                    y: 0
                  },
                  bounds: [store.workArea.pointing.x, store.workArea.pointing.y, store.workArea.pointing.w, store.workArea.pointing.h],
                });
                // If you want to only select first added animation frame uncomment
                // if (store.selectedAnimFrames[store.selectedAnimation] === undefined) {
                  store.selectedAnimFrames[store.selectedAnimation] = [store.nextAnimationFrameId];
                // }
                store.nextAnimationFrameId++;
              }
            }
          }
        } else if (e.button === 1) {
          grab(workAreaElement);
        }
      } else if (isInElement(e, animFramesElement)) {
        if (e.button === 0) {
          const p = store.animFrames.pointing;
          if (p && store.selectedAnimation !== null) {
            if (store.animations.find(a => a.id === store.selectedAnimation)?.frames.some(f => f.id === p.id)) {
              const sa = store.selectedAnimation;
              if ((e.ctrlKey || e.shiftKey) && store.selectedAnimFrames[sa]) {
                const i = store.selectedAnimFrames[sa].findIndex(id => id === p.id);
                if (i !== -1) {
                  store.selectedAnimFrames[sa].splice(i, 1);
                } else {
                  store.selectedAnimFrames[sa].push(p.id);
                }
              } else {
                store.selectedAnimFrames[store.selectedAnimation] = [p.id];
              }
            }
          }
        } else if (e.button === 1) {
          grab(animFramesElement);
        }
      }
    }

    const mouseUp = (e: PointerEvent) => {
      const d = canvasContainer.current;
      if (!d) return;

      if (e.button === 1) {
        ungrab();
      }
    }

    const mouseMove = (e: PointerEvent) => {
      if (store.workArea.grabbing) {
        store.workArea.pos.x += e.movementX;
        store.workArea.pos.y += e.movementY;
      } else if (store.animFrames.grabbing) {
        const sa = store.selectedAnimation;
        if (sa !== null) {
          const t = store.animFrames.transforms[sa];
          if (t) {
            t.pos.x += e.movementX;
            t.pos.y += e.movementY;
          }
        }
      }
    }

    const wheel = (e: WheelEvent) => {
      if (isInElement(e, workAreaElement)) {
        store.workArea.scale -= Math.sign(e.deltaY) * store.workArea.scale * 0.1;
      } else if (isInElement(e, animFramesElement)) {
        const sa = store.selectedAnimation;
        if (sa !== null) {
          const t = store.animFrames.transforms[sa];
          if (t) {
            t.scale -= Math.sign(e.deltaY) * t.scale * 0.1;
          }
        }
      }
    }

    const mouseMoveWorkArea = (e: FederatedPointerEvent) => {
      store.mousePos.x = e.global.x;
      store.mousePos.y = e.global.y;

      if (!scene.renderer.canvas.matches(":hover")) {
        store.workArea.pointing = null;
        return;
      }

      
      if (!workAreaElement) {
        store.workArea.pointing = null;
        return;
      }

      const r = workAreaElement.getBoundingClientRect();
      if (
        r.x > e.x || r.x + r.width < e.x
        || r.y > e.y || r.y + r.height < e.y
      ) {
        store.workArea.pointing = null;
        return;
      }


      if (!store.selectedImage || store.selectedAnimation === null) {
        store.workArea.pointing = null;
        return;
      }
      const f = store.frames[store.selectedImage]?.find(f => f.id === store.selectedFrames);
      if (!f) {
        store.workArea.pointing = null;
        return;
      }

      const w = f.dimensions.x;
      const h = f.dimensions.y;

      let p: typeof store.workArea.pointing = null;
      const {x, y} = e.getLocalPosition(scene.workArea);

      for (let c = 0; c < f.grid.x; c++) {
        for (let r = 0; r < f.grid.y; r++) {
          const startX = f.position.x + (f.padding.x + w) * c;
          const startY = f.position.y + (f.padding.y + h) * r;

          if (x >= startX && x <= startX + w && y >= startY && y <= startY + h) {
            p = store.workArea.pointing?.framesId === f.id
            && store.workArea.pointing.x === startX
            && store.workArea.pointing.y === startY
            && store.workArea.pointing.w === w
            && store.workArea.pointing.h === h
            ? store.workArea.pointing
            : {
              x: startX, y: startY, w, h, framesId: f.id
            };
            break;
          }
        }
      }

      store.workArea.pointing = p;
    };

    const mouseMoveAnimFramesArea = (e: FederatedPointerEvent) => {
      if (!scene.renderer.canvas.matches(":hover")) {
        store.animFrames.pointing = null;
        return;
      }
      
      if (!animFramesElement) {
        store.animFrames.pointing = null;
        return;
      }

      const r = animFramesElement.getBoundingClientRect();
      if (
        r.x > e.x || r.x + r.width < e.x
        || r.y > e.y || r.y + r.height < e.y
      ) {
        store.animFrames.pointing = null;
        return;
      }

      if (!store.selectedImage || store.selectedAnimation === null) {
        store.animFrames.pointing = null;
        return;
      }
      const anim = store.animations.find(a => a.id === store.selectedAnimation);
      const f = anim?.frames;
      if (!f) {
        store.animFrames.pointing = null;
        return;
      }

      const atr = store.animFrames.transforms[store.selectedAnimation];

      if (!atr) {
        store.animFrames.pointing = null;
        return;
      }

      const {x, y} = e.getLocalPosition(scene.animFramesPos);
      const {w, h} = selAnimFramesData;
      let p: typeof store.animFrames.pointing = null;
      for (const f of selAnimFramesData.frames) {
        const startX = f.x;
        const startY = f.y;

        if (x >= startX && x <= startX + w && y >= startY && y <= startY + h) {
          p = store.animFrames.pointing?.id === f.id
          ? store.animFrames.pointing
          : {
            id: f.id
          };
          break;
        }
      }

      store.animFrames.pointing = p;
    };

    const onGlobalpointermove = (e: FederatedPointerEvent) => {
      mouseMoveWorkArea(e);
      mouseMoveAnimFramesArea(e);
    };

    canvas.addEventListener('pointerdown', mouseDown);
    window.addEventListener('pointerup', mouseUp);
    window.addEventListener('pointermove', mouseMove);
    canvas.addEventListener('wheel', wheel);
    scene.workArea.on('globalpointermove', onGlobalpointermove);

    return () => {
      canvas.removeEventListener('pointerdown', mouseDown);
      window.removeEventListener('pointerup', mouseUp);
      window.removeEventListener('pointermove', mouseMove);
      canvas.removeEventListener('wheel', wheel);
      scene.workArea.off('globalpointermove', onGlobalpointermove);
    }
  }, [scene, workAreaElement, animFramesElement]);

  return <Box
    position="relative"
    style={{
      overflow: "hidden",
      ...style
    }}
    sx={sx}
  >
    <Box
      position="absolute"
      sx={{width: "100%", height: "100%"}}
      ref={canvasContainer}
    />
    {/* I can do html element overlay on canvas! Fuck yeah! */}
    {/* <Box
      position="absolute"
      sx={{
        width: "100%", height: "100%",
        pointerEvents: 'none'
      }}
    >
      <Button
        variant="contained"
        sx={{
          pointerEvents: 'auto',
          position: 'absolute',
          left: test.origin.x + "px",
          top: test.origin.y + "px",
          width: (48 * test.scale) + "px",
          height: (48 * test.scale) + "px",
          minWidth: 0,
          minHeight: 0,
          maxWidth: 'none',
          maxHeight: 'none',
          p: 0
        }}
      >
      </Button>
    </Box> */}
  </Box>;

  // return <Box
  //   style={{
  //     overflow: "hidden",
  //     ...style
  //   }}
  //   sx={sx}
  //   ref={div}
  // />;
}

export default TextureDisplayer;