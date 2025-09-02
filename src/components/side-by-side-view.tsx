import { useQuery } from '@tanstack/react-query';
import { Button } from '@src/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@src/components/ui/tabs';
import { Badge } from '@src/components/ui/badge';
import { X, FileText, Calendar, User, Pencil, Save } from 'lucide-react';
import type { Note } from "@intelligenthealthsolutions/hinge-analyze/esm";
import ConsultNote from './notes/consult-note';
import CTSimulationNote from './notes/ct-simulation-note';
import DailyTreatmentNote from './notes/daily-treatment-note';
import WeeklyTreatmentNote from './notes/weekly-treatment-note';
import NurseNote from './notes/nurse-note';
import TreatmentSummaryNote from './notes/treatment-summary-note';
import FollowupNote from './notes/followup-note';
import TextSearch from './text-search';

interface SideBySideViewProps {
  selectedNote: Note | null;
  isVisible: boolean;
  onClose: () => void;
  isEditMode: boolean;
  onEdit: (noteId: string, fieldPath: string, value: any) => void;
  onToggleEditMode: () => void;
  onSave: () => void;
  activeTab: string;
  hasUnsavedChanges?: boolean;
  groupedNotes?: Record<string, Note[]>;
  onTabChange?: (tab: string) => void;
  onNoteSelect?: (note: Note, tab: string) => void;
  editedNotes?: Record<string, any>;
}

interface ClinicalNoteText {
  noteText: string;
}

export function SideBySideView({
  selectedNote,
  isVisible,
  onClose,
  isEditMode,
  onEdit,
  onToggleEditMode,
  onSave,
  activeTab,
  hasUnsavedChanges = false,
  groupedNotes = {},
  onTabChange,
  onNoteSelect,
  editedNotes = {}
}: SideBySideViewProps) {
  const { data: clinicalNoteText, isLoading, error } = useQuery<ClinicalNoteText>({
    queryKey: ['/api/notes', selectedNote?.id, 'text'],
    queryFn: () =>
      fetch(`http://localhost:5000/api/notes/${selectedNote?.id}/text`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch clinical note text');
          }
          return res.json();
        }),
    enabled: !!selectedNote?.id && isVisible,
  });

  if (!isVisible || !selectedNote) {
    return null;
  }

  // Dummy function for viewing original notes (not needed in side-by-side)
  const handleViewNote = () => {};

  const renderAbstractionComponent = () => {
    if (!selectedNote) return null;

    // Apply edited changes to the selected note with deep merge
    const applyEditsToNote = (note: Note, edits: any): Note => {
      if (!edits) return note;

      const result = { ...note };

      // Apply edits using field paths (like "noteAbstraction.diagnosis.cancer_type")
      Object.entries(edits).forEach(([fieldPath, value]) => {
        const keys = fieldPath.split('.');
        let current = result as any;

        // Navigate to the parent object, ensuring each level exists
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (current[key] === undefined || current[key] === null) {
            current[key] = {};
          }
          current = current[key];
        }

        // Set the final value only if the parent object exists
        const finalKey = keys[keys.length - 1];
        if (current && typeof current === 'object') {
          current[finalKey] = value;
        }
      });

      return result;
    };

    const noteWithEdits = applyEditsToNote(selectedNote, editedNotes[selectedNote.id]);
    const notes = [noteWithEdits];
    const props = {
      notes,
      isEditMode,
      onEdit,
      onToggleEditMode,
      onViewNote: handleViewNote
    };

    switch (activeTab) {
      case 'consult':
        return <ConsultNote {...props} />;
      case 'ct-simulation':
        return <CTSimulationNote {...props} />;
      case 'daily-treatment':
        return <DailyTreatmentNote {...props} />;
      case 'weekly-treatment':
        return <WeeklyTreatmentNote {...props} />;
      case 'nurse':
        return <NurseNote {...props} />;
      case 'treatment-summary':
        return <TreatmentSummaryNote {...props} />;
      case 'followup':
        return <FollowupNote {...props} />;
      default:
        return <div>Unknown note type</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex">
      {/* Left Panel - Abstracted Data */}
      <div className="w-1/2 border-r border-gray-200 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Abstracted Data</h2>
          </div>
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && isEditMode && (
              <Button
                variant="default"
                size="sm"
                onClick={onSave}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save Changes
              </Button>
            )}
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleEditMode}
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              {isEditMode ? "Done Editing" : "Edit"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tab Navigation */}
          {groupedNotes && Object.keys(groupedNotes).length > 1 && (
            <div className="border-b bg-gray-50">
              <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="h-auto p-1 bg-transparent">
                  {Object.entries(groupedNotes).map(([tabKey, tabNotes]) => {
                    const tabLabels = {
                      'consult': 'Consult',
                      'ct-simulation': 'CT Simulation',
                      'daily-treatment': 'Daily Treatment',
                      'weekly-treatment': 'Weekly Treatment',
                      'nurse': 'Nurse Notes',
                      'treatment-summary': 'Treatment Summary',
                      'followup': 'Follow-up'
                    };

                    return (
                      <TabsTrigger
                        key={tabKey}
                        value={tabKey}
                        className="text-xs"
                      >
                        {(tabLabels as any)[tabKey] || tabKey}
                        {tabNotes.length > 1 && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {tabNotes.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>
          )}

          <div className="flex-1 overflow-auto p-6">
            {renderAbstractionComponent()}
          </div>
        </div>
      </div>

      {/* Right Panel - Clinical Note */}
      <div className="w-1/2 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Original Clinical Note</h2>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{selectedNote.creation ? new Date(selectedNote.creation).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{selectedNote.enteredBy || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading clinical note...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Failed to load clinical note text</p>
                <p className="text-xs mt-1">Note ID: {selectedNote?.id}</p>
              </div>
            </div>
          ) : clinicalNoteText?.noteText ? (
            <TextSearch
              text={clinicalNoteText.noteText}
              onHighlight={(searchTerm, matches) => {
                // Optional: Handle search feedback here
                console.log(`Found ${matches} matches for "${searchTerm}"`);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Clinical note text not available</p>
                <p className="text-xs mt-1">Note ID: {selectedNote?.id}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
