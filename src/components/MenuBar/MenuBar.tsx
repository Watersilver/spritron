import { Box, IconButton, type Theme, type SxProps, Typography, Stack, Popover, Link, Alert } from "@mui/material"
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
// import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import store, { useWatch } from "../../store/store";
import ColourInput from "../ColourInput/ColourInput";
import Export from "../Export/Export";
import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from "react";
import ExportExplanation from "../ExportExplanation/ExportExplanation";

// ? info: how and when to refresh
// explain that one might need to change relative paths in json depending on folder structure
// and that it(json) assumes all are in the same folder
// That last one might be better moved to the export screen
// {/* Note that too big images will fail to load */}



const lineHeight = 1.2;

function MenuBar({
  sx
}: {
  sx?: SxProps<Theme>
}) {

  const [settingsAnchor, setSettingsAnchor] = useState<HTMLButtonElement | null>(null);
  const [helpAnchor, setHelpAnchor] = useState<HTMLButtonElement | null>(null);
  const bgc = useWatch(() => store.colours.canvas, () => store.colours.canvas);
  const gc = useWatch(() => store.colours.guides, () => store.colours.guides);
  const sc = useWatch(() => store.colours.selectedFrame, () => store.colours.selectedFrame);
  const mc = useWatch(() => store.colours.margin, () => store.colours.margin);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [exportExplainOpen, setExportExplainOpen] = useState(false);

  return <>
    <ExportExplanation
      open={exportExplainOpen}
      onClose={() => setExportExplainOpen(false)}
    />
    <Popover
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      anchorEl={helpAnchor}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right"
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right"
      }}
    >
      <Box
        sx={{
          p: 2,
          maxWidth: "33vw"
        }}
      >
        <Typography>
          Welcome to spritron, an app meant to help you painlessly create animations from spritesheets!
        </Typography>
        <br />
        <Typography>
          Load images, define grids on them, add animations and then click on the grid frames to add them to the animations!
        </Typography>
        <br />
        <Typography>
          Then <Link
            href="#"
            onClick={() => setExportExplainOpen(true)}
          >export</Link>. You're <b><i>DONE!</i></b> God damnit, you're done.
        </Typography>
        <br />
        {/* <br /> */}
        <Alert
          variant="outlined" 
          severity="info"
        >
          This app uses a <Link
            href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest"
          >Web application manifest</Link> to work offline, which means that when it's updated you need to refresh twice to see the changes.
          If this doesn't work for some reason, just clear the cookies and site data and it should be updated next time you open it.
        </Alert>
      </Box>
    </Popover>
    <Popover
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      anchorEl={settingsAnchor}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right"
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right"
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: "1fr 1fr",
          padding: 2
        }}
      >
        <label
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            justifyContent: "end"
          }}
        >
          <Stack
            alignItems="end"
          >
            <Typography
              variant="subtitle1"
              color="textPrimary"
              sx={{lineHeight}}
            >
              Background
            </Typography>
            <Typography
              variant="subtitle1"
              color="textPrimary"
              sx={{lineHeight}}
            >
              Colour
            </Typography>
          </Stack>
          <ColourInput
            valueStr={bgc}
            onChangeStr={(e) => {store.colours.canvas = e.target.value;}}
          />
        </label>
        <label
          style={{display: "flex", gap: "4px", alignItems: "center"}}
        >
          <ColourInput
            valueStr={gc}
            onChangeStr={(e) => {store.colours.guides = e.target.value;}}
          />
          <Stack>
            <Typography
              variant="subtitle1"
              color="textPrimary"
              sx={{lineHeight}}
            >
              Guides
            </Typography>
            <Typography
              variant="subtitle1"
              color="textPrimary"
              sx={{lineHeight}}
            >
              Colour
            </Typography>
          </Stack>
        </label>
        <label
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            justifyContent: "end"
          }}
        >
          <Stack
            alignItems="end"
          >
            <Typography
              variant="subtitle1"
              color="textPrimary"
              sx={{lineHeight}}
            >
              Selection
            </Typography>
            <Typography
              variant="subtitle1"
              color="textPrimary"
              sx={{lineHeight}}
            >
              Colour
            </Typography>
          </Stack>
          <ColourInput
            valueStr={sc}
            onChangeStr={(e) => {store.colours.selectedFrame = e.target.value;}}
          />
        </label>
        <label
          style={{display: "flex", gap: "4px", alignItems: "center"}}
        >
          <ColourInput
            valueStr={mc}
            onChangeStr={(e) => {store.colours.margin = e.target.value;}}
          />
          <Stack>
            <Typography
              variant="subtitle1"
              color="textPrimary"
              sx={{lineHeight}}
            >
              Margin
            </Typography>
            <Typography
              variant="subtitle1"
              color="textPrimary"
              sx={{lineHeight}}
            >
              Colour
            </Typography>
          </Stack>
        </label>
      </Box>
    </Popover>
    <Box sx={sx}>
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto"
        }}
      >
        <Export
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left"
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left"
          }}
          tooltipPlacement="right"
          sx={{fontWeight: 700}}
        />
        <Box></Box>
        <IconButton
          sx={{borderRadius: 0}}
          onClick={() => setSettingsOpen(true)}
          ref={e => {
            if (e instanceof HTMLElement) {
              setSettingsAnchor(e);
            }
          }}
        >
          <SettingsIcon />
        </IconButton>

        <IconButton
          sx={{borderRadius: 0}}
          onClick={() => setHelpOpen(true)}
          ref={e => {
            if (e instanceof HTMLElement) {
              setHelpAnchor(e);
            }
          }}
        >
          <QuestionMarkIcon />
        </IconButton>
      </Box>
    </Box>
  </>
}

export default MenuBar