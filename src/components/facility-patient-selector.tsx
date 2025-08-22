import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@src/components/ui/select';
import { Label } from '@src/components/ui/label';
import { Loader2, Building, User } from 'lucide-react';
import { Card, CardContent } from '@src/components/ui/card';

interface FacilityPatientSelectorProps {
  onSelect: (patientId: string) => void;
  selectedPatientId?: string;
}

interface FacilitiesData {
  facilities: Record<string, string[]>;
}

export default function FacilityPatientSelector({ onSelect, selectedPatientId }: FacilityPatientSelectorProps) {
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
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span className="text-sm text-gray-600">Loading facilities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !facilitiesData) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-destructive">
            Failed to load facilities and patients
          </div>
        </CardContent>
      </Card>
    );
  }

  const facilities = facilitiesData.facilities;
  const facilityNames = Object.keys(facilities).sort();

  return (
    <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
      <CardContent className="p-3 space-y-2">
        {/* Facility Selection */}
        <div className="space-y-1">
          <Label htmlFor="facility-select" className="text-xs font-semibold text-slate-700 flex items-center">
            <Building className="h-3 w-3 mr-1" />
            Facility
          </Label>
          <Select value={selectedFacility} onValueChange={handleFacilityChange}>
            <SelectTrigger 
              id="facility-select"
              className="h-8 text-xs border-slate-300"
            >
              <SelectValue placeholder="Choose facility..." />
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
                <div className="text-sm text-muted-foreground p-2">
                  No facilities found
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Patient Selection */}
        <div className="space-y-1">
          <Label htmlFor="patient-select" className="text-xs font-semibold text-slate-700 flex items-center">
            <User className="h-3 w-3 mr-1" />
            Patient ID
          </Label>
          <Select 
            value={selectedPatientId || ""} 
            onValueChange={handlePatientChange}
            disabled={!selectedFacility}
          >
            <SelectTrigger 
              id="patient-select"
              className={`h-8 text-xs border-slate-300 ${
                !selectedFacility ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <SelectValue placeholder={
                selectedFacility ? "Choose patient..." : "Select facility first..."
              } />
            </SelectTrigger>
            <SelectContent>
              {availablePatients.length > 0 ? (
                availablePatients.map((patientId) => (
                  <SelectItem key={patientId} value={patientId}>
                    {patientId}
                  </SelectItem>
                ))
              ) : selectedFacility ? (
                <div className="text-sm text-muted-foreground p-2">
                  No patients found for this facility
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-2">
                  Select a facility first
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Selection Summary */}
        {selectedFacility && (
          <div className="text-xs text-slate-600 bg-white/50 p-2 rounded border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-medium">{selectedFacility}</span>
              {availablePatients.length > 0 && (
                <span className="text-slate-500">
                  {availablePatients.length} patients
                </span>
              )}
            </div>
            {selectedPatientId && (
              <div className="mt-1 pt-1 border-t border-slate-200">
                <span className="font-medium text-blue-600">{selectedPatientId}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}