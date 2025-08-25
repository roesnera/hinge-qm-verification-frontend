import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@src/components/ui/card";
import EditableField from "@src/components/editable-field";
import { Button } from "@src/components/ui/button";
import { Pencil, FileText } from "lucide-react";
import type { Note } from "@intelligenthealthsolutions/hinge-qm-verification/esm";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui/select";
import { Badge } from "@src/components/ui/badge";

interface NurseNoteProps {
  notes: Note[];
  isEditMode: boolean;
  onEdit: (noteId: string, fieldPath: string, value: any) => void;
  onToggleEditMode: () => void;
  onViewNote?: (note: Note) => void;
}

export default function NurseNote({ notes, isEditMode, onEdit, onToggleEditMode, onViewNote }: NurseNoteProps) {
  // If no notes, show empty state
  if (!notes || notes.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No nurse notes available</p>
        </CardContent>
      </Card>
    );
  }

  // Sort notes by creation date (newest first)
  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.creation).getTime() - new Date(a.creation).getTime()
  );

  // State to track which note is currently selected
  const [selectedNoteId, setSelectedNoteId] = useState<string>(sortedNotes[0].id);

  // Find the currently selected note
  const selectedNote = sortedNotes.find(n => n.id === selectedNoteId) || sortedNotes[0];
  const note = selectedNote;
  const noteData = note.noteAbstraction;

  // Format the date for display
  const creationDate = note.creation ? new Date(note.creation) : null;
  const formattedDate = creationDate ? format(creationDate, 'MM/dd/yyyy') : 'Unknown date';

  // Helper function to create edit handler for a specific field
  const createEditHandler = (fieldPath: string) => (value: string) => {
    onEdit(note.id, fieldPath, value);
  };

  // Helper to format blood pressure display
  const formatBloodPressure = (bp: any) => {
    if (!bp) return '';
    if (typeof bp === 'string') return bp;
    if (bp.systolic && bp.diastolic) return `${bp.systolic}/${bp.diastolic}`;
    return '';
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b">
        <div>
          <CardTitle className="text-xl font-semibold text-slate-800">
            Radiation Oncology Nurse
          </CardTitle>
          <div className="flex items-center space-x-2">
            <p className="text-slate-500 text-sm">{formattedDate}</p>
            {sortedNotes.length > 1 && (
              <Badge variant="outline" className="text-xs">
                {sortedNotes.length} notes available
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {onViewNote && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewNote(note)}
            >
              <FileText className="h-4 w-4 mr-1.5" /> View Original
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleEditMode}
          >
            <Pencil className="h-4 w-4 mr-1.5" /> Edit
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {sortedNotes.length > 1 && (
          <div className="mb-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">
                Select note version:
              </label>
              <Select
                value={selectedNoteId}
                onValueChange={(value: string) => {
                  setSelectedNoteId(value);
                }}
              >
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select a note by date" />
                </SelectTrigger>
                <SelectContent>
                  {sortedNotes.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.creation ? format(new Date(n.creation), 'MMM d, yyyy') : 'Unknown date'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vitals */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Vitals</h3>
            <div className="grid grid-cols-2 gap-3">
              {noteData?.vitals && (
                <>
                  <EditableField
                    label="Temperature"
                    value={noteData.vitals.temperature}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.vitals.temperature")}
                  />
                  <EditableField
                    label="Blood Pressure"
                    value={formatBloodPressure(noteData.vitals.blood_pressure)}
                    isEditMode={isEditMode}
                    onEdit={(value) => {
                      // Handle BP as a string for simplicity
                      onEdit(note.id, "noteAbstraction.vitals.blood_pressure", value);
                    }}
                  />
                  <EditableField
                    label="Pulse"
                    value={noteData.vitals.pulse}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.vitals.pulse")}
                  />
                  <EditableField
                    label="Respiratory Rate"
                    value={noteData.vitals.respiratory_rate}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.vitals.respiratory_rate")}
                  />
                  <EditableField
                    label="Weight"
                    value={noteData.vitals.weight ? `${noteData.vitals.weight} lbs` : null}
                    isEditMode={isEditMode}
                    onEdit={(value) => {
                      // Remove lbs if present
                      const numericValue = value.replace(' lbs', '');
                      onEdit(note.id, "noteAbstraction.vitals.weight", numericValue);
                    }}
                  />
                  {noteData?.assessment && (
                    <EditableField
                      label="Pain Score"
                      value={noteData.assessment.pain_score}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.assessment.pain_score")}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Review of Systems */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Review of Systems</h3>
            <div className="space-y-3">
              {noteData?.review_of_systems && (
                <>
                  <EditableField
                    label="General"
                    value={noteData.review_of_systems.general}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.review_of_systems.general")}
                  />
                  <EditableField
                    label="Neuro"
                    value={noteData.review_of_systems.neuro}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.review_of_systems.neuro")}
                  />
                  <EditableField
                    label="Mood"
                    value={noteData.review_of_systems.mood}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.review_of_systems.mood")}
                  />
                  <EditableField
                    label="Energy"
                    value={noteData.review_of_systems.energy}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.review_of_systems.energy")}
                  />
                  <EditableField
                    label="HEENT"
                    value={noteData.review_of_systems.HEENT}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.review_of_systems.HEENT")}
                  />
                </>
              )}
            </div>
          </div>

          {/* Additional Systems Review */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Additional Systems</h3>
            <div className="space-y-3">
              {noteData?.review_of_systems && (
                <>
                  <EditableField
                    label="Cardiac"
                    value={noteData.review_of_systems.cardiac}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.review_of_systems.cardiac")}
                  />
                  <EditableField
                    label="Pulmonary"
                    value={noteData.review_of_systems.pulmonary}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.review_of_systems.pulmonary")}
                  />
                  <EditableField
                    label="GI"
                    value={noteData.review_of_systems.gi}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.review_of_systems.gi")}
                  />
                  <EditableField
                    label="GU"
                    value={noteData.review_of_systems.gu}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.review_of_systems.gu")}
                  />
                  <EditableField
                    label="Skin"
                    value={noteData.review_of_systems.skin}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.review_of_systems.skin")}
                  />
                </>
              )}
            </div>
          </div>

          {/* Concerns */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Concerns & Interventions</h3>
            <div className="space-y-3">
              <EditableField
                label="Concerns"
                value={noteData?.concerns}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.concerns")}
                multiline
              />
              <EditableField
                label="Interventions"
                value={noteData?.interventions}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.interventions")}
                multiline
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
