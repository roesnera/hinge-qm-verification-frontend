import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@src/components/ui/card";
import { Button } from "@src/components/ui/button";
import { ChevronDown, ChevronUp, Pencil, FileText } from "lucide-react";
import type { Note } from "@intelligenthealthsolutions/hinge-qm-verification/esm";
import { Badge } from "@src/components/ui/badge";
import { format } from "@src/lib/utils";
import { Input } from "@src/components/ui/input";

interface DailyTreatmentNoteProps {
  notes: Note[];
  isEditMode: boolean;
  onEdit: (noteId: string, fieldPath: string, value: any) => void;
  onToggleEditMode: () => void;
  onViewNote?: (note: Note) => void;
}

export default function DailyTreatmentNote({ notes, isEditMode, onEdit, onToggleEditMode, onViewNote }: DailyTreatmentNoteProps) {
  const [showAllTreatments, setShowAllTreatments] = useState(false);

  // If no notes, show empty state
  if (!notes || notes.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No daily treatment notes available</p>
        </CardContent>
      </Card>
    );
  }

  // Sort notes by creation date (newest first)
  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.creation).getTime() - new Date(a.creation).getTime()
  );

  // Display a limited number initially
  const visibleNotes = showAllTreatments ? sortedNotes : sortedNotes.slice(0, 3);
  const hasMoreNotes = sortedNotes.length > 3;

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b">
        <div>
          <CardTitle className="text-xl font-semibold text-slate-800">
            Radiation Oncology Daily Treatment
          </CardTitle>
          <p className="text-slate-500 text-sm">Showing all treatment sessions in chronological order</p>
        </div>
        <div className="flex gap-2">
          {onViewNote && sortedNotes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewNote(sortedNotes[0])}
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
        {/* Treatment Timeline */}
        <div className="relative pb-6">
          <div className="absolute left-4 h-full w-0.5 bg-slate-200"></div>

          {visibleNotes.map((note, index) => {
            const noteData = note.noteAbstraction;
            const treatmentDetails = noteData.treatment_details?.[0];
            const creationDate = note.creation ? new Date(note.creation) : null;
            const formattedDate = creationDate ? format(creationDate, 'MMM d, yyyy') : 'Unknown date';
            const treatmentNumber = parseInt(treatmentDetails?.treatment_number || '0');
            const isLastTreatment = index === 0 && treatmentNumber === sortedNotes.length;

            return (
              <div
                key={note.id}
                className="relative pl-10 mb-8"
                data-note-id={note.id}
              >
                <div className={`absolute left-0 w-8 h-8 ${index === 0 ? 'bg-primary' : 'bg-slate-300'} rounded-full flex items-center justify-center text-white font-medium z-10`}>
                  {treatmentNumber}
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-3 items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">Treatment Session {treatmentNumber}</h3>
                      <p className="text-sm text-slate-500">{formattedDate}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {onViewNote && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewNote(note)}
                          className="text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" /> View Original
                        </Button>
                      )}
                      {isLastTreatment && (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                          Final Session
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* TNM Staging for this treatment session */}
                  <div className="mb-4 bg-white/50 p-3 rounded border">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">TNM Staging Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500">T Stage</label>
                        {isEditMode ? (
                          <Input
                            value={noteData?.staging?.t_stage || ''}
                            onChange={(e) => onEdit(note.id, 'noteAbstraction.staging.t_stage', e.target.value)}
                            className="w-full mt-1 text-sm"
                          />
                        ) : (
                          <p className="text-sm text-slate-800">{noteData?.staging?.t_stage || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500">N Stage</label>
                        {isEditMode ? (
                          <Input
                            value={noteData?.staging?.n_stage || ''}
                            onChange={(e) => onEdit(note.id, 'noteAbstraction.staging.n_stage', e.target.value)}
                            className="w-full mt-1 text-sm"
                          />
                        ) : (
                          <p className="text-sm text-slate-800">{noteData?.staging?.n_stage || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500">M Stage</label>
                        {isEditMode ? (
                          <Input
                            value={noteData?.staging?.m_stage || ''}
                            onChange={(e) => onEdit(note.id, 'noteAbstraction.staging.m_stage', e.target.value)}
                            className="w-full mt-1 text-sm"
                          />
                        ) : (
                          <p className="text-sm text-slate-800">{noteData?.staging?.m_stage || 'Not specified'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Treatment Site</label>
                      {isEditMode ? (
                        <Input
                          value={treatmentDetails?.treatment_site || ''}
                          onChange={(e) => onEdit(note.id, `noteAbstraction.treatment_details[0].treatment_site`, e.target.value)}
                          className="w-full mt-1 text-base"
                        />
                      ) : (
                        <p className="text-base text-slate-800">{treatmentDetails?.treatment_site || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Daily Dose</label>
                      {isEditMode ? (
                        <Input
                          value={treatmentDetails?.daily_dose || ''}
                          onChange={(e) => onEdit(note.id, `noteAbstraction.treatment_details[0].daily_dose`, e.target.value)}
                          className="w-full mt-1 text-base"
                        />
                      ) : (
                        <p className="text-base text-slate-800">{treatmentDetails?.daily_dose || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500">Cumulative Dose</label>
                      {isEditMode ? (
                        <Input
                          value={treatmentDetails?.cumulative_dose_delivered || ''}
                          onChange={(e) => onEdit(note.id, `noteAbstraction.treatment_details[0].cumulative_dose_delivered`, e.target.value)}
                          className="w-full mt-1 text-base"
                        />
                      ) : (
                        <p className="text-base text-slate-800">{treatmentDetails?.cumulative_dose_delivered || 'Not specified'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show/Hide More Button */}
          {hasMoreNotes && (
            <Button
              variant="ghost"
              className="mt-2 ml-10 text-sm text-primary hover:text-primary/90 hover:bg-primary/10"
              onClick={() => setShowAllTreatments(!showAllTreatments)}
            >
              {showAllTreatments ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" /> Hide treatments
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" /> Show more treatments...
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
