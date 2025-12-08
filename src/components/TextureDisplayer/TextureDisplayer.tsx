import { autoDetectRenderer, Container, FederatedPointerEvent, Graphics, Sprite } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import useResource from "../../utils/useResource";
import store, { ImageAsset, useWatch } from "../../store/store";
import { Box, type SxProps, type Theme } from "@mui/material";

(window as any).spriteset = new Set();

function TextureDisplayer({
  sx,
  style
}: {
  sx?: SxProps<Theme>;
  style?: React.CSSProperties;
}) {
  useEffect(() => {
    autoDetectRenderer({});
  });

  const div = useRef<HTMLDivElement>(null);


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

      const grid = new Graphics();
      grid.zIndex = 100;
      workArea.addChild(grid);

      return {
        renderer,
        stage,
        workArea,
        debugCursor,
        grid
      };
    },
    cleanup: (scene) => {
      scene.grid.destroy();
      scene.debugCursor.destroy();
      scene.workArea.destroy();
      scene.stage.destroy();
      scene.renderer.destroy(true);
    },
    deps: []
  });


  // Canvas resize logic
  useEffect(() => {
    if (!scene || !div.current) return;
    const cDiv = div.current;

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

  const [selectedSpritesheetSprite, setSelectedSpritesheetSprite] = useState<(Sprite & {
    image: ImageAsset;
  }) | null>(null);

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

  useEffect(() => {
    if (!selectedSpritesheetSprite) return;
    if (scene) {
      scene.workArea.addChild(selectedSpritesheetSprite);
    }

    return () => {
      selectedSpritesheetSprite.removeFromParent();
    };
  }, [selectedSpritesheetSprite, scene]);

  useEffect(() => {
    return () => {
      if (selectedSpritesheetSprite && !selectedSpritesheetSprite.parent) {
        selectedSpritesheetSprite.destroy();
      }
    };
  }, [selectedSpritesheetSprite]);

  useEffect(() => {
    if (div.current && scene) {
      div.current.innerHTML = "";
      if (scene.renderer.view.canvas instanceof HTMLCanvasElement) {
        div.current.appendChild(scene.renderer.view.canvas);
      }
    }
  }, [scene]);

  const rerenderGrid = useRef(false);

  // const test =
  useWatch(
    [
      () => store.workArea.scale,
      () => store.workArea.pos,
      () => store.selectedFrames,
      () => store.selectedImage,
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

              const w = f.dimensions.x
              const h = f.dimensions.y

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



        renderer.render({
          container: stage,
          clear: true
        });

        id = requestAnimationFrame(render);
      }
    }

    id = requestAnimationFrame(render);

    return () => cancelAnimationFrame(id);
  }, [scene]);

  // Logic
  useEffect(() => {
    const canvas = scene?.renderer.canvas;
    if (!canvas) return;

    const grab = () => {
      document.body.style.cursor = 'grab';
      store.grabbing = true;
    }

    const ungrab = () => {
      document.body.style.cursor = 'auto';
      store.grabbing = false;
    }

    const mouseDown = async (e: PointerEvent) => {
      const d = div.current;
      if (!d) return;

      if (e.button === 1) {
        grab();
      }
    }

    const mouseUp = (e: PointerEvent) => {
      const d = div.current;
      if (!d) return;

      if (e.button === 1) {
        ungrab();
      }
    }

    const mouseMove = (e: PointerEvent) => {
      if (store.grabbing) {
        store.workArea.pos.x += e.movementX;
        store.workArea.pos.y += e.movementY;
      }
    }

    const wheel = (e: WheelEvent) => {
      store.workArea.scale -= Math.sign(e.deltaY) * store.workArea.scale * 0.1;
    }

    const mouseMoveWorkArea = (e: FederatedPointerEvent) => {
      store.mousePos.x = e.global.x;
      store.mousePos.y = e.global.y;
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
  }, [scene]);

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
      ref={div}
    />
    {/* I can do html elemnt overlay on canvas! Fuck yeah! */}
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