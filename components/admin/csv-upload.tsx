"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CSVUploadProps {
  onFileSelect: (file: File) => void;
  onClear: () => void;
  selectedFile: File | null;
  error?: string | null;
  isProcessing?: boolean;
  className?: string;
}

/**
 * CSV Upload Component
 * Drag and drop or click to select CSV files
 */
export function CSVUpload({
  onFileSelect,
  onClear,
  selectedFile,
  error,
  isProcessing = false,
  className,
}: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!selectedFile && !isProcessing) {
      fileInputRef.current?.click();
    }
  }, [selectedFile, isProcessing]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClear();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onClear]
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed transition-all cursor-pointer",
          "flex flex-col items-center justify-center p-8 min-h-[200px]",
          isDragging && "border-primary bg-primary/5",
          !isDragging &&
            !selectedFile &&
            "border-border hover:border-primary/50 hover:bg-secondary/50",
          selectedFile && "border-neon-green/50 bg-neon-green/5 cursor-default",
          error && "border-red-500/50 bg-red-500/5",
          isProcessing && "opacity-50 cursor-wait"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-neon-green/20 rounded-full mb-4">
              <FileText className="h-8 w-8 text-neon-green" />
            </div>
            <p className="font-bold text-foreground mb-1">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            {!isProcessing && (
              <button
                type="button"
                onClick={handleClear}
                className="btn-athletic px-4 py-2 bg-secondary text-muted-foreground text-sm hover:text-foreground inline-flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                <span>Remove</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full mb-4",
                isDragging ? "bg-primary/20" : "bg-secondary"
              )}
            >
              <Upload
                className={cn("h-8 w-8", isDragging ? "text-primary" : "text-muted-foreground")}
              />
            </div>
            <p className="font-bold text-foreground mb-1">
              {isDragging ? "Drop your CSV file here" : "Drag and drop CSV file here"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <p className="text-xs text-muted-foreground">Only .csv files are accepted</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
