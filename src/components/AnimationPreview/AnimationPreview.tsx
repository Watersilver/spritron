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
    Hell no
    <br/>
    Thor
    <br/>
    won't
    <br/>
    GO
  </Box>
}

export default AnimationPreview