"use client"

import { useEffect, useRef } from "react"
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { cpp } from "@codemirror/lang-cpp"
import { indentWithTab } from "@codemirror/commands"
import { keymap } from "@codemirror/view"
import { useTheme } from "next-themes"
import { oneDark } from "@codemirror/theme-one-dark"

interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!editorRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newCode = update.state.doc.toString()
        onChange(newCode)
      }
    })

    // Add tab support
    const tabKeymap = keymap.of([indentWithTab])

    const extensions = [
      basicSetup,
      cpp(),
      updateListener,
      tabKeymap,
      EditorView.theme({
        "&": { height: "600px" },
        ".cm-scroller": { overflow: "auto" },
      }),
    ]

    // Add dark theme if needed
    if (theme === "dark") {
      extensions.push(oneDark)
    }

    const state = EditorState.create({
      doc: code,
      extensions,
    })

    if (editorViewRef.current) {
      editorViewRef.current.destroy()
    }

    editorViewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    })

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy()
      }
    }
  }, [theme]) // Re-initialize when theme changes

  return <div ref={editorRef} className="border rounded-md" />
}

