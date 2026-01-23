import { Box, IconButton, type Theme, type SxProps } from "@mui/material"
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import store, { useWatch } from "../../store/store";
import ColourInput from "../ColourInput/ColourInput";

// ? info: how and when to refresh
// explain that one might need to change relative paths in json depending on folder structure
// and that it(json) assumes all are in the same folder
// That last one might be better moved to the export screen

function MenuBar({
  sx
}: {
  sx?: SxProps<Theme>
}) {

  const bgc = useWatch(() => store.colours.canvas, () => store.colours.canvas);

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
      <ColourInput
        title="bg colour"
        valueStr={bgc}
        onChangeStr={(e) => {store.colours.canvas = e.target.value;}}
      />
      <IconButton sx={{borderRadius: 0}}>
        <QuestionMarkIcon />
      </IconButton>
    </Box>
  </Box>
}

export default MenuBar