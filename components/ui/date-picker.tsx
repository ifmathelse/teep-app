"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

// Função para formatar uma data para o formato YYYY-MM-DD no fuso horário local
function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Date picker simples com input nativo
export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  className,
}: DatePickerProps) {
  const [internalValue, setInternalValue] = useState<string>(value || "");

  // Atualiza o valor interno quando o valor da prop muda
  useEffect(() => {
    setInternalValue(value || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue);
  };

  return (
    <input
      type="date"
      value={internalValue}
      onChange={handleChange}
      className={cn(
        "w-full px-3 py-2 border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm",
        className
      )}
      style={{
        colorScheme: 'light',
        fontSize: '14px',
        fontFamily: 'inherit'
      }}
    />
  );
}

// Exporta também como Calendar para compatibilidade
export const Calendar = DatePicker;