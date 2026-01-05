import { autoDetectRenderer, Container, FederatedPointerEvent, Graphics, Rectangle, Sprite, Texture } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import useResource from "../../utils/useResource";
import store, { ImageAsset, useWatch } from "../../store/store";
import { Box, type SxProps, type Theme } from "@mui/material";
import { deproxify } from "../../libs/proxy-state";

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

  // Setup/cleanup renderer and scene
  const {data: scene} = useResource({
    creator: async () => {
      const renderer = await autoDetectRenderer({});
      const stage = new Container();
      stage.eventMode = "static";
      const workArea = new Container();
      workArea.eventMode = "static";
      stage.addChild(workArea);
      const debugCursor = new Graphics().rect(0, 0, 1, 1).fill(0xff0000);
      debugCursor.zIndex = 200;
      workArea.addChild(debugCursor);
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
      animFrames.mask = animFramesMask;
      stage.addChild(animFramesMask);

      return {
        renderer,
        stage,
        workArea,
        debugCursor,
        workAreaMask,
        animFrames,
        animFramesMask,
        animFramesPos,
        grid,
      };
    },
    cleanup: (scene) => {
      scene.grid.destroy();
      scene.debugCursor.destroy();
      scene.workAreaMask.destroy();
      scene.workArea.destroy();
      scene.animFramesMask.destroy();
      scene.animFrames.destroy();
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

  const selectedImageName = useWatch(() => store.selectedImage, () => store.selectedImage);


  const animations = useWatch(() => store.animations, () => deproxify(store.animations));
  const selectedAnimation = useWatch(() => store.selectedAnimation, () => store.selectedAnimation);

  // Create animation frames
  useEffect(() => {
    if (!scene) return;
    const a = animations.find(a => a.id === selectedAnimation);
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

    return () => {
      for (const r of resources) {
        r[0].removeFromParent();
        r[0].destroy();
        r[1].destroy();
      }
    };
  }, [animations, selectedAnimation, scene]);



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
    if (!scene) return;

    const {stage, renderer, debugCursor, workArea} = scene;

    let id: number;

    const render = () => {
      if (!stage.destroyed) {
        // workArea.rotation += 0.01;

        workArea.position = store.workArea.pos;

        if (workArea.scale.x !== store.workArea.scale) {
          // debugCursor.scale = 1 / store.workArea.scale;

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

        const mp = workArea.toLocal(store.mousePos);
        store.workArea.mousePos.x = mp.x;
        store.workArea.mousePos.y = mp.y;
        debugCursor.position.x = Math.floor(mp.x);
        debugCursor.position.y = Math.floor(mp.y);


        // Grid graphics build code
        if (rerenderGrid.current) {
          rerenderGrid.current = false;
          if (
            store.selectedImage === null
            || store.selectedFrames === null
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

              // Global measurements converted to local
              const ls = scene.workArea.toLocal({x: 0, y: 0});
              const lw = scene.renderer.canvas.width / scene.workArea.scale.x;
              const lh = scene.renderer.canvas.height / scene.workArea.scale.y;
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
                    effectiveStartX,
                    effectiveStartY,
                    effectiveW,
                    effectiveH
                  ).cut();
                }
              }

              for (let c = 0; c < f.grid.x; c++) {
                for (let r = 0; r < f.grid.y; r++) {
                  const startX = f.position.x + (f.padding.x + w) * c;
                  const startY = f.position.y + (f.padding.y + h) * r;

                  grid.rect(startX, startY, w, h)
                  .stroke({pixelLine: true, color: 0xff0000});

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

              let y = f.position.y;
              for (let x = Math.floor(ls.x / dist) * dist; x < ls.x + lw; x += dist) {
                grid.moveTo(x + dist * 0.5, y);
                grid.lineTo(x + dist, y);
              }
              y = y + f.dimensions.y + (f.grid.y - 1) * (f.dimensions.y + f.padding.y);
              for (let x = Math.floor(ls.x / dist) * dist; x < ls.x + lw; x += dist) {
                grid.moveTo(x + dist * 0.5, y);
                grid.lineTo(x + dist, y);
              }
              let x = f.position.x;
              for (let y = Math.floor(ls.y / dist) * dist; y < ls.y + lh; y += dist) {
                grid.moveTo(x, y + dist * 0.5);
                grid.lineTo(x, y + dist);
              }
              x = x + f.dimensions.x + (f.grid.x - 1) * (f.dimensions.x + f.padding.x);
              for (let y = Math.floor(ls.y / dist) * dist; y < ls.y + lh; y += dist) {
                grid.moveTo(x, y + dist * 0.5);
                grid.lineTo(x, y + dist);
              }
              grid.stroke({color: 0x00ff00, pixelLine: true});
            }
          }
        }


        if (store.workArea.grabbing || store.animFrames.grabbing) {
          // document.body.style.cursor = 'grab';
          document.body.style.cursor = 'grabbing';
        } else if (store.workArea.pointing) {
          document.body.style.cursor = 'pointer';
        } else {
          document.body.style.cursor = 'auto';
        }


        // Animation frames container positioning
        const frames = scene.animFrames.children;
        const tallest = frames.reduce((a,c) => c.height > a ? c.height : a, 0);
        const sa = store.selectedAnimation;
        const anim = store.animations.find(a => a.id === sa);
        if (sa !== null && anim) {
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

                if (scAnFr.scale.x !== t.scale) {
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
              }
            }
          } else {
            // Reset when deleting all frames
            delete store.animFrames.transforms[sa];
          }
        }

        // Individual animation frames placement
        if (anim) {
          const widest = frames.reduce((a,c) => c.width > a ? c.width : a, 0);
          for (let i = 0; i < frames.length; i++) {
            const f = frames[i];
            if (!f || !f.parent) continue;
            const col = i % anim.columnLimit;
            const row = Math.floor(i / anim.columnLimit);
            f.x = col * (widest + anim.padding) + anim.padding;
            f.y = row * (tallest + anim.padding) + anim.padding;
          }
        }


        try {
          renderer.render({
            container: stage,
            clear: true,
            clearColor: store.canvasColor
          });
        } catch (e) {
          console.error(e);
        }

        id = requestAnimationFrame(render);
      }
    }


    id = requestAnimationFrame(render);

    return () => cancelAnimationFrame(id);
  }, [scene, animFramesElement]);

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
    }

    const isInElement = (e: PointerEvent | WheelEvent, el: HTMLElement | undefined): el is HTMLElement => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.x > e.x || r.x + r.width < e.x) return false;
      if (r.y > e.y || r.y + r.height < e.y) return false;
      return true;
    }

    const mouseDown = async (e: PointerEvent) => {
      const d = canvasContainer.current;
      if (!d) return;

      if (isInElement(e, workAreaElement)) {
        if (e.button === 0) {
          if (store.workArea.pointing && store.selectedAnimation !== null) {
            const a = store.animations.find(a => a.id === store.selectedAnimation);
            if (a) {
              const image = store.files.find(f => f.name === Object.entries(store.frames).find(([_, data]) => data.some(d => d.id === store.workArea.pointing?.framesId))?.[0])?.name;
              if (image !== undefined) {
                a.frames.push({
                  image,
                  durationFactor: 1,
                  anchor: {x: store.workArea.pointing.x + store.workArea.pointing.w * 0.5, y: store.workArea.pointing.y + store.workArea.pointing.h * 0.5},
                  bounds: [store.workArea.pointing.x, store.workArea.pointing.y, store.workArea.pointing.w, store.workArea.pointing.h],
                });
              }
            }
          }
        } else if (e.button === 1) {
          grab(workAreaElement);
        }
      }

      if (isInElement(e, animFramesElement)) {
        if (e.button === 1) {
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
      const {x, y} = e.getLocalPosition(scene.workArea);

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
    }

    canvas.addEventListener('pointerdown', mouseDown);
    window.addEventListener('pointerup', mouseUp);
    window.addEventListener('pointermove', mouseMove);
    canvas.addEventListener('wheel', wheel);
    scene.workArea.on('globalpointermove', mouseMoveWorkArea);

    return () => {
      canvas.removeEventListener('pointerdown', mouseDown);
      window.removeEventListener('pointerup', mouseUp);
      window.removeEventListener('pointermove', mouseMove);
      canvas.removeEventListener('wheel', wheel);
      scene.workArea.off('globalpointermove', mouseMoveWorkArea);
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