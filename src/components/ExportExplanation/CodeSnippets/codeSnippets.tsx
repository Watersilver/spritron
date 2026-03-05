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
  code?: string
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
      position: "relative",
			tabSize: 2
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
    {code
		? <Tooltip
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
		: null}
  </Box>;
}

///////////////
//// Godot ////
///////////////

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
		sx={{
			"& button": {
				textTransform: "none"
			}
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


/////////////////
//// Pixi.js ////
/////////////////


const pixiUsageJsonExpCode =
`// Import the json export
import animations from "./path/to/animations";

// Import Pixi.js textures
import spritesheetTexture from "./path/to/spritesheetTexture";

// Class that maps data to textures
import SpritronFullExport from "./path/to/SpritronFullExport";

// Function that takes a texture and a list of transparencies
// and returnes a texture with transparencies applied
// optionally deleting the original texture
import applyTransparencies from "./path/to/applyTransparencies";

// Pixi.js renderer, needed to apply transparencies
import renderer from "./path/to/renderer/";

// This is a generic class, which means that you can make animations
// a const and enforce much stricter type checks and autocomplete
const e = new SpritronFullExport(
	animations,
	{
		// If there are no transparencies to apply just pass the texture
		"spritesheet.png": applyTransparencies(
			spritesheetTexture,
			animations.transparenciesMap["spritesheet.png"],
			renderer
		)
	}
)

// Class that extends pixi.js container and is meant
// to play animations provided by a spritron export
import SpritronAnimations from "./path/to/SpritronAnimations";

// Create your animations and add them to your stage
const anims = new SpritronAnimations(e);
import stage from "./path/to/stage";
stage.addChild(anims);

// Change selected animation (If animation doesn't exist it has no effect)
// \`SpritronAnimations\` is generic, so if your animation export is const
// you get strict type check and autocomplete here!
anims.currentAnimationName = "animation_1";

// Change animation speed (negative for reverse)
anims.animationSpeed = 0.5;

// Change animation frame (decimal part is animation progress)
anims.frame = 1.5;

// Play or stop animation
anims.playing = true;

// Call this repeatedly wherever you have your ticker
// (or whatever other method you use to update your scene)
// and pass it its delta time in seconds to progress the animation
anims.update(0.1);
`
let pixiUsageJsonExpCodeHtml = "";
const pixiUsageJsonExpCodeHtmlPromise = codeToHtml(pixiUsageJsonExpCode, {
  lang: 'ts',
  theme: 'vitesse-dark'
}).then((result) => {
  pixiUsageJsonExpCodeHtml = result;
});
export function PixiJsonExportUsage() {
  const [innerHtml, setInnerHtml] = useState(pixiUsageJsonExpCodeHtml);
  useEffect(() => {
    if (pixiUsageJsonExpCodeHtml === "") {
      pixiUsageJsonExpCodeHtmlPromise.then(() => setInnerHtml(pixiUsageJsonExpCodeHtml))
    }
  }, []);
  return <>
  <CodeDisplay
    codeHtml={innerHtml}
  />
  </>;
}


const pixiSprAnimJsonExpCode =
`import {
	ColorSource,
	Container,
	ContainerChild,
	ContainerOptions,
	Graphics,
	Rectangle,
	Sprite,
	Texture
} from "pixi.js";
import { ReadonlySpritronJsonExport } from "./SpritronJsonExport";
import SpritronFullExport from "./SpritronFullExport";


class SpritronAnimations<J extends ReadonlySpritronJsonExport> extends Container {
  private sprExp: SpritronFullExport<J>;
  /** Underlying sprite. Avoid directly modifying it. */
  sprite: Sprite;
  /** Multiplies base fps. Negative values reverse animation. */
  animationSpeed = 1;
  private _framesLength = 1;
  /** Length of the current animation frames, taking ping pong into account. */
  get framesLength() {
    return this._framesLength;
  }
  private _playing = true;
  /** Controls if animation is playing or paused */
  get playing() {
    return this._playing;
  }
  set playing(p) {
    this._playing = p

    if (p) {
      // Restart non looping animation on its last frame
      if (!this._curAnim.loop) {
        if (this.animationSpeed > 0) {
          if (this.frame + 1 >= this._framesLength) {
            this.frame = 0;
          }
        } else if (this.animationSpeed < 0) {
          if (this.frame < 1) {
            this.frame = this._framesLength - 0.0001; // This is a hack. I am a hacker
          }
        }
      }
    }
  }

  /** Colour of the debug rectangle */
  debugCol: ColorSource = "green";
  /** True if debug is toggled on */
  get isDebugEnabled() {return !!this.debug;}
  private debug: Graphics | null = null;
  private updateDebug(d: Graphics) {
    let globalScaleX = this.scale.x;
    let globalScaleY = this.scale.y;
    let p = this.parent;
    while (p) {
      globalScaleX *= p.scale.x;
      globalScaleY *= p.scale.y;
      p = p.parent;
    }
    let strokeWidth = 2 / (Math.max(globalScaleX, globalScaleY));
    let w = this.width / this.scale.x;
    let h = this.height / this.scale.y;
    if (Number.isNaN(strokeWidth) || !Number.isFinite(strokeWidth)) {
      strokeWidth = 0;
    }
    if (Number.isNaN(w) || !Number.isFinite(w)) {
      w = 0;
    }
    if (Number.isNaN(h) || !Number.isFinite(h)) {
      h = 0;
    }
    d.clear();
    d.rect(-w * 0.5, -h * 0.5, w, h);
    d.moveTo(1,0);
    d.lineTo(-1,0);
    d.moveTo(0,1);
    d.lineTo(0,-1);
    d.stroke({color: this.debugCol, width: strokeWidth});
  }
  /** If enabled will draw a rectangle around the frame for debugging purposes */
  toggleDebug(enable: boolean) {
    if (enable) {
      if (!this.debug) {
        this.debug = new Graphics();
        this.addChild(this.debug);
        this.updateDebug(this.debug);
      }
    } else {
      if (this.debug) {
        this.debug.removeFromParent();
        this.debug.destroy();
        this.debug = null;
      }
    }
  }

  private _curAnim: J['animations'][number];
  /** Get data of current animation */
  get currentAnimation() {
    return this._curAnim;
  }

  /**
   * @param frame integer
   */
  private updateVisuals(frame: number) {
    let fd: J['animations'][number]['frames'][number] | undefined;
    if (this._curAnim.pingPong && frame >= this._curAnim.frames.length) {
      const f = frame - this._curAnim.frames.length;

      const frames = [...this._curAnim.frames];

      if (this._curAnim.pingPong.noLast) {
        frames.pop();
      }
      
      frames.reverse();

      if (this._curAnim.pingPong.noFirst) {
        frames.pop();
      }

      fd = frames[f];
    } else {
      fd = this._curAnim.frames[frame];
    }

    if (!fd) return;

    this._curFrData = fd;

    const animName = this._curAnim.name;

    if (animName === undefined) {
      console.error("Animation name not found");
      return;
    }

    const ts = this.sprExp.textures[animName];

    if (!ts) {
      console.error("Texture list not found for aniamtion: \"" + animName + "\"");
      return;
    }

    let newTexture: Texture | undefined;

    if (this._curAnim.pingPong && frame >= this._curAnim.frames.length) {
      const f = frame - this._curAnim.frames.length;

      const textures = [...ts];

      if (this._curAnim.pingPong.noLast) {
        textures.pop();
      }
      
      textures.reverse();

      if (this._curAnim.pingPong.noFirst) {
        textures.pop();
      }

      newTexture = textures[f];
    } else {
      newTexture = ts[frame];
    }

    if (!newTexture) {
      console.error("Texture not found for frame: \"" + frame + "\" of animation: \"" + this._curAnim.name + "\"");
      return;
    }

    this.sprite.texture = newTexture;

    // Pivot placed in the middle of sprite but not midpixel to mimic spritron's preview
    this.sprite.pivot.x = Math.floor(this.sprite.width * 0.5);
    this.sprite.pivot.y = Math.floor(this.sprite.height * 0.5);

    // Set angle based on global animation angle and local frame angle
    const angle = (fd.t?.r ?? 0) + (this._curAnim.transform?.rotation ?? 0);
    // True modulo operation as explained here:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
    this.sprite.angle = ((angle % 360) + 360) % 360;

    // Set mirror and flip based on global animation and local frame values
    this.sprite.scale.x = (!!fd.t?.m?.x !== !!this._curAnim.transform?.mirror?.x) ? -1 : 1;
    this.sprite.scale.y = (!!fd.t?.m?.y !== !!this._curAnim.transform?.mirror?.y) ? -1 : 1;

    // Determine width and height depending of if sprite is angled sideways
    let w = 0;
    let h = 0;
    if (angle % 180 === 0) {
      w = this.sprite.width;
      h = this.sprite.height;
    } else {
      w = this.sprite.height;
      h = this.sprite.width;
    }

    // Set sprite position depending on frame dimensions and offset
    this.sprite.x = fd.o.x + w * 0.5 - this._curAnim.frameDimensions.w * 0.5;
    this.sprite.y = fd.o.y + h * 0.5 - this._curAnim.frameDimensions.h * 0.5;


    if (this.debug) {
      this.updateDebug(this.debug);
    }
  }

  /** Name of currently selected animation.
	 * Set to change animation (Set will silently fail if new animation doesn't exist). */
  get currentAnimationName() {
    return this._curAnim.name;
  }
  set currentAnimationName(name: J['animations'][number]['name']) {
    const ca = this.sprExp.data.animations.find(a => a.name === name);
    if (!ca) return;
    this._curAnim = ca;
    // Update frames length
    this._framesLength = ca.framesLength;
    this.updateVisuals(Math.floor(this.frame));
  }

  private _curFrData: J['animations'][number]['frames'][number];
  /** Get data of current frame */
  get currentFrameData() {
    return this._curFrData;
  }

  private _frame = 0;
  /** Decimal value representing current frame. Both setter and getter clamped between 0 and
	 * framesLength, but getter doesn't change the underlying value.
	 * 
	 * For example if frame is 4 and framesLength changes to 2 then the getter will return 0.
	 * But if we change framesLength again to 5 without setting it the getter will return 4 again.
	 * It's not set to 0 when it gets clamped in the getter. */
  get frame() {
    const fl = this._framesLength;
    // True modulo operation as explained here:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
    return ((this._frame % fl) + fl) % fl;
  }
  set frame(f: number) {
    const prevF = Math.floor(this._frame);

    const fl = this._framesLength;
    // True modulo operation as explained here:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
    this._frame = ((f % fl) + fl) % fl;
    const currF = Math.floor(this._frame);
    if (prevF !== currF) {
      this.updateVisuals(currF);
    }
  }

  /**
   * Scaled width of the frame. Changing it changes the scale.
   */
  get frameWidth() {
    return this._curAnim.frameDimensions.w * this.scale.x;
  }
  set frameWidth(w: number) {
    const newScale = w / this._curAnim.frameDimensions.w;
    if (!Number.isFinite(newScale) || Number.isNaN(newScale)) return;
    this.scale.x = w / this._curAnim.frameDimensions.w;
  }
  /**
   * Scaled height of the frame. Changing it changes the scale.
   */
  get frameHeight() {
    return this._curAnim.frameDimensions.h * this.scale.y;
  }
  set frameHeight(h: number) {
    const newScale = h / this._curAnim.frameDimensions.h;
    if (!Number.isFinite(newScale) || Number.isNaN(newScale)) return;
    this.scale.y = h / this._curAnim.frameDimensions.h;
  }

  constructor(
    spritronFullExport: SpritronFullExport<J>,
    options?: ContainerOptions<ContainerChild>
  ) {
    super(options);
    this.sprExp = spritronFullExport;

    this.sprite = Sprite.from(new Texture({frame: new Rectangle()}));

    this.addChild(this.sprite);

    // At least one animation and one frame should always exist! Validate your input!
    // Even from yourself. Especially from yourself! Your past self is your ENEMY!
    this._curAnim = spritronFullExport.data.animations[0]!;
    this._curFrData = this.currentAnimation.frames[0]!;

    // Initialize animation through the currentAnimationName setter
    this.currentAnimationName = this._curAnim.name;
  }

  /**
   * Updates the animation. Call repeatedly in your ticker/whatever you use for updates.
   * 
   * @param dt in seconds! 
   */
  update(dt: number) {
    if (this._playing) {
      const prevFrame = this.frame;
      // Avoid 0/0
      const dividend = dt * this._curAnim.fps * this.animationSpeed;
      if (dividend !== 0) {
        // Avoid potential Infinity
        this.frame += Math.min(dividend / this._curFrData.d, 1);
      }

      if (!this._curAnim.loop) {
        if (this.animationSpeed > 0) {
          if (prevFrame > this.frame) {
            this.frame = prevFrame;
            this._playing = false;
          }
        } else {
          if (prevFrame < this.frame) {
            this.frame = prevFrame;
            this._playing = false;
          }
        }
      }
    }
  }
}

export default SpritronAnimations
`
let pixiSprAnimJsonExpCodeHtml = "";
const pixiSprAnimJsonExpCodeHtmlPromise = codeToHtml(pixiSprAnimJsonExpCode, {
  lang: 'ts',
  theme: 'vitesse-dark'
}).then((result) => {
  pixiSprAnimJsonExpCodeHtml = result;
});
const pixiFullExpJsonExpCode =
`import { Rectangle, Texture, TextureSource } from "pixi.js";
import { ReadonlySpritronJsonExport } from "./SpritronJsonExport";

class SpritronFullExport<J extends ReadonlySpritronJsonExport> {
  readonly data: J;
  readonly textures: {
    readonly [animationName: string]: Texture[]
  };

  constructor(input: J, textureMap: {readonly [imageName in J['images'][number]]: TextureSource}) {
    this.data = input;

    const textures: {
      [animationName: string]: Texture[]
    } = {};

    for (const a of input.animations) {
      const animTexts: Texture[] = [];
      textures[a.name] = animTexts;

      for (const f of a.frames) {
        const imageName: J['images'][number] | undefined = f.i !== undefined ? input.images[f.i] : undefined;
        const source: TextureSource | undefined = imageName !== undefined ? textureMap[imageName] : undefined;

        if (source) {
          animTexts.push(new Texture({
            frame: new Rectangle(f.b.x, f.b.y, f.b.w, f.b.h),
            source
          }));
        }
      }
    }

    this.textures = textures;
  }
};

export default SpritronFullExport`
let pixiFullExpJsonExpCodeHtml = "";
const pixiFullExpJsonExpCodeHtmlPromise = codeToHtml(pixiFullExpJsonExpCode, {
  lang: 'ts',
  theme: 'vitesse-dark'
}).then((result) => {
  pixiFullExpJsonExpCodeHtml = result;
});
const pixiApplTransJsonExpCode =
`import { Filter, Renderer, RenderTexture, Sprite, TextureSource } from "pixi.js";

function applyTransparencies(
  tex: TextureSource,
  transparencies: readonly {
    readonly colour: { readonly r: number; readonly g: number; readonly b: number; };
    readonly threshold: number;
  }[],
  renderer: Renderer,
  destroyInputTexture = true
) {
  const original = Sprite.from(tex);
  const target = RenderTexture.create({width: original.width, height: original.height});

  if (transparencies.length !== 0) {

    const vertex = \`
      in vec2 aPosition;
      out vec2 vTextureCoord;

      uniform vec4 uInputSize;
      uniform vec4 uOutputFrame;
      uniform vec4 uOutputTexture;

      vec4 filterVertexPosition( void )
      {
          vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
          
          position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
          position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

          return vec4(position, 0.0, 1.0);
      }

      vec2 filterTextureCoord( void )
      {
          return aPosition * (uOutputFrame.zw * uInputSize.zw);
      }

      void main(void)
      {
          gl_Position = filterVertexPosition();
          vTextureCoord = filterTextureCoord();
      }
    \`;

    const fragment = \`
      in vec2 vTextureCoord;

      uniform sampler2D uTexture;

      void main(void)
      {
        vec4 c = texture2D(uTexture, vTextureCoord);

        if (
          \${transparencies.map(t => \`
            (c.r >= \${(t.colour.r - t.threshold).toFixed(1)}
            && c.r <= \${(t.colour.r + t.threshold).toFixed(1)}
            && c.g >= \${(t.colour.g - t.threshold).toFixed(1)}
            && c.g <= \${(t.colour.g + t.threshold).toFixed(1)}
            && c.b >= \${(t.colour.b - t.threshold).toFixed(1)}
            && c.b <= \${(t.colour.b + t.threshold).toFixed(1)})
          \`).join("||")}
        ) {
          gl_FragColor = vec4(0.0,0.0,0.0,0.0);
        } else {
          gl_FragColor = c;
        }
      }
    \`;

    original.filters = [...(original.filters || []), Filter.from({
      gl: {fragment, vertex},
      gpu: {fragment: {source: fragment}, vertex: {source: vertex}}
    })];

    renderer.render({container: original, target});
    original.destroy();
  }

  const newSource = target.source;
  target.destroy();
  if (destroyInputTexture) {
    tex.destroy();
  }
  return newSource;
}

export default applyTransparencies;
`
let pixiApplTransJsonExpCodeHtml = "";
const pixiApplTransJsonExpCodeHtmlPromise = codeToHtml(pixiApplTransJsonExpCode, {
  lang: 'ts',
  theme: 'vitesse-dark'
}).then((result) => {
  pixiApplTransJsonExpCodeHtml = result;
});
const pixiTypeJsonExpCode =
`export type ReadonlySpritronJsonExport = {
  /**
   * Contains the names of the involved images.
   * Used as IDs of the images.
   */
  readonly images: readonly string[];
  /**
   * Lists of colour ranges that should be
   * treated as transparent on their corresponding images.
   */
  readonly transparenciesMap: {
    readonly [imageName: string]: readonly {
      /**
       * Values between [0, 1]
       */
      readonly colour: {
        /** Values between [0, 1] */
        readonly r: number;
        /** Values between [0, 1] */
        readonly g: number;
        /** Values between [0, 1] */
        readonly b: number;
      };
      /**
       * Should be added and subtracted to each of the RGB colour
       * values to determine the range.
       * Any colour with RGB values in between is within the range.
       */
      readonly threshold: number;
    }[];
  };
  /**
   * Array of all animations data
   */
  readonly animations: readonly {
    /**
     * Unique animation identifier
     */
    readonly name: string;
    /**
     * Frames per second
     */
    readonly fps: number;
    /**
     * Whether animation should loop
     */
    readonly loop: boolean;
    /**
     * If not null, animation should not end when reaching last frame.
     * Instead is should play again in reverse.
     */
    readonly pingPong: null | {
      /**
       * If true, when playing the animation in reverse due to ping pong,
       * the first frame (of the normal direction of the animation) should be skipped.
       */
      readonly noFirst: boolean;
      /**
       * If true, when playing the animation in reverse due to ping pong,
       * the last frame (of the normal direction of the animation) should be skipped.
       */
      readonly noLast: boolean;
    };
    /**
     * How the sprite should be rotated and/or mirrored.
     */
    readonly transform: null | {
      /**
       * In degrees. Pivot should be at center of the current frame's sprite.
       */
      readonly rotation: null | 90 | 180 | 270;
      /**
       * The x component mirrors around a vertical line
       * that passes through the center of the sprite and the y around a horizontal.
       */
      readonly mirror: null | {
        /** Mirrors around a vertical line */
        readonly x: boolean;
        /** Mirrors around a horizontal line */
        readonly y: boolean;
      };
    };
    /**
     * Dimensions of every frame of the animation.
     */
    readonly frameDimensions: {
      /** Width in pixels */
      readonly w: number;
      /** Height in pixels */
      readonly h: number;
    };
    /**
     * An array of the animation frames data in order.
     */
    readonly frames: readonly {
      /** Image index referencing the \`images\` array.
       * The corresponding image is the one that should be used for this frame. */
      readonly i: number;
      /**
       * Frame duration. It determines how long a
       * frame should last compared to a 'normal' frame (duration: 1).
       * 
       * A frame with a duration of 2 should last
       * twice as long and a frame with a duration of 0.5 should last half as long.
       * 
       * This can be achieved by dividing the animation's
       * frames per second by this value before using it to
       * calculate the current frame progress.
       * 
       * **Be careful when dividing by 0 or when
       * both dividend and divisor are 0.**
       */
      readonly d: number;
      /**
       * Transform. How the sprite should be rotated and/or mirrored.
       * 
       * Should be combined with animation transform.
       */
      readonly t: null | {
        /** Frame rotation in degrees.
         * Should be added to animation rotation.
         * Pivot should be at center of the current frame's sprite.
         */
        readonly r: null | 90 | 180 | 270;
        /**
         * Frame mirror. Should be combined with animation mirror.
         * 
         * The x component mirrors around a vertical line that
         * passes through the center of the sprite and the y around a horizontal.
         */
        readonly m: null | {
          /** Mirrors around a vertical line */
          readonly x: boolean;
          /** Mirrors around a horizontal line */
          readonly y: boolean;
        };
      };
      /**
       * Bounds. A rectangle that defines the part of the
       * image that should be visible for this
       * frame's texture.
       * 
       * Units are pixels.
       */
      readonly b: {
        /** In pixels */
        x: number;
        /** In pixels */
        y: number;
        /** Width in pixels */
        w: number;
        /** Height in pixels */
        h: number;
      };
      /**
       * Offset in pixels.
       * 
       * The way sprite placement works is as such:
       * - Use the frame bounds to create a sprite from the image.
       * - Place the transform pivot at the center of the created sprite.
       * (Floor if you want to make it exactly the same as spritron.)
       * - Apply rotations and mirrors.
       * - Use the animation frameDimensions to align the sprite's
       * post rotation top-left to the top left of the frame's dimensions rectangle.
       * - Apply the offset by adding it to the sprite position.
       */
      readonly o: {
        /** In pixels */
        readonly x: number;
        /** In pixels */
        readonly y: number;
      };
    }[];
    /**
     * The amount of frames of the animations, adjusted for ping pong.
     */
    readonly framesLength: number;
  }[];
}`
let pixiTypeJsonExpCodeHtml = "";
const pixiTypeJsonExpCodeHtmlPromise = codeToHtml(pixiTypeJsonExpCode, {
  lang: 'ts',
  theme: 'vitesse-dark'
}).then((result) => {
  pixiTypeJsonExpCodeHtml = result;
});
export function PixiJsonExportCode() {
	const [sprAnimHtml, setSprAnimHtml] = useState(pixiSprAnimJsonExpCodeHtml);
  useEffect(() => {
    if (pixiSprAnimJsonExpCodeHtml === "") {
      pixiSprAnimJsonExpCodeHtmlPromise.then(() => setSprAnimHtml(pixiSprAnimJsonExpCodeHtml))
    }
  }, []);
	const [fullExpHtml, setFullExpHtml] = useState(pixiFullExpJsonExpCodeHtml);
  useEffect(() => {
    if (pixiFullExpJsonExpCodeHtml === "") {
      pixiFullExpJsonExpCodeHtmlPromise.then(() => setFullExpHtml(pixiFullExpJsonExpCodeHtml))
    }
  }, []);
	const [applTransHtml, setApplTransHtml] = useState(pixiApplTransJsonExpCodeHtml);
  useEffect(() => {
    if (pixiApplTransJsonExpCodeHtml === "") {
      pixiApplTransJsonExpCodeHtmlPromise.then(() => setApplTransHtml(pixiApplTransJsonExpCodeHtml))
    }
  }, []);
	const [typeHtml, setTypeHtml] = useState(pixiTypeJsonExpCodeHtml);
  useEffect(() => {
    if (pixiTypeJsonExpCodeHtml === "") {
      pixiTypeJsonExpCodeHtmlPromise.then(() => setTypeHtml(pixiTypeJsonExpCodeHtml))
    }
  }, []);

  const [pixiTab, setPixiTab] = useCachedState(
    "SpritronAnimations.ts",
    "tutorialPixiJsonExpTab",
    s=>s,s=>s
  );

  return <>
  <Tabs
    value={pixiTab}
    onChange={(_, v) => {
      setPixiTab(v);
    }}
		sx={{
			"& button": {
				textTransform: "none"
			}
		}}
  >
    <Tab
      label="SpritronAnimations.ts"
      value={'SpritronAnimations.ts'}
    />
    <Tab
      label="SpritronFullExport.ts"
      value={'SpritronFullExport.ts'}
    />
    <Tab
      label="applyTransparencies.ts"
      value={'applyTransparencies.ts'}
    />
    <Tab
      label="SpritronJsonExport.d.ts"
      value={'SpritronJsonExport.d.ts'}
    />
  </Tabs>
	{
		pixiTab === "SpritronAnimations.ts"
		? <CodeDisplay
			codeHtml={sprAnimHtml}
			code={pixiSprAnimJsonExpCode}
		/>
		: pixiTab === "SpritronFullExport.ts"
		? <CodeDisplay
			codeHtml={fullExpHtml}
			code={pixiFullExpJsonExpCode}
		/>
		: pixiTab === "applyTransparencies.ts"
		? <CodeDisplay
			codeHtml={applTransHtml}
			code={pixiApplTransJsonExpCode}
		/>
		: pixiTab === "SpritronJsonExport.d.ts"
		? <CodeDisplay
			codeHtml={typeHtml}
			code={pixiTypeJsonExpCode}
		/>
		: null
	}
  </>;
}


const pixiUsageImgExpCode =
`// Import the animation data json
import animation from "./path/to/animation";

// Import Pixi.js texture
import spritesheetTexture from "./path/to/spritesheetTexture";

// Class that maps data to texture
import SpritronImageExport from "./path/to/SpritronImageExport";

const e = new SpritronImageExport(
	animation,
	spritesheetTexture
)

// Class that extends pixi.js sprite and is meant
// to play animation provided by a spritron image export
import SpritronAnimation from "./path/to/SpritronAnimation";

// Create your animation and add it to your stage
const anim = new SpritronAnimation(e);
import stage from "./path/to/stage";
stage.addChild(anim);

// Change animation speed (negative for reverse)
anim.animationSpeed = 0.5;

// Change animation frame (decimal part is animation progress)
anim.frame = 1.5;

// Play or stop animation
anim.playing = true;

// Call this repeatedly wherever you have your ticker
// (or whatever other method you use to update your scene)
// and pass it its delta time in seconds to progress the animation
anim.update(0.1);
`
let pixiUsageImgExpCodeHtml = "";
const pixiUsageImgExpCodeHtmlPromise = codeToHtml(pixiUsageImgExpCode, {
  lang: 'ts',
  theme: 'vitesse-dark'
}).then((result) => {
  pixiUsageImgExpCodeHtml = result;
});
export function PixiImgExportUsage() {
  const [innerHtml, setInnerHtml] = useState(pixiUsageImgExpCodeHtml);
  useEffect(() => {
    if (pixiUsageImgExpCodeHtml === "") {
      pixiUsageImgExpCodeHtmlPromise.then(() => setInnerHtml(pixiUsageImgExpCodeHtml))
    }
  }, []);
  return <>
  <CodeDisplay
    codeHtml={innerHtml}
  />
  </>;
}

const pixiSprAnimImgExpCode =
`import { Sprite, SpriteOptions, Texture } from "pixi.js";
import SpritronImageExport from "./SpritronImageExport";

class SpritronAnimation extends Sprite {
  private _imageExport: SpritronImageExport;
  get imageExport() {
    return this._imageExport;
  }
  set imageExport(ie) {
    this._imageExport = ie;

    // Make sure frame is clamped properly
    const fl = this._imageExport.frames.length;
    // True modulo operation as explained here:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
    this._frame = ((this._frame % fl) + fl) % fl;

    this.rerender();
  }

  private _playing = true;
  /** Controls if animation is playing or paused */
  get playing() {
    return this._playing;
  }
  set playing(p) {
    this._playing = p

    if (p) {
      // Restart non looping animation on its last frame
      if (!this._imageExport.json.loop) {
        if (this.animationSpeed > 0) {
          if (this.frame + 1 >= this._imageExport.frames.length) {
            this.frame = 0;
          }
        } else if (this.animationSpeed < 0) {
          if (this.frame < 1) {
            this.frame = this._imageExport.frames.length - 0.0001; // Hackfraudery
          }
        }
      }
    }
  }

  private _frame = 0;
  /**
	 * Decimal value representing current frame.
	 * Both setter and getter clamped between 0 and frames.length of the json export,
	 * but getter doesn't change the underlying value. So for example if frame is 4
	 * and frames.length changes to 2 then the getter will return 0.
	 * But if we change frames.length again to 5 without setting it the getter
	 * will return 4 again. It's not set to 0 when it gets clamped in the getter.
	 */
  get frame() {
    const fl = this._imageExport.frames.length;
    // True modulo operation as explained here:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
    return ((this._frame % fl) + fl) % fl;
  }
  set frame(f: number) {
    const prevF = Math.floor(this._frame);

    const fl = this._imageExport.frames.length;
    // True modulo operation as explained here:
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
    this._frame = ((f % fl) + fl) % fl;
    const currF = Math.floor(this._frame);
    if (prevF !== currF) {
      this.rerender()
    }
  }

  animationSpeed = 1;

  rerender() {
    const f = Math.floor(this.frame);
    if (this.imageExport.frames[f]) {
      this.texture = this.imageExport.frames[f];
      this.pivot.x = Math.floor(this.width * 0.5);
      this.pivot.y = Math.floor(this.height * 0.5);
    }
  }


  constructor(
    imageExport: SpritronImageExport,
    options?: SpriteOptions | Texture
  ) {
    super(options)
    this._imageExport = imageExport;

    this.rerender();
  }

  /**
   * Updates the animation. Call repeatedly in your ticker/whatever you use for updates.
   * 
   * @param dt in seconds! 
   */
  update(dt: number) {
    if (this._playing) {
      const prevFrame = this.frame;
      // Avoid 0/0
      const dividend = dt * this._imageExport.json.framesPerSecond * this.animationSpeed;
      if (dividend !== 0) {
        // Avoid potential Infinity
        this.frame += Math.min(dividend / this._imageExport.json.durations[Math.floor(this.frame)]!, 1);
      }

      if (!this._imageExport.json.loop) {
        if (this.animationSpeed > 0) {
          if (prevFrame > this.frame) {
            this.frame = prevFrame;
            this._playing = false;
          }
        } else {
          if (prevFrame < this.frame) {
            this.frame = prevFrame;
            this._playing = false;
          }
        }
      }
    }
  }
};

export default SpritronAnimation
`
let pixiSprAnimImgExpCodeHtml = "";
const pixiSprAnimImgExpCodeHtmlPromise = codeToHtml(pixiSprAnimImgExpCode, {
  lang: 'ts',
  theme: 'vitesse-dark'
}).then((result) => {
  pixiSprAnimImgExpCodeHtml = result;
});
const pixiExpImgExpCode =
`import { Rectangle, Texture, TextureSource } from "pixi.js";
import { ReadonlySpritronImageExportJson } from "./SpritronImageExportJson"

class SpritronImageExport {
  readonly json: ReadonlySpritronImageExportJson;
  readonly frames: readonly Texture[];

  constructor(
    json: ReadonlySpritronImageExportJson,
    textureSource: TextureSource
  ) {
    this.json = json;

    const f: Texture[] = [];
    
    let i = 0;
    nested:
    for (let r = 0; r < json.rows; r++) {
      for (let c = 0; c < json.columns; c++) {
        i++;
        if (i > json.durations.length) {
          break nested;
        }
        f.push(new Texture({
          source: textureSource,
          frame: new Rectangle(
            json.offset + c * (json.padding + json.width),
            json.offset + r * (json.padding + json.height),
            json.width,
            json.height
          )
        }));
      }
    }

    this.frames = f;
  }
}

export default SpritronImageExport
`
let pixiExpImgExpCodeHtml = "";
const pixiExpImgExpCodeHtmlPromise = codeToHtml(pixiExpImgExpCode, {
  lang: 'ts',
  theme: 'vitesse-dark'
}).then((result) => {
  pixiExpImgExpCodeHtml = result;
});
const pixiTypeImgExpCode =
`export type ReadonlySpritronImageExportJson = {
  /**
   * The width of the frame in pixels
   */
  readonly width: number;
  /**
   * The height of the frame in pixels
   */
  readonly height: number;
  /**
   * The outer padding, i.e. how many pixels
   * you need to skip in each dimension
   * to reach the start of the first frame
   */
  readonly offset: number;
  /**
   * Padding in pixels between frames
   */
  readonly padding: number;
  /**
   * Number of columns of the animation
   */
  readonly columns: number;
  /**
   * Number of rwos of the animation
   */
  readonly rows: number;
  readonly framesPerSecond: number;
  /**
   * Whether animation should loop
   */
  readonly loop: boolean;
  /**
   * Array containing the duration of each frame.
   * The duration determines how long a frame
   * should last compared to a 'normal' frame (duration: 1).
   * 
   * A frame with a duration of 2 should last
   * twice as long and a frame with a duration
   * of 0.5 should last half as long.
   * 
   * This can be achieved by dividing the
   * animation's frames per second by the
   * corresponding frame's duration before
   * using it to calculate the current frame progress.
   * 
   * **Be careful when dividing by 0 or
   * when both dividend and divisor are 0.**
   */
  readonly durations: readonly number[];
  /**
   * Number of frames of the animation.
   * 
   * Should be the same as the length of the durations array.
   */
  readonly framesLength: number;
}
`;
let pixiTypeImgExpCodeHtml = "";
const pixiTypeImgExpCodeHtmlPromise = codeToHtml(pixiTypeImgExpCode, {
  lang: 'ts',
  theme: 'vitesse-dark'
}).then((result) => {
  pixiTypeImgExpCodeHtml = result;
});
export function PixiImgExportCode() {
	const [sprAnimHtml, setSprAnimHtml] = useState(pixiSprAnimImgExpCodeHtml);
  useEffect(() => {
    if (pixiSprAnimImgExpCodeHtml === "") {
      pixiSprAnimImgExpCodeHtmlPromise.then(() => setSprAnimHtml(pixiSprAnimImgExpCodeHtml))
    }
  }, []);
	const [expHtml, setExpHtml] = useState(pixiExpImgExpCodeHtml);
  useEffect(() => {
    if (pixiExpImgExpCodeHtml === "") {
      pixiExpImgExpCodeHtmlPromise.then(() => setExpHtml(pixiExpImgExpCodeHtml))
    }
  }, []);
	const [typeHtml, setTypeHtml] = useState(pixiTypeImgExpCodeHtml);
  useEffect(() => {
    if (pixiTypeImgExpCodeHtml === "") {
      pixiTypeImgExpCodeHtmlPromise.then(() => setTypeHtml(pixiTypeImgExpCodeHtml))
    }
  }, []);

  const [pixiTab, setPixiTab] = useCachedState(
    "SpritronAnimation.ts",
    "tutorialPixiImgExpTab",
    s=>s,s=>s
  );

  return <>
  <Tabs
    value={pixiTab}
    onChange={(_, v) => {
      setPixiTab(v);
    }}
		sx={{
			"& button": {
				textTransform: "none"
			}
		}}
  >
    <Tab
      label="SpritronAnimation.ts"
      value={'SpritronAnimation.ts'}
    />
    <Tab
      label="SpritronImageExport.ts"
      value={'SpritronImageExport.ts'}
    />
    <Tab
      label="SpritronImageExportJson.d.ts"
      value={'SpritronImageExportJson.d.ts'}
    />
  </Tabs>
	{
		pixiTab === "SpritronAnimation.ts"
		? <CodeDisplay
			codeHtml={sprAnimHtml}
			code={pixiSprAnimImgExpCode}
		/>
		: pixiTab === "SpritronImageExport.ts"
		? <CodeDisplay
			codeHtml={expHtml}
			code={pixiExpImgExpCode}
		/>
		: pixiTab === "SpritronImageExportJson.d.ts"
		? <CodeDisplay
			codeHtml={typeHtml}
			code={pixiTypeImgExpCode}
		/>
		: null
	}
  </>;
}