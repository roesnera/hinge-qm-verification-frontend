import { useState, useEffect } from "react";
import type { Note } from "@intelligenthealthsolutions/hinge-qm-verification/esm";
import { Card, CardContent, CardHeader, CardTitle } from "@src/components/ui/card";
import { Badge } from "@src/components/ui/badge";
import { Button } from "@src/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { format } from "@src/lib/utils";

interface PatientTimelineProps {
  notes: Note[];
}

export default function PatientTimeline({ notes }: PatientTimelineProps) {
  const [timelineEvents, setTimelineEvents] = useState<{date: Date, type: string, id: string}[]>([]);
  const [showMoreRows, setShowMoreRows] = useState(false);

  useEffect(() => {
    if (!notes || notes.length === 0) return;

    const events = notes.map(note => {
      // Determine event type from noteType or description
      let type = "other";

      if (note.noteType) {
        type = note.noteType.toLowerCase();
      } else if (note.description) {
        type = note.description.toLowerCase();
      }

      // Map to user-friendly type
      let displayType = "Note";
      if (type.includes("consult")) displayType = "Consult";
      else if (type.includes("simulation")) displayType = "CT Simulation";
      else if (type.includes("daily") && type.includes("treatment")) displayType = "Daily Treatment";
      else if (type.includes("weekly") && type.includes("treatment")) displayType = "Weekly Review";
      else if (type.includes("nurse")) displayType = "Nurse Note";
      else if (type.includes("treatment") && type.includes("summary")) displayType = "Treatment Summary";
      else if (type.includes("follow") && (type.includes("up") || type.includes("-up"))) displayType = "Follow-up";

      return {
        date: new Date(note.creation),
        type: displayType,
        id: note.id
      };
    });

    // Sort by date (oldest first for timeline display)
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    setTimelineEvents(events);
  }, [notes]);

  if (!notes || notes.length === 0) {
    return null;
  }

  const startDate = timelineEvents.length > 0 ? format(timelineEvents[0].date, 'MMM d, yyyy') : '';
  const endDate = timelineEvents.length > 0 ? format(timelineEvents[timelineEvents.length - 1].date, 'MMM d, yyyy') : '';

  const getEventColor = (type: string) => {
    switch(type) {
      case "Consult": return "bg-blue-500";
      case "CT Simulation": return "bg-purple-500";
      case "Daily Treatment": return "bg-green-500";
      case "Weekly Review": return "bg-amber-500";
      case "Nurse Note": return "bg-rose-500";
      case "Treatment Summary": return "bg-teal-500";
      case "Follow-up": return "bg-indigo-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">
          Patient Journey Timeline
        </CardTitle>
        <p className="text-sm text-slate-500">
          {startDate} to {endDate}
        </p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="relative">
          {/* Group events into rows of maximum 9 items */}
          {(() => {
            // Create rows of events, max 9 per row
            const rows = [];
            const itemsPerRow = 9;

            for (let i = 0; i < timelineEvents.length; i += itemsPerRow) {
              rows.push(timelineEvents.slice(i, i + itemsPerRow));
            }

            // Only show first row unless "show more" is clicked
            const visibleRows = showMoreRows ? rows : (rows.length > 0 ? [rows[0]] : []);
            const hasMoreRows = rows.length > 1;

            return (
              <div className="space-y-3">
                {visibleRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="relative">
                    {/* Horizontal timeline line for each row */}
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200"></div>

                    {/* Events in this row */}
                    <div className="flex justify-between relative">
                      {row.map((event, index) => (
                        <div key={index} className="flex-1 px-1 relative">
                          {/* Timeline node */}
                          <div className={`absolute top-4 -mt-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full ${getEventColor(event.type)} ring-4 ring-white z-10`}></div>

                          {/* Event content */}
                          <div className="mt-8 flex flex-col items-center text-center">
                            <Badge variant="outline" className="mb-1 text-xs font-medium">
                              {event.type}
                            </Badge>
                            <p className="text-xs text-slate-500">
                              {format(event.date, 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Fill empty spaces in the last row if needed */}
                      {rowIndex === visibleRows.length - 1 && row.length < itemsPerRow &&
                        Array(itemsPerRow - row.length).fill(0).map((_, i) => (
                          <div key={`empty-${i}`} className="flex-1 px-1"></div>
                        ))
                      }
                    </div>

                    {/* Row connector for multiple rows */}
                    {rowIndex < visibleRows.length - 1 && (
                      <div className="flex justify-center mt-1">
                        <div className="h-2 w-0.5 bg-slate-200"></div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Show more/less button */}
                {hasMoreRows && (
                  <div className="flex justify-center mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMoreRows(!showMoreRows)}
                      className="text-xs flex items-center gap-1"
                    >
                      {showMoreRows ? (
                        <>Less <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>More <ChevronDown className="h-3 w-3" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
