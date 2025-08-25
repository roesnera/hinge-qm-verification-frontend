import { useQuery } from '@tanstack/react-query';
import { Button } from '@src/components/ui/button';
import { Separator } from '@src/components/ui/separator';
import { X, FileText, Calendar, User, Building } from 'lucide-react';
import type { Note } from "@intelligenthealthsolutions/hinge-qm-verification/esm";

interface ClinicalNotePanelProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ClinicalNoteText {
  noteText: string;
}

export function ClinicalNotePanel({ note, isOpen, onClose }: ClinicalNotePanelProps) {
  const { data: clinicalNoteText, isLoading, error } = useQuery<ClinicalNoteText>({
    queryKey: ['/api/notes', note?.id, 'text'],
    queryFn: () =>
      fetch(`${process.env.API_URL||'http://localhost:5000'}/api/notes/${note?.id}/text`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch clinical note text');
          }
          return res.json();
        }),
    enabled: !!note?.id && isOpen,
  });

  if (!isOpen || !note) {
    return null;
  }

  return (
    <>
      {/* Overlay to close panel when clicking outside */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      {/* Side Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-1/2 min-w-[500px] max-w-[800px] bg-white shadow-xl border-l border-gray-200">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-slate-50">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Clinical Note</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Note Metadata */}
          <div className="p-4 bg-slate-50 border-b">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Type:</span>
                <span>{note.noteType}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Date:</span>
                <span>{note.creation ? new Date(note.creation).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Entered by:</span>
                <span>{note.enteredBy || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Facility:</span>
                <span>{note.facility || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Clinical Note Content */}
          <div className="flex-1 p-4 overflow-hidden">
            <h3 className="text-md font-semibold mb-3 text-gray-900">Original Clinical Note</h3>
            <Separator className="mb-4" />

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">Loading clinical note...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Failed to load clinical note text</p>
                  <p className="text-xs mt-1">Note ID: {note?.id}</p>
                </div>
              </div>
            ) : clinicalNoteText?.noteText ? (
              <div className="h-full overflow-auto bg-white">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-300 min-h-full">
                  <div
                    className="whitespace-pre-wrap text-sm leading-6 text-black font-mono"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      padding: '16px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    {clinicalNoteText.noteText}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Clinical note text not available</p>
                  <p className="text-xs mt-1">Note ID: {note?.id}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
