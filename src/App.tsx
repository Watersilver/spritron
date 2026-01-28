// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'

import "./libs/proxy-state/tests"


import { Box, createTheme, CssBaseline, ThemeProvider, Typography, type SxProps, type Theme } from "@mui/material";
import TextureLoader from "./components/TextureLoader/TextureLoader";
import { useState } from "react";
import TextureDisplayer from "./components/TextureDisplayer/TextureDisplayer";
import MenuBar from "./components/MenuBar/MenuBar";
import store, { useWatch } from "./store/store";
import { deproxify } from "./libs/proxy-state";
import AnimationMenu from "./components/AnimationMenu/AnimationMenu";
import FrameOptions from "./components/FrameOptions/FrameOptions";
// import store, { useWatch } from "./store/store";

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
  </Box>
}

function App() {
  const [theme] = useState(darkTheme);

  const [workAreaElement, setWorkAreaElement] = useState<HTMLElement>();
  const [animFramesElement, setAnimFramesElement] = useState<HTMLElement>();

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
            {/* TODO */}
            <Box
              sx={{gridArea: "animation-preview"}}
            />
          </Box> : null}
          <CoordsTracker
            sx={theme => ({
              gridArea: "d",
              backgroundColor: theme.palette.background.default,
              pointerEvents: "auto"
            })}
          />
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
