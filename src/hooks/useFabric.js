"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";

export const useFabric = (canvasId) => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);

  useEffect(() => {
    if (!canvasId) return;

    const canvasInstance = new fabric.Canvas(canvasId, {
      width: 800,
      height: 600,
      backgroundColor: "transparent",
      preserveObjectStacking: true,
      selection: true,
    });

    setCanvas(canvasInstance);
    canvasRef.current = canvasInstance;

    const handleResize = () => {
      // Logic for responsiveness if needed
    };

    window.addEventListener("resize", handleResize);

    canvasInstance.on('object:moving', (e) => {
      const obj = e.target;
      const canvasWidth = canvasInstance.width;
      const canvasHeight = canvasInstance.height;
      const snapThreshold = 10;

      const objCenter = obj.getCenterPoint();

      // Horizontal Snapping (Centers object horizontally -> Vertical Line)
      if (Math.abs(objCenter.x - canvasWidth / 2) < snapThreshold) {
        const deltaX = canvasWidth / 2 - objCenter.x;
        obj.set({ left: obj.left + deltaX });
        canvasInstance.gridLineV = true; 
      } else {
        canvasInstance.gridLineV = false;
      }

      // Vertical Snapping (Centers object vertically -> Horizontal Line)
      if (Math.abs(objCenter.y - canvasHeight / 2) < snapThreshold) {
        const deltaY = canvasHeight / 2 - objCenter.y;
        obj.set({ top: obj.top + deltaY });
        canvasInstance.gridLineH = true;
      } else {
        canvasInstance.gridLineH = false;
      }

      canvasInstance.renderAll();
    });

    canvasInstance.on('after:render', () => {
        const ctx = canvasInstance.getContext();
        ctx.save();
        ctx.strokeStyle = '#ff00ff'; 
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        // Draw Vertical Line (for Horizontal Center alignment)
        if (canvasInstance.gridLineV) {
            ctx.beginPath();
            ctx.moveTo(canvasInstance.width / 2, 0);
            ctx.lineTo(canvasInstance.width / 2, canvasInstance.height);
            ctx.stroke();
        }

        // Draw Horizontal Line (for Vertical Center alignment)
        if (canvasInstance.gridLineH) {
            ctx.beginPath();
            ctx.moveTo(0, canvasInstance.height / 2);
            ctx.lineTo(canvasInstance.width, canvasInstance.height / 2);
            ctx.stroke();
        }
        ctx.restore();
    });

    canvasInstance.on('mouse:up', () => {
        canvasInstance.gridLineH = false;
        canvasInstance.gridLineV = false;
        canvasInstance.renderAll();
    });

    return () => {
      canvasInstance.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasId]);

  // --- History Management ---
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isUpdatingHistory = useRef(false);

  const saveHistory = useCallback(() => {
    if (!canvasRef.current || isUpdatingHistory.current) return;
    const json = canvasRef.current.toJSON();
    undoStack.current.push(JSON.stringify(json));
    redoStack.current = [];
  }, []);

  const undo = useCallback(() => {
    if (!canvasRef.current || undoStack.current.length <= 1) return;
    isUpdatingHistory.current = true;
    const current = undoStack.current.pop();
    redoStack.current.push(current);
    const prev = undoStack.current[undoStack.current.length - 1];
    
    canvasRef.current.loadFromJSON(JSON.parse(prev)).then(() => {
        canvasRef.current.renderAll();
        isUpdatingHistory.current = false;
    });
  }, []);

  const redo = useCallback(() => {
    if (!canvasRef.current || redoStack.current.length === 0) return;
    isUpdatingHistory.current = true;
    const next = redoStack.current.pop();
    undoStack.current.push(next);
    
    canvasRef.current.loadFromJSON(JSON.parse(next)).then(() => {
        canvasRef.current.renderAll();
        isUpdatingHistory.current = false;
    });
  }, []);

  useEffect(() => {
    if (!canvas) return;
    
    const handleHistory = () => saveHistory();
    
    canvas.on('object:added', handleHistory);
    canvas.on('object:removed', handleHistory);
    canvas.on('object:modified', handleHistory);
    
    // Initial state
    if (undoStack.current.length === 0) {
        saveHistory();
    }

    return () => {
        canvas.off('object:added', handleHistory);
        canvas.off('object:removed', handleHistory);
        canvas.off('object:modified', handleHistory);
    };
  }, [canvas, saveHistory]);

  const addShape = useCallback((type, options = {}) => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    let shape;

    const defaultOptions = {
        stroke: '#000000',
        strokeWidth: 0,
        ...options
    };

    switch (type) {
      case "rect":
        shape = new fabric.Rect({
          width: 100,
          height: 100,
          fill: "#8b5cf6",
          left: c.width / 2 - 50,
          top: c.height / 2 - 50,
          ...defaultOptions,
        });
        break;
      case "circle":
        shape = new fabric.Circle({
          radius: 50,
          fill: "#ef4444",
          left: c.width / 2 - 50,
          top: c.height / 2 - 50,
          ...defaultOptions,
        });
        break;
      case "triangle":
        shape = new fabric.Triangle({
          width: 100,
          height: 100,
          fill: "#f59e0b",
          left: c.width / 2 - 50,
          top: c.height / 2 - 50,
          ...defaultOptions,
        });
        break;
      case "star":
        const points = [];
        const numPoints = 5;
        const outerRadius = 50;
        const innerRadius = 25;
        for (let i = 0; i < numPoints * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / numPoints;
            points.push({
                x: radius * Math.sin(angle),
                y: radius * Math.cos(angle)
            });
        }
        shape = new fabric.Polygon(points, {
            fill: "#fde047",
            left: c.width / 2 - outerRadius,
            top: c.height / 2 - outerRadius,
            ...defaultOptions
        });
        break;
      default:
        return;
    }

    c.add(shape);
    c.setActiveObject(shape);
    c.renderAll();
  }, []);

  const addText = useCallback((text, options = {}) => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const textObj = new fabric.IText(text || "Type something...", {
      left: c.width / 2 - 100,
      top: c.height / 2 - 20,
      fontSize: options.fontSize || 40,
      fontFamily: options.fontFamily || "Inter",
      fill: options.fill || "#333333",
      textAlign: "center",
      originX: 'center',
      originY: 'center',
      ...options,
    });
    c.add(textObj);
    c.setActiveObject(textObj);
    c.renderAll();
  }, []);

  const addImage = useCallback((url, options = {}) => {
    if (!canvasRef.current || !url) return;
    const c = canvasRef.current;
    
    fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
        const targetWidth = options.width || 400;
        const scale = targetWidth / img.width;
        
        const { width, ...cleanOptions } = options;

        img.set({
            scaleX: scale,
            scaleY: scale,
            left: c.width / 2,
            top: c.height / 2,
            originX: 'center',
            originY: 'center',
            ...cleanOptions
        });
        
        c.add(img);
        c.renderAll();
    }).catch(err => console.error("Image Loading Error:", err));
  }, []);

  const addSVG = useCallback((url) => {
    if (!canvasRef.current || !url) return;
    const c = canvasRef.current;

    fabric.loadSVGFromURL(url).then(({ objects, options }) => {
      const validObjects = objects.filter(obj => obj !== null);
      if (validObjects.length === 0) return;

      // Force create a group even for single elements to ensure it behaves consistently (Inkscape style)
      const group = new fabric.Group(validObjects, {
          ...options,
          subTargetCheck: true,
          interactive: true
      });
      
      group.setCoords();
      const canvasCenter = c.getCenterPoint();
      
      // Professional auto-scale to fit 60% of canvas area initially
      const targetWidth = c.width * 0.6;
      const targetHeight = c.height * 0.6;
      const scale = Math.min(targetWidth / (group.width || 1), targetHeight / (group.height || 1), 1);
      
      group.set({
        scaleX: scale,
        scaleY: scale,
        left: canvasCenter.x,
        top: canvasCenter.y,
        originX: 'center',
        originY: 'center'
      });

      c.add(group);
      c.renderAll();
    }).catch(err => {
      console.error("SVG Loading Error:", err);
      addImage(url);
    });
  }, [addImage]);

  const exportToFile = useCallback((format = "png") => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    let dataUrl;
    
    // De-select items before export for clean look
    c.discardActiveObject();
    
    // TEMPORARILY disable background if it's white for a transparent export
    // But since we initialized with "transparent", we are good.
    c.renderAll();

    if (format === "svg") {
      dataUrl = c.toSVG();
      const blob = new Blob([dataUrl], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `design.svg`;
      link.click();
    } else {
      dataUrl = c.toDataURL({
        format: format,
        quality: 1,
        multiplier: 2, // Better resolution
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `design.${format}`;
      link.click();
    }
  }, []);

  const bringToFront = useCallback(() => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    if (activeObject) {
      c.bringObjectToFront(activeObject);
      c.renderAll();
    }
  }, []);

  const sendToBack = useCallback(() => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    if (activeObject) {
      c.sendObjectToBack(activeObject);
      c.renderAll();
    }
  }, []);

  const moveForward = useCallback(() => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    if (activeObject) {
      c.bringObjectForward(activeObject);
      c.renderAll();
    }
  }, []);

  const moveBackward = useCallback(() => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    if (activeObject) {
      c.sendObjectBackwards(activeObject);
      c.renderAll();
    }
  }, []);

  const groupObjects = useCallback(() => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    
    // In Fabric v7, we can use the Group constructor or toGroup if available on ActiveSelection
    if (activeObject && activeObject.type === 'activeSelection') {
      try {
        const objects = activeObject.removeAll();
        const group = new fabric.Group(objects, {
            canvas: c,
            id: `group-${Date.now()}`
        });
        c.add(group);
        c.setActiveObject(group);
        c.renderAll();
      } catch (e) {
        console.error("Grouping Error:", e);
      }
    }
  }, []);

  const ungroupObjects = useCallback(() => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    
    if (!activeObject || (activeObject.type !== 'group' && !activeObject._objects)) return;

    try {
        // Manual Unpack for perfect compatibility
        const objects = activeObject.getObjects();
        const groupMatrix = activeObject.calcTransformMatrix();
        
        // Remove the group but keep items ready
        c.remove(activeObject);
        c.discardActiveObject();

        objects.forEach(obj => {
            // Recalculate absolute world position from group center
            const objMatrix = obj.calcTransformMatrix();
            const worldMatrix = fabric.util.multiplyTransformMatrices(groupMatrix, objMatrix);
            const transform = fabric.util.qrDecompose(worldMatrix);
            
            obj.set({
                ...transform,
                left: transform.translateX,
                top: transform.translateY
            });
            c.add(obj);
            obj.setCoords();
        });

        const selection = new fabric.ActiveSelection(objects, { canvas: c });
        c.setActiveObject(selection);
        c.renderAll();
    } catch (e) {
        console.error("Critical Ungroup Error:", e);
    }
  }, []);

  const toggleDrawingMode = useCallback((enabled, type = "pencil") => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    c.isDrawingMode = enabled;
    c.selection = !enabled; // Enable normal selection when drawing is off
    
    if (enabled) {
      if (type === "spray") c.freeDrawingBrush = new fabric.SprayBrush(c);
      else if (type === "circle") c.freeDrawingBrush = new fabric.CircleBrush(c);
      else c.freeDrawingBrush = new fabric.PencilBrush(c);
      
      c.freeDrawingBrush.width = 10;
      c.freeDrawingBrush.color = "#000000";
    }
  }, []);

  const updateBrush = useCallback((options = {}) => {
    if (!canvasRef.current || !canvasRef.current.freeDrawingBrush) return;
    const brush = canvasRef.current.freeDrawingBrush;
    if (options.color) brush.color = options.color;
    if (options.width) brush.width = parseInt(options.width);
  }, []);

  const updateStroke = useCallback((color, width) => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    if (activeObject) {
      if (activeObject.type === "activeSelection" || activeObject.type === "group") {
        activeObject.getObjects().forEach(obj => {
          if (color !== undefined) obj.set("stroke", color);
          if (width !== undefined) obj.set("strokeWidth", width);
        });
      } else {
        if (color !== undefined) activeObject.set("stroke", color);
        if (width !== undefined) activeObject.set("strokeWidth", width);
      }
      c.renderAll();
    }
  }, []);

  const updateFill = useCallback((color) => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    if (activeObject) {
      if (activeObject.type === "activeSelection" || activeObject.type === "group") {
        activeObject.getObjects().forEach(obj => obj.set("fill", color));
      } else {
        activeObject.set("fill", color);
      }
      c.renderAll();
    }
  }, []);

  const flipObject = useCallback((axis) => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    if (activeObject) {
      if (axis === 'x') {
        activeObject.set("flipX", !activeObject.flipX);
      } else {
        activeObject.set("flipY", !activeObject.flipY);
      }
      c.renderAll();
    }
  }, []);

  const lockObject = useCallback(() => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    if (activeObject) {
      activeObject.set({
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        hasControls: false,
        selectable: true, 
        hoverCursor: 'not-allowed',
        data: { ...activeObject.data, locked: true }
      });
      c.renderAll();
    }
  }, []);

  const unlockObject = useCallback(() => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    if (activeObject) {
      activeObject.set({
        lockMovementX: false,
        lockMovementY: false,
        lockScalingX: false,
        lockScalingY: false,
        lockRotation: false,
        hasControls: true,
        selectable: true,
        hoverCursor: 'move',
        data: { ...activeObject.data, locked: false }
      });
      c.renderAll();
    }
  }, []);

  // Clipboard functionality
  const clipboard = useRef(null);

  const copy = useCallback(async () => {
    if (!canvasRef.current) return;
    const activeObject = canvasRef.current.getActiveObject();
    if (activeObject) {
      const cloned = await activeObject.clone();
      clipboard.current = cloned;
    }
  }, []);

  const paste = useCallback(async () => {
    if (!canvasRef.current || !clipboard.current) return;
    const c = canvasRef.current;
    const clonedObj = await clipboard.current.clone();
    
    c.discardActiveObject();
    clonedObj.set({
      left: clonedObj.left + 20,
      top: clonedObj.top + 20,
      evented: true,
    });
    
    if (clonedObj.type === 'activeSelection') {
      clonedObj.canvas = c;
      clonedObj.forEachObject(obj => c.add(obj));
      clonedObj.setCoords();
    } else {
      c.add(clonedObj);
    }
    
    clipboard.current.top += 20;
    clipboard.current.left += 20;
    c.setActiveObject(clonedObj);
    c.renderAll();
  }, []);

  const getLayers = useCallback(() => {
    if (!canvasRef.current) return [];
    return canvasRef.current.getObjects().map((obj, index) => ({
        id: obj.id || `obj-${index}`,
        type: obj.type,
        preview: obj.toDataURL?.({ width: 50, height: 50 }) || '',
        name: obj.name || `${obj.type} ${index + 1}`
    })).reverse();
  }, []);

  const updateDepth = useCallback((id, direction) => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const objects = c.getObjects();
    const obj = objects.find(o => o.id === id || (`obj-${objects.indexOf(o)}` === id));
    if (!obj) return;

    if (direction === 'up') c.bringObjectForward(obj);
    else if (direction === 'down') c.sendObjectBackwards(obj);
    else if (direction === 'top') c.bringToFront(obj);
    else if (direction === 'bottom') c.sendToBack(obj);
    c.renderAll();
  }, []);

  const moveLayer = useCallback((fromIndex, toIndex) => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const objects = c.getObjects();
    // Invert indices because getLayers() uses .reverse()
    const realFrom = objects.length - 1 - fromIndex;
    const realTo = objects.length - 1 - toIndex;
    
    const obj = objects[realFrom];
    if (obj) {
      obj.moveTo(realTo);
      c.renderAll();
    }
  }, []);

  return { 
    canvas, 
    addShape, 
    addText, 
    addImage, 
    addSVG,
    exportToFile, 
    bringToFront, 
    sendToBack, 
    moveForward, 
    moveBackward, 
    groupObjects, 
    ungroupObjects,
    updateStroke,
    updateFill,
    flipObject,
    lockObject,
    unlockObject,
    toggleDrawingMode,
    updateBrush,
    copy,
    paste,
    getLayers,
    updateDepth,
    moveLayer,
    undo,
    redo
  };
};
