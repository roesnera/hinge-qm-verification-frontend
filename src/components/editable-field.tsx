import { useEffect, useState } from "react";
import { Input } from "@src/components/ui/input";
import { Textarea } from "@src/components/ui/textarea";

interface EditableFieldProps {
  label: string;
  value: string | number | null | undefined;
  isEditMode: boolean;
  onEdit: (value: string) => void;
  multiline?: boolean;
  className?: string;
  isRequired?: boolean;
}

export default function EditableField({ 
  label, 
  value, 
  isEditMode, 
  onEdit, 
  multiline = false,
  className = "",
  isRequired = false
}: EditableFieldProps) {
  const [editedValue, setEditedValue] = useState<string>(value?.toString() || "");
  
  // Update local state when the source value changes
  useEffect(() => {
    setEditedValue(value?.toString() || "");
  }, [value]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedValue(e.target.value);
    onEdit(e.target.value);
  };

  return (
    <div className={`${className} ${isRequired ? 'border-l-4 border-amber-400 pl-3 bg-amber-50/50' : ''}`}>
      <label className={`block text-xs font-medium ${isRequired ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>
        {label}
        {isRequired && <span className="text-amber-600 ml-1">★ Required for Quality Measures</span>}
      </label>
      {isEditMode ? (
        multiline ? (
          <Textarea
            value={editedValue}
            onChange={handleChange}
            rows={3}
            className="w-full mt-1 text-base"
          />
        ) : (
          <Input
            type="text"
            value={editedValue}
            onChange={handleChange}
            className="w-full mt-1 text-base"
          />
        )
      ) : (
        <p className="text-base text-slate-800 break-words">
          {value?.toString() || "Not specified"}
        </p>
      )}
    </div>
  );
}
