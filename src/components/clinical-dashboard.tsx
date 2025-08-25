import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@src/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@src/components/ui/select';
import { Label } from '@src/components/ui/label';
import { Checkbox } from '@src/components/ui/checkbox';
import { Loader2, BarChart3, PieChart, LineChart, Table, Filter } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import type { Note } from "@intelligenthealthsolutions/hinge-qm-verification/esm";

interface FacilitiesData {
  facilities: Record<string, string[]>;
}

interface ClinicalDashboardProps {
  selectedFacility?: string;
}

// Color palette for charts
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

export default function ClinicalDashboard({ selectedFacility: propSelectedFacility }: ClinicalDashboardProps) {
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [selectedNoteType, setSelectedNoteType] = useState<string>('all');
  const [availableElements, setAvailableElements] = useState<string[]>([]);

  // Fetch facilities data
  const { data: facilitiesData } = useQuery<FacilitiesData>({
    queryKey: ['/api/facilities'],
    queryFn: () => fetch(`http://localhost:5000/api/facilities`).then(res => res.json())
  });

  // Fetch all notes for the selected facility
  const { data: allNotesData, isLoading } = useQuery<Note[]>({
    queryKey: ['/api/notes/all'],
    queryFn: () => fetch(`http://localhost:5000/api/notes/all`).then(res => res.json()).then(data => data.notes),
    enabled: true
  });

  // Filter notes by selected facility
  const facilityNotes = useMemo(() => {
    if (!allNotesData || !selectedFacility || !facilitiesData) return [];
  console.log('facility notes memoized fn called')

    const facilityPatients = facilitiesData.facilities[selectedFacility] || [];
    return allNotesData.filter(note => facilityPatients.includes(note.patient_id));
  }, [allNotesData, selectedFacility, facilitiesData]);

  // Filter notes by note type
  const filteredNotes = useMemo(() => {
    if (selectedNoteType === 'all') return facilityNotes;
    return facilityNotes.filter(note =>
      note.noteType?.toLowerCase().includes(selectedNoteType.toLowerCase()) ||
      note.description?.toLowerCase().includes(selectedNoteType.toLowerCase())
    );
  }, [facilityNotes, selectedNoteType]);

  // Extract all available abstraction elements
  useEffect(() => {
    if (!facilityNotes.length) {
      setAvailableElements([]);
      setSelectedElements([]);
      return;
    }

    console.log('Analyzing facility notes for elements:', facilityNotes.length);
    const elements = new Set<string>();

    facilityNotes.forEach((note, index) => {
      console.log(`Note ${index}:`, note.noteAbstraction ? 'Has abstraction' : 'No abstraction');
      if (note.noteAbstraction) {
        extractKeys(note.noteAbstraction, '', elements);
      }
    });

    const sortedElements = Array.from(elements).sort();
    console.log('Found elements:', sortedElements);
    setAvailableElements(sortedElements);

    // Auto-select some common elements
    const commonElements = sortedElements.filter(elem => {
      const lower = elem.toLowerCase();
      return lower.includes('psa') ||
             lower.includes('gleason') ||
             lower.includes('pain') ||
             lower.includes('weight') ||
             lower.includes('stage') ||
             lower.includes('grade') ||
             lower.includes('age') ||
             lower.includes('diagnosis') ||
             lower.includes('treatment');
    }).slice(0, 8);

    console.log('Auto-selected elements:', commonElements);
    setSelectedElements(commonElements);
  }, [facilityNotes]);

  // Helper function to extract all keys from nested objects
  const extractKeys = (obj: any, prefix: string, keys: Set<string>) => {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      // Add the key if it has any value (including empty strings, 0, false)
      if (value !== null && value !== undefined) {
        keys.add(fullKey);

        // Recursively extract from nested objects (but not arrays)
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          extractKeys(value, fullKey, keys);
        }
      }
    });
  };

  // Get value from nested object path
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Prepare data for visualization
  const prepareChartData = (element: string) => {
    const data: any[] = [];
    const patientData = new Map<string, any[]>();

    filteredNotes.forEach(note => {
      if (!note.noteAbstraction) return;

      const value = getNestedValue(note.noteAbstraction, element);
      if (value !== null && value !== undefined && value !== '') {
        const patientId = note.patient_id;
        const noteDate = new Date(note.creation).toLocaleDateString();

        if (!patientData.has(patientId)) {
          patientData.set(patientId, []);
        }

        patientData.get(patientId)?.push({
          date: noteDate,
          value: value,
          noteType: note.noteType || 'Unknown',
          patient_id: patientId
        });
      }
    });

    // Convert to chart format
    patientData.forEach((values, patientId) => {
      values.forEach(item => {
        data.push({
          ...item,
          numericValue: parseFloat(item.value) || 0,
          isNumeric: !isNaN(parseFloat(item.value))
        });
      });
    });

    return data;
  };

  // Prepare patient table data
  const prepareTableData = () => {
    const patientMap = new Map<string, any>();

    filteredNotes.forEach(note => {
      if (!note.noteAbstraction) return;

      const patientId = note.patient_id;
      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, { patient_id: patientId });
      }

      const patientRow = patientMap.get(patientId);
      selectedElements.forEach(element => {
        const value = getNestedValue(note.noteAbstraction, element);
        if (value !== null && value !== undefined && value !== '') {
          // Use the most recent value for each element
          if (!patientRow[element] || new Date(note.creation) > new Date(patientRow[`${element}_date`] || 0)) {
            patientRow[element] = value;
            patientRow[`${element}_date`] = note.creation;
          }
        }
      });
    });

    return Array.from(patientMap.values());
  };

  // Render line chart for numeric data
  const renderLineChart = (element: string, data: any[]) => {
    const numericData = data.filter(d => d.isNumeric);
    if (numericData.length === 0) return null;

    // Group by patient for multiple lines
    const patientGroups = numericData.reduce((groups, item) => {
      if (!groups[item.patient_id]) groups[item.patient_id] = [];
      groups[item.patient_id].push(item);
      return groups;
    }, {} as Record<string, any[]>);

    // Sort each patient's data by date
    Object.keys(patientGroups).forEach(patientId => {
      patientGroups[patientId].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    const chartData = numericData.reduce((acc, item) => {
      const existing = acc.find((d: any) => d.date === item.date);
      if (existing) {
        existing[item.patient_id] = item.numericValue;
      } else {
        acc.push({
          date: item.date,
          [item.patient_id]: item.numericValue
        });
      }
      return acc;
    }, [] as any[]);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {Object.keys(patientGroups).map((patient_id, index) => (
            <Line
              key={patient_id}
              type="monotone"
              dataKey={patient_id}
              stroke={COLORS[index % COLORS.length]}
              connectNulls={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    );
  };

  // Render bar chart for categorical data
  const renderBarChart = (element: string, data: any[]) => {
    const categoricalData = data.filter(d => !d.isNumeric);
    if (categoricalData.length === 0) return null;

    const counts = categoricalData.reduce((acc, item) => {
      const value = String(item.value).toLowerCase();
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(counts).map(([value, count]) => ({
      value,
      count
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="value" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill={COLORS[0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render pie chart for categorical data
  const renderPieChart = (element: string, data: any[]) => {
    const categoricalData = data.filter(d => !d.isNumeric);
    if (categoricalData.length === 0) return null;

    const counts = categoricalData.reduce((acc, item) => {
      const value = String(item.value).toLowerCase();
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(counts).map(([value, count]) => ({
      name: value,
      value: count
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart data={chartData} cx="50%" cy="50%" outerRadius={80}>
          <Tooltip />
          <Legend />
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </RechartsPieChart>
      </ResponsiveContainer>
    );
  };

  const handleElementToggle = (element: string, checked: boolean) => {
    if (checked) {
      setSelectedElements(prev => [...prev, element]);
    } else {
      setSelectedElements(prev => prev.filter(e => e !== element));
    }
  };

  const tableData = prepareTableData();
  const noteTypes = Array.from(new Set(facilityNotes.map(note => {
    // Extract meaningful note type
    const noteType = note.noteType || note.description || note.title || 'Unknown';
    return noteType.toString().trim();
  }).filter(type => type && type !== 'Unknown'))).sort();

  console.log('Available note types:', noteTypes);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg text-slate-600">Loading dashboard data...</span>
      </div>
    );
  }

  const facilityNames = facilitiesData ? Object.keys(facilitiesData.facilities).sort() : [];

  if (!selectedFacility) {
    return (
      <div className="space-y-6">
        {/* Dashboard Header with Facility Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Clinical Data Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="facility-select" className="text-sm font-medium">Select Facility</Label>
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger id="facility-select" className="mt-1">
                    <SelectValue placeholder="Choose a facility to analyze..." />
                  </SelectTrigger>
                  <SelectContent>
                    {facilityNames.map(facilityName => (
                      <SelectItem key={facilityName} value={facilityName}>
                        {facilityName} ({facilitiesData?.facilities[facilityName]?.length || 0} patients)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Facility</h3>
                <p className="text-gray-500">Choose a facility above to view dashboard analytics and visualizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Facility Selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Clinical Data Dashboard
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Analyzing {facilityNotes.length} total notes from {facilitiesData?.facilities[selectedFacility]?.length || 0} patients
              </p>
            </div>

            {/* Facility Selection */}
            <div className="min-w-64">
              <Label htmlFor="facility-change" className="text-xs font-medium text-slate-600">Current Facility</Label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger id="facility-change" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {facilityNames.map(facilityName => (
                    <SelectItem key={facilityName} value={facilityName}>
                      {facilityName} ({facilitiesData?.facilities[facilityName]?.length || 0} patients)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Element Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Select Data Elements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {availableElements.length > 0 ? (
                availableElements.map(element => (
                  <div key={element} className="flex items-center space-x-2">
                    <Checkbox
                      id={element}
                      checked={selectedElements.includes(element)}
                      onCheckedChange={(checked) => handleElementToggle(element, !!checked)}
                    />
                    <Label htmlFor={element} className="text-xs cursor-pointer">{element}</Label>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground p-4 text-center border border-dashed rounded">
                  {facilityNotes.length > 0
                    ? 'No abstraction elements found in selected facility notes'
                    : 'Select a facility to see available data elements'
                  }
                </div>
              )}
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Available: {availableElements.length} elements | Selected: {selectedElements.length} elements
            </div>
          </CardContent>
        </Card>

        {/* Note Type Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filter by Note Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedNoteType} onValueChange={setSelectedNoteType}>
              <SelectTrigger>
                <SelectValue placeholder="Select note type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Note Types ({facilityNotes.length} notes)</SelectItem>
                {noteTypes.length > 0 ? (
                  noteTypes.map(type => {
                    const count = facilityNotes.filter(note => {
                      const noteType = note.noteType || note.description || note.title || '';
                      return noteType.toString().toLowerCase().includes(type.toLowerCase());
                    }).length;
                    return (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type} ({count} notes)
                      </SelectItem>
                    );
                  })
                ) : (
                  <SelectItem value="none" disabled>
                    No note types available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <div className="mt-2 text-xs text-muted-foreground">
              Showing {filteredNotes.length} filtered notes | Available types: {noteTypes.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      {selectedElements.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {selectedElements.map(element => {
            const data = prepareChartData(element);
            if (data.length === 0) return null;

            const hasNumericData = data.some(d => d.isNumeric);
            const hasCategoricalData = data.some(d => !d.isNumeric);

            return (
              <Card key={element}>
                <CardHeader>
                  <CardTitle className="text-sm">{element}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {data.length} data points from {new Set(data.map(d => d.patient_id)).size} patients
                  </p>
                </CardHeader>
                <CardContent>
                  {hasNumericData ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <LineChart className="h-4 w-4" />
                        <span className="text-xs font-medium">Trend Over Time</span>
                      </div>
                      {renderLineChart(element, data)}
                    </div>
                  ) : hasCategoricalData ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <PieChart className="h-4 w-4" />
                        <span className="text-xs font-medium">Distribution</span>
                      </div>
                      {renderBarChart(element, data)}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Patient Data Table */}
      {selectedElements.length > 0 && tableData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Table className="h-4 w-4" />
              Patient Data Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Patient ID</th>
                    {selectedElements.map(element => (
                      <th key={element} className="text-left p-2 font-medium">
                        {element}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((patient, index) => (
                    <tr key={patient.patient_id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2 font-medium text-blue-600">{patient.patient_id}</td>
                      {selectedElements.map(element => (
                        <td key={element} className="p-2">
                          {patient[element] ? String(patient[element]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
