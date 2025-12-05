import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Button, Card, CardContent, Collapse, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, type SxProps, type Theme } from "@mui/material"
import { Fragment, useEffect, useRef, useState } from "react";
import store, { useWatch } from "../../store/store";
import FramesEditor from "../FramesEditor/FramesEditor";

function TextureLoader({
  sx,
  style,
  editable
}: {
  sx?: SxProps<Theme>;
  style?: React.CSSProperties;
  editable?: boolean
}) {
  // const dropZone = useRef<HTMLElement>(null);

  /**************************************************************************************/
  // Mdn recommends doing all this stuff on the window but I won't do it unless I have to.
  // Leaving it here in case I need to uncomment.
  /**************************************************************************************/
  // Here are the instructions: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
  // useEffect(() => {
  //   const onDrop = (e: DragEvent) => {
  //     if (e.dataTransfer && [...e.dataTransfer.items].some(item => item.kind === "file")) {
  //       e.preventDefault();
  //     }
  //   };
  //   const onDragover = (e: DragEvent) => {
  //     const fileItems = e.dataTransfer && [...e.dataTransfer.items].filter(
  //       (item) => item.kind === "file",
  //     );
  //     if (fileItems && fileItems.length > 0) {
  //       e.preventDefault();
  //       if (dropZone.current && e.target instanceof Node && !dropZone.current.contains(e.target)) {
  //         e.dataTransfer.dropEffect = "none";
  //       }
  //     }
  //   }

  //   window.addEventListener("drop", onDrop);
  //   window.addEventListener("dragover", onDragover);

  //   return () => {
  //     window.removeEventListener("drop", onDrop);
  //     window.removeEventListener("dragover", onDragover);
  //   }
  // }, []);

  const files = useWatch(() => store.files.length, () => [...store.files]);
  const imLength = useWatch(() => store.images.length, () => store.images.length);
  const selected = useWatch(() => store.selectedImage, () => store.selectedImage);

  const selectedIndex = useRef(-1);
  useEffect(() => {
    selectedIndex.current = files.findIndex(file => file.name === selected);
  }, [selected]);

  useEffect(() => {
    if (files[selectedIndex.current]) {
      store.selectedImage = files[selectedIndex.current]!.name;
    } else if (files.length > 0) {
      store.selectedImage = files[files.length - 1]!.name;
    }
  }, [files]);

  const [hoveringImage, setHoveringImage] = useState(false);

  const storeImages = (files: File[]) => {
    if (files.length == 0) return;
    const merged: File[] = [];

    for (const f of [...store.files, ...files].reverse()) {
      if (!merged.some(file => file.name === f.name)) {
        merged.push(f);
      }
    }

    merged.reverse();

    store.files = merged;
    setHoveringImage(false);
  };

  const loadingImages = imLength !== files.length;

  return <Box
    style={style}
    sx={sx}
  >
    <Box
      // ref={dropZone}
      component="label"
      sx={{
        margin: 1,
        padding: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 1,
        minHeight: 64,
        opacity: loadingImages ? 0.5 : 1,
        border: theme => {
          return (hoveringImage ? theme.palette.primary.main : theme.palette.secondary.main) + " dotted 1px"
        },
      }}
      onDrop={e => {
        if (loadingImages) return;
        const files = [...e.dataTransfer.items]
          .flatMap(i => {
            const f = i.getAsFile()
            if (!f) return [];
            return [f];
          });
        storeImages(files);
        e.preventDefault();
      }}
      onDragOver={e => {
        const fileItems = [...e.dataTransfer.items].filter(
          (item) => item.kind === "file",
        );
        if (fileItems.length > 0) {
          e.preventDefault();
          if (fileItems.some((item) => item.type.startsWith("image/"))) {
            e.dataTransfer.dropEffect = "copy";
          } else {
            e.dataTransfer.dropEffect = "none";
          }
        }
      }}
      onDragEnter={() => {
        setHoveringImage(true);
      }}
      onDragLeave={() => {
        setHoveringImage(false);
      }}
    >
      Here ya go
      <input
        type="file"
        accept="image/*"
        disabled={loadingImages}
        multiple
        onChange={e => {
          storeImages([...(e.target.files || [])]);
        }}
        style={{
          display: "none"
        }}
      />
    </Box>
    <List>
      {
        files.map((file, i) => {
          const isSelected = selected === file.name;
          return <Fragment key={file.name}>
            <ListItem disablePadding>
              <ListItemButton
                selected={isSelected}
                onClick={() => {store.selectedImage = file.name}}
                sx={{
                  paddingRight: 0,
                  "--del-op": 0,
                  "&:hover": {
                    "--del-op": 1
                  }
                }}
              >
                <ListItemText primary={file.name} />
                <IconButton
                  color='error'
                  disabled={loadingImages}
                  sx={{
                    overflow: "hidden",
                    opacity: "var(--del-op)",
                    transition: "opacity 0.1s"
                  }}
                  onClick={e => {
                    store.files.splice(i, 1);
                    delete store.frames[file.name];
                    e.stopPropagation();
                  }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </ListItemButton>
              {/* <ListItemButton>
                <ListItemIcon>
                  <Clear />
                </ListItemIcon>
              </ListItemButton> */}
              {/* <IconButton
                disabled={loadingImages}
                onClick={() => {
                  store.files.splice(i, 1);
                }}
              >
                <Clear />
              </IconButton> */}
            </ListItem>
            <Collapse in={isSelected} timeout="auto" unmountOnExit>
              <Card
                sx={{
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  borderTop: 0,
                  marginX: 1
                }}
                variant='outlined'
              >
                <CardContent
                  sx={{
                    padding: 0,
                    paddingBottom: "0 !important"
                  }}
                >
                  <List disablePadding>
                    <FramesEditor
                      image={file.name}
                      editable={editable}
                    />
                    {editable ? <ListItemButton
                      onClick={() => {
                        if (!store.frames[file.name]) {
                          store.frames[file.name] = [];
                        }
                        let i = 1;
                        const frames = store.frames[file.name];
                        while (frames) {
                          if (frames.some(f => f.name === "frames" + i)) {
                            i++;
                          } else {
                            frames.push({
                              id: store.nextFramesId,
                              name: "frames" + i,
                              position: {x: 0, y: 0},
                              padding: {x: 0, y: 0},
                              grid: {x: 1, y: 1},
                              dimensions: {x: 16, y: 16}
                            });
                            store.selectedFrames = store.nextFramesId++;
                            break;
                          }
                        }
                      }}
                    >
                      <ListItemIcon>
                        <AddIcon />
                      </ListItemIcon>
                      <ListItemText primary="Add frames" />
                    </ListItemButton> : null}
                  </List>
                </CardContent>
              </Card>
            </Collapse>
          </Fragment>
        })
      }
    </List>
    <Button
      disabled={loadingImages}
      onClick={() => store.files = []}
    >
      Clear
    </Button>
  </Box>;
};

export default TextureLoader;