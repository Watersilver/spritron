import { Autocomplete, Box, Card, CardContent, Checkbox, Collapse, FormControlLabel, FormHelperText, List, ListItemButton, ListItemIcon, ListItemText, TextField, Typography, type SxProps } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import store, { useWatch } from "../../store/store";
import { deproxify } from "../../libs/proxy-state";
import { Fragment } from "react";

function AnimationMenu({
  sx,
  style
}: {
  sx?: SxProps
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
          animations.map(a => {
            const isSelected = selected === a.id;
            const nameClashes = animations.some(f => f.name === a.name && a !== f);
            const emptyName = a.name === "";
            const error = emptyName || nameClashes;
            const hText = emptyName ? "name is empty" : nameClashes ? "duplicate name" : undefined;

            return <Fragment key={a.id}>
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
              </ListItemButton>
              <Collapse
                in={isSelected}
              >
                <Box
                  // sx={theme => ({
                  sx={{
                    // Mimic button selection
                    borderLeft: "rgba(144, 202, 249, 0.16) solid 8px"
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
                          gridTemplateColumns: '1fr 1fr'
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
                            else delete anim.transfrom;
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
                              value={a.loop ?? false}
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
                          sx={{mr: 0}}
                          control={
                            <Checkbox
                              value={a.pingPong ?? false}
                              onChange={(_, c) => {
                                const anim = store.animations.find(an => an.id === a.id);
                                if (!anim) return;
                                anim.pingPong = c;
                              }}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="subtitle2" color="textSecondary">
                              Ping pong
                            </Typography>
                          }
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Collapse>
            </Fragment>
          })
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
                  frames: []
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