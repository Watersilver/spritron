import { Box, IconButton, Typography, type SxProps } from "@mui/material"
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import store, { useWatch } from "../../store/store";

// ? info: how and when to refresh
// explain that one might need to change relative paths in json depending on folder structure
// and that it(json) assumes all are in the same folder
// That last one might be better moved to the export screen

function MenuBar({
  sx
}: {
  sx?: SxProps
}) {

  const bgc = useWatch(() => store.canvasColor, () => store.canvasColor);

  return <Box sx={sx}>
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto auto"
      }}
    >
      <Box></Box>
      <Box></Box>
      <Box
        sx={{
          display: "grid",
          alignItems: "center",
          gridTemplateAreas: "a"
        }}
      >
        <input
          type="color"
          value={bgc}
          onChange={e => {
            store.canvasColor = e.target.value;
          }}
          style={{
            borderRadius: 0,
            border: 0,
            backgroundColor: "none",
            padding: 0,
            gridArea: "a",
            width: "64px"
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{
            gridArea: "a",
            pointerEvents: "none",
            display: "grid",
            justifyItems: "center",
            textShadow: `
              0px 1px black,
              1px 1px black,
              1px 0px black,
              1px -1px black,
              0px -1px black,
              -1px -1px black,
              -1px 0px black,
              -1px 1px black
            `
          }}
          inert
        >
          bg colour
        </Typography>
      </Box>
      <IconButton sx={{borderRadius: 0}}>
        <QuestionMarkIcon />
      </IconButton>
    </Box>
  </Box>
}

export default MenuBar