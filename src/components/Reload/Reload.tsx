import { Button, Tooltip, type SxProps, type Theme, type TooltipProps } from "@mui/material";

function Reload({
  sx,
  tooltipPlacement,
  onClick
}: {
  sx?: SxProps<Theme>;
  tooltipPlacement?: TooltipProps['placement'];
  onClick: () => void;
}) {
  return <Tooltip
    title={<div>
      <div>
        Reloads saved data.
      </div>
      <br/>
      <div>
        Remember to upload the images it uses before reloading.
        If they are missing the reload will fail.
      </div>
    </div>}
    placement={tooltipPlacement}
  >
    <Button
      sx={sx}
      onClick={onClick}
    >
      Reload
    </Button>
  </Tooltip>
}

export default Reload