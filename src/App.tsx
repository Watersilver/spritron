// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'

import "./libs/proxy-state/tests"


import { Box, createTheme, CssBaseline, ThemeProvider, Typography } from "@mui/material";
import TextureLoader from "./components/TextureLoader/TextureLoader";
import { useState } from "react";
import TextureDisplayer from "./components/TextureDisplayer/TextureDisplayer";
import MenuBar from "./components/MenuBar/MenuBar";
import store, { useWatch } from "./store/store";
import { deproxify } from "./libs/proxy-state";
import AnimationMenu from "./components/AnimationMenu/AnimationMenu";
import AnimationPreview from "./components/AnimationPreview/AnimationPreview";
// import store, { useWatch } from "./store/store";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function CoordsTracker() {
  const mousePos = useWatch(() => store.workArea.mousePos, () => deproxify(store.workArea.mousePos));

  return <Box sx={{gridArea: 'd'}}>
    <Typography variant="subtitle2" color="textSecondary">
      [{Math.floor(mousePos.x)},{Math.floor(mousePos.y)}]
    </Typography>
  </Box>
}

function App() {
  const [theme] = useState(darkTheme);
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
          display: 'grid',
          gridTemplateAreas: `
            "a c e"
            "a b e"
            "a b e"
            "a f e"
            "a d e"
          `,
          gridTemplateColumns: "auto 1fr auto",
          gridTemplateRows: "auto 1fr 1fr auto auto"
        }}
      >
        <MenuBar
          sx={{gridArea: "c"}}
        />
        <TextureLoader
          sx={{gridArea: "a"}}
          editable
        />
        <TextureDisplayer
          sx={{gridArea: "b"}}
        />
        <AnimationMenu
          sx={{gridArea: "e"}}
        />
        <AnimationPreview
          sx={{gridArea: "f"}}
        />
        <CoordsTracker />
        {/* <Box>
          <Button onClick={() => setShow(p=>!p)}>{show ? "Hide" : "Show"}</Button>
          {show ? <TextureDisplayer /> : null}
        </Box> */}
      </Box>
    </ThemeProvider>
  );
}

export default App
