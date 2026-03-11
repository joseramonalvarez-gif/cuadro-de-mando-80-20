import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DataTable({ columns, data, emptyMessage = 'No hay datos disponibles' }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(27,39,49,0.06)] border border-[#E8EEEE]/60 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8F6F1] border-b border-[#E8EEEE]">
              {columns.map((col, i) => (
                <TableHead key={i} className={`text-xs font-semibold text-[#3E4C59] uppercase tracking-wide ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-[#B7CAC9] py-12">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={i} className="hover:bg-[#FDFBF7] transition-colors border-b border-[#E8EEEE]/50">
                  {columns.map((col, j) => (
                    <TableCell key={j} className={`text-sm text-[#1B2731] ${col.align === 'right' ? 'text-right font-medium' : ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}