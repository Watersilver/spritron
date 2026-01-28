import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Box, Button, Card, CardContent, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, useMediaQuery, useTheme, type SxProps, type Theme } from "@mui/material"
import { Fragment, useEffect, useRef, useState } from "react";
import store, { useWatch } from "../../store/store";
import FramesEditor from "../FramesEditor/FramesEditor";
import { deproxify } from '../../libs/proxy-state';
import ColourInput from '../ColourInput/ColourInput';

function TransparencyMapping({
  curImg
}: {
  curImg: string | null
}) {
  const transMaps = useWatch(() => store.transMaps, () => deproxify(store.transMaps));
  const tm = curImg ? transMaps[curImg] ?? [] : [];

  return <Fragment>
    {tm.length > 0 && <Typography
      sx={{
        pl: 2,
        pb: 1
      }}
      color="textSecondary"
    >
      Transparency mapping
    </Typography>}
    <List
      sx={{
        // gridColumn: "1 / -1",
        m: 0, p: 0
      }}
    >
      {
        tm.map(tc => {
          return <ListItem
            key={tc[2]}
            sx={{
              borderLeft: "rgba(144, 202, 249, 0.16) solid 8px"
            }}
          >
            <ColourInput
              value={tc[0] || {r:0,g:0,b:0}}
              onChange={nv => {
                const tm = curImg ? store.transMaps[curImg] : null;
                if (!tm) return;
                const t = tm.find(t => t[2] === tc[2]);
                if (!t) return;
                t[0] = nv;
              }}
              eyedrop={tc[2]}
              thresholdDefault={tc[1]}
              onThresholdChange={nv => {
                const tm = curImg ? store.transMaps[curImg] : null;
                if (!tm) return;
                const t = tm.find(t => t[2] === tc[2]);
                if (!t) return;
                t[1] = nv;
              }}
            />
          </ListItem>;
        })
      }
      <ListItemButton
        onClick={() => {
          if (curImg === null) return;
          if (!store.transMaps[curImg]) {
            store.transMaps[curImg] = [];
          }
          store.transMaps[curImg].push([{r:0,g:0,b:0}, 5, store.nextColId]);
          store.nextColId++;
        }}
      >
        <ListItemIcon>
          <AddIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Add transparency" />
      </ListItemButton>
    </List>
  </Fragment>
}

function FileDeletionDlgContent({
  file
}: {
  file: File | null
}) {
  if (!file) return <DialogContent>No file...</DialogContent>;
  const f = store.frames[file.name];
  if (!f || f.length === 0) return <DialogContent>File has no grid...</DialogContent>;
  const anims = store.animations.filter(a => a.frames.some(f => f.image === file.name));
  return <DialogContent>
    {f.length > 1 ? "There are grids" : "There's a grid"} defined on this file{
      anims.length > 0
      ? ` and it is also used in the following animation${anims.length > 1 ? "s" : ""}: ` + anims.map(a => a.name).join(', ')
      : ''
    }
    <br />
    <br />
    If you delete this file {(anims.length > 0 || f.length > 1) ? "they" : "it"} will be gone too
  </DialogContent>
}


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

  const theme = useTheme();
  const isMediumDown = useMediaQuery(theme.breakpoints.down('md'));

  const [collapsed, setCollapsed] = useState<Symbol | null>(null);

  const files = useWatch(() => store.files.length, () => [...store.files]);
  const imLength = useWatch(() => store.images.length, () => store.images.length);
  const selected = useWatch(() => store.selectedImage, () => {
    const s = Symbol();
    setCollapsed(s);
    setTimeout(() => {
      setCollapsed(sb => sb === s ? null : sb);
    });
    return store.selectedImage;
  });

  const selectedIndex = useRef(-1);
  useEffect(() => {
    selectedIndex.current = files.findIndex(file => file.name === selected);
  }, [selected]);

  useEffect(() => {
    if (files[selectedIndex.current]) {
      store.selectedImage = files[selectedIndex.current]!.name;
    } else if (files.length > 0) {
      store.selectedImage = files[files.length - 1]!.name;
    } else {
      store.selectedImage = null;
    }
  }, [files]);

  const [hoveringImage, setHoveringImage] = useState(false);
  // const [_, setHoveringImage] = useState(false);

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

  useEffect(() => {
    const a = (e: KeyboardEvent) => {
      if (e.key === 'a') {
        console.log(loadingImages, files.length, imLength, deproxify(store.images));
      }
    };
    document.addEventListener('keydown', a);

    return () => document.removeEventListener('keydown', a);
  }, [loadingImages, files, imLength]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer) return;
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
    };
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer) return;
      if (loadingImages) return;
      const files = [...e.dataTransfer.items]
        .flatMap(i => {
          const f = i.getAsFile()
          if (!f) return [];
          return [f];
        });
      storeImages(files);
      e.preventDefault();
    };
    const onDragEnter = () => setHoveringImage(true);

    // Disable as it triggers for leaving every element, not just the window
    // Handle this case at the full screen drop prompt Box
    // const onDragLeave = () => setHoveringImage(false);

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragenter", onDragEnter);
    // window.addEventListener("dragleave", onDragLeave);

    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragenter", onDragEnter);
      // window.removeEventListener("dragleave", onDragLeave);
    }
  }, [loadingImages]);


  const resizableUploadArea = useRef<HTMLDivElement>(null);
  const [showUploadButton, setShowUploadButton] = useState(false);
  useEffect(() => {
    if (!resizableUploadArea.current) return;
    const d = resizableUploadArea.current;

    const ro = new ResizeObserver((e) => {
      const entry = e.find(entry => entry.target === d);
      if (entry) {
        const size = entry.contentBoxSize.reduce((a, c) => ({
          blockSize: a.blockSize + c.blockSize,
          inlineSize: a.inlineSize + c.inlineSize
        }), {blockSize: 0, inlineSize: 0});
        if (size.blockSize === 0) {
          setShowUploadButton(true);
        } else {
          setShowUploadButton(false);
        }
      }
    });

    ro.observe(d);

    return () => {
      ro.disconnect();
    };
  }, []);


  const [fileDelData, setFileDelData] = useState<File | null>(null);
  const deleteFile = (file: File) => {
    const i = store.files.indexOf(file);
    if (i === -1) return;
    store.files.splice(i, 1);
    delete store.frames[file.name];
    store.animations = store.animations.filter(a => !a.frames.some(f => f.image === file.name));
  }

  return <Box
    style={style}
    sx={sx}
    // Uncomment if I want drag and drop to not work on whole window
    // onDrop={e => {
    //   if (loadingImages) return;
    //   const files = [...e.dataTransfer.items]
    //     .flatMap(i => {
    //       const f = i.getAsFile()
    //       if (!f) return [];
    //       return [f];
    //     });
    //   storeImages(files);
    //   e.preventDefault();
    // }}
    // onDragOver={e => {
    //   const fileItems = [...e.dataTransfer.items].filter(
    //     (item) => item.kind === "file",
    //   );
    //   if (fileItems.length > 0) {
    //     e.preventDefault();
    //     if (fileItems.some((item) => item.type.startsWith("image/"))) {
    //       e.dataTransfer.dropEffect = "copy";
    //     } else {
    //       e.dataTransfer.dropEffect = "none";
    //     }
    //   }
    // }}
    // onDragEnter={() => {
    //   setHoveringImage(true);
    // }}
    // onDragLeave={() => {
    //   setHoveringImage(false);
    // }}

    // onClick={() => {
    //   store.selectedImage = null;
    // }}
  >
    <Dialog
      fullScreen={isMediumDown}
      open={!!fileDelData}
      onClose={() => {
        setFileDelData(null);
      }}
    >
      <DialogTitle>Delete {fileDelData?.name}?</DialogTitle>
      <FileDeletionDlgContent file={fileDelData} />
      <DialogActions>
        <Button onClick={() => {
          setFileDelData(null);
        }}>
          Cancel
        </Button>
        <Button color='error' onClick={() => {
          setFileDelData(null);
          if (fileDelData) {
            deleteFile(fileDelData);
          }
        }}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
    <input
      type="file"
      accept="image/*"
      disabled={loadingImages}
      ref={inputRef}
      multiple
      onChange={e => {
        storeImages([...(e.target.files || [])]);
      }}
      style={{
        display: "none"
      }}
    />
    {
      hoveringImage
      ? <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          overflow: "hidden",
          backdropFilter: "blur(5px)",
          zIndex: 1000,
          display: "grid",
          alignItems: "center",
          justifyItems: "center",
          // pointerEvents: "none"
        }}
        onClick={() => setHoveringImage(false)}
        onDragLeave={() => setHoveringImage(false)}
        onMouseLeave={() => setHoveringImage(false)}
      >
        <Card>
          <CardContent>
            <Typography
              variant='h6'
              color='info'
            >
              Drop a spritesheet anywhere
            </Typography>
          </CardContent>
        </Card>
      </Box>
      : null
    }
    {/* In case I want to animate this uncomment following */}
    {/* <Box
      sx={{
        position: "absolute",
        top: hoveringImage ? 0 : "50%",
        left: hoveringImage ? 0 : "50%",
        bottom: hoveringImage ? 0 : "50%",
        right: hoveringImage ? 0 : "50%",
        overflow: "hidden",
        backdropFilter: hoveringImage ? "blur(5px)" : undefined,
        // transition: "all 0.1s",
        zIndex: 1000,
        display: "grid",
        alignItems: "center",
        justifyItems: "center",
        pointerEvents: "none"
      }}
    >
      <Card>
        <CardContent>
          Drop a spritesheet anywhere
        </CardContent>
      </Card>
    </Box> */}
    <Box
      sx={{
        height: "100%",
        display: "grid",
        gridTemplateRows: "auto 1fr"
      }}
    >
      <List
        disablePadding
        onClick={e => {e.stopPropagation()}}
        sx={{ overflow: "auto", overflowX: "hidden" }}
      >
        {/* <Collapse
          in={store.selectedImage !== null}
          onClick={() => store.selectedImage = null}
        >
          <ListItemButton
            sx={{
              position: "relative",
              p: 0
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: 'center',
                position: "absolute",
                left: 0, top: 0, bottom: 0, right: 0
              }}
            >
              <ArrowDropDownIcon fontSize='small' />
            </Box>
            <ArrowDropDownIcon fontSize='small' sx={{visibility: "hidden"}} />
          </ListItemButton>
        </Collapse>
        <Collapse
          in={store.selectedImage === null}
        >
          <ListItemButton
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            <ListItemIcon>
              <UploadFileIcon />
            </ListItemIcon>
            <ListItemText
              primary="Add spritesheet"
              secondary="can drag & drop"
            />
            <input
              type="file"
              accept="image/*"
              disabled={loadingImages}
              ref={inputRef}
              multiple
              onChange={e => {
                storeImages([...(e.target.files || [])]);
              }}
              style={{
                display: "none"
              }}
            />
          </ListItemButton>
        </Collapse> */}
        {
          files.map((file) => {
            const isSelected = selected === file.name;
            return <Fragment key={file.name}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    if (store.selectedImage === file.name) {
                      store.selectedImage = null;
                    } else {
                      store.selectedImage = file.name;
                    }
                  }}
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
                      if (!store.frames[file.name]) {
                        deleteFile(file);
                      } else {
                        setFileDelData(file);
                      }
                      e.stopPropagation();
                    }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </ListItemButton>
              </ListItem>
              <Collapse in={isSelected && !collapsed} timeout="auto" unmountOnExit>
                <Box
                  // sx={theme => ({
                  sx={{
                    // Mimic button selection
                    borderLeft: "rgba(144, 202, 249, 0.16) solid 8px"
                  }}
                  // })}
                >
                  <List disablePadding>
                    <TransparencyMapping
                      curImg={file.name}
                    />
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
                          if (frames.some(f => f.name === "grid_" + i)) {
                            i++;
                          } else {
                            frames.push({
                              id: store.nextFramesId,
                              name: "grid_" + i,
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
                      <ListItemText primary="Add grid" />
                    </ListItemButton> : null}
                  </List>
                </Box>
              </Collapse>
            </Fragment>
          })
        }
      </List>
      <Box
        position="relative"
      >
        <Box
          sx={{
            position: "absolute",
            left: 0, top: 0, bottom: 0, right: 0,
            display: 'grid',
            alignItems: "center",
            justifyItems: "center",
            overflow: 'hidden',
            // cursor: files.length === 0 ? "pointer" : undefined
          }}
          onClick={() => {
            inputRef.current?.click();
          }}
          ref={resizableUploadArea}
        >
          <Box
            sx={{
              width: "100%",
              display: 'grid',
              justifyItems: "center",
              opacity: files.length !== 0 ? 0.1 : 0.5,
              px: 4,
              userSelect: "none",
            }}
          >
            <UploadFileIcon
              fontSize='large'
            />
            <Typography
              variant='h6'
              align='center'
            >
              {
                files.length !== 0
                ? "You can add another image"
                : "Click or drag and drop to add image"
              }
            </Typography>
          </Box>
        </Box>
      </Box>
      {/* <Box sx={{minWidth: "200px"}} /> */}
      <Collapse
        in={showUploadButton}
      >
        <List disablePadding>
          <ListItemButton
            onClick={() => {
              inputRef.current?.click();
            }}
          >
            <ListItemIcon>
              <UploadFileIcon />
            </ListItemIcon>
            <ListItemText
              primary="Add spritesheet"
            />
          </ListItemButton>
        </List>
      </Collapse>
    </Box>
  </Box>;
};

export default TextureLoader;