import { 
  Rect, 
  Line, 
  Path, 
  util,
  type Canvas, 
  type FabricObject 
} from "fabric";
import { SHAPE_PATHS } from "./asset-utils";

/**
 * Shared utility to add standard shapes to a Fabric canvas.
 */
export function addShapeToCanvas(
  canvas: Canvas | null,
  category: string,
  shapeType: string,
  options: any = {},
  accentColor: string = "#462D6E"
) {
  if (!canvas) return;

  const center = canvas.getCenterPoint();
  const left = options.left ?? center.x - 50;
  const top = options.top ?? center.y - 50;

  let shape: FabricObject | null = null;

  if (category === "SEPARADORES") {
    if (shapeType === "solid" || shapeType === "dashed" || shapeType === "dotted") {
      shape = new Line([0, 0, 200, 0], {
        stroke: accentColor,
        strokeWidth: 4,
        strokeDashArray: shapeType === "dashed" ? [12, 8] : shapeType === "dotted" ? [4, 6] : undefined,
      });
    } else if (shapeType === "double") {
      shape = new Path(SHAPE_PATHS.doubleLine, {
        stroke: accentColor,
        strokeWidth: 2,
        fill: "transparent",
      });
    } else {
      shape = new Path(SHAPE_PATHS[shapeType as keyof typeof SHAPE_PATHS] || SHAPE_PATHS.wavy, {
        stroke: accentColor,
        strokeWidth: 4,
        fill: "transparent",
      });
    }
  } else if (category === "MARCOS") {
    shape = new Rect({
      width: 200,
      height: 200,
      fill: "transparent",
      stroke: accentColor,
      strokeWidth: shapeType === "double" ? 8 : 4,
      strokeDashArray: shapeType === "dashed" ? [15, 10] : undefined,
      rx: 12,
      ry: 12,
    });
  } else if (category === "BLOQUES") {
    shape = new Path(SHAPE_PATHS[shapeType as keyof typeof SHAPE_PATHS] || SHAPE_PATHS.badge, {
      fill: `${accentColor}33`, // 20% opacity
      stroke: accentColor,
      strokeWidth: 2,
    });
  } else if (category === "GEOMÉTRICOS") {
    shape = new Path(SHAPE_PATHS[shapeType as keyof typeof SHAPE_PATHS] || SHAPE_PATHS.diamond, {
      fill: `${accentColor}33`,
      stroke: accentColor,
      strokeWidth: 2,
    });
  }

  if (shape) {
    shape.set({
      left,
      top,
      ...options
    });
    
    // Custom utility for Noctra controls usually found in FabricEditor
    if ((canvas as any).applyDefaultObjectControls) {
      (canvas as any).applyDefaultObjectControls(shape);
    }
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.requestRenderAll();
  }
}
