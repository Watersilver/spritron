// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'

import "./libs/proxy-state/tests"


import { Box, createTheme, CssBaseline, IconButton, Stack, ThemeProvider, Typography, type SxProps, type Theme } from "@mui/material";
import TextureLoader from "./components/TextureLoader/TextureLoader";
import { useState } from "react";
import TextureDisplayer from "./components/TextureDisplayer/TextureDisplayer";
import MenuBar from "./components/MenuBar/MenuBar";
import store, { useWatch } from "./store/store";
import { deproxify } from "./libs/proxy-state";
import AnimationMenu from "./components/AnimationMenu/AnimationMenu";
import FrameOptions from "./components/FrameOptions/FrameOptions";
// import store, { useWatch } from "./store/store";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PauseIcon from '@mui/icons-material/Pause';
// import Export from "./components/Export/Export";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function CoordsTracker({
  sx
}: {
  sx?: SxProps<Theme>
}) {
  const mousePos = useWatch(() => store.workArea.mousePos, () => deproxify(store.workArea.mousePos));

  return <Box sx={sx}>
    <Typography variant="subtitle2" color="textSecondary">
      [{Math.floor(mousePos.x)},{Math.floor(mousePos.y)}]
    </Typography>
  </Box>;
}

const playstop = (e: React.MouseEvent) => {
  e.stopPropagation();
  store.preview.playing = !store.preview.playing;
  const a = store.animations.find(a => a.id === store.selectedAnimation);
  if (a && a.frames.length - 1 + (a.pingPong ? a.frames.length : 0) - (a.pingPong?.noFirst ? 1 : 0) - (a.pingPong?.noLast ? 1 : 0) <= store.preview.frame) {
    store.preview.frame = 0;
  }
}

function PreviewControls({
  sx
}: {
  sx?: SxProps<Theme>
}) {
  const p = useWatch(() => store.preview.playing, () => store.preview.playing);

  return <Box sx={sx}>
    <Stack
      direction="row"
      sx={{
        background: "linear-gradient(#0000, #000A)"
      }}
    >
      <IconButton
        sx={{borderRadius: 0}}
        onClick={playstop}
      >
        {
          p
          ? <PauseIcon />
          : <PlayArrowIcon />
        }
      </IconButton>
      <IconButton
        sx={{borderRadius: 0}}
        onClick={e => {
          e.stopPropagation();
          store.preview.frame = 0;
          store.preview.playing = false;
        }}
      >
        <StopIcon />
      </IconButton>
    </Stack>
  </Box>
}

function App() {
  const [theme] = useState(darkTheme);

  const [workAreaElement, setWorkAreaElement] = useState<HTMLElement>();
  const [animFramesElement, setAnimFramesElement] = useState<HTMLElement>();
  const [previewElement, setPreviewElement] = useState<HTMLElement>();

  const isAnimSelected = useWatch(() => store.selectedAnimation, () => store.selectedAnimation !== null);
  const animFramesHeight = useWatch(() => store.animFrames.height, () => store.animFrames.height);

  // const [show,setShow] = useState(true);

  // const {files, textures} = useSnapshot(state);
  // const setFiles: React.Dispatch<React.SetStateAction<File[]>> = (f) => {
  //   if (!Array.isArray(f)) {
  //     f = f([...files])
  //   }
  //   state.files.length = 0;
  //   for (const file of f) {
  //     state.files.push(ref(file));
  //   }
  // }

  // const [files, setFiles] = useState<File[]>([]);

  return (
    <ThemeProvider
      theme={theme}
    >
      <CssBaseline />
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          pointerEvents: 'none'
        }}
      >
        <TextureDisplayer
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 0,
            pointerEvents: "auto"
          }}
          workAreaElement={workAreaElement}
          animFramesElement={animFramesElement}
          previewElement={previewElement}
        />
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            display: 'grid',
            gridTemplateAreas: `
              "a c e"
              "a b e"
              "a b e"
              ${isAnimSelected ? '"f f f"' : ""}
              ${isAnimSelected ? '"g g g"' : ""}
              "d d d"
            `,
            gridTemplateColumns: "auto 1fr auto",
            gridTemplateRows: "auto 1fr 1fr auto auto",
            zIndex: 1000
          }}
        >
          <MenuBar
            sx={theme => ({
              gridArea: "c",
              backgroundColor: theme.palette.background.default,
              pointerEvents: "auto"
            })}
          />
          <TextureLoader
            sx={theme => ({
              gridArea: "a",
              backgroundColor: theme.palette.background.default,
              pointerEvents: "auto"
            })}
            editable
          />
          <Box
            sx={{
              gridArea: "b",
            }}
            ref={(e) => {
              if (e instanceof HTMLElement) {
                setWorkAreaElement(e);
              }
            }}
          />
          <AnimationMenu
            sx={theme => ({
              gridArea: "e",
              backgroundColor: theme.palette.background.default,
              pointerEvents: "auto"
            })}
          />
          {isAnimSelected ? <Box
            sx={theme => ({
              gridArea: "f",
              backgroundColor: theme.palette.background.default,
              height: 8,
              pointerEvents: "auto"
            })}
          /> : null}
          {/* {isAnimSelected ? <Box
            sx={{
              gridArea: "g",
              minHeight: animFramesHeight + "vh"
            }}
            ref={(e) => {
              if (e instanceof HTMLElement) {
                setAnimFramesElement(e);
              }
            }}
          /> : null} */}
          {isAnimSelected ? <Box
            sx={{
              gridArea: "g",
              minHeight: animFramesHeight + "vh",
              // TODO? frame options only appear when frame is selected
              display: "grid",
              gridTemplateAreas: `"frame-options animation-frames animation-preview"`,
              gridTemplateColumns: "auto 1fr auto"
            }}
          >
            <FrameOptions
              sx={{
                gridArea: "frame-options",
                pointerEvents: "auto"
              }}
            />
            <Box
              sx={{gridArea: "animation-frames"}}
              ref={(e) => {
                if (e instanceof HTMLElement) {
                  setAnimFramesElement(e);
                }
              }}
            />
            <Box
              sx={{
                display: "grid",
                gridArea: "animation-preview",
                gridTemplateColumns: "auto 1fr",
                width: `calc(${animFramesHeight + "vh"} + 8px)`
              }}
            >
              <Box
                sx={theme => ({
                  backgroundColor: theme.palette.background.default,
                  width: 8
                })}
              />
              <Box
                ref={e => {
                  if (e instanceof HTMLElement) {
                    setPreviewElement(e);
                  }
                }}
                sx={{
                  position: "relative",
                  pointerEvents: "auto",
                  "--prev-hov-op": 0,
                  "&:hover": {
                    "--prev-hov-op": 1
                  }
                }}
                onClick={playstop}
              >
                <PreviewControls
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    opacity: "var(--prev-hov-op)",
                    transition: "opacity 0.1s",
                    width: "100%"
                  }}
                />
              </Box>
            </Box>
          </Box> : null}
          <Stack
            sx={theme => ({
              gridArea: "d",
              position: 'relative',
              pointerEvents: "auto",
              backgroundColor: theme.palette.background.default,
            })}
            direction='row'
            justifyContent="space-between"
            alignItems="end"
          >
            <CoordsTracker />
            {/* <Export
              anchorOrigin={{
                vertical: "top",
                horizontal: "right"
              }}
              transformOrigin={{
                vertical: "bottom",
                horizontal: "right"
              }}
              tooltipPlacement="left"
            /> */}
            <Typography
              sx={{pr: 1}}
              variant="subtitle2"
              color="textDisabled"
            >
              Version 1.0
            </Typography>
          </Stack>
          {/* <Box>
            <Button onClick={() => setShow(p=>!p)}>{show ? "Hide" : "Show"}</Button>
            {show ? <TextureDisplayer /> : null}
          </Box> */}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App
