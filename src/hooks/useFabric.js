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

    return () => {
      canvasInstance.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasId]);

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
      default:
        return;
    }

    c.add(shape);
    c.setActiveObject(shape);
    c.renderAll();
  }, []);

  const addText = useCallback((text = "Enter text", options = {}) => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const iText = new fabric.IText(text, {
      left: c.width / 2 - 50,
      top: c.height / 2 - 20,
      fontSize: 24,
      fontFamily: "Outfit",
      fill: "#000000",
      ...options,
    });
    c.add(iText);
    c.setActiveObject(iText);
    c.renderAll();
  }, []);

  const addImage = useCallback((url, options = {}) => {
    if (!canvasRef.current || !url) return;
    const c = canvasRef.current;
    fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
        img.scaleToWidth(200);
        img.set({
            left: c.width / 2 - 100,
            top: c.height / 2 - (img.height * img.scaleY) / 2,
            ...options
        });
        c.add(img);
        c.setActiveObject(img);
        c.renderAll();
    });
  }, []);

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
    if (activeObject && activeObject.type === "activeSelection") {
      activeObject.toGroup();
      c.renderAll();
    }
  }, []);

  const ungroupObjects = useCallback(() => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    if (activeObject && activeObject.type === "group") {
      activeObject.toActiveSelection();
      c.renderAll();
    }
  }, []);

  const updateStroke = useCallback((color, width) => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const activeObject = c.getActiveObject();
    if (activeObject) {
      if (activeObject.type === "activeSelection") {
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
      if (activeObject.type === "activeSelection") {
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

  return { 
    canvas, 
    addShape, 
    addText, 
    addImage, 
    exportToFile, 
    bringToFront, 
    sendToBack, 
    moveForward, 
    moveBackward, 
    groupObjects, 
    ungroupObjects,
    updateStroke,
    updateFill,
    flipObject
  };
};
