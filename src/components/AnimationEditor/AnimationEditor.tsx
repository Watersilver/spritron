import { Box, type SxProps, type Theme } from "@mui/material"
import { useEffect, useRef } from "react";
import useResource from "../../utils/useResource";
import { autoDetectRenderer, Container } from "pixi.js";
import AnimationPreview from "../AnimationPreview/AnimationPreview";
import store from "../../store/store";

// BUUUG:
// Seems like I can't have two renderers.
// Look into it

function AnimationEditor({
  sx,
  style
}: {
  sx?: SxProps<Theme>
  style?: React.CSSProperties
}) {
  const canvasContainer = useRef<HTMLDivElement>(null);


  // Setup/cleanup renderer and scene
  const {data: scene} = useResource({
    creator: async () => {
      const renderer = await autoDetectRenderer({multiView: true});
      const stage = new Container();
      stage.eventMode = "static";

      return {
        renderer,
        stage
      };
    },
    cleanup: (scene) => {
      scene.stage.destroy();
      scene.renderer.destroy(true);
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


  // Add canvas to dom
  useEffect(() => {
    if (canvasContainer.current && scene) {
      canvasContainer.current.innerHTML = "";
      if (scene.renderer.view.canvas instanceof HTMLCanvasElement) {
        canvasContainer.current.appendChild(scene.renderer.view.canvas);
      }
    }
  }, [scene]);


  // Rendering
  useEffect(() => {
    if (!scene) return;

    const {stage, renderer} = scene;

    let id: number;

    const render = () => {
      if (!stage.destroyed) {

        renderer.render({
          container: stage,
          clear: true,
          clearColor: store.canvasColor
        });

        id = requestAnimationFrame(render);
      }
    }

    id = requestAnimationFrame(render);

    return () => cancelAnimationFrame(id);
  }, [scene]);


  return <Box
    sx={sx}
    position="relative"
    style={{
      overflow: "hidden",
      ...style
    }}
  >
    <Box
      position="absolute"
      sx={{
        width: "100%",
        height: "100%"
      }}
      ref={canvasContainer}
    />
  </Box>
}

export default AnimationEditor