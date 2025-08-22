import { Card, CardContent } from "@src/components/ui/card";
import { Button } from "@src/components/ui/button";
import { Save, X } from "lucide-react";

interface EditControlsProps {
  isVisible: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export default function EditControls({ isVisible, onSave, onCancel }: EditControlsProps) {
  if (!isVisible) return null;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <span className="mr-1">✏️</span> Edit Mode
            </span>
            <p className="ml-2 text-sm text-slate-500">Make changes to patient data</p>
          </div>
          <div>
            <Button 
              onClick={onSave} 
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
            <Button 
              onClick={onCancel} 
              variant="outline" 
              className="ml-3"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
