import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Box, Card, CardContent, Container, Dialog, IconButton, Slide, Typography } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef } from "react";

const Transition =
forwardRef(
  (
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) => {
  return <Slide direction="down" ref={ref} {...props} />;
}
);

function ExportExplanation({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  return <Dialog
    fullScreen
    open={open}
    onClose={onClose}
    slots={{
      transition: Transition
    }}
  >
    <Box
      sx={theme => ({
        width: "100%",
        height: "100%",
        background: theme.palette.background.default
      })}
    >
      <IconButton
        sx={{float: "left", margin: 1, borderRadius: 0}}
        onClick={() => onClose()}
      >
        <ArrowBackIosNewIcon />
      </IconButton>
      <Container
        sx={{
          height: "100%"
        }}
      >
        <Card
          sx={{
            height: "100%",
            borderRadius: 0,
            overflow: "auto"
          }}
        >
          <CardContent>
            <Typography>
              Oh, hello! You probably weren't expecting this wall of text but the exports require a bit more explanation and some examples.
            </Typography>
            <br/>
            <Typography>
              There's two types of exports:
            </Typography>
            <ul>
              <li>
                <Typography>
                  A json export of all the animations that holds all the data to help animate the original texture
                </Typography>
              </li>
              <li>
                <Typography>
                  An image export that exports the currently selected animation as an image, alongside a json with useful animation data (loop, frame duration, dimensions, etc)
                </Typography>
              </li>
            </ul>
            <Typography>
              Most people will probably use the second because it's simpler, but the first can be useful when making a browser game with any engine that doesn't pack its textures to avoid making an http request for every animation image, and generally anyone that needs to save space.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  </Dialog>
}

export default ExportExplanation