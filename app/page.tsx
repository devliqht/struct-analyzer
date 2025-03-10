"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MoonIcon, SunIcon } from "lucide-react"
import StructDiagram from "@/components/struct-diagram"
import CodeEditor from "@/components/code-editor"
import { ThemeProvider } from "@/components/theme-provider"
import { useTheme } from "next-themes"
import Link from "next/link"

export default function StructAnalyzer() {
  const [code, setCode] = useState<string>(`typedef struct {
    char fName[20];
    char lName[20];
    char MI;
} name;

typedef struct {
    name empName;
    int idNum;
    int grossSalary;
    int rate;
    int hrsWorked;
    float takeHomeSalary;
} employeeInfo;

typedef struct {
    employeeInfo* employees;
    int count;
} employeeRecord;

typedef struct {
    employeeRecord employeeList;
    employeeRecord bracket1, bracket2, bracket3;
} companyRecord;`)
  const [parsedStructs, setParsedStructs] = useState<any[]>([])
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    parseStructs(code)
  }, [])

  const parseStructs = (codeInput: string) => {
    // Simple regex-based parser for C struct declarations
    const structRegex = /typedef\s+struct\s+(?:\w+\s+)?{([^}]*)}\s+(\w+);/g
    const fieldRegex = /\s*(\w+)\s*(\*?)\s+(\w+)(?:\[(\d+)\])?;/g

    const structs: any[] = []
    let match

    while ((match = structRegex.exec(codeInput)) !== null) {
      const [_, bodyContent, structName] = match
      const fields: any[] = []
      let fieldMatch

      const fieldContent = bodyContent.trim()
      const fieldRegexInstance = new RegExp(fieldRegex)

      const fieldString = fieldContent
      while ((fieldMatch = fieldRegexInstance.exec(fieldContent)) !== null) {
        const [__, fieldType, pointerIndicator, fieldName, arraySize] = fieldMatch
        fields.push({
          type: fieldType,
          name: fieldName,
          isArray: !!arraySize,
          arraySize: arraySize ? Number.parseInt(arraySize) : undefined,
          isPointer: pointerIndicator === "*",
        })
      }

      structs.push({
        name: structName,
        fields,
      })
    }

    setParsedStructs(structs)
  }

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
  }

  const handleAnalyze = () => {
    parseStructs(code)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="container mx-auto p-4 min-h-screen font-sans">
        <div className="text-center my-8">
          <h1 className="text-4xl font-bold mb-2 font-serif">C Struct Analyzer</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Created by{" "}
            <Link href="https://devliqht.vercel.app" className="text-primary hover:underline">
              Matt Cabarrubias
            </Link>{" "}
            with v0
          </p>
          <Button variant="outline" size="sm" onClick={toggleTheme} className="mb-4">
            {theme === "dark" ? <SunIcon className="h-4 w-4 mr-2" /> : <MoonIcon className="h-4 w-4 mr-2" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-4 shadow-md">
            <h2 className="text-xl font-semibold mb-3 font-serif">C Code Input</h2>
            <CodeEditor code={code} onChange={handleCodeChange} />
            <Button className="mt-4 w-full" onClick={handleAnalyze}>
              Analyze Structs
            </Button>
          </Card>

          <Card className="p-4 flex flex-col shadow-md">
            <h2 className="text-xl font-semibold mb-3 font-serif">Structure Diagram</h2>
            <div className="flex-grow bg-muted/20 rounded-md p-4 overflow-auto">
              <StructDiagram structs={parsedStructs} />
            </div>
          </Card>
        </div>

        <footer className="border-t pt-6 pb-8 text-center">
          <h3 className="text-xl font-semibold mb-3 font-serif">Other Tools</h3>
          <ul className="flex flex-col items-center gap-2">
            <li>
              <Link href="https://networking-vlsm.vercel.app/" className="text-primary hover:underline">
                Networking VLSM Calculator
              </Link>
            </li>
          </ul>
        </footer>
      </main>
    </ThemeProvider>
  )
}

