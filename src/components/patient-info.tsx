import { Card, CardContent } from "@src/components/ui/card";
import { Badge } from "@src/components/ui/badge";
import { CheckCircle, X, AlertTriangle } from "lucide-react";

interface PatientInfoProps {
  patientInfo: {
    patient_name?: string;
    age?: number;
    gender?: string;
  };
  diagnosis?: {
    cancer_type?: string;
    receptor_status?: string;
  };
  qualityMeasuresCounts?: {
    passed: number;
    failed: number;
    excluded: number;
  };
}

export default function PatientInfo({ patientInfo, diagnosis, qualityMeasuresCounts }: PatientInfoProps) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-500">Patient</h2>
          <p className="text-lg font-medium">
            {patientInfo.patient_name || "Not specified"}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-500">Demographics</h2>
          <p className="text-base">
            {patientInfo.age ? `${patientInfo.age} years` : ""}{patientInfo.age && patientInfo.gender ? ", " : ""}
            {patientInfo.gender || ""}
            {!patientInfo.age && !patientInfo.gender && "Not specified"}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-500">Diagnosis</h2>
          <p className="text-base">
            {diagnosis?.cancer_type || ""}
            {diagnosis?.cancer_type && diagnosis?.receptor_status ? ", " : ""}
            {diagnosis?.receptor_status || ""}
            {!diagnosis?.cancer_type && !diagnosis?.receptor_status && "Not specified"}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-500">Quality Measures</h2>
          <div className="flex flex-wrap gap-2">
            {qualityMeasuresCounts ? (
              <>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {qualityMeasuresCounts.passed} Passed
                </Badge>
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  <X className="h-3 w-3 mr-1" />
                  {qualityMeasuresCounts.failed} Failed
                </Badge>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {qualityMeasuresCounts.excluded} Excluded
                </Badge>
              </>
            ) : (
              <span className="text-base text-slate-500">Loading...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
