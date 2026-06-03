"use client"

import { useRef, useState } from "react"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.snow.css"

const modules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image"],
      [{ align: [] }],
      ["clean"],
    ],
    handlers: {},
  },
}

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "code-block",
  "link",
  "image",
  "align",
]

interface RichTextEditorProps {
  value: string
  onChange: (val: string) => void
  id?: string
  placeholder?: string
}

export default function RichTextEditor({
  value,
  onChange,
  id,
  placeholder,
}: RichTextEditorProps) {
  const [initial] = useState(value)
  const quillRef = useRef<ReactQuill>(null)
  const [uploading, setUploading] = useState(false)

  const linkHandler = () => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    const range = editor.getSelection(true)
    let url = window.prompt("Введіть URL:")
    if (!url) return

    if (!/^https?:\/\//i.test(url) && !url.startsWith("/") && !url.startsWith("#") && !url.startsWith("mailto:") && !url.startsWith("tel:")) {
      url = "https://" + url
    }

    if (range.length === 0) {
      const text = window.prompt("Текст посилання:") || url
      editor.insertText(range.index, text, "link", url)
      editor.setSelection(range.index + text.length, 0)
    } else {
      editor.format("link", url)
    }
  }

  const imageHandler = () => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    const range = editor.getSelection(true)

    let imgUrl = window.prompt("Введіть URL зображення, або натисніть OK щоб вибрати файл:")
    if (imgUrl && imgUrl.trim()) {
      imgUrl = imgUrl.trim()
      if (!/^https?:\/\//i.test(imgUrl) && !imgUrl.startsWith("/")) {
        imgUrl = "https://" + imgUrl
      }
      editor.insertEmbed(range.index, "image", imgUrl)
      editor.setSelection(range.index + 1, 0)
      return
    }

    const input = document.createElement("input")
    input.setAttribute("type", "file")
    input.setAttribute("accept", "image/*")
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()
        if (data.url) {
          const ed = quillRef.current?.getEditor()
          if (ed) {
            ed.insertEmbed(range.index, "image", data.url)
            ed.setSelection(range.index + 1, 0)
          }
        }
      } catch (err) {
        console.error("Image upload failed:", err)
      } finally {
        setUploading(false)
      }
    }
  }

  const toolbarModules = {
    toolbar: {
      container: modules.toolbar.container,
      handlers: { link: linkHandler, image: imageHandler },
    },
  }

  return (
    <div className="min-h-[200px] relative">
      {uploading && (
        <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center rounded-md">
          <span className="text-sm font-medium">Завантаження зображення...</span>
        </div>
      )}
      <ReactQuill
        ref={quillRef}
        theme="snow"
        defaultValue={initial}
        onChange={onChange}
        modules={toolbarModules}
        formats={formats}
        placeholder={placeholder ?? "Почніть писати..."}
      />
      <textarea
        id={id}
        className="sr-only"
        tabIndex={-1}
        readOnly
        value={value}
        aria-hidden="true"
      />
    </div>
  )
}
