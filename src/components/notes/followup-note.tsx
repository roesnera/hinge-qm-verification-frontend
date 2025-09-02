import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@src/components/ui/card";
import EditableField from "@src/components/editable-field";
import { Button } from "@src/components/ui/button";
import { Pencil, FileText } from "lucide-react";
import type { Note } from "@intelligenthealthsolutions/hinge-analyze/esm";
import { format } from "@src/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@src/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui/select";
import { Badge } from "@src/components/ui/badge";

interface FollowupNoteProps {
  notes: Note[];
  isEditMode: boolean;
  onEdit: (noteId: string, fieldPath: string, value: any) => void;
  onToggleEditMode: () => void;
  onViewNote?: (note: Note) => void;
}

export default function FollowupNote({ notes, isEditMode, onEdit, onToggleEditMode, onViewNote }: FollowupNoteProps) {
  // If no notes, show empty state
  if (!notes || notes.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No follow-up notes available</p>
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
            Radiation Oncology Follow-up Note
          </CardTitle>
          <div className="flex items-center space-x-2">
            <p className="text-slate-500 text-sm">
              {formattedDate}
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

        <Tabs defaultValue="follow-up-details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="follow-up-details">Follow-up Details</TabsTrigger>
            <TabsTrigger value="review-of-systems">Review of Systems</TabsTrigger>
          </TabsList>

          <TabsContent value="follow-up-details" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Diagnosis & Status */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Diagnosis & Status</h3>
                <div className="space-y-3">
                  <EditableField
                    label="Diagnosis"
                    value={typeof noteData?.diagnosis === 'string' ? noteData.diagnosis : ''}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.diagnosis")}
                  />

                  <EditableField
                    label="Stage (Combined)"
                    value={noteData?.stage || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.stage")}
                  />

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

                  <EditableField
                    label="Disease Status"
                    value={noteData?.disease_status || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.disease_status")}
                  />

                  <EditableField
                    label="Weeks Post-Treatment"
                    value={noteData?.weeks_post_treatment?.toString() || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.weeks_post_treatment")}
                  />

                  <EditableField
                    label="Next Follow-up"
                    value={noteData?.next_follow_up || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.next_follow_up")}
                  />
                </div>
              </div>

              {/* Side Effects & Recommendations */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Side Effects & Plan</h3>
                <div className="space-y-3">
                  <EditableField
                    label="Side Effects"
                    value={noteData?.side_effects || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.side_effects")}
                    multiline
                  />

                  <EditableField
                    label="Recommendations"
                    value={noteData?.recommendations || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.recommendations")}
                    multiline
                  />

                  <EditableField
                    label="Next Follow-up"
                    value={noteData?.next_follow_up || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.next_follow_up")}
                  />
                </div>
              </div>

              {/* Patient Assessment */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Patient Assessment</h3>
                <div className="grid grid-cols-2 gap-3">
                  <EditableField
                    label="KPS"
                    value={noteData?.assessment?.kps?.toString() || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.assessment.kps")}
                  />

                  <EditableField
                    label="ECOG"
                    value={noteData?.assessment?.ecog?.toString() || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.assessment.ecog")}
                  />

                  <EditableField
                    label="Pain Score"
                    value={noteData?.assessment?.pain_score?.toString() || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.assessment.pain_score")}
                  />

                  <EditableField
                    label="AUA"
                    value={noteData?.assessment?.aua?.toString() || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.assessment.aua")}
                    isRequired={true}
                  />

                  <EditableField
                    label="IIEF"
                    value={noteData?.assessment?.iief?.toString() || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.assessment.iief")}
                    isRequired={true}
                  />

                  <EditableField
                    label="SHIM"
                    value={noteData?.assessment?.shim?.toString() || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.assessment.shim")}
                    isRequired={true}
                  />

                  <EditableField
                    label="IPSS"
                    value={noteData?.assessment?.ipss?.toString() || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.assessment.ipss")}
                    isRequired={true}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="review-of-systems" className="mt-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="text-base font-semibold text-slate-800 mb-3">Review of Systems</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {noteData?.review_of_systems && Object.entries(noteData.review_of_systems)
                  .filter(([_, value]) => value !== null && value !== undefined)
                  .map(([key, value]) => (
                    <div key={key} className="mb-3">
                      <p className="text-sm font-medium text-slate-500 capitalize">{key}:</p>
                      <EditableField
                        label=""
                        value={value as string}
                        isEditMode={isEditMode}
                        onEdit={createEditHandler(`noteAbstraction.review_of_systems.${key}`)}
                      />
                    </div>
                  ))
                }
                {(!noteData?.review_of_systems || Object.keys(noteData.review_of_systems).length === 0) && (
                  <p className="text-sm text-slate-500">No review of systems information available</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
