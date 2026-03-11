import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subYears, endOfYear } from "date-fns";
import { es } from "date-fns/locale";

const PRESETS = [
  { label: 'Hoy', key: 'today' },
  { label: 'Esta semana', key: 'week' },
  { label: 'Este mes', key: 'month' },
  { label: 'Este trimestre', key: 'quarter' },
  { label: 'Este año', key: 'year' },
  { label: 'Año anterior', key: 'prev_year' },
  { label: 'Personalizado', key: 'custom' },
];

export default function DateFilter({ onDateChange, compact = false }) {
  const [activePreset, setActivePreset] = useState('month');
  const [customRange, setCustomRange] = useState({ from: null, to: null });
  const [open, setOpen] = useState(false);

  function getRange(key) {
    const now = new Date();
    switch (key) {
      case 'today': return { from: now, to: now };
      case 'week': return { from: startOfWeek(now, { locale: es }), to: now };
      case 'month': return { from: startOfMonth(now), to: now };
      case 'quarter': return { from: startOfQuarter(now), to: now };
      case 'year': return { from: startOfYear(now), to: now };
      case 'prev_year': {
        const prev = subYears(now, 1);
        return { from: startOfYear(prev), to: endOfYear(prev) };
      }
      default: return { from: startOfMonth(now), to: now };
    }
  }

  function handlePreset(key) {
    setActivePreset(key);
    if (key !== 'custom') {
      const range = getRange(key);
      onDateChange?.(range);
      setOpen(false);
    }
  }

  function handleCustom(range) {
    setCustomRange(range);
    if (range?.from && range?.to) {
      onDateChange?.(range);
    }
  }

  const currentRange = activePreset === 'custom' ? customRange : getRange(activePreset);
  const label = currentRange.from && currentRange.to
    ? `${format(currentRange.from, 'dd MMM', { locale: es })} – ${format(currentRange.to, 'dd MMM yy', { locale: es })}`
    : 'Seleccionar fechas';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`bg-white border-[#B7CAC9] text-[#1B2731] hover:bg-[#F0F5F5] ${compact ? 'h-8 text-xs px-2' : 'h-9 text-sm px-3'}`}>
          <CalendarDays className="w-4 h-4 mr-2 text-[#33A19A]" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white border-[#B7CAC9]" align="start">
        <div className="flex">
          <div className="border-r border-[#E8EEEE] p-2 space-y-1">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => handlePreset(p.key)}
                className={`block w-full text-left text-sm px-3 py-1.5 rounded transition-colors ${
                  activePreset === p.key
                    ? 'bg-[#33A19A] text-white'
                    : 'text-[#3E4C59] hover:bg-[#F0F5F5]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {activePreset === 'custom' && (
            <div className="p-2">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={handleCustom}
                locale={es}
                numberOfMonths={2}
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}