import { Box, IconButton, Slider, Stack, Tooltip, Typography } from "@mui/material";
import ColorizeIcon from '@mui/icons-material/Colorize';
import store, { useWatch } from "../../store/store";
import { useEffect, useRef } from "react";
import ClearIcon from '@mui/icons-material/Clear';


function toClamped2DigitHexStr(n: number) {
  if (n < 0) n = 0;
  if (n > 255) n = 255;
  let h = Math.round((n)).toString(16);
  if (h.length === 1) {
    h = "0" + h;
  }
  return h;
}

function isNotNullish<T>(v: T): v is NonNullable<T> {
  if (v !== undefined && v !== null) return true;
  return false;
}

function ColourInput({
  value,
  valueStr,
  onChange,
  onChangeStr,
  title,
  eyedrop,
  thresholdDefault,
  onThresholdChange,
  onDelete
}: {
  value?: {r: number, g: number, b: number},
  valueStr?: string;
  onChange?: (newVal: {r: number, g: number, b: number}) => void;
  onChangeStr?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  title?: string;
  eyedrop?: typeof store.eyedropTool;
  thresholdDefault?: number;
  onThresholdChange?: (newVal: number) => void;
  onDelete?: () => void;
}) {
  const e = useWatch(() => store.eyedropTool, () => store.eyedropTool);

  const defThresVal = useRef(thresholdDefault);

  const ocRef = useRef(onChange);
  ocRef.current = onChange;
  useEffect(() => {
    return () => {
      if (!isNotNullish(eyedrop) || !ocRef.current || !store.eyedropPickedCol) return;
      if (e === eyedrop) {
        ocRef.current?.(store.eyedropPickedCol);
      }
    };
  }, [e, eyedrop]);

  const val = valueStr
  ? valueStr
  : value
  ? "#" + toClamped2DigitHexStr(value.r)
  + toClamped2DigitHexStr(value.g)
  + toClamped2DigitHexStr(value.b)
  : '#000';

  return <Stack
    direction='row'
    spacing={1}
    sx={{
      "--del-col": 0,
      "&:hover": {
        "--del-col": 1
      }
    }}
  >
    <Box
      sx={{
        display: "grid",
        alignItems: "center",
        gridTemplateAreas: "a"
      }}
    >
      <input
        type="color"
        value={val}
        onChange={e => {
          const v = e.target.value;
          onChange?.({
            r: Number("0x" + v.substring(1,3)),
            g: Number("0x" + v.substring(3,5)),
            b: Number("0x" + v.substring(5))
          });
          onChangeStr?.(e);
        }}
        style={{
          borderRadius: 0,
          border: 0,
          backgroundColor: "none",
          padding: 0,
          gridArea: "a",
          width: title === undefined ? "32px" : "64px"
        }}
      />
      {title !== undefined && <Typography
        variant="subtitle2"
        sx={{
          gridArea: "a",
          pointerEvents: "none",
          display: "grid",
          justifyItems: "center",
          textShadow: `
            0px 1px black,
            1px 1px black,
            1px 0px black,
            1px -1px black,
            0px -1px black,
            -1px -1px black,
            -1px 0px black,
            -1px 1px black
          `
        }}
        inert
      >
        {title}
      </Typography>}
    </Box>
    {
      isNotNullish(eyedrop)
      ? <IconButton
        size="small"
        sx={{borderRadius: 0}}
        onClick={() => {
          store.eyedropTool = eyedrop;
        }}
        disabled={e === eyedrop}
      >
        <ColorizeIcon />
      </IconButton>
      : null
    }
    {
      defThresVal.current !== undefined
      ? <>
        <Tooltip
          disableInteractive
          title="Threshold"
          placement="top"
        >
          <Slider
            defaultValue={defThresVal.current}
            max={25}
            sx={{minWidth: 75}}
            onChangeCommitted={(_, v) => onThresholdChange?.(v)}
            // valueLabelDisplay="auto"
            // valueLabelFormat={v => {
            //   return "Threshold: " + v;
            // }}
          />
        </Tooltip>
      </>
      : null
    }
    {
      onDelete !== undefined
      ? <IconButton
        color="error"
        sx={{
          opacity: "var(--del-col)",
          transition: "opacity 0.1s"
        }}
        onClick={onDelete}
      >
        <ClearIcon />
      </IconButton>
      : null
    }
  </Stack>;
}

export default ColourInput;