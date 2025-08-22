import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@src/components/ui/card";
import EditableField from "@src/components/editable-field";
import { Button } from "@src/components/ui/button";
import { Pencil, FileText } from "lucide-react";
import { Note } from "@shared/schema";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui/select";
import { Badge } from "@src/components/ui/badge";
import DynamicFieldEditor from "@src/components/dynamic-field-editor";

interface CTSimulationNoteProps {
  notes: Note[];
  isEditMode: boolean;
  onEdit: (noteId: string, fieldPath: string, value: any) => void;
  onToggleEditMode: () => void;
  onViewNote?: (note: Note) => void;
}

export default function CTSimulationNote({ notes, isEditMode, onEdit, onToggleEditMode, onViewNote }: CTSimulationNoteProps) {
  // If no notes, show empty state
  if (!notes || notes.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No CT simulation notes available</p>
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
  const formattedDate = creationDate ? format(creationDate, 'yyyy-MM-dd') : 'Unknown date';

  // Helper function to create edit handler for a specific field
  const createEditHandler = (fieldPath: string) => (value: string) => {
    onEdit(note.id, fieldPath, value);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b">
        <div>
          <CardTitle className="text-xl font-semibold text-slate-800">
            Radiation Oncology CT Simulation
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
          {/* CT Simulation Details */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-500 mb-2">
              <span className="font-medium">Simulation Date: </span>
              <span>{formattedDate}</span>
            </div>
            <div className="space-y-3">
              <EditableField 
                label="Cardiac Device"
                value={noteData?.cardiac_device}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.cardiac_device")}
              />
              <EditableField 
                label="Previous RT Details"
                value={noteData?.previous_rt_details}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.previous_rt_details")}
              />
              <EditableField 
                label="Scan"
                value={noteData?.scan}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.scan")}
              />
              <EditableField 
                label="Immobilization"
                value={noteData?.immobilization}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.immobilization")}
              />
              <EditableField 
                label="Additional Details"
                value={noteData?.addtional_details}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.addtional_details")}
                multiline
              />
              <EditableField 
                label="Start Date"
                value={noteData?.start_date}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.start_date")}
              />
              
              {/* Required Simulation Fields */}
              <EditableField 
                label="Rectal Empty Instructions"
                value={noteData?.rectal_empty_instructions}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.rectal_empty_instructions")}
                isRequired={true}
                multiline
              />
              <EditableField 
                label="Bladder Filling Instructions"
                value={noteData?.bladder_filling_instructions}
                isEditMode={isEditMode}
                onEdit={createEditHandler("noteAbstraction.bladder_filling_instructions")}
                isRequired={true}
                multiline
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
