import { Box } from '@mui/material'
import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'


// Test
const code = 'var a := 1' // input code
let html = "";
const htmlPromise = codeToHtml(code, {
  lang: 'gdscript',
  theme: 'vitesse-dark'
}).then((result) => {
  html = result;
});
export function Test() {
  const [innerHtml, setInnerHtml] = useState(html);
  useEffect(() => {
    if (html === "") {
      htmlPromise.then(() => setInnerHtml(html))
    }
  }, []);
  return <Box
    dangerouslySetInnerHTML={{__html: innerHtml}}
  />
}