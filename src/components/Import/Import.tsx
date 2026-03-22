import { Button, Tooltip, type SxProps, type Theme, type TooltipProps } from "@mui/material";
import { useRef, useState } from "react";

function Import({
  sx,
  tooltipPlacement,
  onImport
}: {
  sx?: SxProps<Theme>;
  tooltipPlacement?: TooltipProps['placement'];
  onImport: (data: string, notFound: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return <Tooltip
    title={<div>
      <div>
        Imports an exported spritron full export json.
      </div>
      <br/>
      <div>
        Remember to upload the images it requires before doing that.
        If they are missing the import will fail.
      </div>
    </div>}
    placement={tooltipPlacement}
  >
    <Button
      sx={sx}
      disabled={loading}
      onClick={() => inputRef.current?.click()}
    >
      Import
      <input
        type="file"
        accept=".json"
        disabled={loading}
        ref={inputRef}
        onChange={async e => {
          setLoading(true);
          const file = e.target.files?.[0];
          if (file) {
            const txt = await file.text();
            setLoading(false);
            onImport(txt, false);
            return;
          }
          onImport("", true);
        }}
        style={{
          display: "none"
        }}
      />
    </Button>
  </Tooltip>
}

export default Import