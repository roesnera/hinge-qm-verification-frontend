import { useQuery } from "@tanstack/react-query";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@src/components/ui/select";
import { Label } from "@src/components/ui/label";
import { Loader2 } from "lucide-react";

interface PatientSelectorProps {
  onSelect: (patientId: string) => void;
  selectedPatientId: string;
}

export default function PatientSelector({ onSelect, selectedPatientId }: PatientSelectorProps) {
  // Fetch patient IDs from the API
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/patients'],
    queryFn: () => 
      fetch('/api/patients')
        .then(res => res.json())
        .then(data => data.patientIds)
  });

  // Handle selection change
  const handleChange = (value: string) => {
    onSelect(value);
  };

  return (
    <div className="space-y-1">
      <Label htmlFor="patient-select" className="text-sm font-medium text-slate-700">
        Select Patient ID
      </Label>
      <Select value={selectedPatientId} onValueChange={handleChange}>
        <SelectTrigger 
          id="patient-select" 
          className="w-full border-slate-300 focus:border-primary focus:ring-primary"
        >
          <SelectValue placeholder="Select a patient..." />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive p-2">
              Failed to load patient IDs
            </div>
          ) : data?.length > 0 ? (
            data.map((patientId: string) => (
              <SelectItem key={patientId} value={patientId}>
                {patientId}
              </SelectItem>
            ))
          ) : (
            <div className="text-sm text-muted-foreground p-2">
              No patients found
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
