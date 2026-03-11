"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Square, 
  Circle, 
  Triangle, 
  Type, 
  Image as ImageIcon, 
  Download, 
  Upload, 
  Layout, 
  Layers, 
  Search, 
  Plus, 
  Trash2, 
  Undo2, 
  Redo2, 
  Maximize2, 
  Minus, 
  PlusCircle, 
  Menu,
  Slash,
  FlipHorizontal,
  FlipVertical,
  Unlock,
  Star,
  Pencil,
  Brush,
  Eraser,
  Paintbrush,
  MousePointer2,
  ChevronUp,
  ChevronDown,
  Hexagon,
  Pentagon,
  Heart,
  Diamond,
  ArrowRight,
  Ban
} from "lucide-react";
import { useFabric } from "@/hooks/useFabric";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function CanvasEditor() {
  const [activePanel, setActivePanel] = useState("elements");
  const [selectedObject, setSelectedObject] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushType, setBrushType] = useState("pencil");
  const [layers, setLayers] = useState([]);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [customFonts, setCustomFonts] = useState(["Inter", "Outfit", "Roboto", "serif"]);
  const fileInputRef = useRef(null);
  const fontInputRef = useRef(null);

  const { 
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
    updateStroke,
    updateFill,
    updateBorderRadius,
    flipObject,
    toggleDrawingMode,
    updateBrush,
    copy,
    paste,
    getLayers,
    updateDepth,
    moveLayer,
    undo,
    redo
  } = useFabric("canvas-editor");

  const deleteSelected = useCallback(() => {
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      canvas.discardActiveObject();
      if (activeObjects.length > 0) {
        canvas.remove(...activeObjects);
      }
      canvas.renderAll();
    }
  }, [canvas]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        copy();
      }
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        paste();
      }
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copy, paste, undo, redo, deleteSelected, canvas]);

  // Sync Layers List
  useEffect(() => {
    if (!canvas) return;
    const sync = () => setLayers(getLayers());
    canvas.on('object:added', sync);
    canvas.on('object:removed', sync);
    canvas.on('object:modified', sync);
    return () => {
        canvas.off('object:added', sync);
        canvas.off('object:removed', sync);
        canvas.off('object:modified', sync);
    };
  }, [canvas, getLayers]);

  const handleFontUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fontName = file.name.split('.')[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const newFont = new FontFace(fontName, `url(${event.target.result})`);
        newFont.load().then((loaded) => {
          document.fonts.add(loaded);
          setCustomFonts(prev => [...prev, fontName]);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!canvas) return;
    
    const handleSelection = (e) => {
      setSelectedObject(canvas.getActiveObject());
    };

    const handleDeselection = () => {
      setSelectedObject(null);
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", handleDeselection);

    return () => {
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared", handleDeselection);
    };
  }, [canvas]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isSVG = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (!result) return;

      const newUpload = {
        id: Date.now(),
        url: result,
        type: isSVG ? 'svg' : 'image',
        name: file.name
      };

      setUploadedFiles(prev => [newUpload, ...prev]);
      
      // Reset input value
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };



  const menuItems = [
    { id: "select_tool", icon: MousePointer2, label: "Select" },
    { id: "elements", icon: Layers, label: "Elements" },
    { id: "text", icon: Type, label: "Text" },
    { id: "draw", icon: Pencil, label: "Draw" },
    { id: "uploads", icon: Upload, label: "Uploads" },
    { id: "layers", icon: Layers, label: "Layers" },
  ];

  const colors = [
    "#000000", "#ffffff", "#f87171", "#fb923c", "#fbbf24", "#34d399", "#22d3ee", "#60a5fa", "#818cf8", "#a78bfa", "#f472b6"
  ];

  const updateColor = (color) => {
    if (selectedObject && canvas) {
      updateFill(color);
      setSelectedObject({ ...selectedObject, fill: color }); // Trigger re-render
    }
  };

  return (
    <div className="flex h-screen bg-[#F0F2F5] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar - Tool Selection */}
      <aside className="w-[72px] bg-[#0F172A] flex flex-col items-center py-6 gap-6 z-30">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-violet-500/30">
          <Menu size={24} />
        </div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === "select_tool") {
                setIsDrawing(false);
                toggleDrawingMode(false);
              } else if (item.id === "layers") {
                setIsLayersOpen(!isLayersOpen);
              } else {
                setActivePanel(item.id);
              }
            }}
            className={cn(
              (activePanel === item.id || (item.id === "select_tool" && !isDrawing) || (item.id === "layers" && isLayersOpen)) ? "text-violet-400" : "text-slate-400 hover:text-white"
            )}
          >
            <div className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              (activePanel === item.id || (item.id === "select_tool" && !isDrawing) || (item.id === "layers" && isLayersOpen)) ? "bg-white/10 shadow-inner" : "group-hover:bg-white/5"
            )}>
              <item.icon size={22} strokeWidth={(activePanel === item.id || (item.id === "select_tool" && !isDrawing) || (item.id === "layers" && isLayersOpen)) ? 2.5 : 2} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
          </button>
        ))}
        
        <div className="mt-auto pb-4">
          <button className="p-3 text-slate-400 hover:text-white transition-colors">
            <PlusCircle size={24} />
          </button>
        </div>
      </aside>

      {/* Detail Panel */}
      <div className="w-80 bg-white border-r border-slate-200 shadow-xl z-20 overflow-y-auto">
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activePanel === "elements" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                key="elements"
                className="space-y-6"
              >
                <div className="flex flex-col gap-4 sticky top-0 bg-white z-10 pb-4 border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Elements</h2>
                    <div className="relative flex-1 ml-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search elements" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-100 rounded-full py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-violet-500 outline-none transition-all border border-transparent focus:bg-white"
                      />
                    </div>
                  </div>
                  
                  {searchQuery && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                       {[
                         { label: 'Shapes', icon: Square },
                         { label: 'Web Photos', icon: ImageIcon },
                         { label: '3D Art', icon: PlusCircle }
                       ].map(cat => (
                         <button 
                           key={cat.label}
                           onClick={() => setSearchQuery(cat.label.toLowerCase())}
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 hover:bg-violet-100 hover:text-violet-700 transition-colors whitespace-nowrap border border-slate-200 shadow-sm"
                         >
                            <cat.icon size={12} />
                            {cat.label}
                         </button>
                       ))}
                    </div>
                  )}
                </div>
                
                {/* Search Results / Content */}
                <div className="space-y-8">
                    <section>
                    <div className="flex items-center justify-between mb-3 border-l-4 border-violet-500 pl-3">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Shapes</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                          { type: 'rect', icon: Square, label: 'Square' },
                          { type: 'circle', icon: Circle, label: 'Circle' },
                          { type: 'ellipse', icon: Circle, label: 'Ellipse' },
                          { type: 'triangle', icon: Triangle, label: 'Triangle' },
                          { type: 'star', icon: Star, label: 'Star' },
                          { type: 'hexagon', icon: Hexagon, label: 'Hexagon' },
                          { type: 'pentagon', icon: Pentagon, label: 'Pentagon' },
                          { type: 'diamond', icon: Diamond, label: 'Diamond' },
                          { type: 'heart', icon: Heart, label: 'Heart' },
                          { type: 'arrow', icon: ArrowRight, label: 'Arrow' },
                          { type: 'rect', icon: Minus, label: 'Line' },
                        ].filter(shape => !searchQuery || shape.label.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((shape, i) => (
                        <button 
                            key={shape.type + i}
                            onClick={() => addShape(shape.type, shape.label === 'Line' ? { height: 2, width: 200, fill: '#000000' } : {})}
                            className="aspect-square rounded-xl bg-slate-50 border border-slate-100 hover:border-violet-400 flex flex-col items-center justify-center hover:bg-white transition-all shadow-sm group"
                            title={shape.label}
                        >
                            <shape.icon size={20} className={cn("text-slate-700 group-hover:text-violet-600 group-hover:scale-110 transition-transform", shape.type === 'diamond' && 'rotate-45')} />
                        </button>
                        ))}
                    </div>
                    </section>

                </div>
              </motion.div>
            )}

            {activePanel === "text" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                key="text"
                className="space-y-6"
              >
                <div className="flex flex-col gap-4 sticky top-0 bg-white z-10 pb-4 border-b border-slate-50">
                  <h2 className="text-xl font-bold">Text</h2>
                      <div className="flex gap-2">
                         <label className="flex-1 bg-violet-50 text-violet-600 p-2 rounded-lg text-xs font-bold text-center cursor-pointer hover:bg-violet-100 transition-colors">
                            Import Font
                            <input type="file" ref={fontInputRef} hidden accept=".ttf,.otf,.woff" onChange={handleFontUpload} />
                         </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <button
                        onClick={() => addText("Heading", { fontSize: 60, fontWeight: "bold" })}
                        className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-violet-500 hover:bg-violet-50 transition-all group"
                      >
                        <h1 className="text-2xl font-bold group-hover:text-violet-600">Add a Heading</h1>
                      </button>
                      <button
                        onClick={() => addText("Subheading", { fontSize: 32, fontWeight: "medium" })}
                        className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-violet-500 hover:bg-violet-50 transition-all group"
                      >
                        <h2 className="text-xl font-medium group-hover:text-violet-600">Add a Subheading</h2>
                      </button>
                      <button
                        onClick={() => addText("Body text", { fontSize: 18 })}
                        className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-violet-500 hover:bg-violet-50 transition-all group"
                      >
                        <p className="text-sm group-hover:text-violet-600">Add body text</p>
                      </button>
                    </div>
              </motion.div>
            )}

            {activePanel === "draw" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                key="draw"
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Creative Drawing</h2>
                  <div className={cn(
                    "w-3 h-3 rounded-full animate-pulse",
                    isDrawing ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-slate-200"
                  )} />
                </div>

                <div className="p-1 bg-slate-100 rounded-2xl flex">
                  <button 
                    onClick={() => {
                        setIsDrawing(true);
                        toggleDrawingMode(true, "pencil");
                        setBrushType("pencil");
                    }}
                    className={cn(
                        "flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all",
                        isDrawing && brushType === "pencil" ? "bg-white shadow-sm text-violet-600" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <Pencil size={20} />
                    <span className="text-[10px] font-bold uppercase">Pencil</span>
                  </button>
                  <button 
                    onClick={() => {
                        setIsDrawing(true);
                        toggleDrawingMode(true, "spray");
                        setBrushType("spray");
                    }}
                    className={cn(
                        "flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all",
                        isDrawing && brushType === "spray" ? "bg-white shadow-sm text-violet-600" : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <Brush size={20} />
                    <span className="text-[10px] font-bold uppercase">Sketch</span>
                  </button>
                  <button 
                    onClick={() => {
                        setIsDrawing(false);
                        toggleDrawingMode(false);
                        setBrushType("");
                    }}
                    className={cn(
                        "flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all text-slate-500 hover:text-red-500",
                        !isDrawing ? "bg-white shadow-sm" : ""
                    )}
                  >
                    <PlusCircle size={20} className="rotate-45" />
                    <span className="text-[10px] font-bold uppercase">Select</span>
                  </button>
                </div>

                {isDrawing && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <section>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Brush Style</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'pencil', label: 'Classic', icon: Pencil },
                          { id: 'spray', label: 'Airbrush', icon: Brush },
                          { id: 'circle', label: 'Bubble', icon: Circle }
                        ].map(type => (
                          <button
                            key={type.id}
                            onClick={() => {
                                setBrushType(type.id);
                                toggleDrawingMode(true, type.id);
                            }}
                            className={cn(
                              "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                              brushType === type.id ? "border-violet-600 bg-violet-50 text-violet-600 shadow-lg" : "border-slate-100 hover:border-slate-200"
                            )}
                          >
                            <type.icon size={24} />
                            <span className="text-[10px] font-bold">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ink Color</h3>
                      <div className="grid grid-cols-6 gap-2">
                        {colors.map(color => (
                          <button 
                            key={color}
                            onClick={() => updateBrush({ color })}
                            className="w-full aspect-square rounded-full border border-slate-100 hover:scale-110 shadow-sm transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </section>

                    <section>
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ink Thickness</h3>
                         <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 tracking-tighter">XL PRO</span>
                       </div>
                       <input 
                         type="range" 
                         min="1" max="100" 
                         defaultValue="10"
                         onChange={(e) => updateBrush({ width: e.target.value })}
                         className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
                       />
                    </section>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl">
                       <p className="text-xs font-bold opacity-80 mb-1">PRO TIP</p>
                       <p className="text-sm font-medium">Use the <span className="underline">Sketch brush</span> for a spray-paint effect, best for creative backgrounds!</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activePanel === "uploads" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                key="uploads"
                className="space-y-6"
              >
                <div className="flex flex-col gap-4 sticky top-0 bg-white z-10 pb-4 border-b border-slate-50">
                  <h2 className="text-xl font-bold">Uploads</h2>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-tight">Your Media Library</p>
                </div>

                <div className="space-y-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative cursor-pointer"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative px-6 py-10 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 group-hover:border-violet-400 transition-colors">
                      <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700">Upload Media</p>
                        <p className="text-[10px] text-slate-400 mt-1">Images or SVG files supported</p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        hidden 
                        accept="image/*,.svg" 
                        onChange={handleFileUpload} 
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-l-4 border-indigo-500 pl-3">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Uploads</h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{uploadedFiles.length} items</span>
                    </div>

                    {uploadedFiles.length === 0 ? (
                      <div className="py-20 text-center space-y-3 opacity-40">
                        <div className="w-12 h-12 border-2 border-slate-200 rounded-full flex items-center justify-center mx-auto">
                          <ImageIcon size={20} className="text-slate-300" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Library is empty</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {uploadedFiles.map((file) => (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={file.id}
                            onClick={() => {
                              if (file.type === 'svg') addSVG(file.url);
                              else addImage(file.url);
                            }}
                            className="aspect-square rounded-xl bg-slate-50 border border-slate-100 hover:border-violet-400 overflow-hidden relative group shadow-sm transition-all"
                          >
                            <img src={file.url} className="w-full h-full object-contain p-2" alt={file.name} />
                            <div className="absolute inset-0 bg-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Plus className="text-violet-600 bg-white p-1 rounded-full shadow-lg" size={24} />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}


          </AnimatePresence>
        </div>
      </div>

      {/* Removed old placeholder */}

      {/* Main Content */}
      <main className="flex-1 flex relative overflow-hidden bg-[#F1F5F9]">
        <div className="flex-1 flex flex-col items-center">
            {/* Top Header */}
            <header className="w-full h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
               <div className="flex items-center gap-4">
                 <span className="font-bold text-slate-700">Project Canvas</span>
                 <div className="flex items-center bg-slate-100 rounded-lg p-1">
                    <button className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-500 transition-all" onClick={undo}><Undo2 size={16}/></button>
                    <button className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-500 transition-all" onClick={redo}><Redo2 size={16}/></button>
                 </div>
               </div>

               <div className="flex items-center gap-4">
                 <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 gap-2">
                    <button onClick={() => setZoom(prev => Math.max(10, prev - 10))} className="p-1 hover:bg-white rounded shadow-sm text-slate-400 hover:text-violet-600"><Minus size={14}/></button>
                    <span className="text-[10px] font-black w-10 text-center tracking-tighter">{zoom}%</span>
                    <button onClick={() => setZoom(prev => Math.min(200, prev + 10))} className="p-1 hover:bg-white rounded shadow-sm text-slate-400 hover:text-violet-600"><Plus size={14}/></button>
                 </div>
                 <div className="relative">
                   <button 
                     onClick={() => setIsExportOpen(!isExportOpen)} 
                     className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-500/30 flex items-center gap-2"
                   >
                      <Download size={14}/> Export
                   </button>

                   <AnimatePresence>
                     {isExportOpen && (
                       <>
                         <div 
                           className="fixed inset-0 z-40" 
                           onClick={() => setIsExportOpen(false)} 
                         />
                         <motion.div
                           initial={{ opacity: 0, y: 10, scale: 0.95 }}
                           animate={{ opacity: 1, y: 0, scale: 1 }}
                           exit={{ opacity: 0, y: 10, scale: 0.95 }}
                           className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 overflow-hidden"
                         >
                            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                               Choose Format
                            </div>
                            {[
                              { id: 'png', label: 'PNG Image', desc: 'Best for web & shared', icon: ImageIcon, color: 'text-blue-500' },
                              { id: 'svg', label: 'SVG Vector', desc: 'Scalable graphics', icon: Layers, color: 'text-orange-500' },
                              { id: 'jpeg', label: 'JPEG Photo', desc: 'Smaller file size', icon: ImageIcon, color: 'text-green-500' }
                            ].map((format) => (
                              <button
                                key={format.id}
                                onClick={() => {
                                  exportToFile(format.id);
                                  setIsExportOpen(false);
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all group"
                              >
                                <div className={cn("p-2 rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all", format.color)}>
                                  <format.icon size={16} />
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-slate-700">{format.label}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{format.desc}</p>
                                </div>
                              </button>
                            ))}
                         </motion.div>
                       </>
                     )}
                   </AnimatePresence>
                 </div>
               </div>
            </header>

            {/* Canvas Container */}
            <div className="flex-1 w-full relative overflow-auto flex items-center justify-center p-20 scrollbar-hide">
              <div 
                className="bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] transition-all duration-300 transform-gpu"
                style={{
                  width: "800px",
                  height: "600px",
                  minWidth: "800px",
                  minHeight: "600px",
                  zoom: zoom / 100,
                  transformOrigin: "center center"
                }}
              >
                <canvas id="canvas-editor" />
              </div>
            </div>

             {/* Compact Floating Toolbar */}
             {selectedObject && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                onMouseDown={(e) => { e.stopPropagation(); if(e.nativeEvent) e.nativeEvent.stopImmediatePropagation(); }}
                onPointerDown={(e) => { e.stopPropagation(); if(e.nativeEvent) e.nativeEvent.stopImmediatePropagation(); }}
                onMouseUp={(e) => { e.stopPropagation(); if(e.nativeEvent) e.nativeEvent.stopImmediatePropagation(); }}
                onClick={(e) => { e.stopPropagation(); if(e.nativeEvent) e.nativeEvent.stopImmediatePropagation(); }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 px-3 py-2 bg-white/98 backdrop-blur-3xl border border-slate-200/60 rounded-[28px] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.12)] flex items-center gap-2.5 z-40"
              >
                  {/* Section 1: Colors */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex flex-col items-center gap-0.5 group relative">
                        <div className="w-9 h-9 rounded-full border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] cursor-pointer overflow-hidden ring-1 ring-slate-100" style={{ background: selectedObject.fill }}>
                           <input 
                             type="color" 
                             value={selectedObject.fill === 'transparent' ? '#ffffff' : selectedObject.fill}
                             onChange={(e) => updateFill(e.target.value)}
                             className="opacity-0 w-full h-full cursor-pointer"
                           />
                        </div>
                        <span className="text-[7px] font-black uppercase text-slate-400">Fill</span>
                    </div>

                    <button 
                      onClick={() => {
                        updateFill('transparent');
                        if (!selectedObject.stroke || selectedObject.stroke === 'transparent' || (selectedObject.strokeWidth || 0) === 0) {
                          updateStroke('#333333', 1.5);
                        }
                      }}
                      className="p-1.5 hover:bg-slate-50 rounded-xl transition-all flex flex-col items-center gap-0.5"
                    >
                        <Ban size={14} className="text-red-400" />
                        <span className="text-[7px] font-black uppercase text-slate-400">None</span>
                    </button>

                    <div className="flex flex-col items-center gap-0.5">
                        <div className="w-9 h-9 rounded-full border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] cursor-pointer overflow-hidden flex items-center justify-center bg-slate-50 ring-1 ring-slate-100" style={{ borderColor: selectedObject.stroke || '#ddd' }}>
                             <input 
                               type="color" 
                               value={selectedObject.stroke || '#000000'}
                               onChange={(e) => {
                                   const color = e.target.value;
                                   updateStroke(color, selectedObject.strokeWidth || 1.5);
                                   setSelectedObject(prev => ({ ...prev, stroke: color }));
                               }}
                               className="opacity-0 w-full h-full cursor-pointer"
                             />
                        </div>
                        <span className="text-[7px] font-black uppercase text-slate-400">Border</span>
                    </div>
                  </div>

                  <div className="w-[1px] h-10 bg-slate-100/80 mx-1" />

                  {/* Section 2: Precise Adjustments */}
                  <div className="flex items-center gap-4 bg-slate-50/60 px-3 py-1.5 rounded-[20px] border border-slate-100/50">
                    <div className="flex flex-col gap-1 w-16">
                        <div className="flex items-center justify-between px-0.5">
                            <span className="text-[7px] font-black uppercase text-slate-400">Weight</span>
                            <span className="text-[7px] font-bold text-violet-600 font-mono">{Math.round(selectedObject.strokeWidth || 0)}</span>
                        </div>
                        <input 
                          type="range" min="0" max="20" step="0.5"
                          value={selectedObject.strokeWidth || 0}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onChange={(e) => {
                              const width = parseFloat(e.target.value);
                              updateStroke(selectedObject.stroke, width);
                              setSelectedObject(prev => ({ ...prev, strokeWidth: width }));
                          }}
                          className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-violet-600 slider-thumb-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-1 w-16 border-l border-slate-200/60 pl-3">
                        <div className="flex items-center justify-between px-0.5">
                            <span className="text-[7px] font-black uppercase text-slate-400">Radius</span>
                            <span className="text-[7px] font-bold text-violet-600 font-mono">{Math.round(selectedObject.rx || 0)}</span>
                        </div>
                        <input 
                            type="range" min="0" max="50" step="1"
                            value={selectedObject.rx || 0}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onChange={(e) => {
                                const r = parseInt(e.target.value);
                                updateBorderRadius(r);
                                setSelectedObject(prev => ({ ...prev, rx: r, ry: r }));
                            }}
                            className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-violet-600 slider-thumb-sm"
                        />
                    </div>

                    {selectedObject.type === 'i-text' && (
                       <div className="flex flex-col gap-1 w-20 border-l border-slate-200/60 pl-3">
                         <span className="text-[7px] font-black uppercase text-slate-400">Text Size</span>
                         <div className="flex items-center justify-between bg-white rounded-lg px-2 py-0.5 ring-1 ring-slate-200/50">
                            <Minus size={8} className="text-slate-400 cursor-pointer hover:text-violet-600" onClick={() => {
                                const news = Math.max(1, (selectedObject.fontSize || 20) - 2);
                                selectedObject.set('fontSize', news);
                                canvas.renderAll();
                                setSelectedObject(prev => ({...prev, fontSize: news}));
                            }}/>
                            <span className="text-[9px] font-bold text-slate-700">{Math.round(selectedObject.fontSize)}</span>
                            <Plus size={8} className="text-slate-400 cursor-pointer hover:text-violet-600" onClick={() => {
                                const news = (selectedObject.fontSize || 20) + 2;
                                selectedObject.set('fontSize', news);
                                canvas.renderAll();
                                setSelectedObject(prev => ({...prev, fontSize: news}));
                            }}/>
                         </div>
                       </div>
                    )}
                  </div>

                  <div className="w-[1px] h-10 bg-slate-100/80 mx-1" />

                  {/* Section 3: Hierarchy & Actions */}
                  <div className="flex items-center gap-1.5 px-2">
                    {[
                      { icon: ChevronUp, label: 'Front', action: bringToFront, color: 'text-violet-600' },
                      { icon: ChevronDown, label: 'Back', action: sendToBack, color: 'text-violet-600' },
                    ].map((item, idx) => (
                      <button 
                        key={idx} 
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          item.action();
                        }}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-all flex flex-col items-center gap-0.5 group"
                      >
                        <item.icon size={16} className={item.color} />
                        <span className="text-[7px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-slate-600">{item.label}</span>
                      </button>
                    ))}

                    <div className="w-[1px] h-8 bg-slate-100/80 mx-2" />

                    <button 
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        deleteSelected();
                      }}
                      className="p-2 hover:bg-red-50 rounded-xl transition-all flex flex-col items-center gap-0.5 group"
                    >
                        <Trash2 size={16} className="text-red-400 group-hover:text-red-600" />
                        <span className="text-[7px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-red-500">Delete</span>
                    </button>
                  </div>
              </motion.div>
            )}
        </div>

        {/* Right Sidebar - Layers (Only Show when isLayersOpen is true) */}
        <AnimatePresence>
          {isLayersOpen && (
            <motion.aside 
              initial={{ x: 260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 260, opacity: 0 }}
              className="w-64 bg-white border-l border-slate-200 flex flex-col z-30 shadow-2xl relative"
            >
               <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Layers</h2>
                  <button onClick={() => setIsLayersOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                     <Plus size={18} className="rotate-45" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                  {layers.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-300 gap-2 opacity-50">
                       <Layers size={32} />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-center">Empty Canvas</span>
                    </div>
                  ) : (
                    layers.map((layer, i) => (
                        <motion.div 
                          key={layer.id}
                          layout
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("fromIndex", i);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            const from = e.dataTransfer.getData("fromIndex");
                            moveLayer(parseInt(from), i);
                          }}
                          className={cn(
                            "p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-grab active:cursor-grabbing group bg-white",
                            selectedObject?.id === layer.id ? "border-violet-500 bg-violet-50/50 shadow-md" : "border-slate-50 hover:bg-slate-50"
                          )}
                          onClick={() => {
                              const obj = canvas.getObjects().find(o => o.id === layer.id || (`obj-${canvas.getObjects().indexOf(o)}` === layer.id));
                              if (obj) {
                                  canvas.setActiveObject(obj);
                                  canvas.renderAll();
                              }
                          }}
                        >
                           <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm pointer-events-none">
                              {layer.preview ? <img src={layer.preview} className="max-w-full max-h-full object-contain" alt="" /> : <div className="text-slate-300"><ImageIcon size={16}/></div>}
                           </div>
                           <div className="flex-1 min-w-0 pointer-events-none">
                              <p className="text-[10px] font-black uppercase text-slate-400 leading-tight truncate">{layer.type}</p>
                              <p className="text-xs font-bold text-slate-800 truncate">{layer.name}</p>
                           </div>
                           
                           {/* Layer Control Buttons & Drag Handle */}
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex flex-col gap-0.5">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateDepth(layer.id, 'up'); }}
                                  className="p-1 hover:bg-white rounded text-slate-400 hover:text-violet-600 transition-all border border-transparent hover:border-slate-100"
                                >
                                  <ChevronUp size={12}/>
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateDepth(layer.id, 'down'); }}
                                  className="p-1 hover:bg-white rounded text-slate-400 hover:text-violet-600 transition-all border border-transparent hover:border-slate-100"
                                >
                                  <ChevronDown size={12}/>
                                </button>
                              </div>
                              <div className="flex flex-col gap-1 text-slate-300 ml-1">
                                <div className="w-3 h-[1px] bg-current rounded-full" />
                                <div className="w-3 h-[1px] bg-current rounded-full" />
                                <div className="w-3 h-[1px] bg-current rounded-full" />
                              </div>
                           </div>
                        </motion.div>
                    ))
                  )}
               </div>

               <div className="p-6 mt-auto bg-slate-50/50 border-t border-slate-100">
                  <div className="p-4 rounded-2xl bg-[#0F172A] text-white shadow-xl relative overflow-hidden group">
                      <div className="relative z-10">
                         <p className="text-[10px] font-black opacity-80 mb-1 tracking-widest text-violet-400">LAYER SYSTEM</p>
                         <p className="text-[10px] text-slate-400 leading-relaxed">Drag and drop layers to change their stacking order.</p>
                      </div>
                  </div>
               </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
