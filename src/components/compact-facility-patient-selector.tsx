import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@src/components/ui/select';
import { Building, User, Loader2 } from 'lucide-react';

interface CompactFacilityPatientSelectorProps {
  onSelect: (patientId: string) => void;
  selectedPatientId?: string;
}

interface FacilitiesData {
  facilities: Record<string, string[]>;
}

export default function CompactFacilityPatientSelector({ onSelect, selectedPatientId }: CompactFacilityPatientSelectorProps) {
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [availablePatients, setAvailablePatients] = useState<string[]>([]);

  // Fetch facilities and their patients
  const { data: facilitiesData, isLoading, isError } = useQuery<FacilitiesData>({
    queryKey: ['/api/facilities'],
    queryFn: () => 
      fetch('/api/facilities')
        .then(res => res.json())
  });

  // Update available patients when facility selection changes
  useEffect(() => {
    if (selectedFacility && facilitiesData?.facilities) {
      const patients = facilitiesData.facilities[selectedFacility] || [];
      setAvailablePatients(patients);
      
      // If current selected patient is not in this facility, clear selection
      if (selectedPatientId && !patients.includes(selectedPatientId)) {
        onSelect("");
      }
    } else {
      setAvailablePatients([]);
    }
  }, [selectedFacility, facilitiesData, selectedPatientId, onSelect]);

  // Auto-select facility if a patient is already selected
  useEffect(() => {
    if (selectedPatientId && facilitiesData?.facilities && !selectedFacility) {
      // Find which facility contains this patient
      for (const [facilityName, patients] of Object.entries(facilitiesData.facilities)) {
        if (patients.includes(selectedPatientId)) {
          setSelectedFacility(facilityName);
          break;
        }
      }
    }
  }, [selectedPatientId, facilitiesData, selectedFacility]);

  const handleFacilityChange = (facilityName: string) => {
    setSelectedFacility(facilityName);
    // Clear patient selection when facility changes
    onSelect("");
  };

  const handlePatientChange = (patientId: string) => {
    onSelect(patientId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading facilities...
      </div>
    );
  }

  if (isError || !facilitiesData) {
    return (
      <div className="text-xs text-red-600">Failed to load facilities</div>
    );
  }

  const facilities = facilitiesData.facilities;
  const facilityNames = Object.keys(facilities).sort();

  return (
    <div className="flex items-center gap-3">
      {/* Facility Selection */}
      <div className="flex items-center gap-2">
        <div className="flex items-center text-xs text-slate-600">
          <Building className="h-3 w-3 mr-1" />
          <span className="whitespace-nowrap">Facility:</span>
        </div>
        <Select value={selectedFacility} onValueChange={handleFacilityChange}>
          <SelectTrigger className="h-7 w-[140px] text-xs border-slate-300">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {facilityNames.length > 0 ? (
              facilityNames.map((facilityName) => (
                <SelectItem key={facilityName} value={facilityName}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs">{facilityName}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      ({facilities[facilityName].length})
                    </span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="text-xs text-muted-foreground p-2">
                No facilities found
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Patient Selection */}
      <div className="flex items-center gap-2">
        <div className="flex items-center text-xs text-slate-600">
          <User className="h-3 w-3 mr-1" />
          <span className="whitespace-nowrap">Patient:</span>
        </div>
        <Select 
          value={selectedPatientId || ""} 
          onValueChange={handlePatientChange}
          disabled={!selectedFacility}
        >
          <SelectTrigger 
            className={`h-7 w-[120px] text-xs border-slate-300 ${
              !selectedFacility ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <SelectValue placeholder={
              selectedFacility ? "Select..." : "Choose facility first"
            } />
          </SelectTrigger>
          <SelectContent>
            {availablePatients.length > 0 ? (
              availablePatients.map((patientId) => (
                <SelectItem key={patientId} value={patientId}>
                  <span className="text-xs">{patientId}</span>
                </SelectItem>
              ))
            ) : selectedFacility ? (
              <div className="text-xs text-muted-foreground p-2">
                No patients found
              </div>
            ) : (
              <div className="text-xs text-muted-foreground p-2">
                Select facility first
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}