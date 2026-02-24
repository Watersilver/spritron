import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Box, Card, CardContent, Container, Dialog, IconButton, Link, Slide, Stack, Typography } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef } from "react";
import TagIcon from '@mui/icons-material/Tag';

const Transition =
forwardRef(
  (
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) => {
  return <Slide direction="down" ref={ref} {...props} />;
}
);

function SectionTitle({
  variant,
  id,
  title,
  subtitle
}: {
  variant: "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
  id: string,
  title: string,
  subtitle?: boolean
}) {
  return <Stack
    direction='row'
    alignItems='center'
    sx={{pb: 3}}
    spacing={2}
  >
    <Link
      href={"#" + id}
      sx={theme => ({
        color: "#ffffff22",
        "&:hover": {
          color: theme.palette.primary.main
        }
      })}
    >
      <TagIcon fontSize='large' />
      {
        subtitle
        ? <TagIcon fontSize='large' />
        : null
      }
    </Link>
    <Typography id={id} variant={variant}>
      {title}
    </Typography>
  </Stack>
}

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
        background: theme.palette.background.default,
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 1
      })}
    >
      <Stack
        sx={{
          mr: 3,
          ml: 1,
          mt: 1
        }}
        spacing={1}
        alignItems="start"
      >
        <IconButton
          sx={{borderRadius: 0}}
          onClick={() => onClose()}
        >
          <ArrowBackIosNewIcon />
        </IconButton>
        <Card
          variant='outlined'
        >
          <CardContent
            sx={{pt: 1, pb: "8px !important"}}
          >
            <ul
              style={{paddingLeft: 8}}
            >
              <Link
                href="#intro"
              >
                <li>
                  Introduction
                </li>
              </Link>
              <Link
                href="#docs"
              >
                <li>
                  Docs
                </li>
              </Link>
            </ul>
          </CardContent>
        </Card>
      </Stack>
      <Container
        sx={{
          height: "100%",
          p: "0 !important"
        }}
      >
        <Card
          sx={{
            height: "100%",
            borderRadius: 0,
            overflow: "auto",
            px: 3,
            position: "relative"
          }}
        >
          <CardContent
            sx={{
              height: "100%",
              position: "absolute"
            }}
          >
            <SectionTitle
              title='Introduction'
              variant='h4'
              id='intro'
            />
            <Typography>
              There's two types of exports:
            </Typography>
            <ul>
              <li>
                <Typography>
                  A <b style={{textDecoration: "underline"}}>json export</b> of all the animations that holds all the data to help animate the original texture. It's useful when you want to only load the original texture, like for example in browser games where you want to avoid making an http request per animation. If your engine bundles textures it's not that useful.
                </Typography>
              </li>
              <li>
                <Typography>
                  An <b style={{textDecoration: "underline"}}>image export</b> that exports the currently selected animation as an image, alongside an optional json with useful animation data (loop, frame durations, dimensions, etc). The exported image can also be used as a new spritesheet that is organised more in accordance to the needs of the user.
                </Typography>
              </li>
            </ul>
            <SectionTitle
              title='Docs'
              variant='h4'
              id='docs'
            />
            <SectionTitle
              title='Image Export'
              variant='h5'
              id='docs-im-exp'
              subtitle
            />
            {/* Make a table and shit */}
            {/* https://ldtk.io/json/#ldtk-ProjectJson */}
            {/* https://mui.com/material-ui/react-table/ */}
          </CardContent>
        </Card>
      </Container>
    </Box>
  </Dialog>
}

export default ExportExplanation