import { Alert, Box, IconButton, Tab, Tabs, Tooltip, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { codeToHtml } from 'shiki'
import useCachedState from '../../../utils/useCachedState';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';

function CodeDisplay({
  codeHtml,
  code
}: {
  codeHtml: string,
  code: string
}) {
  const [error, setError] = useState("");

  const [copyDone, setCopyDone] = useState(false);

  const timeoutRunning = useRef(false);
  useEffect(() => {
    if (timeoutRunning.current) return;
    if (copyDone) {
      timeoutRunning.current = true;
      setTimeout(() => {
        setCopyDone(false);
        timeoutRunning.current = false;
      }, 2000);
    }
  }, [copyDone]);

  return <Box
    sx={{
      position: "relative"
    }}
  >
    <Box
      sx={{
        p: 1,
        backgroundColor: "#121212",
        "& pre": {
          my: "0 !important"
        }
      }}
      dangerouslySetInnerHTML={{__html: codeHtml}}
    />
    <Tooltip
      title={error || "Copied!"}
      disableHoverListener
      open={copyDone}
    >
      <IconButton
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          borderTopRightRadius: 0,
          borderTopLeftRadius: 0,
          borderBottomRightRadius: 0
        }}
        size='small'
        disabled={copyDone}

        onClick={() => {
          setError("");

          navigator.clipboard
          .writeText(code)
          .then(() => {
            setCopyDone(true);
          })
          .catch(() => {
            setError("Copy failed :(");
            setCopyDone(true);
          });
        }}
      >
        {
          copyDone
          ? (
            error === ""
            ? <CheckBoxIcon fontSize='small' />
            : <SentimentVeryDissatisfiedIcon fontSize='small' />
          )
          : <ContentCopyIcon fontSize='small' />
        }
      </IconButton>
    </Tooltip>
  </Box>;
}


const godotUsageJsonExpCode =
`## Exported properties will be marked with (EXP) and can (and in
## most cases should) be given values in the editor, not in code

# Load the godot resource that stores the export
const SPRITRON_EXPORT = preload("res://path_to/spritron_export.tres")

# Load the JSON
const ANIMATIONS = preload("res://path_to/animations.json")
SPRITRON_EXPORT.json = ANIMATIONS # (EXP)

# Load any spritesheets that you need for the exported animations
const SPRITESHEET = preload("res://path_to/spritesheet.png")
# This maps image names that exist in the \`images\` array of the json export to textures
# In this case "spritesheet" must exist in the \`images\` array
SPRITRON_EXPORT.texture_map["spritesheet"] = SPRITESHEET # (EXP)

# \`update\` Creates new transparent textures according to
# the export transparency maps and remaps \`texture_map\`
SPRITRON_EXPORT.update()

## WARNING: If there are transparencies to be applied to the loaded textures
## then a new texture with the appropriate transparencies is created.
## That means \`SPRITRON_EXPORT.texture_map["spritesheet"] != SPRITESHEET\`
## in case the spritesheet has transparencies.
## More importantly, it means that the resource *MUST BE REUSED*
## if needed in multiple places or each time you
## might be creating new textures per new \`SpritronExport\`.

# Get a reference to the SpritronAnimations node
@onready var anims: SpritronAnimations = %SpritronAnimations

# Assign the \`SpritronExport\` resource
anims.spritron_export = SPRITRON_EXPORT # (EXP)

# Change selected animation (If animation doesn't exist it has no effect)
anims.animation = "animation_1" # (EXP)

# Change animation speed (negative for reverse)
anims.animation_speed = 0.5 # (EXP)

# Change animation frame (decimal part is animation progress)
anims.frame = 1.5 # (EXP)

# Play animation
anims.playing = true # (EXP)
`
let godotUsageJsonExpCodeHtml = "";
const godotUsageJsonExpCodeHtmlPromise = codeToHtml(godotUsageJsonExpCode, {
  lang: 'gdscript',
  theme: 'vitesse-dark'
}).then((result) => {
  godotUsageJsonExpCodeHtml = result;
});
export function GodotJsonExportUsage() {
  const [innerHtml, setInnerHtml] = useState(godotUsageJsonExpCodeHtml);
  useEffect(() => {
    if (godotUsageJsonExpCodeHtml === "") {
      godotUsageJsonExpCodeHtmlPromise.then(() => setInnerHtml(godotUsageJsonExpCodeHtml))
    }
  }, []);
  return <>
  <CodeDisplay
    codeHtml={innerHtml}
    code={godotUsageJsonExpCode}
  />
  </>;
}

const godotSprAnimJsonExpCode =
`@tool

extends Node2D
class_name SpritronAnimations

@onready var sprite: Sprite2D = %Sprite2D

var __frames_size := 1
func get_frames_size() -> int: return __frames_size

var __curr_anim: SpritronExport.SpritronAnimation = null
func get_current_animation_data() -> SpritronExport.SpritronAnimation: return __curr_anim

var __curr_fr_data: SpritronExport.SpritronAnimation.Frame = null
func get_current_frame_data() -> SpritronExport.SpritronAnimation.Frame: return __curr_fr_data


## All the exported data from spritron is here
@export var spritron_export: SpritronExport:
	set(se):
		spritron_export = se
		if spritron_export and spritron_export.parsed:
			var i = spritron_export.parsed.animations.find_custom(func(an): return an.name == animation)
			if i != -1:
				# reassign to call setter
				animation = animation
			else:
				animation = spritron_export.parsed.animations[0].name

## Name of the currently selected animation.
@export var animation: String:
	set(a):
		animation = a
		
		update()

## Speed multiplier for current animation (negative makes it play in reverse)
@export var animation_speed := 1.0

## Current animation frame with the decimal part representing animation progress
@export var frame: float:
	set(f):
		var prev := floori(frame)
		
		frame = fposmod(f, __frames_size)
		
		var curr := floori(frame)
		
		if prev != curr:
			if not is_node_ready(): return
			render_frame(curr)
	get():
		return fposmod(frame, __frames_size)

## Controls if animation is playing
@export var playing: bool:
	set(p):
		if not __curr_anim:
			printerr("Current animation is null")
			return
		if not __curr_fr_data:
			printerr("Current frame data is null")
			return
		
		playing = p
		
		if playing:
			# Restart non looping animation on its last frame
			if not __curr_anim.loop:
				if animation_speed > 0:
					if frame + 1 >= __curr_anim.frames_size:
						frame = 0
				elif animation_speed < 0:
					if frame < 1:
						frame = __curr_anim.frames_size - 0.0001 # I am a hack and a fraud

## Press if animation in editor isn't updated
@export_tool_button("Update") var update_action = update

## Renders given frame
func render_frame(new_frame: int):
	if not sprite: return
	
	var f := __curr_anim.get_frame(new_frame)
	
	if not f: return
	
	__curr_fr_data = f
	
	# Set texture for frame
	sprite.texture = spritron_export.texture_map[spritron_export.parsed.images[f.image_index]]
	sprite.region_rect = f.bounds
	
	# Offset placed in the middle of sprite but not midpixel to mimic spritron preview
	sprite.offset.x = -floorf(f.bounds.size.x * 0.5)
	sprite.offset.y = -floorf(f.bounds.size.y * 0.5)
	
	# Set angle and mirror/flip based on global and local values
	var local_rot := 0
	var global_rot := 0
	var local_mirror := false
	var global_mirror := false
	var local_flip := false
	var global_flip := false
	
	if f.transform:
		local_rot = f.transform.rotation
		if f.transform.mirror:
			local_mirror = f.transform.mirror.x
			local_flip = f.transform.mirror.y
	
	if __curr_anim.transform:
		global_rot = __curr_anim.transform.rotation
		if __curr_anim.transform.mirror:
			global_mirror = __curr_anim.transform.mirror.x
			global_flip = __curr_anim.transform.mirror.y
	
	sprite.rotation_degrees = fposmod(local_rot + global_rot, 360)
	
	sprite.flip_h = local_mirror != global_mirror
	sprite.flip_v = local_flip != global_flip
	
	# Set position depending on frame dimensions
	var w := 0
	var h := 0
	if fmod(sprite.rotation_degrees,180) == 0:
		w = f.bounds.size.x
		h = f.bounds.size.y
	else:
		w = f.bounds.size.y
		h = f.bounds.size.x
	
	sprite.position.x = f.offset.x + w * 0.5 - __curr_anim.frame_dimensions.x * 0.5
	sprite.position.y = f.offset.y + h * 0.5 - __curr_anim.frame_dimensions.y * 0.5

## Brings internal variables up to date and renders current frame
func update():
	if not spritron_export.parsed: return
	
	var i = spritron_export.parsed.animations.find_custom(func(an): return an.name == animation)
	
	if i == -1:
		if not Engine.is_editor_hint():
			printerr("Animation not found: " + animation)
		return
	
	__curr_anim = spritron_export.parsed.animations[i]
	__frames_size = __curr_anim.frames_size
	
	if not is_node_ready(): return
	render_frame(floori(frame))




func _ready() -> void:
	render_frame(floori(frame))

func _process(delta: float) -> void:
	if not playing: return
	
	var prev_fr = frame
	
	# Update frame
	if __curr_fr_data.duration == 0: # Ensure we don't divide by zero
		frame += 1
	else:
		# Don't skip more than one frame
		frame += minf(1, delta * __curr_anim.fps * animation_speed / __curr_fr_data.duration)
	
	if __curr_anim.loop: return
	
	# If not looping stop at last frame
	if animation_speed > 0:
		if prev_fr > frame:
			frame = prev_fr
			playing = false
	else:
		if prev_fr < frame:
			frame = prev_fr
			playing = false
`
let godotSprAnimJsonExpCodeHtml = "";
const godotSprAnimJsonExpCodeHtmlPromise = codeToHtml(godotSprAnimJsonExpCode, {
  lang: 'gdscript',
  theme: 'vitesse-dark'
}).then((result) => {
  godotSprAnimJsonExpCodeHtml = result;
});
const godotSprExJsonExpCode =
`@tool

extends Resource
class_name SpritronExport

## Used for texture map enties that haven't been initialized by the user
static var __placeholder_tex := PlaceholderTexture2D.new()

## Marks which textures are up to date with the json export transparencies
var __up_to_date: Array[Texture2D] = [__placeholder_tex]

## More convenient and typesafe way to access the export data
var parsed: ParsedJsonExport

## Will be used for images that need to have transparency applied to them.
## Make sure it has a component for the alpha value.
@export var image_format: Image.Format = Image.FORMAT_RGBAF

## Full spritron json export holding data for all the animations
@export var json: JSON:
	set(s):
		__up_to_date.clear()
		__up_to_date.push_back(__placeholder_tex)
		
		json = s
		
		if not json:
			parsed = null
			return
		
		parsed = ParsedJsonExport.new(s)
		
		# Initialize texture_map with dummy textures
		for im in json.data.images:
			if not texture_map.has(im):
				texture_map[im] = __placeholder_tex
		
		# Delete images that don't exist in the json export
		for existing_im in texture_map.keys():
			if not json.data.images.has(existing_im):
				texture_map.erase(existing_im)
		
		update()

## Textures that correspond to the images expected by the json export
@export var texture_map: Dictionary[String, Texture2D]:
	# Reacts to editor value changes
	set(new_tm):
		texture_map = new_tm
		
		# Iterate over _up_to_date (minus the placeholder) to delete unneeded textures
		for t in __up_to_date.filter(func(t): return t != __placeholder_tex):
			if not texture_map.values().any(func(tex): return tex == t):
				__up_to_date.erase(t)
		
		update()

## Apply texture trasparencies and update texture_map
func update():
	if not json: return
	
	for im_name in texture_map.keys():
		var tex := texture_map[im_name]
		
		# Ignore texture as it has already been handled
		if __up_to_date.has(tex): continue
		
		if not json.data.transparenciesMap.has(im_name):
			# Texture needs no processing
			__up_to_date.push_back(tex)
			continue
		var transparencies = json.data.transparenciesMap[im_name]
		
		var p: Color
		var im := tex.get_image()
		
		if not im:
			printerr("Failed to get image from texture")
			__up_to_date.push_back(tex)
			continue
		
		im.convert(image_format)
		
		for x in range(im.get_width()):
			for y in range(im.get_height()):
				p = im.get_pixel(x, y)
				for t in transparencies:
					if p.r >= t.colour.r - t.threshold \\
					&& p.r <= t.colour.r + t.threshold \\
					&& p.g >= t.colour.g - t.threshold \\
					&& p.g <= t.colour.g + t.threshold \\
					&& p.b >= t.colour.b - t.threshold \\
					&& p.b <= t.colour.b + t.threshold:
						im.set_pixel(x, y, Color.TRANSPARENT)
		
		# Create new texture with proper transparencies
		var new_tex := ImageTexture.create_from_image(im)
		texture_map[im_name] = new_tex
		__up_to_date.push_back(new_tex)


## The following classes are meant to be a convenient type safe to
## hold the data of the json export instead of the default dictionary
class ParsedJsonExport:
	var images: Array[String]
	var animations: Array[SpritronAnimation]
	
	func _init(json: JSON) -> void:
		for image_name in json.data.images:
			if image_name is String:
				images.push_back(image_name)
		
		for anim in json.data.animations:
			var a = SpritronAnimation.new()
			
			a.name = anim["name"]
			a.fps = anim["fps"]
			a.loop = anim["loop"]
			if anim["pingPong"] != null:
				a.ping_pong = SpritronAnimation.PingPong.new()
				a.ping_pong.no_first = anim["pingPong"]["noFirst"]
				a.ping_pong.no_last = anim["pingPong"]["noLast"]
			if anim["transform"] != null:
				a.transform = SpritronAnimation.Transform.new()
				if anim["transform"]["rotation"] != null:
					a.transform.rotation = anim["transform"]["rotation"]
				if anim["transform"]["mirror"] != null:
					a.transform.mirror = SpritronAnimation.Transform.Mirror.new()
					a.transform.mirror.x = anim["transform"]["mirror"]["x"]
					a.transform.mirror.y = anim["transform"]["mirror"]["y"]
			a.frame_dimensions.x = anim["frameDimensions"]["w"]
			a.frame_dimensions.y = anim["frameDimensions"]["h"]
			
			for frame in anim["frames"]:
				var new_frame = SpritronAnimation.Frame.new()
				new_frame.image_index = frame['i']
				new_frame.duration = frame['d']
				if frame['t'] != null:
					new_frame.transform = SpritronAnimation.Transform.new()
					if frame['t']['r'] != null:
						new_frame.transform.rotation = frame['t']['r']
					if frame['t']['m'] != null:
						new_frame.transform.mirror = SpritronAnimation.Transform.Mirror.new()
						new_frame.transform.mirror.x = frame['t']['m']["x"]
						new_frame.transform.mirror.y = frame['t']['m']["y"]
				new_frame.bounds.position.x = frame['b']['x']
				new_frame.bounds.position.y = frame['b']['y']
				new_frame.bounds.size.x = frame['b']['w']
				new_frame.bounds.size.y = frame['b']['h']
				new_frame.offset.x = frame['o']['x']
				new_frame.offset.y = frame['o']['y']
				a.__frames.push_back(new_frame)
			
			a.frames_size = anim["framesLength"]
			
			animations.push_back(a)

class SpritronAnimation:
	var name: String
	var fps: float
	var loop: bool
	var ping_pong: PingPong
	var transform: Transform
	var frame_dimensions: Vector2i
	var frames_size: int
	var __frames: Array[Frame]
	
	func get_frame(index: int) -> Frame:
		if index < 0:
			index = frames_size + index
			if index < 0:
				return null
		
		if ping_pong:
			if index >= __frames.size():
				if index >= frames_size:
					return null
				index -= __frames.size()
				var f = __frames.duplicate()
				if ping_pong.no_last:
					f.pop_back()
				f.reverse()
				if ping_pong.no_first:
					f.pop_back()
				return f[index]
			else:
				return __frames[index]
		else:
			if index >= __frames.size(): return null
			return __frames[index]
	
	class PingPong:
		var no_first: bool
		var no_last: bool
	
	class Transform:
		class Mirror:
			var x: bool
			var y: bool
		
		var rotation: int
		var mirror: Mirror
	
	class Frame:
		var image_index: int
		var duration: float
		var transform: Transform
		var bounds: Rect2i
		var offset: Vector2i
`
let godotSprExJsonExpCodeHtml = "";
const godotSprExJsonExpCodeHtmlPromise = codeToHtml(godotSprExJsonExpCode, {
  lang: 'gdscript',
  theme: 'vitesse-dark'
}).then((result) => {
  godotSprExJsonExpCodeHtml = result;
});
export function GodotJsonExportCode() {
  const [sprexHtml, setSprexHtml] = useState(godotSprExJsonExpCodeHtml);
  useEffect(() => {
    if (godotSprExJsonExpCodeHtml === "") {
      godotSprExJsonExpCodeHtmlPromise.then(() => setSprexHtml(godotSprExJsonExpCodeHtml))
    }
  }, []);
  const [spranimHtml, setSpranimHtml] = useState(godotSprAnimJsonExpCodeHtml);
  useEffect(() => {
    if (godotSprAnimJsonExpCodeHtml === "") {
      godotSprAnimJsonExpCodeHtmlPromise.then(() => setSpranimHtml(godotSprAnimJsonExpCodeHtml))
    }
  }, []);

  const [godotTab, setGodotTab] = useCachedState(
    "spritron_animations.gd",
    "tutorialGodotTab",
    s=>s,s=>s
  );

  return  <>
  <Typography my={1}>
    - Create a scene called `spritron_animations.tscn` or whatever.
  </Typography>
  <Typography my={1}>
    - Root should be a simple Node2D with the `spritron_animations.gd` attached. It should have a single `Sprite2D` child with the unique name "Sprite2D".
  </Typography>
  <Alert severity='info'>
    As you can see we are using toolscripts, so restart godot after setting up or you might experience some jank.
  </Alert>
  <Tabs
    value={godotTab}
    onChange={(_, v) => {
      setGodotTab(v);
    }}
  >
    <Tab
      label="spritron_animations.gd"
      value={'spritron_animations.gd'}
    />
    <Tab
      label="spritron_export.gd"
      value={'spritron_export.gd'}
    />
  </Tabs>
  {
    godotTab === "spritron_animations.gd"
    ? <CodeDisplay
        codeHtml={spranimHtml}
        code={godotSprAnimJsonExpCode}
      />
    : godotTab === "spritron_export.gd"
    ? <CodeDisplay
        codeHtml={sprexHtml}
        code={godotSprExJsonExpCode}
      />
    : null
  }
  <br/>
  </>;
}


const godotUsageImgExpCode =
`# Get a reference to the AnimatedSpritron node
@onready var anim: AnimatedSpritron = %AnimatedSpritron

# Load the animation data JSON
const ANIMATION = preload("res://path_to/animation.json")
anim.data = SPRITRON_EXPORT # (EXP)

# Load the animation image
const ANIMATION = preload("res://path_to/animation.png")
anim.texture = ANIMATION

# Change animation speed (negative for reverse)
anim.animation_speed = 0.5 # (EXP)

# Change animation frame (decimal part is animation progress)
anims.animation_frame = 1.5 # (EXP)

# Play animation
anims.playing = true # (EXP)
`
let godotUsageImgExpCodeHtml = "";
const godotUsageImgExpCodeHtmlPromise = codeToHtml(godotUsageImgExpCode, {
  lang: 'gdscript',
  theme: 'vitesse-dark'
}).then((result) => {
  godotUsageImgExpCodeHtml = result;
});
export function GodotImgExportUsage() {
  const [innerHtml, setInnerHtml] = useState(godotUsageImgExpCodeHtml);
  useEffect(() => {
    if (godotUsageImgExpCodeHtml === "") {
      godotUsageImgExpCodeHtmlPromise.then(() => setInnerHtml(godotUsageImgExpCodeHtml))
    }
  }, []);
  return <>
  <CodeDisplay
    codeHtml={innerHtml}
    code={godotUsageImgExpCode}
  />
  </>;
}


const godotImgExpCode =
`@tool

extends Sprite2D
class_name AnimatedSpritron

## Frame width
var width := 0
## Frame height
var height := 0
## Animation spritesheet rows
var rows := 0
## Animation spritesheet columns
var columns := 0
## Outer padding (Pixels to skip before reaching first frame in spritesheet on both axes)
var margin := 0
## Padding between frames of the spritesheet
var padding := 0
## Frames per second
var fps := 0.0
var loop := false
## How long each frame should last in comparison to a normal frame (normal duration: 1)
var durations: Array[float] = []
## Amount of frames
var frames_size := 0

## Speed multiplier for animation (negative makes it play in reverse)
var animation_speed := 1.0

## Controls if animation is playing
@export var playing: bool:
	set(p):
		playing = p
		
		if playing:
			# Restart non looping animation on its last frame
			if not loop:
				if animation_speed > 0:
					if animation_frame + 1 >= frames_size:
						animation_frame = 0
				elif animation_speed < 0:
					if animation_frame < 1:
						animation_frame = frames_size - 0.0001 # Hack

## Animation frame with the decimal part representing animation progress
var animation_frame := 0.0:
	set(f):
		var prev := floori(animation_frame)
		
		animation_frame = fposmod(f, frames_size)
		
		var curr := floori(animation_frame)
		
		if prev != curr:
			if not is_node_ready(): return
			render_frame(curr)
	get():
		return fposmod(animation_frame, frames_size)

## JSON of the exported animation data
@export var data: JSON:
	set(d):
		data = d
		__initialize()

func __on_texture_changed():
	__initialize()

func __initialize():
	region_enabled = true
	width = data.data['width']
	height = data.data['height']
	rows = data.data['rows']
	columns = data.data['columns']
	margin = data.data['offset']
	padding = data.data['padding']
	fps = data.data['framesPerSecond']
	loop = data.data['loop']
	durations.assign(data.data['durations'])
	frames_size = data.data['framesLength']
	
	region_rect.size.x = width
	region_rect.size.y = height
	
	render_frame(floori(animation_frame))

# Renders given frame
func render_frame(f: int):
	var col = f % columns
	@warning_ignore("integer_division")
	var row = f / columns
	
	region_rect.position.x = margin + col * (padding + width)
	region_rect.position.y = margin + row * (padding + height)


func _ready() -> void:
	texture_changed.connect(__on_texture_changed)


func _process(delta: float) -> void:
	if not playing: return
	
	var prev_fr = animation_frame
	
	var df = durations[floori(animation_frame)]
	
	if df == 0:
		animation_frame += 1
	else:
		animation_frame += minf(1, delta * fps * animation_speed / df)
	
	if loop: return
	
	if animation_speed > 0:
		if prev_fr > animation_frame:
			animation_frame = prev_fr
			playing = false
	else:
		if prev_fr < animation_frame:
			animation_frame = prev_fr
			playing = false
`
let godotImgExpCodeHtml = "";
const godotImgExpCodeHtmlPromise = codeToHtml(godotImgExpCode, {
  lang: 'gdscript',
  theme: 'vitesse-dark'
}).then((result) => {
  godotImgExpCodeHtml = result;
});
export function GodotImgExportCode() {
  const [innerHtml, setInnerHtml] = useState(godotImgExpCodeHtml);
  useEffect(() => {
    if (godotImgExpCodeHtml === "") {
      godotImgExpCodeHtmlPromise.then(() => setInnerHtml(godotImgExpCodeHtml))
    }
  }, []);
  return <>
  <Typography my={1}>
    - Create a scene called `spritron_animation.tscn` or whatever.
  </Typography>
  <Typography my={1}>
    - Root should be a `Sprite2D` with the following script attached.
  </Typography>
  <Alert severity='info'>
    As you can see we are using a toolscript, so restart godot after setting up or you might experience some jank.
  </Alert>
  <br/>
  <CodeDisplay
    codeHtml={innerHtml}
    code={godotImgExpCode}
  />
  </>;
}
