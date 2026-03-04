import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { Alert, Box, Button, ButtonGroup, Card, CardContent, Container, Dialog, IconButton, Link, Slide, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, type SxProps, type Theme } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef } from "react";
import TagIcon from '@mui/icons-material/Tag';

import {
  GodotJsonExportUsage,
  GodotJsonExportCode,
  GodotImgExportCode,
  GodotImgExportUsage
} from './CodeSnippets/codeSnippets';
import useCachedState from '../../utils/useCachedState';

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

function FieldCell({
  id,
  sx,
  children
}: {
  id?: string,
  sx?: SxProps<Theme>,
  children?: React.ReactNode
}) {
  return <TableCell
    id={id}
    sx={sx}
    component="th"
    scope='row'
  >
    <Typography
      component='span'
      sx={theme => ({
        fontFamily: "monospace",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.secondary.main,
        p: 1,
        borderRadius: "2px"
      })}
    >
      {children}
    </Typography>
  </TableCell>
}

function TypeCell({
  sx,
  children
}: {
  sx?: SxProps<Theme>,
  children?: React.ReactNode
}) {
  return <TableCell
    sx={sx}
  >
    <Typography
      sx={{fontFamily: "monospace"}}
      color='textSecondary'
    >
      {children}
    </Typography>
  </TableCell>
}

function DescCell({
  sx,
  children,
  noTypography
}: {
  sx?: SxProps<Theme>,
  children?: React.ReactNode,
  noTypography?: boolean
}) {
  return <TableCell
    sx={sx}
  >
    {
      noTypography ? children : <Typography>{children}</Typography>
    }
  </TableCell>
}

function ExportExplanation({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [engine, setEngine] = useCachedState(
    "Godot",
    "selectedTutorialEngine",
    s=>s,s=>s
  )
  const [viewMode, setViewMode] = useCachedState(
    "Usage",
    "tutorialViewMode",
    s=>s,s=>s
  )

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
              <li>
                <Link
                  href="#intro"
                >
                  Introduction
                </Link>
              </li>
              <li>
                <Link
                  href="#usage-examples"
                >
                  Usage examples
                </Link>
              </li>
              <ul
                style={{paddingLeft: 8}}
              >
                <li>
                  <Link
                    href="#usage-examples-im-exp"
                  >
                    Image export
                  </Link>
                </li>
                <li>
                  <Link
                    href="#usage-examples-json-exp"
                  >
                    JSON export (advanced)
                  </Link>
                </li>
              </ul>
              <li>
                <Link
                  href="#docs"
                >
                  Docs
                </Link>
              </li>
              <ul
                style={{paddingLeft: 8}}
              >
                <li>
                  <Link
                    href="#docs-im-exp"
                  >
                    Image export
                  </Link>
                </li>
                <li>
                  <Link
                    href="#docs-json-exp"
                  >
                    JSON export (advanced)
                  </Link>
                </li>
              </ul>
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
          id="explanation"
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
                  An <b style={{textDecoration: "underline"}}>image export</b> that exports the currently selected animation as an image, alongside an optional json with useful animation data (loop, frame durations, dimensions, etc). The exported image can also be used as a new spritesheet that is organised more in accordance to the needs of the user.
                </Typography>
              </li>
              <li>
                <Typography>
                  A <b style={{textDecoration: "underline"}}>json export</b> of all the animations that holds all the data to help animate the original texture. It's useful when you want to only load the original texture, like for example in browser games where you want to avoid making an http request per animation. If your engine bundles textures it's not that useful.
                </Typography>
              </li>
            </ul>
            <br/>
            <SectionTitle
              title='Usage examples'
              variant='h4'
              id='usage-examples'
            />
            <Typography>
              This section has implementations of spritron animations for different engines. It includes usage examples and the source code. To use it just copy and paste the code and follow the instructions to set it up.
            </Typography>
            <br/>
            <SectionTitle
              title='Image export'
              variant='h5'
              id='usage-examples-im-exp'
              subtitle
            />
            <Stack
              justifyContent="space-between"
              direction='row'
              mb={1}
            >
              <ButtonGroup>
                <Button
                  variant={engine === "Godot" ? "contained" : "outlined"}
                  disabled={engine === "Godot"}
                  onClick={() => {
                    setEngine("Godot");
                  }}
                >Godot</Button>
                <Button
                  variant={engine === "Pixi.js" ? "contained" : "outlined"}
                  disabled={engine === "Pixi.js"}
                  onClick={() => {
                    setEngine("Pixi.js");
                  }}
                >Pixi.js</Button>
              </ButtonGroup>
              <ButtonGroup>
                <Button
                  variant={viewMode === "Usage" ? "contained" : "outlined"}
                  disabled={viewMode === "Usage"}
                  onClick={() => {
                    setViewMode("Usage");
                  }}
                >Usage</Button>
                <Button
                  variant={viewMode === "Code" ? "contained" : "outlined"}
                  disabled={viewMode === "Code"}
                  onClick={() => {
                    setViewMode("Code");
                  }}
                >Code</Button>
              </ButtonGroup>
            </Stack>
            {
              engine === "Godot"
              ? <>
                <Typography mb={1}>
                  This implementation works by loading the exported image and data to a Sprite2D node with a custom script.
                </Typography>
                <br/>
                {
                viewMode === "Code"
                ? <GodotImgExportCode />
                : viewMode === "Usage"
                ? <GodotImgExportUsage />
                : null
                }
              </>
              : engine === "Pixi.js"
              ? (
                viewMode === "Code"
                ? <>TODO</>
                : viewMode === "Usage"
                ? <>TODO</>
                : null
              )
              : null
            }
            <br/>
            <SectionTitle
              title='JSON export'
              variant='h5'
              id='usage-examples-json-exp'
              subtitle
            />
            <Stack
              justifyContent="space-between"
              direction='row'
              mb={1}
            >
              <ButtonGroup>
                <Button
                  variant={engine === "Godot" ? "contained" : "outlined"}
                  disabled={engine === "Godot"}
                  onClick={() => {
                    setEngine("Godot");
                  }}
                >Godot</Button>
                <Button
                  variant={engine === "Pixi.js" ? "contained" : "outlined"}
                  disabled={engine === "Pixi.js"}
                  onClick={() => {
                    setEngine("Pixi.js");
                  }}
                >Pixi.js</Button>
              </ButtonGroup>
              <ButtonGroup>
                <Button
                  variant={viewMode === "Usage" ? "contained" : "outlined"}
                  disabled={viewMode === "Usage"}
                  onClick={() => {
                    setViewMode("Usage");
                  }}
                >Usage</Button>
                <Button
                  variant={viewMode === "Code" ? "contained" : "outlined"}
                  disabled={viewMode === "Code"}
                  onClick={() => {
                    setViewMode("Code");
                  }}
                >Code</Button>
              </ButtonGroup>
            </Stack>
            {
              engine === "Godot"
              ? <>
                <Typography mb={1}>
                  This implementation works by loading the export in a Godot resource, `SpritronExport`, which is then passed to the node `SpritronAnimations`.
                </Typography>
                <Typography mb={1}>
                  `SpritronAnimations` can then be used to play all the animations defined in the export.
                </Typography>
                <Alert severity='warning'>
                  Different instances of `SpritronAnimations` should use the same `SpritronExport` resource if you want them to play the same animations. Do not create a different `SpritronExport` for each one or you might end up using duplicated textures.
                </Alert>
                <br/>
                {
                viewMode === "Code"
                ? <GodotJsonExportCode />
                : viewMode === "Usage"
                ? <GodotJsonExportUsage />
                : null
                }
              </>
              : engine === "Pixi.js"
              ? (
                viewMode === "Code"
                ? <>TODO</>
                : viewMode === "Usage"
                ? <>TODO</>
                : null
              )
              : null
            }
            <br/>
            <SectionTitle
              title='Docs'
              variant='h4'
              id='docs'
            />
            <Typography>
              This section describes the structure of the exports in case the code provided above doesn't cover your usecase or you want to make your own implementation.
            </Typography>
            <br/>
            <SectionTitle
              title='Image export'
              variant='h5'
              id='docs-im-exp'
              subtitle
            />
            <Typography mb={1}>
              The image export is a zip containing two files. An image of the selected format, and a json with animation data on it.
            </Typography>
            <Typography>
              The image is the same as the frames preview when creating the animation, with the same padding, offset and columns defined there.
            </Typography>
            <Typography mb={1}>
              For the jpeg format, transparency is replaced by the first provided transparency colour.
            </Typography>
            <Typography mb={1}>
              The export also has an optional json file to describe data about the animation.
              You don't need to use this if the data is irrelevnt,
              i.e. you intend to use the exported image just as a spritesheet.
            </Typography>
            <Typography>
              Structure:
            </Typography>
            <br/>
            <TableContainer
              sx={theme => ({
                outline: `2px solid ${theme.palette.background.default}`,
              })}
            >
              <Table>
                <TableHead
                  sx={theme => ({
                    backgroundColor: theme.palette.background.default
                  })}
                >
                  <TableRow>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Field
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Type
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'
                      width="61%"
                    >
                      <Typography>
                        Description/Notes
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <FieldCell>
                      width
                    </FieldCell>
                    <TypeCell>
                      Int
                    </TypeCell>
                    <DescCell>
                      The width of the frame in pixels
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      height
                    </FieldCell>
                    <TypeCell>
                      Int
                    </TypeCell>
                    <DescCell>
                      The height of the frame in pixels
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      offset
                    </FieldCell>
                    <TypeCell>
                      Int
                    </TypeCell>
                    <DescCell>
                      The outer padding, i.e. how many pixels you need to skip in each dimension to reach the start of the first frame
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      padding
                    </FieldCell>
                    <TypeCell>
                      Int
                    </TypeCell>
                    <DescCell>
                      Padding in pixels between frames
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      columns
                    </FieldCell>
                    <TypeCell>
                      Int
                    </TypeCell>
                    <DescCell>
                      --
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      rows
                    </FieldCell>
                    <TypeCell>
                      Int
                    </TypeCell>
                    <DescCell>
                      --
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      framesPerSecond
                    </FieldCell>
                    <TypeCell>
                      Float
                    </TypeCell>
                    <DescCell>
                      --
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      loop
                    </FieldCell>
                    <TypeCell>
                      Bool
                    </TypeCell>
                    <DescCell>
                      --
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      durations
                    </FieldCell>
                    <TypeCell>
                      Array[Float]
                    </TypeCell>
                    <DescCell noTypography>
                      <Typography>
                        Array containing the duration of each frame.
                        The duration determines how long a frame should last
                        compared to a 'normal' frame (duration: 1).
                      </Typography>
                      <br/>
                      <Typography>
                        A frame with a duration of 2 should last twice
                        as long and a frame with a duration of 0.5 should last half as long.
                      </Typography>
                      <br/>
                      <Typography>
                        This can be achieved by dividing the animation's frames per second by the
                        corresponding frame's duration
                        before using it to calculate the current frame progress.
                      </Typography>
                      <br/>
                      <Alert component='span' severity='warning'>Be careful when dividing by 0 or when both dividend and divisor are 0.</Alert>
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      framesLength
                    </FieldCell>
                    <TypeCell>
                      Int
                    </TypeCell>
                    <DescCell>
                      Number of frames of the animation. <br/><br/> Should be the same as the length of the durations array.
                    </DescCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <br/>
            <br/>
            <SectionTitle
              title='JSON export (advanced)'
              variant='h5'
              id='docs-json-exp'
              subtitle
            />
            <Typography mb={1}>
              The json export consists of a single json file, intended to be used in conjunction with the images used in the animations.
            </Typography>
            <Typography mb={1}>
              The provided json describes how to construct all the animations with the original spritesheets.
            </Typography>
            <Alert severity='warning' sx={{mb: 1}}>
              The json is quite big.
              Only use this approach if have a reason to use the original spritesheet instead of the exported image of the image export.
              <br/>
              For example, if the animations have to be used in the browser and you don't want to make two HTTP requests per animation (one for the image and another for its data).
              <br/>
              Another example is if you want to limit vram usage, it could potentially help, provided there is no part of the spritesheet that goes unused, it could save space because the image export might have repeat frames and any frame offset is baked into the texture.
            </Alert>
            <Typography>
              Structure:
            </Typography>
            <br/>
            <TableContainer
              sx={theme => ({
                outline: `2px solid ${theme.palette.background.default}`,
              })}
            >
              <Table>
                <TableHead
                  sx={theme => ({
                    backgroundColor: theme.palette.background.default
                  })}
                >
                  <TableRow>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Field
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Type
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'
                      width="61%"
                    >
                      <Typography>
                        Description/Notes
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <FieldCell id="images-field">
                      images
                    </FieldCell>
                    <TypeCell>
                      Array[String]
                    </TypeCell>
                    <DescCell>
                      Contains the names of the involved images. Used as IDs of the images.
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      transparenciesMap
                    </FieldCell>
                    <TypeCell>
                      Dictionary[String, Array[<Link href="#col-range-table">ColourRange</Link>]]
                    </TypeCell>
                    <DescCell>
                      Lists of colour ranges that should be treated as transparent on their corresponding images.
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      animations
                    </FieldCell>
                    <TypeCell>
                      Array[<Link href="#animation-table">Animation</Link>]
                    </TypeCell>
                    <DescCell>
                      --
                    </DescCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <br/>
            <Typography variant='h6' id="col-range-table">
              ColourRange
            </Typography>
            <br/>
            <TableContainer
              sx={theme => ({
                outline: `2px solid ${theme.palette.background.default}`,
              })}
            >
              <Table>
                <TableHead
                  sx={theme => ({
                    backgroundColor: theme.palette.background.default
                  })}
                >
                  <TableRow>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Field
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Type
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'
                      width="61%"
                    >
                      <Typography>
                        Description/Notes
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <FieldCell>
                      colour
                    </FieldCell>
                    <TypeCell>
                      <Link href="#colour-table">Colour</Link>
                    </TypeCell>
                    <DescCell>
                      --
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      threshold
                    </FieldCell>
                    <TypeCell>
                      Float
                    </TypeCell>
                    <DescCell>
                      Should be added and subtracted to each of the RGB colour values to determine the range. Any colour with RGB values in between is within the range.
                    </DescCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <br/>
            <Typography variant='h6' id="colour-table">
              Colour
            </Typography>
            <br/>
            <TableContainer
              sx={theme => ({
                outline: `2px solid ${theme.palette.background.default}`,
              })}
            >
              <Table>
                <TableHead
                  sx={theme => ({
                    backgroundColor: theme.palette.background.default
                  })}
                >
                  <TableRow>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Field
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Type
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'
                      width="61%"
                    >
                      <Typography>
                        Description/Notes
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <FieldCell>
                      r
                    </FieldCell>
                    <TypeCell>
                      Float
                    </TypeCell>
                    <DescCell>
                      Values between [0, 1]
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      g
                    </FieldCell>
                    <TypeCell>
                      Float
                    </TypeCell>
                    <DescCell>
                      Values between [0, 1]
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      b
                    </FieldCell>
                    <TypeCell>
                      Float
                    </TypeCell>
                    <DescCell>
                      Values between [0, 1]
                    </DescCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <br/>
            <Typography variant='h6' id="animation-table">
              Animation
            </Typography>
            <br/>
            <TableContainer
              sx={theme => ({
                outline: `2px solid ${theme.palette.background.default}`,
              })}
            >
              <Table>
                <TableHead
                  sx={theme => ({
                    backgroundColor: theme.palette.background.default
                  })}
                >
                  <TableRow>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Field
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Type
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'
                      width="61%"
                    >
                      <Typography>
                        Description/Notes
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <FieldCell>
                      name
                    </FieldCell>
                    <TypeCell>
                      String
                    </TypeCell>
                    <DescCell>
                      --
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      fps
                    </FieldCell>
                    <TypeCell>
                      Float
                    </TypeCell>
                    <DescCell>
                      Frames per second
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      loop
                    </FieldCell>
                    <TypeCell>
                      Bool
                    </TypeCell>
                    <DescCell>
                      --
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      pingPong
                    </FieldCell>
                    <TypeCell>
                      Null | <Link href="#pingpong-table">PingPong</Link>
                    </TypeCell>
                    <DescCell>
                      If not null, animation should not end when reaching last frame. Instead is should play again in reverse.
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      transform
                    </FieldCell>
                    <TypeCell>
                      Null | <Link href="#transform-table">Transform</Link>
                    </TypeCell>
                    <DescCell>
                      How the sprite should be rotated and/or mirrored.
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell id="frame-dimensions-field">
                      frameDimensions
                    </FieldCell>
                    <TypeCell>
                      <Link href="#dimensions-table">Dimensions</Link>
                    </TypeCell>
                    <DescCell>
                      Dimensions of every frame of the animation.
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      frames
                    </FieldCell>
                    <TypeCell>
                      Array[<Link href="#frame-table">Frame</Link>]
                    </TypeCell>
                    <DescCell>
                      --
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      framesLength
                    </FieldCell>
                    <TypeCell>
                      Int
                    </TypeCell>
                    <DescCell>
                      The amount of frames of the animations, adjusted for ping pong.
                    </DescCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <br/>
            <Typography variant='h6' id="pingpong-table">
              PingPong
            </Typography>
            <br/>
            <TableContainer
              sx={theme => ({
                outline: `2px solid ${theme.palette.background.default}`,
              })}
            >
              <Table>
                <TableHead
                  sx={theme => ({
                    backgroundColor: theme.palette.background.default
                  })}
                >
                  <TableRow>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Field
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Type
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'
                      width="61%"
                    >
                      <Typography>
                        Description/Notes
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <FieldCell>
                      noFirst
                    </FieldCell>
                    <TypeCell>
                      Bool
                    </TypeCell>
                    <DescCell>
                      If true, when playing the animation in reverse due to ping pong, the first frame (of the normal direction of the animation) should be skipped.
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      noLast
                    </FieldCell>
                    <TypeCell>
                      Bool
                    </TypeCell>
                    <DescCell>
                      If true, when playing the animation in reverse due to ping pong, the last frame (of the normal direction of the animation) should be skipped.
                    </DescCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <br/>
            <Typography variant='h6' id="transform-table">
              Transform
            </Typography>
            <br/>
            <TableContainer
              sx={theme => ({
                outline: `2px solid ${theme.palette.background.default}`,
              })}
            >
              <Table>
                <TableHead
                  sx={theme => ({
                    backgroundColor: theme.palette.background.default
                  })}
                >
                  <TableRow>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Field
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Type
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'
                      width="61%"
                    >
                      <Typography>
                        Description/Notes
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <FieldCell>
                      rotation
                    </FieldCell>
                    <TypeCell>
                      Null | 90 | 180 | 270
                    </TypeCell>
                    <DescCell>
                      In degrees. Pivot should be at center of the current frame's sprite.
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      mirror
                    </FieldCell>
                    <TypeCell>
                      Null | <Link href="#vector2-table">Vector2</Link>{"<"}Bool{">"}
                    </TypeCell>
                    <DescCell>
                      The x component mirrors around a vertical line that passes through the center of the sprite and the y around a horizontal.
                    </DescCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <br/>
            <Typography variant='h6' id="vector2-table">
              Vector2{"<"}T{">"} (generic)
            </Typography>
            <br/>
            <TableContainer
              sx={theme => ({
                outline: `2px solid ${theme.palette.background.default}`,
              })}
            >
              <Table>
                <TableHead
                  sx={theme => ({
                    backgroundColor: theme.palette.background.default
                  })}
                >
                  <TableRow>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Field
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Type
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'
                      width="61%"
                    >
                      <Typography>
                        Description/Notes
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <FieldCell>
                      x
                    </FieldCell>
                    <TypeCell>
                      T
                    </TypeCell>
                    <DescCell>
                      <i>context-sensitive</i>
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      y
                    </FieldCell>
                    <TypeCell>
                      T
                    </TypeCell>
                    <DescCell>
                      <i>context-sensitive</i>
                    </DescCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <br/>
            <Typography variant='h6' id="dimensions-table">
              Dimensions
            </Typography>
            <br/>
            <TableContainer
              sx={theme => ({
                outline: `2px solid ${theme.palette.background.default}`,
              })}
            >
              <Table>
                <TableHead
                  sx={theme => ({
                    backgroundColor: theme.palette.background.default
                  })}
                >
                  <TableRow>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Field
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Type
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'
                      width="61%"
                    >
                      <Typography>
                        Description/Notes
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <FieldCell>
                      w
                    </FieldCell>
                    <TypeCell>
                      Int
                    </TypeCell>
                    <DescCell>
                      Width in pixels
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      h
                    </FieldCell>
                    <TypeCell>
                      Int
                    </TypeCell>
                    <DescCell>
                      Height in pixels
                    </DescCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <br/>
            <Typography variant='h6' id="frame-table">
              Frame
            </Typography>
            <br/>
            <TableContainer
              sx={theme => ({
                outline: `2px solid ${theme.palette.background.default}`,
              })}
            >
              <Table>
                <TableHead
                  sx={theme => ({
                    backgroundColor: theme.palette.background.default
                  })}
                >
                  <TableRow>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Field
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Type
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'
                      width="61%"
                    >
                      <Typography>
                        Description/Notes
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <FieldCell>
                      i
                    </FieldCell>
                    <TypeCell>
                      Int
                    </TypeCell>
                    <DescCell>
                      Image index referencing the <Link href="#images-field">images</Link> array. The corresponding image is the one that should be used for this frame.
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      d
                    </FieldCell>
                    <TypeCell>
                      Float
                    </TypeCell>
                    <DescCell
                      noTypography
                    >
                      <Typography>
                        Frame duration. It determines how long a frame should last
                        compared to a 'normal' frame (duration: 1).
                      </Typography>
                      <br/>
                      <Typography>
                        A frame with a duration of 2 should last twice
                        as long and a frame with a duration of 0.5 should last half as long.
                      </Typography>
                      <br/>
                      <Typography>
                        This can be achieved by dividing the animation's frames per second by this value
                        before using it to calculate the current frame progress.
                      </Typography>
                      <br/>
                      <Alert component='span' severity='warning'>Be careful when dividing by 0 or when both dividend and divisor are 0.</Alert>
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      t
                    </FieldCell>
                    <TypeCell>
                      Null | <Link href="#transform-short-table">TransformShort</Link>
                    </TypeCell>
                    <DescCell>
                      Transform. How the sprite should be rotated and/or mirrored. Should be combined with animation transform.
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      b
                    </FieldCell>
                    <TypeCell>
                      <Link href="#vector2-table">Vector2</Link>{"<"}Int{">"} & <Link href="#dimensions-table">Dimensions</Link>
                    </TypeCell>
                    <DescCell>
                      Bounds.
                      A rectangle that defines the part of the image that should be visible for this frame's texture. Units are pixels.
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      o
                    </FieldCell>
                    <TypeCell>
                      <Link href="#vector2-table">Vector2</Link>{"<"}Int{">"}
                    </TypeCell>
                    <DescCell>
                      Offset in pixels.
                      <br/>
                      <br/>
                      The way sprite placement works is as such:
                      <br/>
                      - Use the frame bounds to create a sprite from the image.
                      <br/>
                      - Place the transform pivot at the center of the created sprite. (Floor if you want to make it exactly the same as spritron.)
                      <br/>
                      - Apply rotations and mirrors.
                      <br/>
                      - Use the animation <Link href="#frame-dimensions-field">frameDimensions</Link> to align the sprite's post rotation top-left to the top left of the frame's dimensions rectangle.
                      <br/>
                      - Apply the offset by adding it to the sprite position.
                    </DescCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <br/>
            <Typography variant='h6' id="transform-short-table">
              TransformShort
            </Typography>
            <br/>
            <TableContainer
              sx={theme => ({
                outline: `2px solid ${theme.palette.background.default}`,
              })}
            >
              <Table>
                <TableHead
                  sx={theme => ({
                    backgroundColor: theme.palette.background.default
                  })}
                >
                  <TableRow>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Field
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'>
                      <Typography>
                        Type
                      </Typography>
                    </TableCell>
                    <TableCell component="th" scope='col'
                      width="61%"
                    >
                      <Typography>
                        Description/Notes
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <FieldCell>
                      r
                    </FieldCell>
                    <TypeCell>
                      Null | 90 | 180 | 270
                    </TypeCell>
                    <DescCell>
                      Frame rotation in degrees. Should be added to animation rotation. Pivot should be at center of the current frame's sprite.
                    </DescCell>
                  </TableRow>
                  <TableRow hover>
                    <FieldCell>
                      m
                    </FieldCell>
                    <TypeCell>
                      Null | <Link href="#vector2-table">Vector2</Link>{"<"}Bool{">"}
                    </TypeCell>
                    <DescCell>
                      Frame mirror. Should be combined with animation mirror.
                      The x component mirrors around a vertical line that passes through the center of the sprite and the y around a horizontal.
                    </DescCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>
    </Box>
  </Dialog>
}

export default ExportExplanation


// Image export ts types
// export type SpritronImageExportJson = {
//   width: number;
//   height: number;
//   offset: number;
//   padding: number;
//   columns: number;
//   rows: number;
//   framesPerSecond: number;
//   loop: boolean;
//   durations: number[];
// }

// export type ReadonlySpritronImageExportJson = {
//   readonly width: number;
//   readonly height: number;
//   readonly offset: number;
//   readonly padding: number;
//   readonly columns: number;
//   readonly rows: number;
//   readonly framesPerSecond: number;
//   readonly loop: boolean;
//   readonly durations: readonly number[];
// }

// type SpritronJsonExport = {
//   images: string[];
//   transparenciesMap: {
//     [imageName: string]: {
//       colour: { r: number; g: number; b: number; };
//       threshold: number;
//     }[];
//   };
//   animations: {
//     name: string;
//     fps: number;
//     loop: boolean;
//     pingPong: null | { noFirst: boolean; noLast: boolean; };
//     transform: null | {
//       rotation: null | 90 | 180 | 270;
//       mirror: null | { x: boolean; y: boolean; };
//     };
//     frameDimensions: { w: number; h: number; };
//     frames: {
//       // Image index for images array above
//       i: number;
//       // Duration
//       d: number;
//       // Tranform
//       t: null | {
//         // Rotation
//         r: null | 90 | 180 | 270;
//         // Mirror
//         m: null | { x: boolean; y: boolean; }
//       };
//       // Bounds
//       b: { x: number; y: number; w: number; h: number; };
//       // Offset
//       o: { x: number; y: number; };
//     }[];
//     framesLength: number;
//   }[];
// }