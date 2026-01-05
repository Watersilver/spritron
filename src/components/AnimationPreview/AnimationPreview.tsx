import { Box, type SxProps, type Theme } from "@mui/material"

function AnimationPreview({
  sx,
  style
}: {
  sx?: SxProps<Theme>
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