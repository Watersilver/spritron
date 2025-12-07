import { Box, Card, CardContent, Collapse, IconButton, List, ListItem, ListItemButton, ListItemText, TextField, Typography, type SxProps } from "@mui/material"
import store, { useWatch } from "../../store/store";
import { Fragment } from "react";
import ClearIcon from '@mui/icons-material/Clear';

function Coords({
  frames,
  field,
  framesIndex,
  imageName,
  xAlias,
  yAlias,
  fieldMirror,
  xMin,
  yMin,
  isHorizontal
}: {
  frames: {
    id: number;
    name: string;
    padding: {
      x: number;
      y: number;
    };
    position: {
      x: number;
      y: number;
    };
    dimensions: {
      x: number;
      y: number;
    };
    grid: {
      x: number;
      y: number;
    };
  },
  field: "padding" | "position" | "dimensions" | "grid";
  fieldMirror?: "padding" | "position" | "dimensions" | "grid";
  framesIndex: number;
  imageName: string;
  xAlias?: string;
  yAlias?: string;
  xMin?: number;
  yMin?: number;
  isHorizontal?: boolean;
}) {
  let coords = frames[field];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, coord: "x" | "y") => {
    let c = store.frames[imageName]?.[framesIndex]?.[field];
    if (!c) return;
    let m = fieldMirror ? store.frames[imageName]?.[framesIndex]?.[fieldMirror] : undefined;
    const v = Number(e.target.value);
    if (Number.isNaN(v) || !Number.isFinite(v)) {
      c[coord] = 0;
    } else {
      c[coord] = v;
    }
    const min = (coord === "x" ? xMin : yMin) || 0;
    if (c[coord] < min) c[coord] = min;
    if (m) {
      m[coord] = c[coord];
    }
  }

  return <Box
    sx={{
      display: "grid",
      gridTemplateColumns: isHorizontal ? "1fr 1fr" : "1fr",
      gap: 1
    }}
  >
    <TextField
      value={coords.x}
      size="small"
      sx={{width: "5em"}}
      onChange={e => handleChange(e, "x")}
      label={xAlias ?? "x"}
    />
    <TextField
      value={coords.y}
      size="small"
      sx={{width: "5em"}}
      onChange={e => handleChange(e, "y")}
      label={yAlias ?? "y"}
    />
  </Box>
}

function ImageFramesEditor({
  framesIndex,
  imageName
}: {
  framesIndex: number;
  imageName: string;
}) {
  const frames = useWatch(() => store.frames[imageName]![framesIndex], () => {
    if (!store.frames[imageName]?.[framesIndex]) return null;
    const f = store.frames[imageName][framesIndex];
    return {
      id: f.id,
      name: f.name,
      padding: {
        x: f.padding.x,
        y: f.padding.y,
      },
      position: {
        x: f.position.x,
        y: f.position.y,
      },
      dimensions: {
        x: f.dimensions.x,
        y: f.dimensions.y,
      },
      grid: {
        x: f.grid.x,
        y: f.grid.y,
      }
    }
  });

  const cellSx: SxProps = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr auto",
    gap: 1
  };

  return frames ? <Fragment>
    <Card
      // variant="outlined"
      sx={{
        borderRadius: 0
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            rowGap: 1
          }}
        >
          {/* {frames.offsetMerged ? null : <Box
            sx={cellSx}
          >
            <Box>
              <Typography sx={{display: "inline"}}>Offset</Typography>
              <Box
                sx={{
                  display: "inline",
                  position: "relative"
                }}
              >
                <IconButton
                  size="small"
                  sx={{
                    visibility: "hidden",
                    paddingY: 0,
                    height: 1
                  }}
                >
                  <CallMergeIcon />
                </IconButton>
                <Tooltip title="merge padding and offset">
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: "-50%"
                    }}
                    onClick={() => {
                      const f = store.frames[imageName]?.[framesIndex]
                      if (!f) return;
                      f.offsetMerged = true;
                      f.offset.x = f.padding.x;
                      f.offset.y = f.padding.y;
                    }}
                  >
                    <CallMergeIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Coords
              frames={frames}
              field="offset"
              xAlias="horizontal"
              yAlias="vertical"
              framesIndex={framesIndex}
              imageName={imageName}
            />
          </Box>} */}
          <Box
            sx={cellSx}
          >
            <Box>
              <Typography sx={{display: "inline"}}>Padding</Typography>
              {/* {frames.offsetMerged ? <Box
                sx={{display: 'inline', position: "relative"}}
              >
                <IconButton
                  size="small"
                  sx={{
                    visibility: "hidden",
                    paddingY: 0,
                    height: 1
                  }}
                >
                  <CallSplitIcon />
                </IconButton>
                <Tooltip title="unmerge padding and offset">
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: "-50%"
                    }}
                    onClick={() => {
                      const f = store.frames[imageName]?.[framesIndex]
                      if (!f) return;
                      f.offsetMerged = false;
                    }}
                  >
                    <CallSplitIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              : null} */}
            </Box>
            <Coords
              frames={frames}
              field="padding"
              xAlias="horizontal"
              yAlias="vertical"
              // fieldMirror={frames.offsetMerged ? "offset" : undefined}
              framesIndex={framesIndex}
              imageName={imageName}
            />
          </Box>
          <Box
            sx={cellSx}
          >
            <Typography sx={{display: "inline"}}>Position</Typography>
            <Coords frames={frames} field="position" framesIndex={framesIndex} imageName={imageName} />
          </Box>
          <Box
            sx={cellSx}
          >
            <Typography sx={{display: "inline"}}>Dimensions</Typography>
            <Coords
              frames={frames}
              field="dimensions"
              xAlias="width"
              yAlias="height"
              framesIndex={framesIndex}
              imageName={imageName}
            />
          </Box>
          <Box
            sx={
              // frames.offsetMerged
              // ?
              cellSx
              // : {
              //   ...cellSx,
              //   gridColumn: "1 / -1"
              // }
            }
          >
            <Typography sx={{display: "inline"}}>Grid</Typography>
            <Coords
              frames={frames}
              field="grid"
              framesIndex={framesIndex}
              imageName={imageName}
              xAlias="columns"
              yAlias="rows"
              xMin={1}
              yMin={1}
              // isHorizontal={!frames.offsetMerged}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  </Fragment> : null;
}

function FramesEditor({
  image,
  editable
}: {
  image: string,
  editable?: boolean
}) {

  // Not optimal rendering but this wont ever be big enough to cause a problem
  const frames = useWatch(() => store.frames[image], () => ([...(store.frames[image] || [])]));
  const selectedImage = useWatch(() => store.selectedImage, () => store.selectedImage);
  const selectedFrames = useWatch(() => store.selectedFrames, () => store.selectedFrames);
// ClearIcon
  return <List disablePadding>
    {
      frames ?
      frames.map((value, i) => {
        const isSelected = image === selectedImage
          && selectedFrames === value.id;
        const nameClashes = frames.some(f => f.name === value.name && value !== f);
        const emptyName = value.name === "";
        const error = emptyName || nameClashes;

        return <Fragment key={value.id}>
          <ListItem disablePadding>
            <ListItemButton
              selected={isSelected}
              sx={theme => {
                return {
                  backgroundColor: error ? theme.palette.error.main : undefined,
                  paddingRight: 0,
                  paddingY: 0,
                  "--del-op": 0,
                  "&:hover": {
                    "--del-op": 1
                  }
                }
              }}
              onClick={() => {
                if (!selectedImage) return;
                if (store.selectedFrames === value.id) {
                  store.selectedFrames = null;
                } else {
                  store.selectedFrames = value.id;
                }
              }}
            >
              <ListItemText
                primary={
                  isSelected
                  // ? <TextField
                  //   size="small"
                  //   variant="standard"
                  //   error={error}
                  //   helperText={emptyName ? "name is empty" : nameClashes ? "duplicate name" : undefined}
                  //   value={value.name}
                  //   onChange={e => {
                  //     if (!store.frames[image] || !store.frames[image][i]) return;
                  //     store.frames[image][i].name = e.target.value;
                  //   }}
                  //   // slotProps={{
                  //   //   htmlInput: {
                  //   //     size: value.name.length || 1
                  //   //   }
                  //   // }}
                  // />
                  ? <Box
                    component="span"
                    sx={{
                      position: "relative"
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        visibility: "hidden"
                      }}
                    >
                      {value.name}
                    </Box>
                    {/* 
                      https://css-tricks.com/auto-growing-inputs-textareas/
                      Fucking thank you Chris Coyier
                      For input resize trick
                     */}
                    <TextField
                      size="small"
                      variant="standard"
                      error={error}
                      helperText={emptyName ? "name is empty" : nameClashes ? "duplicate name" : undefined}
                      value={value.name}
                      onChange={e => {
                        if (!store.frames[image] || !store.frames[image][i]) return;
                        store.frames[image][i].name = e.target.value;
                      }}
                      onClick={e => e.stopPropagation()}
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: -4
                      }}
                      fullWidth
                    />
                  </Box>
                  : <Box
                    component="span"
                  >
                    {value.name}
                  </Box>
                }
              />
              {
                editable
                ? <IconButton
                  color="error"
                  sx={{
                    overflow: "hidden",
                    opacity: "var(--del-op)",
                    transition: "opacity 0.1s"
                  }}
                  onClick={e => {
                    if (!store.frames[image] || !store.frames[image][i]) return;
                    store.frames[image].splice(i, 1);
                    e.stopPropagation();
                  }}
                >
                  <ClearIcon />
                </IconButton>
                : null
              }
            </ListItemButton>
          </ListItem>
          <Collapse
            in={isSelected}
          >
            <ImageFramesEditor imageName={image} framesIndex={i} />
          </Collapse>
        </Fragment>
      }) : null
    }
  </List>
}

export default FramesEditor