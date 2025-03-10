"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"
import { useTheme } from "next-themes"
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StructDiagramProps {
  structs: any[]
}

export default function StructDiagram({ structs }: StructDiagramProps) {
  const [diagramId] = useState(`mermaid-${Math.random().toString(36).substring(2, 11)}`)
  const containerRef = useRef<HTMLDivElement>(null)
  const diagramContainerRef = useRef<HTMLDivElement>(null)
  const [diagramSvg, setDiagramSvg] = useState<string>("")
  const { theme } = useTheme()
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialRender, setInitialRender] = useState(true)
  const maxZoom = 5 // Increased max zoom to 500%

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "loose",
    })

    if (structs.length > 0) {
      generateDiagram()
    }
  }, [structs, theme]) // Re-render when theme changes

  // Effect to optimize diagram size after initial render
  useEffect(() => {
    if (diagramSvg && initialRender && diagramContainerRef.current && containerRef.current) {
      optimizeDiagramSize()
      setInitialRender(false)
    }
  }, [diagramSvg, initialRender])

  const optimizeDiagramSize = () => {
    if (!diagramContainerRef.current || !containerRef.current) return

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const diagramWidth = diagramContainerRef.current.scrollWidth
    const diagramHeight = diagramContainerRef.current.scrollHeight

    // Calculate optimal scale to fill the container better
    // Use a higher fill ratio (0.9 = 90% of container)
    const fillRatio = 0.9
    const scaleX = (containerWidth * fillRatio) / diagramWidth
    const scaleY = (containerHeight * fillRatio) / diagramHeight

    // Use the smaller scale to ensure the diagram fits in both dimensions
    // But don't scale down if the diagram is already smaller than the container
    const optimalScale = Math.min(scaleX, scaleY)

    // Only scale up if diagram is smaller than container
    if ((diagramWidth < containerWidth * 0.8 && diagramHeight < containerHeight * 0.8) || optimalScale > 1) {
      setZoomLevel(optimalScale)
    } else if (optimalScale < 0.5) {
      // If diagram is very large, set a minimum scale
      setZoomLevel(0.5)
    } else {
      setZoomLevel(optimalScale)
    }

    // Center the diagram
    setPosition({ x: 0, y: 0 })
  }

  const generateDiagram = async () => {
    if (!containerRef.current || structs.length === 0) return

    // Create a mapping of struct names to their fields
    const structMap = new Map()
    structs.forEach((struct) => {
      structMap.set(struct.name, struct)
    })

    // Generate class diagram in mermaid syntax
    let mermaidCode = "classDiagram\n"

    // Define all classes with their members
    structs.forEach((struct) => {
      mermaidCode += `  class ${struct.name} {\n`

      struct.fields.forEach((field) => {
        let fieldDisplay = `+${field.name}`
        if (field.isArray) {
          // Handle both numeric and non-numeric array sizes
          fieldDisplay += ` : ${field.type}[${field.arraySize}]`
        } else if (field.isPointer) {
          fieldDisplay += ` : ${field.type}*`
        } else {
          fieldDisplay += ` : ${field.type}`
        }
        mermaidCode += `    ${fieldDisplay}\n`
      })

      mermaidCode += "  }\n"
    })

    // Define relationships
    structs.forEach((struct) => {
      struct.fields.forEach((field) => {
        // Check if the field type is one of our defined structs
        if (structMap.has(field.type)) {
          if (field.isPointer) {
            // Pointer relationship - use arrow (->)
            // This represents the C arrow operator (->)
            mermaidCode += `  ${struct.name} --> ${field.type} : ${field.name} (pointer)\n`
          } else {
            // Direct embedding - use dotted line (..)
            // This represents the C dot operator (.)
            mermaidCode += `  ${struct.name} ..> ${field.type} : ${field.name}\n`
          }
        }
      })
    })

    try {
      const { svg } = await mermaid.render(diagramId, mermaidCode)
      setDiagramSvg(svg)
      // Reset initial render flag to trigger size optimization
      setInitialRender(true)
    } catch (error) {
      console.error("Error rendering mermaid diagram:", error)
      console.log("Mermaid code:", mermaidCode)
      setDiagramSvg(`<div class="text-red-500">Error generating diagram: ${error}</div>`)
    }
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, maxZoom)) // Increased max zoom
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.1)) // Decreased min zoom to 10%
  }

  const handleResetZoom = () => {
    optimizeDiagramSize()
  }

  const handleFitToView = () => {
    if (!diagramContainerRef.current || !containerRef.current) return

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const diagramWidth = diagramContainerRef.current.scrollWidth
    const diagramHeight = diagramContainerRef.current.scrollHeight

    // Calculate the scale needed to fit the diagram with a margin
    const margin = 20 // pixels
    const scaleX = (containerWidth - margin * 2) / diagramWidth
    const scaleY = (containerHeight - margin * 2) / diagramHeight

    // Use the smaller scale to ensure the diagram fits in both dimensions
    const newZoom = Math.min(scaleX, scaleY)

    setZoomLevel(newZoom)
    setPosition({ x: 0, y: 0 })
  }

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // Handle wheel events for zooming
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY * -0.01
      const newZoom = Math.max(0.1, Math.min(maxZoom, zoomLevel + delta))
      setZoomLevel(newZoom)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {structs.length > 0 && (
        <div className="flex justify-center mb-3 gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In" aria-label="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out" aria-label="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleFitToView} title="Fit to View" aria-label="Fit to View">
            <Maximize className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetZoom} title="Optimal View" aria-label="Optimal View">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <span className="text-xs flex items-center ml-2">{Math.round(zoomLevel * 100)}%</span>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-grow bg-muted/20 rounded-md overflow-hidden relative"
        style={{ cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default", height: "600px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        {structs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Enter C struct code and click "Analyze Structs" to generate a diagram
          </div>
        ) : (
          <div
            ref={diagramContainerRef}
            className="absolute transition-transform duration-100 origin-center"
            style={{
              transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
            }}
            dangerouslySetInnerHTML={{ __html: diagramSvg }}
          />
        )}
      </div>
    </div>
  )
}

