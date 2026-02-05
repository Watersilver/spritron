import { Autocomplete, Box, Card, CardContent, Checkbox, Collapse, FormControlLabel, FormHelperText, IconButton, List, ListItemButton, ListItemIcon, ListItemText, TextField, Tooltip, Typography, type SxProps, type Theme } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import store, { useWatch } from "../../store/store";
import { deproxify } from "../../libs/proxy-state";
import { Fragment } from "react";
import ClearIcon from '@mui/icons-material/Clear';

function AnimationOptions({
  animation,
  selected,
  nameClashes
}: {
  animation: typeof store.animations[number],
  selected: number | null,
  nameClashes: boolean
}) {
  const a = animation;
  const isSelected = selected === a.id;
  const emptyName = a.name === "";
  const error = emptyName || nameClashes;
  const hText = emptyName ? "name is empty" : nameClashes ? "duplicate name" : undefined;

  return <Fragment>
    <ListItemButton
      selected={isSelected}
      onClick={() => {
        if (store.selectedAnimation !== a.id) {
          store.selectedAnimation = a.id;
        } else {
          store.selectedAnimation = null;
        }
      }}
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
    >
      <ListItemText
        primary={
          isSelected
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
              {a.name || "a"}
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
              value={a.name}
              onChange={e => {
                const v = store.animations.find(an => an.id === a.id);
                if (!v) return;
                v.name = e.target.value;
              }}
              onClick={e => e.stopPropagation()}
              sx={{
                position: "absolute",
                left: 0,
                top: -4
              }}
              fullWidth
            />
            {
              hText
              ? <FormHelperText
                sx={{pt: 0.5}}
                error
              >
                {hText}
              </FormHelperText>
              : null
            }
          </Box>
          : <Box
            component="span"
          >
            {a.name || "a"}
          </Box>
        }
      />
      {
        <IconButton
          color="error"
          sx={{
            overflow: "hidden",
            opacity: "var(--del-op)",
            transition: "opacity 0.1s"
          }}
          onClick={e => {
            e.stopPropagation();
            store.animations = store.animations.filter(an => an.id !== a.id);
          }}
        >
          <ClearIcon />
        </IconButton>
      }
    </ListItemButton>
    <Collapse
      in={isSelected}
      unmountOnExit
    >
      <Box
        // sx={theme => ({
        sx={{
          // Mimic button selection
          borderLeft: store.colours.selectedMimic
        }}
        // })}
      >
        <Card
          sx={{borderRadius: 0}}
        >
          <CardContent
            sx={{
              pb: "8px !important"
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: '1fr 1fr',
                gap: 1
              }}
            >
              <TextField
                value={a.fps}
                size="small"
                sx={{width: "5em"}}
                onChange={e => {
                  const anim = store.animations.find(an => an.id === a.id);
                  if (!anim) return;
                  const v = Number(e.target.value);
                  if (Number.isNaN(v) || !Number.isFinite(v) || v < 0) {
                    anim.fps = 0;
                  } else {
                    anim.fps = v;
                  }
                }}
                label={"FPS"}
              />
              <Tooltip
                title="How many columns there are before it wraps"
              >
                <TextField
                  value={a.columnLimit}
                  size="small"
                  sx={{width: "5em"}}
                  onChange={e => {
                    const anim = store.animations.find(an => an.id === a.id);
                    if (!anim) return;
                    const v = Number(e.target.value);
                    if (Number.isNaN(v) || !Number.isFinite(v) || v < 1) {
                      anim.columnLimit = 1;
                    } else {
                      anim.columnLimit = v;
                    }
                  }}
                  label={"Columns"}
                />
              </Tooltip>
              <TextField
                value={a.padding}
                size="small"
                sx={{width: "5em"}}
                onChange={e => {
                  const anim = store.animations.find(an => an.id === a.id);
                  if (!anim) return;
                  const v = Number(e.target.value);
                  if (Number.isNaN(v) || !Number.isFinite(v) || v < 0) {
                    anim.padding = 1;
                  } else {
                    anim.padding = v;
                  }
                }}
                label={"Padding"}
              />
              <Autocomplete
                sx={{width: "5em"}}
                size="small"
                options={[0,90,180,270]}
                value={a.transfrom?.rotation ?? 0}
                onChange={(_, v) => {
                  const anim = store.animations.find(an => an.id === a.id);
                  if (!anim) return;
                  if (!anim.transfrom) anim.transfrom = {};
                  if (v === 90 || v === 180 || v === 270) anim.transfrom.rotation = v;
                  else delete anim.transfrom.rotation;
                }}
                disablePortal
                disableClearable
                renderInput={(params) => <TextField {...params} label="Rotation" />}
                renderValue={v => {
                  return v + "°"
                }}
                getOptionLabel={v => {
                  return v + "°";
                }}
              />
              <FormControlLabel
                sx={{mr: 0}}
                control={
                  <Checkbox
                    checked={!!a.transfrom?.mirror?.x}
                    onChange={(_, c) => {
                      const anim = store.animations.find(an => an.id === a.id);
                      if (!anim) return;
                      if (!anim.transfrom) {
                        anim.transfrom = {mirror: {x: c, y: false}};
                      } else if (!anim.transfrom.mirror) {
                        anim.transfrom.mirror = {x: c, y: false};
                      } else {
                        anim.transfrom.mirror.x = c;
                      }
                    }}
                    size="small"
                  />
                }
                label={
                  <Typography variant="subtitle2" color="textSecondary">
                    Mirror
                  </Typography>
                }
              />
              <FormControlLabel
                sx={{mr: 0}}
                control={
                  <Checkbox
                    checked={!!a.transfrom?.mirror?.y}
                    onChange={(_, c) => {
                      const anim = store.animations.find(an => an.id === a.id);
                      if (!anim) return;
                      if (!anim.transfrom) {
                        anim.transfrom = {mirror: {x: false, y: c}};
                      } else if (!anim.transfrom.mirror) {
                        anim.transfrom.mirror = {x: false, y: c};
                      } else {
                        anim.transfrom.mirror.y = c;
                      }
                    }}
                    size="small"
                  />
                }
                label={
                  <Typography variant="subtitle2" color="textSecondary">
                    Flip
                  </Typography>
                }
              />
              <FormControlLabel
                sx={{mr: 0}}
                control={
                  <Checkbox
                    checked={!!a.loop}
                    onChange={(_, c) => {
                      const anim = store.animations.find(an => an.id === a.id);
                      if (!anim) return;
                      anim.loop = c;
                    }}
                    size="small"
                  />
                }
                label={
                  <Typography variant="subtitle2" color="textSecondary">
                    Loop
                  </Typography>
                }
              />
              <FormControlLabel
                sx={{
                  mr: 0
                }}
                control={
                  <Checkbox
                    checked={!!a.pingPong}
                    onChange={(_, c) => {
                      const anim = store.animations.find(an => an.id === a.id);
                      if (!anim) return;
                      if (!c) anim.pingPong = undefined;
                      else anim.pingPong = {};
                      store.preview.frame = 0;
                    }}
                    size="small"
                  />
                }
                label={
                  <Typography variant="subtitle2" color="textSecondary" sx={{width: "1px"}}>
                    Ping pong
                  </Typography>
                }
              />
              {
                a.pingPong
                ? <>
                  <Tooltip
                    title="Controls if first frame is repeated when ping ponging animation"
                  >
                    <FormControlLabel
                      sx={{mr: 0}}
                      control={
                        <Checkbox
                          checked={!a.pingPong.noFirst}
                          onChange={(_, c) => {
                            const anim = store.animations.find(an => an.id === a.id);
                            if (!anim || !anim.pingPong) return;
                            anim.pingPong.noFirst = !c;
                            store.preview.frame = 0;
                          }}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="subtitle2" color="textSecondary" sx={{width: "1px"}}>
                          repeat first
                        </Typography>
                      }
                    />
                  </Tooltip>
                  <Tooltip
                    title="Controls if last frame is repeated when ping ponging animation"
                  >
                    <FormControlLabel
                      sx={{mr: 0}}
                      control={
                        <Checkbox
                          checked={!a.pingPong.noLast}
                          onChange={(_, c) => {
                            const anim = store.animations.find(an => an.id === a.id);
                            if (!anim || !anim.pingPong) return;
                            anim.pingPong.noLast = !c;
                            store.preview.frame = 0;
                          }}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="subtitle2" color="textSecondary" sx={{width: "1px"}}>
                          repeat last
                        </Typography>
                      }
                    />
                  </Tooltip>
                </>
                : null
              }
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Collapse>
  </Fragment>
}

function AnimationMenu({
  sx,
  style
}: {
  sx?: SxProps<Theme>
  style?: React.CSSProperties
}) {
  const animations = useWatch(() => store.animations, () => deproxify(store.animations));
  const selected = useWatch(() => store.selectedAnimation, () => store.selectedAnimation);

  return <Box
    style={style}
    sx={sx}
  >
    <Box
      sx={{
        height: "100%",
        display: "grid",
        gridTemplateRows: "auto 1fr",
      }}
    >
      <List disablePadding>
        {
          animations.map(a => <AnimationOptions
            key={a.id}
            animation={a}
            selected={selected}
            nameClashes={animations.some(f => f.name === a.name && a !== f)}
          />)
        }
        <ListItemButton
          onClick={() => {
            let i = 1;
            while (true) {
              if (store.animations.some(a => a.name === "animation_" + i)) {
                i++;
              } else {
                store.animations.push({
                  id: store.nextAnimationId,
                  fps: 24,
                  name: "animation_" + i,
                  frames: [],
                  padding: 0,
                  columnLimit: 20
                });
                store.selectedAnimation = store.nextAnimationId;
                store.nextAnimationId++;
                break;
              }
            }
          }}
        >
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>
          <ListItemText
            primary="Add animation"
          />
        </ListItemButton>
      </List>
    </Box>
  </Box>
}

export default AnimationMenu;