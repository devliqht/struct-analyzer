"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"
import { useTheme } from "next-themes"

interface StructDiagramProps {
  structs: any[]
}

export default function StructDiagram({ structs }: StructDiagramProps) {
  const [diagramId] = useState(`mermaid-${Math.random().toString(36).substring(2, 11)}`)
  const containerRef = useRef<HTMLDivElement>(null)
  const [diagramSvg, setDiagramSvg] = useState<string>("")
  const { theme } = useTheme()

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
    } catch (error) {
      console.error("Error rendering mermaid diagram:", error)
      console.log("Mermaid code:", mermaidCode)
      setDiagramSvg(`<div class="text-red-500">Error generating diagram: ${error}</div>`)
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      {structs.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Enter C struct code and click "Analyze Structs" to generate a diagram
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: diagramSvg }} className="w-full h-full" />
      )}
    </div>
  )
}

