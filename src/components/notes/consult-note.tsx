import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@src/components/ui/card";
import EditableField from "@src/components/editable-field";
import { Button } from "@src/components/ui/button";
import { Pencil, FileText } from "lucide-react";
import type { Note } from "@intelligenthealthsolutions/hinge-qm-verification/esm";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@src/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui/select";
import { Badge } from "@src/components/ui/badge";
import DynamicFieldEditor from "@src/components/dynamic-field-editor";

interface ConsultNoteProps {
  notes: Note[];
  isEditMode: boolean;
  onEdit: (noteId: string, fieldPath: string, value: any) => void;
  onToggleEditMode: () => void;
  onViewNote?: (note: Note) => void;
}

export default function ConsultNote({ notes, isEditMode, onEdit, onToggleEditMode, onViewNote }: ConsultNoteProps) {
  // If no notes, show empty state
  if (!notes || notes.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No consult notes available</p>
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

  // Format blood pressure display
  const formatBloodPressure = (bp: any) => {
    if (!bp) return '';
    if (typeof bp === 'string') return bp;
    if (bp.systolic && bp.diastolic) return `${bp.systolic}/${bp.diastolic}`;
    return '';
  };

  // Helper to format allergies (can be string or array)
  const formatAllergies = (allergies: any) => {
    if (!allergies) return [];
    if (typeof allergies === 'string') return [allergies];
    return allergies;
  };

  // Helper to format family history
  const formatFamilyHistory = (history: any) => {
    if (!history) return [];
    if (typeof history === 'object' && !Array.isArray(history)) {
      return Object.entries(history).map(([relation, condition]) => `${relation}: ${condition}`);
    }
    return Array.isArray(history) ? history : [];
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b">
        <div>
          <CardTitle className="text-xl font-semibold text-slate-800">
            Radiation Oncology Consult
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

        <Tabs defaultValue="diagnostics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="diagnostics">Diagnosis & History</TabsTrigger>
            <TabsTrigger value="clinical-overview">Clinical Overview</TabsTrigger>
            <TabsTrigger value="staging">Staging</TabsTrigger>
            <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="clinical-overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Demographics & Risk Factors - Dynamic */}
              <DynamicFieldEditor
                title="Demographics & Risk Factors"
                data={{
                  alcohol_use: noteData?.history?.alcohol_use,
                  weight: noteData?.vitals?.weight
                }}
                fieldPath="noteAbstraction.history"
                onEdit={(fieldPath, value) => onEdit(note.id, fieldPath, value)}
                isEditMode={isEditMode}
              />

              {/* Review of Systems - Dynamic */}
              <DynamicFieldEditor
                title="Review of Systems"
                data={noteData?.review_of_systems}
                fieldPath="noteAbstraction.review_of_systems"
                onEdit={(fieldPath, value) => onEdit(note.id, fieldPath, value)}
                isEditMode={isEditMode}
              />



              {/* Medical Conditions - Dynamic */}
              <DynamicFieldEditor
                title="Medical Conditions"
                data={noteData?.history?.medical_history}
                fieldPath="noteAbstraction.history.medical_history"
                onEdit={(fieldPath, value) => onEdit(note.id, fieldPath, value)}
                isEditMode={isEditMode}
              />

              {/* Surgical History - Dynamic */}
              <DynamicFieldEditor
                title="Surgical History"
                data={noteData?.history?.surgical_history}
                fieldPath="noteAbstraction.history.surgical_history"
                onEdit={(fieldPath, value) => onEdit(note.id, fieldPath, value)}
                isEditMode={isEditMode}
              />
            </div>
          </TabsContent>

          <TabsContent value="diagnostics" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cancer Diagnosis */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Cancer Diagnosis</h3>
                <div className="space-y-3">
                  <EditableField
                    label="Cancer Type"
                    value={noteData?.diagnosis?.cancer_type || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.diagnosis.cancer_type")}
                    isRequired={true}
                  />
                  <EditableField
                    label="PSA"
                    value={noteData?.diagnosis?.psa?.toString() || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.diagnosis.psa")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Gleason Score"
                    value={noteData?.diagnosis?.gleason_score || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.diagnosis.gleason_score")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Risk Level"
                    value={noteData?.diagnosis?.risk_level || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.diagnosis.risk_level")}
                    isRequired={true}
                  />
                </div>
              </div>

              {/* Demographics */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Patient Demographics</h3>
                <div className="space-y-3">
                  <EditableField
                    label="Patient Name"
                    value={noteData?.demographics?.patient_name}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.demographics.patient_name")}
                  />
                  <EditableField
                    label="Age"
                    value={noteData?.demographics?.age?.toString()}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.demographics.age")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Gender"
                    value={noteData?.demographics?.gender}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.demographics.gender")}
                  />
                </div>
              </div>

              {/* Clinical History & Status */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Clinical History & Status</h3>
                <div className="space-y-3">
                  <EditableField
                    label="Patient Underwent Surgery (Prostatectomy)"
                    value={noteData?.patient_underwent_surgury_prostatectomy}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.patient_underwent_surgury_prostatectomy")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Recurrent Disease"
                    value={noteData?.history?.recurrent_disease === true ? "Yes" :
                           noteData?.history?.recurrent_disease === false ? "No" : ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.history.recurrent_disease")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Prior Radiation Delivered"
                    value={noteData?.history?.prior_radiation_delivered === true ? "Yes" :
                           noteData?.history?.prior_radiation_delivered === false ? "No" : ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.history.prior_radiation_delivered")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Biochemical Failure"
                    value={noteData?.history?.biochemical_failure === true ? "Yes" :
                           noteData?.history?.biochemical_failure === false ? "No" : ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.history.biochemical_failure")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Smoking Status"
                    value={noteData?.history?.smoking?.smoking_status}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.history.smoking.smoking_status")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Pregnancy Status"
                    value={noteData?.pregnancy?.status}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.pregnancy.status")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Pregnancy Test Date"
                    value={noteData?.pregnancy?.pregnancyTestDate}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.pregnancy.pregnancyTestDate")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Implanted Cardiac Device"
                    value={noteData?.history?.implanted_cardiac_device === false ? "No" :
                           noteData?.history?.implanted_cardiac_device === true ? "Yes" : "Not specified"}
                    isEditMode={isEditMode}
                    onEdit={(value) => {
                      const boolValue = value?.toLowerCase() === "yes" ? true :
                                       value?.toLowerCase() === "no" ? false : null;
                      onEdit(note.id, "noteAbstraction.history.implanted_cardiac_device", boolValue);
                    }}
                    isRequired={true}
                  />
                </div>
              </div>

              {/* Imaging Results */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Imaging Results</h3>
                <div className="space-y-3">
                  <EditableField
                    label="PET/CT Performed"
                    value={noteData?.imaging?.pet_ct_performed === true ? "Yes" :
                           noteData?.imaging?.pet_ct_performed === false ? "No" : ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.imaging.pet_ct_performed")}
                    isRequired={true}
                  />
                  <EditableField
                    label="PET/CT Date"
                    value={noteData?.imaging?.pet_ct_date}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.imaging.pet_ct_date")}
                    isRequired={true}
                  />
                  <EditableField
                    label="MRI Performed"
                    value={noteData?.imaging?.mri_performed === true ? "Yes" :
                           noteData?.imaging?.mri_performed === false ? "No" : ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.imaging.mri_performed")}
                    isRequired={true}
                  />
                  <EditableField
                    label="MRI Date"
                    value={noteData?.imaging?.mri_date}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.imaging.mri_date")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Bone Scan Performed"
                    value={noteData?.imaging?.bone_scan_performed === true ? "Yes" :
                           noteData?.imaging?.bone_scan_performed === false ? "No" : ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.imaging.bone_scan_performed")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Bone Scan Date"
                    value={noteData?.imaging?.bone_scan_date}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.imaging.bone_scan_date")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Bone Density Scan Performed"
                    value={noteData?.imaging?.bone_density_scan_performed === true ? "Yes" :
                           noteData?.imaging?.bone_density_scan_performed === false ? "No" : ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.imaging.bone_density_scan_performed")}
                    isRequired={true}
                  />
                  <EditableField
                    label="MRI Contraindications"
                    value={noteData?.imaging?.contraindications_for_mri}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.imaging.contraindications_for_mri")}
                    isRequired={true}
                  />

                  {noteData?.imaging?.mri_finding && (
                    <EditableField
                      label="MRI Finding"
                      value={noteData.imaging.mri_finding}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.imaging.mri_finding")}
                      multiline
                    />
                  )}

                  {noteData?.imaging?.ct_finding && (
                    <EditableField
                      label="CT Finding"
                      value={noteData.imaging.ct_finding}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.imaging.ct_finding")}
                      multiline
                    />
                  )}

                  {noteData?.imaging?.bone_scan_finding && (
                    <EditableField
                      label="Bone Scan Finding"
                      value={noteData.imaging.bone_scan_finding}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.imaging.bone_scan_finding")}
                      multiline
                    />
                  )}

                  {noteData?.imaging?.pet_ct_finding && (
                    <EditableField
                      label="PET/CT Finding"
                      value={noteData.imaging.pet_ct_finding}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.imaging.pet_ct_finding")}
                      multiline
                    />
                  )}
                </div>
              </div>

              {/* Biopsy Details */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Biopsy Details</h3>
                <div className="space-y-3">
                  <EditableField
                    label="Biopsy Date"
                    value={noteData?.biopsy?.biopsy_date}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.biopsy.biopsy_date")}
                    isRequired={true}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <EditableField
                      label="Gleason Primary"
                      value={noteData?.biopsy?.gleason_primary?.toString()}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.biopsy.gleason_primary")}
                      isRequired={true}
                    />
                    <EditableField
                      label="Gleason Secondary"
                      value={noteData?.biopsy?.gleason_secondary?.toString()}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.biopsy.gleason_secondary")}
                      isRequired={true}
                    />
                  </div>

                  {/* Additional required biopsy fields */}
                  <EditableField
                    label="Gleason Group"
                    value={noteData?.biopsy?.gleason_group?.toString()}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.biopsy.gleason_group")}
                    isRequired={true}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <EditableField
                      label="Cores Positive"
                      value={noteData?.biopsy?.cores_positive?.toString()}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.biopsy.cores_positive")}
                    />
                    <EditableField
                      label="Cores Sampled"
                      value={noteData?.biopsy?.cores_sampled?.toString()}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.biopsy.cores_sampled")}
                    />
                  </div>
                </div>
              </div>

              {/* Vitals */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Vitals</h3>
                <div className="grid grid-cols-2 gap-3">
                  <EditableField
                    label="Temperature"
                    value={noteData?.vitals?.temperature}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.vitals.temperature")}
                  />
                  <EditableField
                    label="Blood Pressure"
                    value={formatBloodPressure(noteData?.vitals?.blood_pressure)}
                    isEditMode={isEditMode}
                    onEdit={(value) => {
                      // Handle BP as a string for simplicity
                      onEdit(note.id, "noteAbstraction.vitals.blood_pressure", value);
                    }}
                  />
                  <EditableField
                    label="Pulse"
                    value={noteData?.vitals?.pulse?.toString()}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.vitals.pulse")}
                  />
                  <EditableField
                    label="Respiratory Rate"
                    value={noteData?.vitals?.respiratory_rate?.toString()}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.vitals.respiratory_rate")}
                  />
                  <EditableField
                    label="Weight"
                    value={noteData?.vitals?.weight}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.vitals.weight")}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="staging" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TNM Staging - Separate Components */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">TNM Staging Components</h3>
                <div className="space-y-3">
                  <EditableField
                    label="T Stage (Primary Tumor)"
                    value={noteData?.staging?.t_stage}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.staging.t_stage")}
                    isRequired={true}
                  />
                  <EditableField
                    label="N Stage (Regional Lymph Nodes)"
                    value={noteData?.staging?.n_stage}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.staging.n_stage")}
                    isRequired={true}
                  />
                  <EditableField
                    label="M Stage (Distant Metastasis)"
                    value={noteData?.staging?.m_stage}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.staging.m_stage")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Overall Stage Group"
                    value={noteData?.staging?.stage_group}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.staging.stage_group")}
                  />
                  <EditableField
                    label="Combined Stage (Original)"
                    value={noteData?.diagnosis?.stage}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.diagnosis.stage")}
                  />
                  <EditableField
                    label="Risk Level"
                    value={noteData?.diagnosis?.risk_level}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.diagnosis.risk_level")}
                  />
                </div>
              </div>

              {/* Nomogram */}
              {noteData?.nomogram && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-base font-semibold text-slate-800 mb-3">Nomogram</h3>
                  <div className="space-y-3">
                    <EditableField
                      label="Organ Confined"
                      value={noteData.nomogram.organ_confined}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.nomogram.organ_confined")}
                    />
                    <EditableField
                      label="Extra-prostatic Extension"
                      value={noteData.nomogram.epe}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.nomogram.epe")}
                    />
                    <EditableField
                      label="Lymph Node Involvement"
                      value={noteData.nomogram.ln}
                      isEditMode={isEditMode}
                      onEdit={createEditHandler("noteAbstraction.nomogram.ln")}
                    />
                  </div>
                </div>
              )}

              {/* Patient Assessment */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Patient Assessment</h3>
                <div className="grid grid-cols-2 gap-3">
                  <EditableField
                    label="KPS"
                    value={noteData?.assessment?.kps?.toString() || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.assessment.kps")}
                    isRequired={true}
                  />

                  <EditableField
                    label="ECOG"
                    value={noteData?.assessment?.ecog?.toString() || ""}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.assessment.ecog")}
                    isRequired={true}
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

          <TabsContent value="treatment" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Treatment Planning */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Treatment Planning</h3>
                <div className="space-y-3">
                  <EditableField
                    label="Treatment Options Recommended"
                    value={Array.isArray(noteData?.treatment_options_recommended)
                      ? noteData.treatment_options_recommended.join(', ')
                      : noteData?.treatment_options_recommended || ''}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.treatment_options_recommended")}
                    isRequired={true}
                    multiline
                  />
                  <EditableField
                    label="Treatment Options Discussed"
                    value={Array.isArray(noteData?.treatment_options_discussed) ?
                           noteData.treatment_options_discussed.join(', ') :
                           noteData?.treatment_options_discussed}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.treatment_options_discussed")}
                    isRequired={true}
                    multiline
                  />
                  <EditableField
                    label="Enrolled in Clinical Trial"
                    value={noteData?.history?.enrolled_in_clinical_trial === false ? "No" :
                           noteData?.history?.enrolled_in_clinical_trial === true ? "Yes" : "Not specified"}
                    isEditMode={isEditMode}
                    onEdit={(value) => {
                      const boolValue = value.toLowerCase() === "yes" ? true :
                                       value.toLowerCase() === "no" ? false : null;
                      onEdit(note.id, "noteAbstraction.history.enrolled_in_clinical_trial", boolValue);
                    }}
                    isRequired={true}
                  />
                </div>
              </div>

              {/* Hormone Therapy & Treatment Details */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Hormone Therapy & Treatment Details</h3>
                <div className="space-y-3">
                  <EditableField
                    label="Hormone Therapy or ADT Prescribed"
                    value={noteData?.hormone_therapy_or_ADT_prescribed}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.hormone_therapy_or_ADT_prescribed")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Hormone Therapy Start Date"
                    value={noteData?.hormone_therapy_start_date}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.hormone_therapy_start_date")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Androgen Receptor Axis Therapy (ARAT)"
                    value={noteData?.androgen_receptor_axis_therapy}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.androgen_receptor_axis_therapy")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Patient Treated with Palliative Radiotherapy"
                    value={noteData?.patient_treated_with_palliative_radiotherapy}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.patient_treated_with_palliative_radiotherapy")}
                    isRequired={true}
                  />
                </div>
              </div>

              {/* Radiation Treatment Specifics */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Radiation Treatment Specifics</h3>
                <div className="space-y-3">
                  <EditableField
                    label="Regional Pelvic Nodes Treated"
                    value={noteData?.regional_pelvic_nodes_treated}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.regional_pelvic_nodes_treated")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Pelvic Lymphnode Radiation"
                    value={noteData?.pelvic_lymphnode_radiation}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.pelvic_lymphnode_radiation")}
                    isRequired={true}
                  />
                </div>
              </div>

              {/* Next Steps & Referrals */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-slate-800 mb-3">Next Steps & Referrals</h3>
                <div className="space-y-3">
                  <EditableField
                    label="Multidisciplinary Discussion"
                    value={noteData?.nextSteps?.multidisciplinaryDiscussion}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.nextSteps.multidisciplinaryDiscussion")}
                    isRequired={true}
                  />
                  <EditableField
                    label="Referral Surgery"
                    value={noteData?.nextSteps?.referralSurgery}
                    isEditMode={isEditMode}
                    onEdit={createEditHandler("noteAbstraction.nextSteps.referralSurgery")}
                    isRequired={true}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
