import { Box, Button, Checkbox, FormControlLabel, ListItemText, Menu, MenuItem, Radio, RadioGroup, Stack, Tooltip, Typography, type PopoverOrigin, type SxProps, type Theme, type TooltipProps } from "@mui/material";
import { useState } from "react";
import store, { useWatch } from "../../store/store";
import { deproxify } from "../../libs/proxy-state";

const downloadLink = document.createElement("a");

function Export({
  sx,
  style,
  anchorOrigin,
  transformOrigin,
  tooltipPlacement
}: {
  sx?: SxProps<Theme>;
  style?: React.CSSProperties;
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
  tooltipPlacement?: TooltipProps['placement']
}) {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const anims = useWatch(() => store.animations, () => deproxify(store.animations));
  const selAnId = useWatch(() => store.selectedAnimation, () => store.selectedAnimation);
  const anim = anims.find(a => a.id === selAnId);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isAnimValid = !!anim && anim.frames.length > 0;
  const isAnyAnimValid = anims.some(a => a.frames.length > 0);
  const extractImageFormat = useWatch(() => store.extractImageFormat, () => store.extractImageFormat);
  const extractImageTrim = useWatch(() => store.extractImageTrim, () => store.extractImageTrim);
  const extractImageAnimData = useWatch(() => store.extractImageAnimData, () => store.extractImageAnimData);

  useWatch(() => store.extractImage, () => {
    if (store.extractImage === null) {
      setProcessing(false);
    } else {
      setProcessing(true);
    }
  });

  return <>
    <Button
      sx={sx}
      style={style}
      onClick={() => setOpen(true)}
      disabled={!isAnyAnimValid}
      ref={e => setAnchorEl(e)}
    >
      Export
    </Button>
    <Menu
      open={open}
      onClose={() => setOpen(false)}
      variant="menu"
      anchorEl={anchorEl}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      slotProps={{
        list: {
          dense: true
        }
      }}
    >
      <Tooltip
        disableInteractive
        title="Exports a json of all animations"
        placement={tooltipPlacement}
      >
        <MenuItem
          disabled={!isAnyAnimValid || processing}
          onClick={() => {
            const imagesSet = new Set<string>();
            store.animations.forEach(a => a.frames.forEach(f => imagesSet.add(f.image)));
            const transparenciesMap: {[imageName: string]: {colour: {r: number; g: number; b: number;}, threshold: number;}[];} = {};
            for (const im of imagesSet) {
              if (store.transMaps[im]) {
                transparenciesMap[im] = store.transMaps[im].map(c => {
                  return {
                    colour: {r: c[0].r / 255, g: c[0].g / 255, b: c[0].b / 255},
                    threshold: c[1] / 100
                  };
                });
              }
            }
            const images = [...imagesSet];

            const json = {
              images,
              transparenciesMap,
              animations: deproxify(store.animations).map(a => {
                const w = a.frames.reduce((acc,c,i) => {
                  const f = a.frames[i];
                  let r = a.transfrom?.rotation ?? 0;
                  r += f?.transfrom?.rotation ?? 0;
                  const w = (r === 90 || r === 270 ? c.bounds[3] : c.bounds[2]) + (f?.offset.x ?? 0);
                  return w > acc ? w : acc;
                }, 0);
                const h = a.frames.reduce((acc,c,i) => {
                  const f = a.frames[i];
                  let r = a.transfrom?.rotation ?? 0;
                  r += f?.transfrom?.rotation ?? 0;
                  const h = (r === 90 || r === 270 ? c.bounds[2] : c.bounds[3]) + (f?.offset.y ?? 0);
                  return h > acc ? h : acc;
                }, 0);
                return {
                  name: a.name,
                  fps: a.fps,
                  loop: !!a.loop,
                  pingPong: a.pingPong ? {
                    noFirst: !!a.pingPong.noFirst,
                    noLast: !!a.pingPong.noLast
                  } : null,
                  transform: a.transfrom && (a.transfrom.rotation !== undefined || a.transfrom.mirror) ? {
                    rotation: a.transfrom.rotation ?? null,
                    mirror: a.transfrom.mirror ? {
                      x: !!a.transfrom.mirror.x,
                      y: !!a.transfrom.mirror.y
                    } : null
                  } : null,
                  frameDimensions: {w,h},
                  frames: a.frames.map(f => {
                    return {
                      i: images.findIndex(i => i === f.image),
                      d: f.durationFactor,
                      t: f.transfrom && (f.transfrom.rotation !== undefined || f.transfrom.mirror) ? {
                        r: f.transfrom.rotation ?? null,
                        m: f.transfrom.mirror ? {
                          x: !!f.transfrom.mirror.x,
                          y: !!f.transfrom.mirror.y
                        } : null
                      } : null,
                      b: {x: f.bounds[0], y: f.bounds[1], w: f.bounds[2], h: f.bounds[3]},
                      o: f.offset
                    }
                  })
                };
              })
            };

            window.URL.revokeObjectURL(downloadLink.href);
            const blob = new Blob([JSON.stringify(json,null,2)], { type: "application/json" });
            downloadLink.download = "animations";
            downloadLink.href = window.URL.createObjectURL(blob);
            // Why?? https://stackoverflow.com/a/65939108
            // downloadLink.dataset.downloadurl = ["application/json", downloadLink.download, downloadLink.href].join(":");
            downloadLink.click();

            setOpen(false);
          }}
        >
          <ListItemText
            primary="Json Export"
          />
        </MenuItem>
      </Tooltip>
      <Tooltip
        disableInteractive
        title="Exports image of currently selected animation"
        placement={tooltipPlacement}
      >
        <MenuItem
          disabled={!isAnimValid || processing}
          onClick={() => {
            setProcessing(true);
            store.extractImage = 'start';

            setOpen(false);
          }}
        >
          <Stack>
            <ListItemText
              primary="Image Export"
              secondary={!anim ? "*Select an animation" : isAnimValid ? undefined : "*Animation is empty"}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "auto auto 1fr",
                gap: 1
              }}
            >
              <Tooltip
                disableInteractive
                title="Trims the outside layer of padding"
              >
                <FormControlLabel
                  sx={{mr: 0}}
                  onClick={e => e.stopPropagation()}
                  control={
                    <Checkbox
                      checked={extractImageTrim}
                      onChange={(_, c) => {
                        store.extractImageTrim = c;
                      }}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="subtitle2" color="textSecondary">
                      Trim
                    </Typography>
                  }
                />
              </Tooltip>
              <Tooltip
                disableInteractive
                title="Includes json with animation data"
              >
                <FormControlLabel
                  sx={{mr: 0}}
                  onClick={e => e.stopPropagation()}
                  control={
                    <Checkbox
                      checked={extractImageAnimData}
                      onChange={(_, c) => {
                        store.extractImageAnimData = c;
                      }}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="subtitle2" color="textSecondary">
                      Include data
                    </Typography>
                  }
                />
              </Tooltip>
              <Box />
            </Box>
            <RadioGroup
              row
              value={extractImageFormat}
              onChange={(_, v) => {
                if (v === "png") store.extractImageFormat = v;
                else if (v === "jpg") store.extractImageFormat = v;
                else if (v === "webp") store.extractImageFormat = v;
              }}
              onClick={e => e.stopPropagation()}
            >
              <FormControlLabel value="png" control={<Radio />} label="png" />
              <FormControlLabel value="jpg" control={<Radio />} label="jpg" />
              <FormControlLabel value="webp" control={<Radio />} label="webp" />
            </RadioGroup>
          </Stack>
        </MenuItem>
      </Tooltip>
      {/* 
        Pain in the ass.
        Leave it here in case I make it in the future
      */}
      {/* <Tooltip
        disableInteractive
        title="Exports gif of currently selected animation"
        placement={tooltipPlacement}
      >
        <MenuItem
          disabled={!isAnimValid || processing}
          
          onClick={() => {
            setProcessing(true);

            setOpen(false);
          }}
        >
          <ListItemText
            primary="Gif Export"
            secondary={!anim ? "*Select an animation" : isAnimValid ? "*Frame duration is not taken into account" : "*Animation is empty"}
          />
        </MenuItem>
      </Tooltip> */}
    </Menu>
  </>
}

export default Export