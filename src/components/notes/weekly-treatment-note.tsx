import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@src/components/ui/card";
import EditableField from "@src/components/editable-field";
import { Button } from "@src/components/ui/button";
import { Pencil, FileText } from "lucide-react";
import type { Note } from "@intelligenthealthsolutions/hinge-qm-verification/esm";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui/select";
import { Badge } from "@src/components/ui/badge";

interface WeeklyTreatmentNoteProps {
  notes: Note[];
  isEditMode: boolean;
  onEdit: (noteId: string, fieldPath: string, value: any) => void;
  onToggleEditMode: () => void;
  onViewNote?: (note: Note) => void;
}

export default function WeeklyTreatmentNote({ notes, isEditMode, onEdit, onToggleEditMode, onViewNote }: WeeklyTreatmentNoteProps) {
  // If no notes, show empty state
  if (!notes || notes.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No weekly treatment notes available</p>
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
  const formattedDate = creationDate ? format(creationDate, 'MMM d, yyyy') : 'Unknown date';

  // Helper function to create edit handler for a specific field
  const createEditHandler = (fieldPath: string) => (value: string) => {
    onEdit(note.id, fieldPath, value);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b">
        <div>
          <CardTitle className="text-xl font-semibold text-slate-800">
            Radiation Oncology Weekly Treatment Review
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
          {/* Weekly Treatment Details */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-500 mb-2">
              <span className="font-medium">Date: </span>
              <span>{formattedDate}</span>
            </div>
            <div className="space-y-3">
              <EditableField
                label="Diagnosis"
                value={noteData?.diagnosis}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.diagnosis")}
                multiline
              />

              {/* TNM Staging */}
              <EditableField
                label="T Stage (Primary Tumor)"
                value={noteData?.staging?.t_stage}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.staging.t_stage")}
              />

              <EditableField
                label="N Stage (Regional Lymph Nodes)"
                value={noteData?.staging?.n_stage}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.staging.n_stage")}
              />

              <EditableField
                label="M Stage (Distant Metastasis)"
                value={noteData?.staging?.m_stage}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.staging.m_stage")}
              />
              {noteData?.treatment_sites && noteData.treatment_sites[0] && (
                <>
                  <EditableField
                    label="Treatment Site"
                    value={noteData.treatment_sites[0].treatment_site_name}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.treatment_sites[0].treatment_site_name")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Treatment Number"
                    value={noteData.treatment_sites[0].treatment_number}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.treatment_sites[0].treatment_number")}
                  />
                  <EditableField
                    label="Daily Dose (cGy)"
                    value={noteData.treatment_sites[0].daily_dose}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.treatment_sites[0].daily_dose")}
                  />
                  <EditableField
                    label="Cumulative Dose (cGy)"
                    value={noteData.treatment_sites[0].cumulative_dose_received_to_date}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.treatment_sites[0].cumulative_dose_received_to_date")}
                  />
                  <EditableField
                    label="Total Planned Dose (cGy)"
                    value={noteData.treatment_sites[0].total_dose}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.treatment_sites[0].total_dose")}
                    isRequired={true}
                  />
                  <EditableField
                    label="First Treatment Date"
                    value={noteData.treatment_sites[0].first_treatment_date}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.treatment_sites[0].first_treatment_date")}
                    isRequired={true}
                  />
                </>
              )}
            </div>
          </div>

          {/* Patient Condition */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Patient Condition</h3>
            <div className="space-y-3">
              <EditableField
                label="Subjective"
                value={noteData?.subjective}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.subjective")}
              />
              <EditableField
                label="Radiation Side Effects"
                value={noteData?.radiation_side_effects}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.radiation_side_effects")}
              />
              <EditableField
                label="Concurrent Chemotherapy"
                value={noteData?.concurrent_chemotherapy}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.concurrent_chemotherapy")}
              />
              <EditableField
                label="Next Steps"
                value={noteData?.next_steps}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.next_steps")}
                multiline
              />
              <EditableField
                label="Follow-up"
                value={noteData?.follow_up}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.follow_up")}
              />
              {noteData?.ctcae && (
                <>
                  <EditableField
                    label="Pain"
                    value={noteData.ctcae.pain}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.ctcae.pain")}
                  />
                  <EditableField
                    label="Fatigue"
                    value={noteData.ctcae.fatigue}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.ctcae.fatigue")}
                  />
                  <EditableField
                    label="Dermatitis"
                    value={noteData.ctcae.dermatitis}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.ctcae.dermatitis")}
                  />
                </>
              )}
            </div>
          </div>

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
                    value={noteData.vitals.blood_pressure}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.vitals.blood_pressure")}
                  />
                  <EditableField
                    label="Pulse"
                    value={noteData.vitals.pulse}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.vitals.pulse")}
                  />
                  <EditableField
                    label="Respiration"
                    value={noteData.vitals.respiration}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.vitals.respiration")}
                  />
                  <EditableField
                    label="Pain"
                    value={noteData.vitals.pain}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.vitals.pain")}
                    isRequired={true}
                  />
                </>
              )}
            </div>
          </div>

          {/* Follow-up */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Follow-up</h3>
            <EditableField
              label="Next Steps"
              value={noteData?.follow_up}
              isEditMode={isEditMode}
              onEdit={createEditHandler("noteAbstraction.follow_up")}
              multiline
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
