"use client";

import { useState, useRef, useEffect } from "react";
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
  Group,
  Ungroup,
  Slash,
  FlipHorizontal,
  FlipVertical
} from "lucide-react";
import { useFabric } from "@/hooks/useFabric";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function CanvasEditor() {
  const [activePanel, setActivePanel] = useState("elements");
  const [selectedObject, setSelectedObject] = useState(null);
  const [zoom, setZoom] = useState(100);
  const fileInputRef = useRef(null);

  const { 
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
  } = useFabric("canvas-editor");

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
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (f) => {
        addImage(f.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteSelected = () => {
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      canvas.discardActiveObject();
      if (activeObjects.length > 0) {
        canvas.remove(...activeObjects);
      }
      canvas.renderAll();
    }
  };

  const menuItems = [
    { id: "templates", icon: Layout, label: "Templates" },
    { id: "elements", icon: Layers, label: "Elements" },
    { id: "text", icon: Type, label: "Text" },
    { id: "uploads", icon: Upload, label: "Uploads" },
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
            onClick={() => setActivePanel(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 group transition-all duration-200",
              activePanel === item.id ? "text-violet-400" : "text-slate-400 hover:text-white"
            )}
          >
            <div className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              activePanel === item.id ? "bg-white/10 shadow-inner" : "group-hover:bg-white/5"
            )}>
              <item.icon size={22} strokeWidth={activePanel === item.id ? 2.5 : 2} />
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Elements</h2>
                  <div className="relative flex-1 ml-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search elements" 
                      className="w-full bg-slate-100 rounded-full py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <section>
                  <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Recently used</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                      { icon: Square, fill: '#1e293b' },
                      { icon: Circle, fill: '#334155' }
                    ].map((item, i) => (
                      <button 
                        key={i}
                        onClick={() => addShape(item.icon === Square ? 'rect' : 'circle', { fill: item.fill })}
                        className="w-16 h-16 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors shadow-sm"
                      >
                         <item.icon size={24} style={{ color: item.fill }} fill={item.fill} />
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Shapes</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: 'rect', icon: Square, label: 'Square' },
                      { type: 'circle', icon: Circle, label: 'Circle' },
                      { type: 'triangle', icon: Triangle, label: 'Triangle' },
                    ].map((shape) => (
                      <button 
                        key={shape.type}
                        onClick={() => addShape(shape.type)}
                        className="aspect-square rounded-xl border-2 border-slate-50 hover:border-violet-500 flex flex-col items-center justify-center gap-2 hover:bg-violet-50 transition-all group shadow-sm bg-slate-50/50"
                      >
                        <shape.icon size={24} className="text-slate-700 group-hover:text-violet-600" />
                        <span className="text-[10px] font-bold text-slate-500">{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Outlined Shapes</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: 'rect', icon: Square, label: 'Border Rect' },
                      { type: 'circle', icon: Circle, label: 'Border Circle' },
                      { type: 'triangle', icon: Triangle, label: 'Border Tri' },
                    ].map((shape) => (
                      <button 
                        key={shape.type}
                        onClick={() => addShape(shape.type, { fill: 'transparent', stroke: '#000000', strokeWidth: 2 })}
                        className="aspect-square rounded-xl border-2 border-slate-50 hover:border-violet-500 flex flex-col items-center justify-center gap-2 hover:bg-violet-50 transition-all group shadow-sm bg-white"
                      >
                        <shape.icon size={24} className="text-slate-700 group-hover:text-violet-600" />
                        <span className="text-[10px] font-bold text-slate-500">{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Graphics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-square rounded-xl bg-slate-100 border border-slate-200 cursor-pointer overflow-hidden relative group">
                        <img 
                          src={`https://api.dicebear.com/7.x/shapes/svg?seed=${i+100}`} 
                          alt="Graphic" 
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                          onClick={() => addImage(`https://api.dicebear.com/7.x/shapes/svg?seed=${i+100}`, { width: 150 })}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                   <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">3D Illustrations</h3>
                   <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="aspect-video rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 border border-indigo-100 cursor-pointer overflow-hidden relative group flex items-center justify-center shadow-sm">
                        <img 
                          src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${i+50}`} 
                          alt="3D Illustration" 
                          className="w-16 h-16 group-hover:scale-125 transition-transform duration-500"
                          onClick={() => addImage(`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${i+50}`, { scaleX: 1.5, scaleY: 1.5 })}
                        />
                         <span className="absolute bottom-1 right-2 text-[8px] font-black text-indigo-400 uppercase">3D</span>
                      </div>
                    ))}
                  </div>
                </section>
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
                <h2 className="text-xl font-bold mb-4">Add Text</h2>
                <div className="space-y-3">
                  <button 
                    onClick={() => addText("Add a heading", { fontSize: 48, fontWeight: 'bold' })}
                    className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-violet-500 text-left hover:bg-violet-50 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <h1 className="text-2xl font-bold">Heading</h1>
                    <Plus size={18} className="text-slate-300 group-hover:text-violet-500" />
                  </button>
                  <button 
                    onClick={() => addText("Add a subheading", { fontSize: 24, fontWeight: 'semibold' })}
                    className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-violet-500 text-left hover:bg-violet-50 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <h2 className="text-lg font-semibold text-slate-700">Subheading</h2>
                    <Plus size={18} className="text-slate-300 group-hover:text-violet-500" />
                  </button>
                  <button 
                    onClick={() => addText("Add a little bit of body text", { fontSize: 16 })}
                    className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-violet-500 text-left hover:bg-violet-50 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <p className="text-sm text-slate-500">Body text</p>
                    <Plus size={18} className="text-slate-300 group-hover:text-violet-500" />
                  </button>
                </div>

                <div className="pt-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Featured Font Combinations</h3>
                  <div className="grid grid-cols-1 gap-4">
                     {[
                        { title: 'BRIGHT', sub: 'Future', color: 'from-amber-400 to-orange-500' },
                        { title: 'CREATIVE', sub: 'Studio', color: 'from-fuchsia-500 to-purple-600' }
                     ].map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            addText(item.title, { fontSize: 60, fill: '#ff0000', fontWeight: 'bold' });
                            addText(item.sub, { fontSize: 32, top: 200 });
                          }}
                          className={`p-6 rounded-2xl bg-gradient-to-r ${item.color} text-white cursor-pointer hover:scale-[1.02] transition-transform shadow-lg`}
                        >
                           <p className="text-2xl font-black tracking-tighter uppercase leading-none">{item.title}</p>
                           <p className="text-sm font-medium opacity-90">{item.sub}</p>
                        </div>
                     ))}
                  </div>
                </div>
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
                <h2 className="text-xl font-bold mb-4">Your Uploads</h2>
                <label className="w-full p-10 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-violet-500 hover:bg-violet-50/50 transition-all group bg-slate-50/50">
                  <div className="p-4 bg-violet-600 rounded-2xl shadow-lg shadow-violet-200 text-white group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-700 uppercase text-xs tracking-widest mb-1">Click to browse</p>
                    <p className="text-sm text-slate-500">Images or SVG</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              </motion.div>
            )}

            {activePanel === "templates" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                key="templates"
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-xl font-bold">Templates</h2>
                   <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div 
                      key={i} 
                      className="aspect-[3/4] rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:ring-4 hover:ring-violet-500/20 hover:border-violet-500 transition-all shadow-md relative group"
                      onClick={() => {
                        addImage(`https://picsum.photos/seed/bg${i}/800/600`);
                      }}
                    >
                      <img 
                        src={`https://picsum.photos/seed/template${i}/300/400`} 
                        alt="Template" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[10px] text-white font-bold bg-violet-600 px-2 py-1 rounded-full shadow-lg">USE READY</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-100">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 mr-4">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                   <Plus size={18} />
                </div>
                <span className="font-bold text-slate-700">Project Workspace</span>
             </div>
            <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 bg-violet-100 text-violet-700 rounded-md">Pro Editor</span>
            <div className="w-[1px] h-6 bg-slate-200 mx-2" />
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
              <Undo2 size={18} />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
              <Redo2 size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-full px-4 py-1.5 mr-4 gap-4 border border-slate-200 shadow-sm transition-all hover:bg-slate-50">
              <button onClick={() => setZoom(prev => Math.max(10, prev - 10))} className="text-slate-500 hover:text-slate-900"><Minus size={16}/></button>
              <span className="text-xs font-bold w-10 text-center">{zoom}%</span>
              <button onClick={() => setZoom(prev => Math.min(200, prev + 10))} className="text-slate-500 hover:text-slate-900"><Plus size={16}/></button>
            </div>
            
            <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button 
                onClick={() => exportToFile("png")}
                className="px-4 py-2 text-sm font-bold border-r border-slate-100 hover:bg-slate-50 flex items-center gap-2 group transition-colors"
                title="Download as PNG"
              >
                <Download size={18} className="text-violet-600 group-hover:scale-110 transition-transform" />
                <span>PNG</span>
              </button>
              <button 
                onClick={() => exportToFile("svg")}
                className="px-4 py-2 text-sm font-bold border-slate-100 hover:bg-slate-50 flex items-center gap-2 group transition-colors"
                title="Download as SVG"
              >
                <Download size={18} className="text-violet-600 group-hover:scale-110 transition-transform" />
                <span>SVG</span>
              </button>
            </div>
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-12 flex items-center justify-center relative scrollbar-hide">
          <div className="relative group/canvas">
            <div className="canvas-container bg-white shadow-2xl overflow-hidden border border-slate-100 p-1">
              <canvas id="canvas-editor" />
            </div>
            
            {/* Quick Actions (Appear when hover canvas) */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/95 text-white p-2.5 rounded-2xl shadow-2xl opacity-0 group-hover/canvas:opacity-100 border border-white/20 backdrop-blur-xl transition-all duration-300 transform scale-95 group-hover/canvas:scale-100 z-50">
               <button 
                 onClick={deleteSelected} 
                 className="px-4 py-2 hover:bg-red-600/30 text-red-400 rounded-xl transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-red-500/50 shadow-lg shadow-red-500/10"
               >
                 <Trash2 size={16} />
                 Delete Object
               </button>
               <div className="w-[1px] h-4 bg-white/20 mx-1" />
               <button onClick={bringToFront} className="p-2 hover:bg-white/10 rounded-lg transition-colors group/tool" title="Bring to Front">
                 <Layers size={16} className="text-slate-300 group-hover/tool:text-white" />
               </button>
               <button onClick={sendToBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors group/tool" title="Send to Back">
                 <Layers size={16} className="rotate-180 text-slate-300 group-hover/tool:text-white" />
               </button>
            </div>
          </div>
          
          {/* Dynamic Grid Background Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ 
            backgroundImage: 'radial-gradient(#000 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} />
        </div>

        {/* Floating Contextual Toolbar */}
        {selectedObject && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-2xl rounded-3xl p-3 flex items-center gap-4 z-40 transition-all border-b-4 border-b-violet-500"
          >
             <div className="flex items-center gap-2 px-2">
                 <div className="flex gap-1.5">
                    {colors.map(color => (
                        <button 
                            key={color}
                            onClick={() => updateColor(color)}
                            className={cn(
                                "w-6 h-6 rounded-full border border-slate-100 hover:scale-110 transition-transform",
                                selectedObject.fill === color ? "ring-2 ring-violet-500 ring-offset-2" : ""
                            )}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                 </div>
             </div>
             <div className="w-[1px] h-8 bg-slate-200" />
             <div className="flex items-center gap-2 px-2">
                  <button 
                    onClick={bringToFront}
                    className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors flex flex-col items-center gap-1 group"
                    title="Bring to Front"
                  >
                      <Layers size={18} className="text-slate-600 group-hover:text-violet-600 font-bold" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Front</span>
                  </button>
                  <button 
                    onClick={moveForward}
                    className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors flex flex-col items-center gap-1 group"
                    title="Move Forward"
                  >
                      <Layers size={18} className="text-slate-600 group-hover:text-violet-600 opacity-70" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Forward</span>
                  </button>
                  <button 
                    onClick={moveBackward}
                    className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors flex flex-col items-center gap-1 group"
                    title="Move Backward"
                  >
                      <Layers size={18} className="text-slate-600 group-hover:text-violet-600 rotate-180 opacity-70" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Backward</span>
                  </button>
                  <button 
                    onClick={sendToBack}
                    className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors flex flex-col items-center gap-1 group"
                    title="Send to Back"
                  >
                      <Layers size={18} className="text-slate-600 group-hover:text-violet-600 rotate-180 font-bold" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Back</span>
                  </button>
                  
                  <div className="w-[1px] h-8 bg-slate-200 mx-2" />
                  
                  {/* Border Controls */}
                  <div className="flex flex-col gap-1 px-2 min-w-[120px] border-r border-slate-100 pr-4">
                     <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Border</span>
                        <div className="flex gap-1">
                           {['#000000', '#f87171', '#60a5fa', '#34d399'].map(color => (
                              <button 
                                 key={color}
                                 onClick={() => updateStroke(color, (selectedObject.strokeWidth > 0 ? selectedObject.strokeWidth : 2))}
                                 className="w-3.5 h-3.5 rounded-full border border-slate-200 hover:scale-125 transition-transform"
                                 style={{ backgroundColor: color }}
                              />
                           ))}
                        </div>
                     </div>
                     <input 
                        type="range" 
                        min="0" 
                        max="20" 
                        step="1"
                        value={selectedObject.strokeWidth || 0}
                        onChange={(e) => updateStroke(selectedObject.stroke || '#000000', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600"
                     />
                  </div>

                  {/* Fill Toggle */}
                  <button 
                    onClick={() => updateFill(selectedObject.fill === 'transparent' ? '#8b5cf6' : 'transparent')}
                    className={cn(
                        "p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 group/fill",
                        selectedObject.fill === 'transparent' ? "bg-violet-50 text-violet-600" : "hover:bg-slate-50 text-slate-600"
                    )}
                    title={selectedObject.fill === 'transparent' ? "Add Interior Color" : "Remove Interior Color (Border Only)"}
                  >
                      <Slash size={18} className={cn(selectedObject.fill === 'transparent' ? "text-violet-600 shrink-0" : "text-slate-400 group-hover/fill:text-red-500")} />
                      <span className="text-[8px] font-bold uppercase">{selectedObject.fill === 'transparent' ? "Add Fill" : "No Fill"}</span>
                  </button>

                  <div className="w-[1px] h-8 bg-slate-200 mx-2" />
                  
                  {/* Flip Controls */}
                  <div className="flex gap-1 border-r border-slate-100 pr-2">
                      <button 
                        onClick={() => flipObject('x')}
                        className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors flex flex-col items-center gap-1 group/flip"
                        title="Flip Horizontal"
                      >
                          <FlipHorizontal size={18} className="text-slate-400 group-hover/flip:text-violet-600" />
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Flip H</span>
                      </button>
                      <button 
                        onClick={() => flipObject('y')}
                        className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors flex flex-col items-center gap-1 group/flip"
                        title="Flip Vertical"
                      >
                          <FlipVertical size={18} className="text-slate-400 group-hover/flip:text-violet-600" />
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Flip V</span>
                      </button>
                  </div>

                  {selectedObject.type === "activeSelection" && (
                    <button 
                      onClick={groupObjects}
                      className="p-2.5 hover:bg-violet-50 rounded-xl transition-colors flex flex-col items-center gap-1 group/btn"
                      title="Group Objects"
                    >
                        <Group size={18} className="text-violet-600 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[8px] font-bold text-violet-400 uppercase">Group</span>
                    </button>
                 )}

                 {selectedObject.type === "group" && (
                    <button 
                      onClick={ungroupObjects}
                      className="p-2.5 hover:bg-orange-50 rounded-xl transition-colors flex flex-col items-center gap-1 group/btn"
                      title="Ungroup Objects"
                    >
                        <Ungroup size={18} className="text-orange-600 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[8px] font-bold text-orange-400 uppercase">Ungroup</span>
                    </button>
                 )}

                <div className="w-[1px] h-6 bg-slate-100 mx-1" />
                <button onClick={deleteSelected} className="p-2.5 hover:bg-red-50 rounded-xl transition-colors flex flex-col items-center gap-1 group">
                    <Trash2 size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-bold text-red-500 uppercase">Delete</span>
                </button>
             </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
