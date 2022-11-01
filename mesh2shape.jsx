function coerceColor(color, defaultColor) {
    function coerceComponent(component) {
        if (component === undefined) {
            throw new Error("Missing color component.");
        }
        if (isNaN(component)) {
            throw new Error("Color component is not a number.");
        }
        if (component < 0 || component > 1) {
            throw new Error("Color component not in range [0,1].");
        }
        return component;
    }
    if (color === undefined) {
        if (defaultColor === undefined) {
            throw new Error("Expected a color.");
        }
        return defaultColor;
    }
    return [
        coerceComponent(color.r),
        coerceComponent(color.g),
        coerceComponent(color.b)
    ];
}

function coerceLayerName(name, defaultName) {
    if (name === undefined) {
        if (defaultName === undefined) {
            throw new Error("Expected a layer name.");
        }
        return defaultName;
    }
    if (!(typeof name === 'string' || name instanceof String)) {
        throw new Error("Name is not a string.");
    }
    if (!name.match(/^[\w \?\!\{\}\[\]\(\)\"\'\\\-\+\*\/\$\%\&\=_\.,#@]+$/)) {
        throw new Error("Name contains invalid characters.");
    }
    return name;
}

function coerceNumber(value, defaultValue, min, max) {
    if (value === undefined) {
        if (defaultValue === undefined) {
            throw new Error("Expected a number.");
        }
        return defaultValue;
    }
    if (isNaN(value)) {
        throw new Error("Not a number.");
    }
    if (value < min || value > max) {
        throw new Error("Number not in range [" + min + "," + max + "].");
    }
    return value;
}

function coerceInterpolation(value, defaultValue) {
    if (value === undefined) {
        if (defaultValue === undefined) {
            throw new Error("Expected an interpolation type.");
        }
        return defaultValue;
    }
    if (!(typeof value === 'string' || value instanceof String)) {
        throw new Error("Interpolation type is not a string.");
    }
    switch (value) {
        case "linear":
            return 0;
        case "bezier":
            return 1;
        case "continuous_bezier":
            return 2;
        case "auto_bezier":
            return 3;
        default:
            throw new Error("Unknown interpolation type.");
    }
}

function coerceObject(value, properties) {
    if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        throw new Error("Not an object.");
    }
    for (var key in value) {
        if (properties.indexOf(key) === -1) {
            throw new Error("Unexpected property '" + key + "'.");
        }
    }
    return value;
}

function coerceList(value) {
    if (!Array.isArray(value)) {
        throw new Error("Not an array.");
    }
    return value;
}

function main() {
    // composition
    var composition = app.project.activeItem;
    if (!(composition instanceof CompItem)) {
        throw new Error("No active composition.");
    }
    // loading
    var meshFile = File.openDialog("Load a mesh", "JSON files:*.json,All files:*.*", false);
    if (meshFile === null) {
        return;
    }
    meshFile.open("r");
    var json = meshFile.read();
    meshFile.close();
    // validation
    var mesh = coerceObject(JSON.parse(json), ["strokeColor", "fillColor", "strokeWidth", "name", "keyframeDuration", "timeInterpolation", "spatialInterpolation", "keyframes"]);
    mesh.strokeColor = coerceColor(mesh.strokeColor, [0, 0, 0]);
    mesh.strokeWidth = coerceNumber(mesh.strokeWidth, 0, 0, Infinity);
    mesh.fillColor = coerceColor(mesh.fillColor, [1, 1, 1]);
    mesh.name = coerceLayerName(mesh.name, "My mesh");
    mesh.keyframeDuration = Math.max(coerceNumber(mesh.keyframeDuration, 1, 0, 60), composition.frameDuration);
    mesh.timeInterpolation = coerceInterpolation(mesh.timeInterpolation, 2);
    mesh.spatialInterpolation = coerceInterpolation(mesh.spatialInterpolation, 2);
    mesh.keyframes = coerceList(mesh.keyframes);
    var keyframeCount = mesh.keyframes.length;
    var polygonCount = null;
    mesh.keyframes = mesh.keyframes.map(function(keyframe) {
        keyframe = coerceList(keyframe);
        if (polygonCount == null) {
            polygonCount = keyframe.length;
        }
        if (polygonCount !== keyframe.length) {
            throw new Error("Polygon count does not match between keyframes.");
        }
        return keyframe.map(function(polygon) {
            polygon = coerceObject(polygon, ["lambert", "depth", "vertices"]);
            polygon.lambert = coerceNumber(polygon.lambert, undefined, 0, 1);
            polygon.depth = coerceNumber(polygon.depth, undefined, -Infinity, Infinity);
            polygon.vertices = coerceList(polygon.vertices).map(function(vertex) {
                vertex = coerceObject(vertex, ["x", "y"]);
                vertex.x = coerceNumber(vertex.x, undefined, -Infinity, Infinity);
                vertex.y = coerceNumber(vertex.y, undefined, -Infinity, Infinity);
                return vertex;
            });
            return polygon;
        })
    });
    for (var pi = 0; pi < polygonCount; pi++) {
        var vertCount = null;
        for (var ki = 0; ki < keyframeCount; ki++) {
            if (vertCount === null) {
                vertCount = mesh.keyframes[ki][pi].vertices.count;
            }
            if (vertCount != mesh.keyframes[ki][pi].vertices.count) {
                throw new Error("Vertex count does not match between keyframes.");
            }
        }
    }
    // depth sorting
    // TODO
    // creation
    app.beginUndoGroup("mesh2shape");
    composition.duration = Math.max(composition.duration, keyframeCount * mesh.keyframeDuration);
    var layer = composition.layers.addShape();
    layer.name = mesh.name;
    layer.property("ADBE Transform Group").property("Anchor Point").setValue([composition.width / 2, composition.height / 2]);
    var contents = layer.property("ADBE Root Vectors Group");
    for (var pi = 0; pi < polygonCount; pi++) {
        var groupIndex = contents.addProperty("ADBE Vector Shape - Group").propertyIndex;
        if (mesh.strokeWidth > 0) {
            var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
            stroke.property("ADBE Vector Stroke Color").setValue(mesh.strokeColor);
            stroke.property("ADBE Vector Stroke Width").setValue(mesh.strokeWidth);
            stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
            stroke.property("ADBE Vector Stroke Line Join").setValue(2);
        }
        var fillIndex = contents.addProperty("ADBE Vector Graphic - Fill").propertyIndex;
        for (var ki = 0; ki < keyframeCount; ki++) {
            var shape = new Shape();
            var polygon = mesh.keyframes[ki][pi];
            shape.vertices = polygon.vertices.map(function(vertex) {
                return [
                    composition.width / 2 + vertex.x / 2 * composition.height,
                    composition.height / 2 - vertex.y / 2 * composition.height
                ];
            });
            shape.closed = true;
            var time = ki * mesh.keyframeDuration;
            contents.property(groupIndex).property("ADBE Vector Shape").setValueAtTime(time, shape);
            var color = [
                mesh.fillColor[0] * polygon.lambert,
                mesh.fillColor[1] * polygon.lambert,
                mesh.fillColor[2] * polygon.lambert
            ];
            contents.property(fillIndex).property("ADBE Vector Fill Color").setValueAtTime(time, color);
        }
    }
    app.endUndoGroup();
};

try {
    main();
} catch (e) {
    if ($.level === 0) {
        Window.alert(e.message, "mesh2shape error", true);
    } else {
        throw e;
    }
}