import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Card from '../shared/Card';

const STATEMENT_TYPES = [
  { value: 'profit_loss', label: 'Profit & Loss Statement' },
  { value: 'balance_sheet', label: 'Balance Sheet' },
  { value: 'cash_flow', label: 'Cash Flow Statement' },
];

export default function StatementUploadForm({ businessId, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    statement_type: '',
    period: '',
    notes: '',
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['text/csv', 'application/pdf', 'application/vnd.ms-excel'];
      const isValid = validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv');
      
      if (!isValid) {
        alert('Please upload a CSV or PDF file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file || !formData.statement_type || !formData.period) {
      alert('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPrivateFile({ file });
      
      await base44.entities.FinancialStatement.create({
        business_id: businessId,
        file_url,
        file_name: file.name,
        statement_type: formData.statement_type,
        period: formData.period,
        notes: formData.notes,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      alert('Failed to upload statement. Please try again.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg" padding="large">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-stone-800">Upload Financial Statement</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-stone-700">Upload File (CSV or PDF)</Label>
            <div className="mt-1.5">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 rounded-xl hover:border-stone-400 transition-colors cursor-pointer bg-stone-50">
                <div className="flex flex-col items-center">
                  {file ? (
                    <>
                      <FileText className="w-8 h-8 text-stone-600 mb-2" />
                      <p className="text-sm text-stone-700 font-medium">{file.name}</p>
                      <p className="text-xs text-stone-400 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-stone-400 mb-2" />
                      <p className="text-sm text-stone-600">Click to upload</p>
                      <p className="text-xs text-stone-400 mt-1">CSV or PDF files only</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <div>
            <Label className="text-stone-700">Statement Type *</Label>
            <Select
              value={formData.statement_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, statement_type: value }))}
            >
              <SelectTrigger className="mt-1.5 rounded-xl border-stone-200">
                <SelectValue placeholder="Select statement type" />
              </SelectTrigger>
              <SelectContent>
                {STATEMENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-stone-700">Period (Month) *</Label>
            <Input
              type="month"
              value={formData.period}
              onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value + '-01' }))}
              className="mt-1.5 rounded-xl border-stone-200"
            />
          </div>

          <div>
            <Label className="text-stone-700">Notes (optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this statement..."
              className="mt-1.5 rounded-xl border-stone-200 h-20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl bg-stone-900 hover:bg-stone-800"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Statement'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}