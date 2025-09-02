import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@src/components/ui/card";
import EditableField from "@src/components/editable-field";
import { Button } from "@src/components/ui/button";
import { Pencil, FileText } from "lucide-react";
import type { Note } from "@intelligenthealthsolutions/hinge-analyze/esm";
import { format } from "@src/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui/select";
import { Badge } from "@src/components/ui/badge";
import DynamicFieldEditor from "@src/components/dynamic-field-editor";

interface TreatmentSummaryNoteProps {
  notes: Note[];
  isEditMode: boolean;
  onEdit: (noteId: string, fieldPath: string, value: any) => void;
  onToggleEditMode: () => void;
  onViewNote?: (note: Note) => void;
}

export default function TreatmentSummaryNote({ notes, isEditMode, onEdit, onToggleEditMode, onViewNote }: TreatmentSummaryNoteProps) {
  // If no notes, show empty state
  if (!notes || notes.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No treatment summary notes available</p>
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

  // Format the creation date for display
  const creationDate = note.creation ? new Date(note.creation) : null;
  const formattedDate = creationDate ? format(creationDate, 'MMM d, yyyy') : 'Unknown date';

  // Format dates
  const formatDateString = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (e) {
      return dateStr; // Return original if parsing fails
    }
  };

  // Helper function to create edit handler for a specific field
  const createEditHandler = (fieldPath: string) => (value: string) => {
    onEdit(note.id, fieldPath, value);
  };

  // Find treatment periods
  const startDate = noteData?.treatment_sites?.[0]?.first_treatment_date || '';
  const endDate = noteData?.treatment_completion_date || '';

  // Calculate total sessions
  const totalSessions = noteData?.treatment_sites?.[0]?.treatment_number || '0';

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b">
        <div>
          <CardTitle className="text-xl font-semibold text-slate-800">
            Radiation Oncology Treatment Summary
          </CardTitle>
          <div className="flex items-center space-x-2">
            <p className="text-slate-500 text-sm">
              {formatDateString(noteData?.treatment_completion_date) || formattedDate}
            </p>
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
        {/* Treatment Overview Box */}
        <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-primary-600 uppercase">Treatment Period</h3>
              <p className="text-sm">
                {formatDateString(startDate)} - {formatDateString(endDate)}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-primary-600 uppercase">Total Treatments</h3>
              <p className="text-sm">{totalSessions} Sessions</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-primary-600 uppercase">Treatment Status</h3>
              <p className="text-sm font-medium text-emerald-600">{noteData?.treatment_status || 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Treatment Details */}
          <div>
            <div className="bg-slate-50 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Diagnosis & Treatment</h3>
              <div className="space-y-3">
                <EditableField
                  label="Diagnosis"
                  value={noteData?.diagnosis}
                  isEditMode={isEditMode}
                  onEdit={createEditHandler("noteAbstraction.diagnosis")}
                  multiline
                />

                {noteData?.treatment_sites?.[0] && (
                  <EditableField
                    label="Treatment Site"
                    value={noteData.treatment_sites[0].treatment_site_name}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.treatment_sites[0].treatment_site_name")}
                    isRequired={true}
                  />
                )}

                <EditableField
                  label="Intent"
                  value={noteData?.intent}
                  isEditMode={isEditMode}
                  onEdit={createEditHandler("noteAbstraction.intent")}
                  isRequired={true}
                />

                <EditableField
                  label="Technique"
                  value={noteData?.technique}
                  isEditMode={isEditMode}
                  onEdit={createEditHandler("noteAbstraction.technique")}
                />

                <EditableField
                  label="Modality"
                  value={noteData?.modality}
                  isEditMode={isEditMode}
                  onEdit={createEditHandler("noteAbstraction.modality")}
                />

                <EditableField
                  label="Concurrent Chemotherapy"
                  value={noteData?.concurrent_chemotherapy}
                  isEditMode={isEditMode}
                  onEdit={createEditHandler("noteAbstraction.concurrent_chemotherapy")}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Treatment Course</h3>
              <div className="space-y-3">
                {noteData?.treatment_sites?.[0] && (
                  <>
                    <EditableField
                      label="First Treatment Date"
                      value={noteData.treatment_sites[0].first_treatment_date}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.treatment_sites[0].first_treatment_date")}
                      isRequired={true}
                    />

                    <EditableField
                      label="Total Treatments"
                      value={noteData.treatment_sites[0].treatment_number}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.treatment_sites[0].treatment_number")}
                      isRequired={true}
                    />

                    <EditableField
                      label="Daily Dose (cGy)"
                      value={noteData.treatment_sites[0].daily_dose}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.treatment_sites[0].daily_dose")}
                      isRequired={true}
                    />

                    <EditableField
                      label="Cumulative Dose (cGy)"
                      value={noteData.treatment_sites[0].cumulative_dose_received_to_date}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.treatment_sites[0].cumulative_dose_received_to_date")}
                    />
                    <EditableField
                      label="Total Dose (cGy)"
                      value={noteData.treatment_sites[0].total_dose}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.treatment_sites[0].total_dose")}
                      isRequired={true}
                    />
                  </>
                )}

                <EditableField
                  label="Treatment Completion Date"
                  value={noteData?.treatment_completion_date}
                  isEditMode={isEditMode}
                  onEdit={createEditHandler("noteAbstraction.treatment_completion_date")}
                  isRequired={true}
                />
                <EditableField
                  label="Pain Management Description"
                  value={noteData?.pain_management_description}
                  isEditMode={isEditMode}
                  onEdit={createEditHandler("noteAbstraction.pain_management_description")}
                  isRequired={true}
                  multiline
                />
              </div>
            </div>
          </div>

          {/* Patient Response */}
          <div>
            {/* Patient Response - Dynamic */}
            <DynamicFieldEditor
              title="Patient Response & Side Effects"
              data={noteData?.ctcae || { tolerance: noteData?.tolerance, radiation_side_effects: noteData?.radiation_side_effects }}
              fieldPath="noteAbstraction.ctcae"
              onEdit={(fieldPath, value) => onEdit(note.id, fieldPath, value)}
              isEditMode={isEditMode}
            />

            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Follow-up Plan</h3>
              <div className="space-y-3">
                <EditableField
                  label="Follow-up Schedule"
                  value={noteData?.follow_up}
                  isEditMode={isEditMode}
                  onEdit={createEditHandler("noteAbstraction.follow_up")}
                  multiline
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
