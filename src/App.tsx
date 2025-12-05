// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'

import "./libs/proxy-state/tests"


import { Box, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import TextureLoader from "./components/TextureLoader/TextureLoader";
import { useState } from "react";
import TextureDisplayer from "./components/TextureDisplayer/TextureDisplayer";
import store, { useWatch } from "./store/store";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function CoordsTracker() {
  const coords = useWatch(() => store.workArea, () => ({mouse: {...store.workArea.mousePos}, ...store.workArea.pos}));
  return <Box sx={{gridArea: 'c'}}>
    <Box>
      Mouse: x = {coords.mouse.x} | y = {coords.mouse.y}
    </Box>
    <Box>
      Position: x = {coords.x} | y = {coords.y}
    </Box>
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
            "a b b"
            "a b b"
            "c c c"
          `,
          gridTemplateColumns: "auto 1fr 1fr",
          gridTemplateRows: "1fr 1fr auto"
        }}
      >
        <TextureLoader
          sx={{
            gridArea: "a",
            overflow: 'auto'
          }}
          editable
        />
        <TextureDisplayer
          sx={{gridArea: "b"}}
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
