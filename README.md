# **mesh2shape** for Adobe After Effects

Small script I use to import 3D meshes as shape layers in After Effects.

## Mesh file format

The mesh file is a JSON file with the following structure:

- **`strokeColor`** : _`object` (optional, defaults to black)_  
  The stroke color as a triplet of RGB values. Ignored if `strokeWidth` is `0`.
  - **`r`** : _`number` in range \[0,1\]_
  - **`g`** : _`number` in range \[0,1\]_
  - **`b`** : _`number` in range \[0,1\]_
- **`fillColor`** : _`object` (optional, defaults to white)_  
  The fill color as a triplet of RGB values. It is multiplied by the `lambert` factor to obtain the final polygon color.
  - **`r`** : _`number` in range \[0,1\]_
  - **`g`** : _`number` in range \[0,1\]_
  - **`b`** : _`number` in range \[0,1\]_
- **`strokeWidth`** : _`number` (optional, defaults to `0`, non-negative)_  
  The stroke width. If positive, a stroke is applied to each polygon.
- **`name`** : _`string` (optional, defaults to `"My mesh"`, alphanumeric or space or one of `.,-_?!"'()[]{}$%&\=#@+-\*/`)_  
  The After Effects layer name when loaded.
- **`keyframeDuration`** : _`number` (optional, defaults to `1`, non-negative)_  
  The time distance between each keyframe in the animation, in seconds. Clamped if shorter than a frame.
- **`timeInterpolation`** : _`"linear" | "bezier" | "continuous_bezier" | "auto_bezier"` (optional, defaults to `"continuous_bezier"`)_  
  The time interpolation property of the keyframes.
- **`spatialInterpolation`** : _`"linear" | "bezier" | "continuous_bezier" | "auto_bezier"` (optional, defaults to `"continuous_bezier"`)_  
  The spatial interpolation property of the keyframes.
- **`keyframes`** : _`object[][]`_  
  The keyframe list. Each keyframe is a list of polygons.
  - **`lambert`** : _`number` in range \[0,1\]_  
    The lighting intensity of the polygon.
  - **`depth`** : _`number`_  
    A numeric value in an arbitrary range. Used to sort the polygons so that lower values go on top.
  - **`vertices`** : _`object[]`_  
    The vertices of the polygon. Order and count must remain the same between the keyframes. The origin is the center of the screen. (`-w/h`,`-1`) and (`w/h`,`1`) are the bottom left and the top right corners of the screen, respectively (where `w` and `h` are the width and the height of the composition).
    - **`x`**: _`number`_  
      The x coordinate of the vertex.
    - **`y`**: _`number`_  
      The y coordinate of the vertex.

## Example

See [example.json](example.json).

## TODO

- Depth sorting is not implemented yet.
- `spatialInterpolation` and `timeInterpolation` are not implemented yet.
