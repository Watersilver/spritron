import { Autocomplete, Box, Card, CardContent, Checkbox, FormControlLabel, TextField, Tooltip, Typography, type SxProps, type Theme } from "@mui/material";
import store, { useWatch } from "../../store/store";
import { useEffect, useMemo, useState } from "react";
import { deproxify } from "../../libs/proxy-state";

function FrameOptions({
  sx,
  style
}: {
  sx?: SxProps<Theme>
  style?: React.CSSProperties
}) {
  const selAnId = useWatch(() => store.selectedAnimation, () => store.selectedAnimation);
  const anims = useWatch(() => store.animations, () => deproxify(store.animations));
  const selectedAnimFrames = useWatch(() => store.selectedAnimFrames, () => store.selectedAnimFrames);
  const [selAnFr, setSelAnFr] = useState<(typeof anims[number]['frames'][number]) | null>(null);

  const safInd = useMemo(() => {
    if (selAnId === null) return null;
    return selectedAnimFrames[selAnId] ?? null;
  }, [selAnId, selectedAnimFrames]);

  useEffect(() => {
    if (selAnId === null || safInd === null) return;
    const anim = anims.find(a => a.id === selAnId);
    if (!anim) return;
    setSelAnFr(anim.frames[safInd] ?? null);
  }, [selAnId, anims, safInd]);

  return <Box
    sx={sx}
    style={style}
  >
    <Card
      sx={{
        borderRadius: 0,
        border: 0,
        minHeight: "100%"
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
            title="Determines how long this frame lasts for the current fps. e.g. if this value is 2 and fps is 24 then this frame lasts for 2/24 seconds."
          >
            <TextField
              value={selAnFr?.durationFactor ?? 0}
              size="small"
              sx={{width: "5em"}}
              onChange={e => {
                if (safInd === null) return;
                const f = store.animations.find(an => an.id === selAnId)?.frames[safInd];
                if (!f) return;
                const v = Number(e.target.value);
                if (Number.isNaN(v) || !Number.isFinite(v) || v < 0) {
                  f.durationFactor = 0;
                } else {
                  f.durationFactor = v;
                }
              }}
              label={"Duration"}
              disabled={!selAnFr}
            />
          </Tooltip>
          <Autocomplete
            sx={{width: "5em"}}
            size="small"
            options={[0,90,180,270]}
            value={selAnFr?.transfrom?.rotation ?? 0}
            onChange={(_, v) => {
              if (safInd === null) return;
              const f = store.animations.find(an => an.id === selAnId)?.frames[safInd];
              if (!f) return;
              if (!f.transfrom) f.transfrom = {};
              if (v === 90 || v === 180 || v === 270) f.transfrom.rotation = v;
              else delete f.transfrom.rotation;
            }}
            disablePortal
            disableClearable
            renderInput={(params) => <TextField {...params} label="Rotation" />}
            renderValue={v => {
              return v + "°";
            }}
            getOptionLabel={v => {
              return v + "°";
            }}
            disabled={!selAnFr}
          />
          <FormControlLabel
            sx={{mr: 0}}
            control={
              <Checkbox
                value={selAnFr?.transfrom?.mirror?.x ?? false}
                onChange={(_, c) => {
                  if (safInd === null) return;
                  const f = store.animations.find(an => an.id === selAnId)?.frames[safInd];
                  if (!f) return;
                  f.transfrom = f.transfrom ?? {};
                  f.transfrom.mirror = f.transfrom.mirror ?? {x: false, y: false};
                  f.transfrom.mirror.x = c;
                }}
                size="small"
              />
            }
            label={
              <Typography variant="subtitle2" color="textSecondary">
                Mirror
              </Typography>
            }
            disabled={!selAnFr}
          />
          <FormControlLabel
            sx={{mr: 0}}
            control={
              <Checkbox
                value={selAnFr?.transfrom?.mirror?.y ?? false}
                onChange={(_, c) => {
                  if (safInd === null) return;
                  const f = store.animations.find(an => an.id === selAnId)?.frames[safInd];
                  if (!f) return;
                  f.transfrom = f.transfrom ?? {};
                  f.transfrom.mirror = f.transfrom.mirror ?? {x: false, y: false};
                  f.transfrom.mirror.y = c;
                }}
                size="small"
              />
            }
            label={
              <Typography variant="subtitle2" color="textSecondary">
                Flip
              </Typography>
            }
            disabled={!selAnFr}
          />
          <Typography
            sx={{
              gridColumn: "-1 / 1"
            }}
            color="textSecondary"
          >
            Offset
          </Typography>
          <TextField
            value={selAnFr?.offset.x ?? 0}
            size="small"
            sx={{
              width: "5em",
              gridColumn: "-1 / 1"
            }}
            onChange={e => {
              if (safInd === null) return;
              const f = store.animations.find(an => an.id === selAnId)?.frames[safInd];
              if (!f) return;
              const v = Number(e.target.value);
              if (Number.isNaN(v) || !Number.isFinite(v) || v < 0) {
                f.offset.x = 0;
              } else {
                f.offset.x = v;
              }
            }}
            label={"x"}
            disabled={!selAnFr}
          />
          <TextField
            value={selAnFr?.offset.y ?? 0}
            size="small"
            sx={{
              width: "5em",
              gridColumn: "-1 / 1"
            }}
            onChange={e => {
              if (safInd === null) return;
              const f = store.animations.find(an => an.id === selAnId)?.frames[safInd];
              if (!f) return;
              const v = Number(e.target.value);
              if (Number.isNaN(v) || !Number.isFinite(v) || v < 0) {
                f.offset.y = 0;
              } else {
                f.offset.y = v;
              }
            }}
            label={"y"}
            disabled={!selAnFr}
          />
        </Box>
      </CardContent>
    </Card>
  </Box>
}

export default FrameOptions;