import { Autocomplete, Box, Button, Card, CardActions, CardContent, Checkbox, FormControlLabel, TextField, Tooltip, Typography, type SxProps, type Theme } from "@mui/material";
import store, { useWatch } from "../../store/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { deproxify } from "../../libs/proxy-state";

// TODO: how can the user know what pressing control click does?

function getUnifiedValue<T, S>(
  frames: typeof store.animations[number]['frames'],
  getter: (f: typeof store.animations[number]['frames'][number]) => T,
  defaultValue: S
) {
  const fr = frames[0];
  if (!fr) return defaultValue;
  const v = getter(fr);
  if (frames.some(f => getter(f) !== v)) return defaultValue;
  return v;
}

function getSelectedFrames(selAnId: number | null, safIds: number[]) {
  const f = store.animations.find(an => an.id === selAnId)?.frames.filter(f => safIds.some(id => f.id === id));
  return f;
}

function FrameOptions({
  sx,
  style
}: {
  sx?: SxProps<Theme>
  style?: React.CSSProperties
}) {
  const selAnId = useWatch(() => store.selectedAnimation, () => store.selectedAnimation);
  const anims = useWatch(() => store.animations, () => deproxify(store.animations));
  const selectedAnimFrames = useWatch(() => store.selectedAnimFrames, () => deproxify(store.selectedAnimFrames));
  const [selAnFr, setSelAnFr] = useState<(typeof anims[number]['frames'])>([]);

  const safIds = useMemo(() => {
    if (selAnId === null) return [];
    return selectedAnimFrames[selAnId] ?? [];
  }, [selAnId, selectedAnimFrames]);

  useEffect(() => {
    if (selAnId === null) return;
    const anim = anims.find(a => a.id === selAnId);
    if (!anim) return;
    setSelAnFr(anim.frames.filter(f => safIds.some(id => id === f.id)));
  }, [selAnId, anims, safIds]);

  const mirrorX = getUnifiedValue(selAnFr, f => !!f.transfrom?.mirror?.x, null);
  const mirrorY = getUnifiedValue(selAnFr, f => !!f.transfrom?.mirror?.y, null);

  const deleteFrames = useCallback(() => {
    const sa = store.animations.find(a => a.id === store.selectedAnimation);
    if (!sa || sa.frames.length === 0 || selAnFr.length === 0) return;
    sa.frames = sa.frames.filter(f => !selAnFr.some(fr => fr.id === f.id));
    store.preview.frame = 0;
  }, [selAnFr]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Delete") {
        deleteFrames();
      }
    }

    window.addEventListener("keydown", h);

    return () => window.removeEventListener("keydown", h);
  }, [deleteFrames]);

  return <Box
    sx={sx}
    style={style}
  >
    <Card
      sx={{
        borderRadius: 0,
        border: 0,
        minHeight: "100%",
        position: "relative"
      }}
      variant="outlined"
    >
      <CardContent
        sx={{
          pb: "8px !important"
        }}
      >
        <Typography variant="h6" color="textSecondary">
          Frame options
        </Typography>
        <br />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: '1fr 1fr',
            gap: 1
          }}
        >
          <Tooltip
            disableInteractive
            title="Determines how long this frame lasts for the current fps. e.g. if this value is 2 and fps is 24 then this frame lasts for 2/24 seconds."
          >
            <TextField
              value={getUnifiedValue(selAnFr, f => {
                let df = f.durationFactor.toString();
                if (!df.includes(".")) {
                  df += ".0";
                }
                return df;
              }, "")}
              size="small"
              sx={{width: "5em"}}
              onChange={e => {
                if (safIds === null) return;
                const f = getSelectedFrames(selAnId, safIds);
                if (!f) return;
                const v = Number(e.target.value);
                if (Number.isNaN(v) || !Number.isFinite(v) || v < 0) {
                  f.forEach(fr => fr.durationFactor = 0);
                } else {
                  f.forEach(fr => fr.durationFactor = v);
                }
              }}
              label="Duration"
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={selAnFr.length === 0}
            />
          </Tooltip>
          <Autocomplete
            sx={{width: "5em"}}
            size="small"
            options={[0,90,180,270]}
            value={getUnifiedValue(selAnFr, f => f.transfrom?.rotation ?? 0, -1)}
            onChange={(_, v) => {
              if (safIds === null) return;
              const fr = getSelectedFrames(selAnId, safIds);
              if (!fr) return;
              fr.forEach(f => {
                if (!f.transfrom) f.transfrom = {};
                if (v === 90 || v === 180 || v === 270) f.transfrom.rotation = v;
                else delete f.transfrom.rotation;
              });
            }}
            disablePortal
            disableClearable
            renderInput={(params) => <TextField {...params} label="Rotation" slotProps={{ inputLabel: { shrink: true } }} />}
            renderValue={v => {
              if (v === -1) return "";
              return v + "°";
            }}
            getOptionLabel={v => {
              return v + "°";
            }}
            disabled={selAnFr.length === 0}
          />
          <Typography
            color="textSecondary"
            sx={{
              gridColumn: "-1 / 1"
            }}
          >
            Offset
          </Typography>
          <TextField
            value={getUnifiedValue(selAnFr, f => f.offset.x, "")}
            size="small"
            sx={{
              width: "5em"
            }}
            onChange={e => {
              if (safIds === null) return;
              const fr = getSelectedFrames(selAnId, safIds);
              if (!fr) return;
              const v = Number(e.target.value);
              fr.forEach(f => {
                if (Number.isNaN(v) || !Number.isFinite(v) || v < 0) {
                  f.offset.x = 0;
                } else {
                  f.offset.x = Math.floor(v);
                }
              });
            }}
            label={"x"}
            slotProps={{ inputLabel: { shrink: true } }}
            disabled={selAnFr.length === 0}
          />
          <TextField
            value={getUnifiedValue(selAnFr, f => f.offset.y, "")}
            size="small"
            sx={{
              width: "5em"
            }}
            onChange={e => {
              if (safIds === null) return;
              const fr = getSelectedFrames(selAnId, safIds);
              if (!fr) return;
              const v = Number(e.target.value);
              fr.forEach(f => {
                if (Number.isNaN(v) || !Number.isFinite(v) || v < 0) {
                  f.offset.y = 0;
                } else {
                  f.offset.y = Math.floor(v);
                }
              })
            }}
            label={"y"}
            slotProps={{ inputLabel: { shrink: true } }}
            disabled={selAnFr.length === 0}
          />
          <FormControlLabel
            sx={{mr: 0}}
            control={
              <Checkbox
                checked={!!mirrorX}
                indeterminate={mirrorX === null}
                onChange={(_, c) => {
                  if (safIds === null) return;
                  const fr = getSelectedFrames(selAnId, safIds);
                  if (!fr) return;
                  fr.forEach(f => {
                    if (!f.transfrom) {
                      f.transfrom = {mirror: {x: c, y: false}};
                    } else if (!f.transfrom.mirror) {
                      f.transfrom.mirror = {x: c, y: false};
                    } else {
                      f.transfrom.mirror.x = c;
                    }
                  });
                }}
                size="small"
              />
            }
            label={
              <Typography variant="subtitle2" color="textSecondary">
                Mirror
              </Typography>
            }
            disabled={selAnFr.length === 0}
          />
          <FormControlLabel
            sx={{mr: 0}}
            control={
              <Checkbox
                checked={!!mirrorY}
                indeterminate={mirrorY === null}
                onChange={(_, c) => {
                  if (safIds === null) return;
                  const fr = getSelectedFrames(selAnId, safIds);
                  if (!fr) return;
                  fr.forEach(f => {
                    if (!f.transfrom) {
                      f.transfrom = {mirror: {x: false, y: c}};
                    } else if (!f.transfrom.mirror) {
                      f.transfrom.mirror = {x: false, y: c};
                    } else {
                      f.transfrom.mirror.y = c;
                    }
                  });
                }}
                size="small"
              />
            }
            label={
              <Typography variant="subtitle2" color="textSecondary">
                Flip
              </Typography>
            }
            disabled={selAnFr.length === 0}
          />
        </Box>
      </CardContent>
      <CardActions
        sx={{
          position: "absolute",
          bottom: 0
        }}
      >
        <Button
          color="error"
          disabled={selAnFr.length === 0}
          onClick={deleteFrames}
        >
          Delete Frame{selAnFr.length < 2 ? "" : "s"}
        </Button>
      </CardActions>
    </Card>
  </Box>
}

export default FrameOptions;