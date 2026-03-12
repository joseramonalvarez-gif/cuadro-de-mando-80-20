import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { useApp } from './DemoContext';

export default function ExportButton({ data, filename, label = "Exportar" }) {
  const { isAdmin, isAdvanced } = useApp();

  // Only admin and advanced users can export
  if (!isAdmin && !isAdvanced) {
    return null;
  }

  function handleExport() {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const value = row[h];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}