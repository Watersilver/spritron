import { Box, type SxProps } from "@mui/material"

function AnimationPreview({
  sx,
  style
}: {
  sx?: SxProps
  style?: React.CSSProperties
}) {

  return <Box
    sx={sx}
    style={style}
  >
    Eat my balls
  </Box>
}

export default AnimationPreview