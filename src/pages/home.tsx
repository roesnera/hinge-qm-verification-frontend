import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@src/components/ui/button";
import { noteAbstractionSchema, type Note } from "@intelligenthealthsolutions/hinge-qm-verification/esm";
import { queryClient } from "@src/lib/queryClient";
import CompactFacilityPatientSelector from "@src/components/compact-facility-patient-selector";
import PatientTimeline from "@src/components/patient-timeline";
import EditControls from "@src/components/edit-controls";
import TabNavigation from "@src/components/tab-navigation";
import ConsultNote from "@src/components/notes/consult-note";
import CTSimulationNote from "@src/components/notes/ct-simulation-note";
import DailyTreatmentNote from "@src/components/notes/daily-treatment-note";
import WeeklyTreatmentNote from "@src/components/notes/weekly-treatment-note";
import NurseNote from "@src/components/notes/nurse-note";
import TreatmentSummaryNote from "@src/components/notes/treatment-summary-note";
import FollowupNote from "@src/components/notes/followup-note";
import ClinicalDashboard from "@src/components/clinical-dashboard";
import { SideBySideView } from "@src/components/side-by-side-view";
import QualityMeasuresPanel from "@src/components/quality-measures-panel";
import { Loader2, Award } from "lucide-react";

export default function Home() {
  // Main view mode
  const [viewMode, setViewMode] = useState<'patient' | 'analytics'>('patient');

  // Selected patient ID
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  // Selected tab
  const [activeTab, setActiveTab] = useState<string>("consult");

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Edited fields tracking
  const [editedNotes, setEditedNotes] = useState<Record<string, Note>>({});

  // Clinical note side-by-side view state
  const [selectedNoteForSideBySide, setSelectedNoteForSideBySide] = useState<Note | null>(null);
  const [isSideBySideView, setIsSideBySideView] = useState<boolean>(false);

  // Quality measures panel state
  const [isQualityMeasuresPanelOpen, setIsQualityMeasuresPanelOpen] = useState<boolean>(false);

  // Fetch patient notes when a patient is selected
  const { data: rawNotesData, isLoading: isLoadingNotes } = useQuery<{},{},Note[]>({
    queryKey: ['/api/patients', selectedPatientId, 'notes'],
    queryFn: async () => {
        return await fetch(`http://localhost:5000/api/patients/${selectedPatientId}/notes`)
          .then(res => res.json())
          .then(data => data.notes)
      },
    enabled: !!selectedPatientId
  });

  const notesData = rawNotesData?.filter(entry => {
    return !!entry.id
  }) ?? []

  // Fetch quality measures for the selected patient
  const { data: qualityMeasuresData, isLoading: _isLoadingQualityMeasures } = useQuery({
    queryKey: ['/api/patients', selectedPatientId, 'quality-measures'],
    queryFn: () =>
      fetch(`http://localhost:5000/api/patients/${selectedPatientId}/quality-measures`)
        .then(res => res.json())
        .then(data => data.qualityMeasures),
    enabled: !!selectedPatientId
  });

  // Fetch all patient notes for analytics (when in analytics mode)
  const { data: _allNotesData, isLoading: _isLoadingAllNotes } = useQuery({
    queryKey: ['/api/patients/all-notes'],
    queryFn: async () => {
      const patientsResponse = await fetch(`http://localhost:5000/api/patients`);
      const { patientIds } = await patientsResponse.json();

      const allNotes: Note[] = [];
      for (const patientId of patientIds) {
        const notesResponse = await fetch(`http://localhost:5000/api/patients/${patientId}/notes`);
        const { notes } = await notesResponse.json();
        allNotes.push(...notes);
      }
      return allNotes;
    },
    enabled: viewMode === 'analytics'
  });

  // Group notes by type for tabs
  const groupedNotes = notesData ? groupNotesByType(notesData) : {};

  // Calculate quality measures counts
  const qualityMeasuresCounts = qualityMeasuresData ? {
    passed: Object.values(qualityMeasuresData[0]?.data || {}).filter((measure: any) => measure.final_outcome?.toLowerCase() === 'pass').length,
    failed: Object.values(qualityMeasuresData[0]?.data || {}).filter((measure: any) => measure.final_outcome?.toLowerCase() === 'fail').length,
    excluded: Object.values(qualityMeasuresData[0]?.data || {}).filter((measure: any) =>
      measure.final_outcome?.toLowerCase() === 'exclusion' ||
      measure.final_outcome?.toLowerCase() === 'excluded' ||
      measure.final_outcome?.toLowerCase() === 'exclude'
    ).length
  } : { passed: 0, failed: 0, excluded: 0 };

  // Handle patient selection from dropdown
  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    setIsEditMode(false);
    setEditedNotes({});
    setIsSideBySideView(false);
    setSelectedNoteForSideBySide(null);
    setIsQualityMeasuresPanelOpen(false);
  };

  // Handle opening clinical note side-by-side view
  const handleOpenNoteSideBySide = (note: Note) => {
    setSelectedNoteForSideBySide(note);
    setIsSideBySideView(true);
  };

  // Handle closing clinical note side-by-side view
  const handleCloseNoteSideBySide = () => {
    setIsSideBySideView(false);
    setSelectedNoteForSideBySide(null);
  };

  // Handle opening quality measures panel
  const handleOpenQualityMeasures = () => {
    setIsQualityMeasuresPanelOpen(true);
  };

  // Handle closing quality measures panel
  const handleCloseQualityMeasures = () => {
    setIsQualityMeasuresPanelOpen(false);
  };

  // Toggle edit mode
  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // If we're turning off edit mode, reset edited notes
      setEditedNotes({});
    }
  };

  // Handle saving changes
  const handleSaveChanges = async () => {
    try {
      const noteIds = Object.keys(editedNotes);

      for (const noteId of noteIds) {
        const fieldChanges = editedNotes[noteId];
        const originalNote = notesData.find((n: Note) => n.id === noteId);

        if (!originalNote) continue;

        // Apply field changes to create the updated note
        const updatedNote = JSON.parse(JSON.stringify(originalNote));

        Object.entries(fieldChanges).forEach(([fieldPath, value]) => {
          updateFieldByPath(updatedNote, fieldPath, value);
        });

        await fetch(`${process.env.API_URL||'http://localhost:5000'}/api/notes/${noteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedNote),
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/patients', selectedPatientId, 'notes'] });

      // Exit edit mode
      setIsEditMode(false);
      setEditedNotes({});
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  // Track changes in edited fields
  const handleFieldEdit = (noteId: string, fieldPath: string, value: any) => {
    setEditedNotes(prev => ({
      ...prev,
      [noteId]: {
        ...prev[noteId],
        [fieldPath]: value
      }
    }));
  };

  // Helper to update a nested field by path
  const updateFieldByPath = (obj: any, path: string, value: any) => {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      // Handle array indices in the path
      if (part.includes('[') && part.includes(']')) {
        const arrayName = part.substring(0, part.indexOf('['));
        const index = parseInt(part.substring(part.indexOf('[') + 1, part.indexOf(']')));

        if (!current[arrayName]) current[arrayName] = [];
        if (!current[arrayName][index]) current[arrayName][index] = {};

        current = current[arrayName][index];
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }

    const lastPart = parts[parts.length - 1];

    // Handle array index in the last part
    if (lastPart.includes('[') && lastPart.includes(']')) {
      const arrayName = lastPart.substring(0, lastPart.indexOf('['));
      const index = parseInt(lastPart.substring(lastPart.indexOf('[') + 1, lastPart.indexOf(']')));

      if (!current[arrayName]) current[arrayName] = [];
      current[arrayName][index] = value;
    } else {
      current[lastPart] = value;
    }
  };

  // Function to group notes by type
  function groupNotesByType(notes: Note[]) {
    // console.log('All notes:', notes);

    const grouped: Record<string, Note[]> = {};

    notes.forEach(note => {
      // Check if noteType exists, otherwise fall back to using description
      const type = note.noteType
        ? mapNoteTypeToTab(note.noteType)
        : mapNoteTypeToTab(note.description || '');

      // console.log('Processing note:', note.id,
      //             'noteType:', note.noteType || 'undefined',
      //             'description:', note.description || 'undefined',
      //             'mappedType:', type);

      if (!grouped[type]) {
        grouped[type] = [];
      }

      grouped[type].push(note);
    });

    // Sort notes by creation date (newest first) within each type
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => {
        return new Date(b.creation).getTime() - new Date(a.creation).getTime();
      });
    });

    // console.log('Grouped notes:', Object.keys(grouped));
    return grouped;
  }

  // Map note type to tab key
  function mapNoteTypeToTab(noteType: string): string {
    if (!noteType) return 'other';

    const typeLower = noteType.toLowerCase();
    // console.log('Mapping type:', typeLower);

    // First check exact matches to avoid false positives
    if (typeLower === 'follow-up' || typeLower === 'followup' || typeLower === 'follow up') return 'followup';

    // Then check for included terms
    if (typeLower.includes('consult')) return 'consult';
    if (typeLower.includes('ct') && typeLower.includes('simulation')) return 'ct-simulation';
    if (typeLower.includes('simulation')) return 'ct-simulation'; // Catch SIMULATION noteType
    if (typeLower.includes('daily') && typeLower.includes('treatment')) return 'daily-treatment';
    if (typeLower.includes('weekly') && typeLower.includes('treatment')) return 'weekly-treatment';
    if (typeLower.includes('nurse')) return 'nurse';
    if (typeLower.includes('treatment') && typeLower.includes('summary')) return 'treatment-summary';

    // More specific check for followup variations
    if (typeLower.includes('follow') && (typeLower.includes('up') || typeLower.includes('-up'))) return 'followup';

    // Log for debugging
    console.log('Note type not matched:', noteType);

    return 'other';
  }

  // Extract diagnosis info from notes
  const getDiagnosisFromNotes = (notes: Note[]) => {
    if (!notes || notes.length === 0) return null;

    // First look for diagnosis in consult notes
    const consultNotes = notes.filter(n =>
      (n.noteType && n.noteType.toLowerCase().includes('consult')) ||
      (n.description && n.description.toLowerCase().includes('consult'))
    );

    if (consultNotes.length > 0) {
      const cancerType = consultNotes[0].noteAbstraction?.diagnosis?.cancer_type;
      if (cancerType) {
        return { cancer_type: cancerType };
      }
    }

    // Then check in other note types in order of preference
    const noteTypes = ['simulation', 'weekly', 'followup'];

    for (const type of noteTypes) {
      const matchingNotes = notes.filter(n =>
        (n.noteType && n.noteType.toLowerCase().includes(type)) ||
        (n.description && n.description.toLowerCase().includes(type))
      );

      if (matchingNotes.length > 0) {
        // Check both diagnosis.cancer_type and direct diagnosis field
        const note = matchingNotes[0];
        if (note.noteAbstraction?.diagnosis?.cancer_type) {
          return { cancer_type: note.noteAbstraction.diagnosis.cancer_type };
        }
        if (note.noteAbstraction?.diagnosis && typeof note.noteAbstraction.diagnosis === 'string') {
          return { cancer_type: note.noteAbstraction.diagnosis };
        }
      }
    }

    return null;
  };

  // Get patient demographics from the first note (if available)
  const patientInfo = notesData?.length > 0
    ? notesData[0].noteAbstraction?.demographics
    : null;

  // Get diagnosis from notes
  const diagnosisInfo = notesData ? getDiagnosisFromNotes(notesData) : null;

  // Get current notes for the active tab
  const currentTabNotes = groupedNotes[activeTab] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-2 max-w-7xl">
          {/* Single Row Layout */}
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title */}
            <div className="flex-shrink-0">
              <h1 className="text-lg font-bold text-slate-800">
                {viewMode === 'patient' ? 'Clinical Notes' : 'Analytics'}
              </h1>
            </div>

            {/* Center: Patient Selection (only in patient mode) */}
            {viewMode === 'patient' && (
              <div className="flex-1 max-w-2xl">
                <CompactFacilityPatientSelector onSelect={handlePatientSelect} selectedPatientId={selectedPatientId} />
              </div>
            )}

            {/* Right: Patient Info + Mode Toggle */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Patient Quick Info */}
              {selectedPatientId && (
                <div className="text-xs text-slate-600 bg-blue-50 px-3 py-2 rounded border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-1">ID:</span>
                      <span className="font-medium text-blue-700">{selectedPatientId}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-1">Age:</span>
                      <span className="font-medium">{patientInfo?.age || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-1">Gender:</span>
                      <span className="font-medium">{patientInfo?.gender || 'N/A'}</span>
                    </div>
                    {diagnosisInfo?.cancer_type && (
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-1">Diagnosis:</span>
                        <span className="font-medium text-orange-600">{diagnosisInfo.cancer_type.split(' ')[0]}</span>
                      </div>
                    )}
                    {notesData && (
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-1">Notes:</span>
                        <span className="font-medium text-green-600">{notesData.length}</span>
                      </div>
                    )}
                    {qualityMeasuresCounts && (qualityMeasuresCounts.passed + qualityMeasuresCounts.failed + qualityMeasuresCounts.excluded) > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 mr-1">QM:</span>
                        <div className="flex gap-1">
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">{qualityMeasuresCounts.passed}P</span>
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">{qualityMeasuresCounts.failed}F</span>
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">{qualityMeasuresCounts.excluded}E</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Quality Measures Button - only show in patient mode with selected patient */}
                {viewMode === 'patient' && selectedPatientId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenQualityMeasures}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 text-xs h-7 px-2"
                  >
                    <Award className="w-3 h-3 mr-1" />
                    Quality
                  </Button>
                )}

                {/* Mode Toggle */}
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'patient' ? 'default' : 'outline'}
                    onClick={() => setViewMode('patient')}
                    size="sm"
                    className="text-xs h-7 px-2"
                  >
                    Patient
                  </Button>
                  <Button
                    variant={viewMode === 'analytics' ? 'default' : 'outline'}
                    onClick={() => setViewMode('analytics')}
                    size="sm"
                    className="text-xs h-7 px-2"
                  >
                    Analytics
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Maximized */}
      <div className="container mx-auto px-4 py-2 max-w-7xl" style={{ minHeight: '85vh' }}>

      {/* Edit Controls */}
      {selectedPatientId && (
        <EditControls
          isVisible={isEditMode}
          onSave={handleSaveChanges}
          onCancel={() => setIsEditMode(false)}
        />
      )}

      {/* Patient Timeline - Expanded */}
      {selectedPatientId && notesData && notesData.length > 0 && (
        <div className="mb-3">
          <PatientTimeline notes={notesData} />
        </div>
      )}

      {/* Main Content Area */}
      {selectedPatientId && (
        <div>
          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            availableTabs={Object.keys(groupedNotes)}
          />

          {/* Content Area */}
          {isLoadingNotes ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-lg text-slate-600">Loading patient notes...</span>
            </div>
          ) : (
            <div>
              {activeTab === 'consult' && (
                <ConsultNote
                  notes={currentTabNotes}
                  isEditMode={isEditMode}
                  onEdit={handleFieldEdit}
                  onToggleEditMode={handleToggleEditMode}
                  onViewNote={handleOpenNoteSideBySide}
                />
              )}

              {activeTab === 'ct-simulation' && (
                <CTSimulationNote
                  notes={currentTabNotes}
                  isEditMode={isEditMode}
                  onEdit={handleFieldEdit}
                  onToggleEditMode={handleToggleEditMode}
                  onViewNote={handleOpenNoteSideBySide}
                />
              )}

              {activeTab === 'daily-treatment' && (
                <DailyTreatmentNote
                  notes={currentTabNotes}
                  isEditMode={isEditMode}
                  onEdit={handleFieldEdit}
                  onToggleEditMode={handleToggleEditMode}
                  onViewNote={handleOpenNoteSideBySide}
                />
              )}

              {activeTab === 'weekly-treatment' && (
                <WeeklyTreatmentNote
                  notes={currentTabNotes}
                  isEditMode={isEditMode}
                  onEdit={handleFieldEdit}
                  onToggleEditMode={handleToggleEditMode}
                  onViewNote={handleOpenNoteSideBySide}
                />
              )}

              {activeTab === 'nurse' && (
                <NurseNote
                  notes={currentTabNotes}
                  isEditMode={isEditMode}
                  onEdit={handleFieldEdit}
                  onToggleEditMode={handleToggleEditMode}
                  onViewNote={handleOpenNoteSideBySide}
                />
              )}

              {activeTab === 'treatment-summary' && (
                <TreatmentSummaryNote
                  notes={currentTabNotes}
                  isEditMode={isEditMode}
                  onEdit={handleFieldEdit}
                  onToggleEditMode={handleToggleEditMode}
                  onViewNote={handleOpenNoteSideBySide}
                />
              )}

              {activeTab === 'followup' && (
                <FollowupNote
                  notes={currentTabNotes}
                  isEditMode={isEditMode}
                  onEdit={handleFieldEdit}
                  onToggleEditMode={handleToggleEditMode}
                  onViewNote={handleOpenNoteSideBySide}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Analytics View - Clinical Dashboard */}
      {viewMode === 'analytics' && (
        <ClinicalDashboard />
      )}

      {/* Clinical Note Side-by-Side View */}
      <SideBySideView
        selectedNote={selectedNoteForSideBySide}
        isVisible={isSideBySideView}
        onClose={handleCloseNoteSideBySide}
        isEditMode={isEditMode}
        onEdit={handleFieldEdit}
        onToggleEditMode={handleToggleEditMode}
        onSave={handleSaveChanges}
        activeTab={activeTab}
        hasUnsavedChanges={Object.keys(editedNotes).length > 0}
        groupedNotes={groupedNotes}
        onTabChange={setActiveTab}
        onNoteSelect={(note, tab) => {
          setSelectedNoteForSideBySide(note);
          setActiveTab(tab);
        }}
        editedNotes={editedNotes}
      />

      {/* Quality Measures Panel */}
      {selectedPatientId && (
        <QualityMeasuresPanel
          patientId={selectedPatientId}
          isOpen={isQualityMeasuresPanelOpen}
          onClose={handleCloseQualityMeasures}
        />
      )}
      </div>
    </div>
  );
}
