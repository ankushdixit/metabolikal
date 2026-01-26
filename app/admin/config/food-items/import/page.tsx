"use client";

import { useState, useEffect, useCallback } from "react";
import { useList } from "@refinedev/core";
import Link from "next/link";
import { ArrowLeft, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { CSVUpload } from "@/components/admin/csv-upload";
import { CSVPreviewTable } from "@/components/admin/csv-preview-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  parseCSV,
  downloadCSVTemplate,
  getValidFoodItems,
  type CSVParseResult,
} from "@/lib/csv-parser";
import { cn } from "@/lib/utils";
import type { FoodItem } from "@/lib/database.types";

type ImportStep = "upload" | "preview" | "importing" | "complete";

/**
 * CSV Import Page
 * Upload and import multiple food items via CSV
 */
export default function CSVImportPage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [step, setStep] = useState<ImportStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [skipInvalidRows, setSkipInvalidRows] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Get current admin user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAdminId(data.user.id);
      }
    });
  }, []);

  // Fetch existing food items for duplicate detection
  const existingFoodItemsQuery = useList<FoodItem>({
    resource: "food_items",
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!adminId,
    },
  });

  const existingNames = (existingFoodItemsQuery.query.data?.data || []).map((f) => f.name);
  const isLoadingExisting = existingFoodItemsQuery.query.isLoading;

  const handleFileSelect = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      setParseError(null);
      setParseResult(null);

      try {
        const content = await file.text();
        const result = parseCSV(content, existingNames);

        if (result.parseErrors.length > 0 && result.rows.length === 0) {
          setParseError(`Failed to parse CSV: ${result.parseErrors.join(", ")}`);
          return;
        }

        setParseResult(result);
        setStep("preview");
      } catch {
        setParseError("Failed to read file. Please ensure it's a valid CSV file.");
      }
    },
    [existingNames]
  );

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setParseResult(null);
    setParseError(null);
    setStep("upload");
  }, []);

  const handleImport = useCallback(async () => {
    if (!parseResult) return;

    setStep("importing");
    setImportProgress(0);
    setImportResult(null);

    const supabase = createBrowserSupabaseClient();
    const validItems = getValidFoodItems(parseResult);

    if (validItems.length === 0) {
      setImportResult({
        success: 0,
        failed: 0,
        errors: ["No valid items to import"],
      });
      setStep("complete");
      return;
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Import in batches of 10
    const batchSize = 10;
    for (let i = 0; i < validItems.length; i += batchSize) {
      const batch = validItems.slice(i, i + batchSize);

      const { error } = await supabase.from("food_items").insert(batch);

      if (error) {
        failedCount += batch.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        successCount += batch.length;
      }

      setImportProgress(Math.round(((i + batch.length) / validItems.length) * 100));
    }

    setImportResult({
      success: successCount,
      failed: failedCount,
      errors,
    });
    setStep("complete");
  }, [parseResult]);

  const handleStartOver = useCallback(() => {
    setSelectedFile(null);
    setParseResult(null);
    setParseError(null);
    setImportResult(null);
    setStep("upload");
    // Refetch existing items to include newly imported ones
    existingFoodItemsQuery.query.refetch();
  }, [existingFoodItemsQuery.query]);

  const validRowCount = parseResult?.validRows || 0;
  const invalidRowCount = parseResult?.invalidRows || 0;
  const canImport = validRowCount > 0 && (skipInvalidRows || invalidRowCount === 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <Link
          href="/admin/config/food-items"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Food Items</span>
        </Link>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Import <span className="gradient-athletic">Food Items</span>
        </h1>
        <p className="text-sm text-muted-foreground font-bold">
          Upload a CSV file to add multiple food items at once
        </p>
      </div>

      {/* Step 1: Download Template */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-primary/20 font-black text-sm">
            1
          </div>
          <span className="text-sm font-black tracking-[0.2em] uppercase text-muted-foreground">
            Download Template
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Start with our template to ensure your CSV has the correct format.
        </p>
        <button
          type="button"
          onClick={downloadCSVTemplate}
          className="btn-athletic inline-flex items-center gap-2 px-6 py-3 bg-secondary text-foreground"
        >
          <Download className="h-5 w-5" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {/* Step 2: Upload File */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 bg-primary/20 font-black text-sm">
            2
          </div>
          <span className="text-sm font-black tracking-[0.2em] uppercase text-muted-foreground">
            Upload Your File
          </span>
        </div>

        {isLoadingExisting ? (
          <div className="flex items-center gap-2 text-muted-foreground p-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-bold">Loading existing food items...</span>
          </div>
        ) : (
          <CSVUpload
            onFileSelect={handleFileSelect}
            onClear={handleClearFile}
            selectedFile={selectedFile}
            error={parseError}
            isProcessing={step === "importing"}
          />
        )}
      </div>

      {/* Step 3: Preview & Validate */}
      {step !== "upload" && parseResult && (
        <div className="athletic-card p-6 pl-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/20 font-black text-sm">
              3
            </div>
            <span className="text-sm font-black tracking-[0.2em] uppercase text-muted-foreground">
              Preview & Validate
            </span>
          </div>

          {/* Summary */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-secondary">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-neon-green" />
              <span className="font-bold text-neon-green">{validRowCount} valid rows</span>
            </div>
            {invalidRowCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="font-bold text-red-500">{invalidRowCount} rows with errors</span>
              </div>
            )}
            <div className="text-sm text-muted-foreground font-bold">
              Total: {parseResult.totalRows} rows
            </div>
          </div>

          {/* Filter toggle */}
          {invalidRowCount > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <Checkbox
                id="show-errors-only"
                checked={showOnlyErrors}
                onCheckedChange={(checked) => setShowOnlyErrors(checked === true)}
              />
              <label htmlFor="show-errors-only" className="text-sm font-bold cursor-pointer">
                Show only rows with errors
              </label>
            </div>
          )}

          {/* Preview Table */}
          <CSVPreviewTable rows={parseResult.rows} showOnlyErrors={showOnlyErrors} />

          {/* Import Options */}
          {step === "preview" && (
            <div className="mt-6 pt-6 border-t border-border">
              {invalidRowCount > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <Checkbox
                    id="skip-invalid"
                    checked={skipInvalidRows}
                    onCheckedChange={(checked) => setSkipInvalidRows(checked === true)}
                  />
                  <label htmlFor="skip-invalid" className="text-sm font-bold cursor-pointer">
                    Skip rows with errors (import {validRowCount} valid items)
                  </label>
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="btn-athletic px-6 py-3 bg-secondary text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!canImport}
                  className={cn(
                    "btn-athletic flex-1 px-6 py-3 glow-power disabled:opacity-50 disabled:cursor-not-allowed",
                    canImport
                      ? "gradient-electric text-black"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  Import {validRowCount} Items
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Importing Progress */}
      {step === "importing" && (
        <div className="athletic-card p-6 pl-8">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="font-bold">Importing food items...</span>
          </div>
          <div className="w-full bg-secondary h-4 overflow-hidden">
            <div
              className="h-full gradient-electric transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground font-bold mt-2">{importProgress}% complete</p>
        </div>
      )}

      {/* Import Complete */}
      {step === "complete" && importResult && (
        <div className="athletic-card p-6 pl-8">
          <div className="flex items-center gap-3 mb-6">
            {importResult.success > 0 && importResult.failed === 0 ? (
              <CheckCircle2 className="h-8 w-8 text-neon-green" />
            ) : importResult.success === 0 ? (
              <AlertCircle className="h-8 w-8 text-red-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            )}
            <div>
              <h2 className="text-xl font-black uppercase">Import Complete</h2>
              <p className="text-sm text-muted-foreground font-bold">
                {importResult.success > 0 && `${importResult.success} items imported successfully`}
                {importResult.success > 0 && importResult.failed > 0 && " | "}
                {importResult.failed > 0 && `${importResult.failed} items failed`}
              </p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30">
              <p className="font-bold text-red-500 text-sm mb-2">Import Errors:</p>
              <ul className="text-sm text-red-500 space-y-1">
                {importResult.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleStartOver}
              className="btn-athletic px-6 py-3 bg-secondary text-foreground"
            >
              Import More
            </button>
            <Link
              href="/admin/config/food-items"
              className="btn-athletic flex-1 px-6 py-3 gradient-electric text-black glow-power text-center"
            >
              View Food Items
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
