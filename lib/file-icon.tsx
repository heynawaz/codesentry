"use client";

import {
  FileCode,
  FileText,
  FileBraces,
  FileImage,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EXT_ICON: Record<string, LucideIcon> = {
  // Code
  ts: FileCode,
  tsx: FileCode,
  js: FileCode,
  jsx: FileCode,
  mjs: FileCode,
  cjs: FileCode,
  html: FileCode,
  htm: FileCode,
  css: FileCode,
  scss: FileCode,
  sass: FileCode,
  less: FileCode,
  yaml: FileCode,
  yml: FileCode,
  json: FileBraces,
  jsonc: FileBraces,
  // Text / docs
  md: FileText,
  mdx: FileText,
  txt: FileText,
  log: FileText,
  // Images
  svg: FileImage,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  ico: FileImage,
};

function getExtension(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return ext;
}

export function getFileIcon(path: string): LucideIcon {
  const ext = getExtension(path);
  return EXT_ICON[ext] ?? FileCode;
}

type FileIconProps = {
  path: string;
  className?: string;
};

export function FileIcon({ path, className }: FileIconProps) {
  const Icon = getFileIcon(path);
  return <Icon className={cn("size-4 shrink-0 text-muted-foreground", className)} aria-hidden />;
}
