"use client"

import { useState, useEffect } from "react"
import { ChangelogModal } from "./changelog-modal"

export function VersionFooter() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentVersion, setCurrentVersion] = useState("3.7.0")

  useEffect(() => {
    const versionMeta = document.querySelector('meta[name="app-version"]')
    if (versionMeta) {
      setCurrentVersion(versionMeta.getAttribute("content") || "3.7.0")
    }
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-700 transition cursor-pointer flex items-center gap-1"
        aria-label="Ver changelog"
      >
        <span>v{currentVersion}</span>
        <span>·</span>
        <span>septiembre 2026</span>
        <span className="ml-1 opacity-0 group-hover:opacity-100 transition">📋</span>
      </button>
      <ChangelogModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentVersion={currentVersion}
      />
    </>
  )
}
