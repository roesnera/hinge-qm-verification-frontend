import { Note } from "@shared/schema";

export interface ComorbidityProfile {
  patientId: string;
  age?: number;
  hypertension: boolean;
  copd: boolean;
  diabetes: boolean;
  cad: boolean; // Coronary Artery Disease
  smokingHistory: boolean;
  allMedicalConditions: string[];
  ecogScores: { source: string; value: number; date: string }[];
  kpsScores: { source: string; value: number; date: string }[];
  painScores: { source: string; value: number; date: string }[];
  ipssScores: { source: string; value: number; date: string }[];
  auaScores: { source: string; value: number; date: string }[];
  shimScores: { source: string; value: number; date: string }[];
  iiefScores: { source: string; value: number; date: string }[];
}

export interface TreatmentModality {
  patientId: string;
  treatmentType: string; // IMRT, SBRT, 3D-CRT, Proton, HDR
  fractionation?: string;
  totalDose?: number;
  fractions?: number;
  technique?: string;
}

export interface TreatmentTolerance {
  patientId: string;
  interruptions: number;
  doseReductions: boolean;
  toxicityGrade?: number;
  completedTreatment: boolean;
  fatigueReports: { source: string; severity: string; date: string }[];
  dermatitisReports: { source: string; severity: string; date: string }[];
}

export interface OutcomeData {
  patientId: string;
  localControl: boolean;
  recurrence: boolean;
  survivalMonths?: number;
  lateToxicity: boolean;
  grade3Toxicity: boolean;
}

export interface PatientCohort {
  id: string;
  name: string;
  filters: CohortFilters;
  patients: string[];
}

export interface CohortFilters {
  ageRange?: { min: number; max: number };
  diseaseStage?: string[];
  treatmentTypes?: string[];
  comorbidities?: string[];
  ecogRange?: { min: number; max: number };
}

export class ComorbidityAnalyzer {
  private notes: Note[];
  
  constructor(notes: Note[]) {
    this.notes = notes;
  }

  // Extract comprehensive patient profile from multiple note types
  extractComorbidityProfile(patientId: string): ComorbidityProfile {
    // Get all relevant notes for this patient
    const consultNotes = this.notes.filter(
      note => note.patient_id === patientId && note.noteType === 'CONSULT'
    );
    const weeklyNotes = this.notes.filter(
      note => note.patient_id === patientId && note.noteType === 'WEEKLY TREATMENT'
    );
    const followupNotes = this.notes.filter(
      note => note.patient_id === patientId && note.noteType === 'FOLLOWUP'
    );
    const treatmentSummaryNotes = this.notes.filter(
      note => note.patient_id === patientId && note.noteType === 'TREATMENT SUMMARY'
    );
    
    // Initialize arrays for tracking scores across notes
    const ecogScores: { source: string; value: number; date: string }[] = [];
    const kpsScores: { source: string; value: number; date: string }[] = [];
    const painScores: { source: string; value: number; date: string }[] = [];
    const ipssScores: { source: string; value: number; date: string }[] = [];
    const auaScores: { source: string; value: number; date: string }[] = [];
    const shimScores: { source: string; value: number; date: string }[] = [];
    const iiefScores: { source: string; value: number; date: string }[] = [];
    let allMedicalConditions: string[] = [];
    
    let age: number | undefined;
    let hypertension = false;
    let copd = false;
    let diabetes = false;
    let cad = false;
    let smokingHistory = false;

    // Extract from consult notes
    consultNotes.forEach(note => {
      const noteData = note.noteAbstraction;
      const noteDate = note.creation || '';
      
      // Demographics
      if (noteData?.demographics?.age) {
        age = noteData.demographics.age;
      }
      
      // Medical history
      const medicalHistory = noteData?.history?.medical_history || [];
      const medicalHistoryArray = Array.isArray(medicalHistory) ? medicalHistory : [String(medicalHistory)];
      allMedicalConditions.push(...medicalHistoryArray.filter(condition => condition && condition.trim() !== ''));
      
      const medicalHistoryStr = medicalHistoryArray.join(' ').toLowerCase();
      
      hypertension = hypertension || medicalHistoryStr.includes('hypertension') || 
                    medicalHistoryStr.includes('htn') ||
                    medicalHistoryStr.includes('high blood pressure');
      copd = copd || medicalHistoryStr.includes('copd') || 
            medicalHistoryStr.includes('chronic obstructive') ||
            medicalHistoryStr.includes('emphysema');
      diabetes = diabetes || medicalHistoryStr.includes('diabetes') || 
               medicalHistoryStr.includes('dm') ||
               medicalHistoryStr.includes('diabetic');
      cad = cad || medicalHistoryStr.includes('coronary') || 
           medicalHistoryStr.includes('cad') ||
           medicalHistoryStr.includes('heart disease');
      
      // Smoking status
      const smokingStatus = typeof noteData?.history?.smoking_status === 'string' 
        ? noteData.history.smoking_status 
        : '';
      smokingHistory = smokingHistory || smokingStatus.toLowerCase().includes('former') || 
                      smokingStatus.toLowerCase().includes('current') ||
                      smokingStatus.toLowerCase().includes('smoking');
      
      // Assessment scores
      if (noteData?.assessment?.ecog !== undefined) {
        ecogScores.push({ source: 'consult', value: noteData.assessment.ecog, date: noteDate });
      }
      if (noteData?.assessment?.kps !== undefined) {
        kpsScores.push({ source: 'consult', value: noteData.assessment.kps, date: noteDate });
      }
      if (noteData?.assessment?.pain_score !== undefined) {
        painScores.push({ source: 'consult', value: noteData.assessment.pain_score, date: noteDate });
      }
      if (noteData?.assessment?.ipss !== undefined) {
        ipssScores.push({ source: 'consult', value: noteData.assessment.ipss, date: noteDate });
      }
      if (noteData?.assessment?.aua !== undefined) {
        auaScores.push({ source: 'consult', value: noteData.assessment.aua, date: noteDate });
      }
      if (noteData?.assessment?.shim !== undefined) {
        shimScores.push({ source: 'consult', value: noteData.assessment.shim, date: noteDate });
      }
      if (noteData?.assessment?.iief !== undefined) {
        iiefScores.push({ source: 'consult', value: noteData.assessment.iief, date: noteDate });
      }
    });

    // Extract from weekly treatment notes
    weeklyNotes.forEach(note => {
      const noteData = note.noteAbstraction;
      const noteDate = note.creation || '';
      
      if (noteData?.assessment?.ecog !== undefined) {
        ecogScores.push({ source: 'weekly', value: noteData.assessment.ecog, date: noteDate });
      }
      if (noteData?.assessment?.kps !== undefined) {
        kpsScores.push({ source: 'weekly', value: noteData.assessment.kps, date: noteDate });
      }
      if (noteData?.assessment?.pain_score !== undefined) {
        painScores.push({ source: 'weekly', value: noteData.assessment.pain_score, date: noteDate });
      }
      if (noteData?.assessment?.ipss !== undefined) {
        ipssScores.push({ source: 'weekly', value: noteData.assessment.ipss, date: noteDate });
      }
      if (noteData?.assessment?.aua !== undefined) {
        auaScores.push({ source: 'weekly', value: noteData.assessment.aua, date: noteDate });
      }
      if (noteData?.assessment?.shim !== undefined) {
        shimScores.push({ source: 'weekly', value: noteData.assessment.shim, date: noteDate });
      }
      if (noteData?.assessment?.iief !== undefined) {
        iiefScores.push({ source: 'weekly', value: noteData.assessment.iief, date: noteDate });
      }
    });

    // Extract from follow-up notes
    followupNotes.forEach(note => {
      const noteData = note.noteAbstraction;
      const noteDate = note.creation || '';
      
      if (noteData?.assessment?.ecog !== undefined) {
        ecogScores.push({ source: 'followup', value: noteData.assessment.ecog, date: noteDate });
      }
      if (noteData?.assessment?.kps !== undefined) {
        kpsScores.push({ source: 'followup', value: noteData.assessment.kps, date: noteDate });
      }
      if (noteData?.assessment?.pain_score !== undefined) {
        painScores.push({ source: 'followup', value: noteData.assessment.pain_score, date: noteDate });
      }
      if (noteData?.assessment?.ipss !== undefined) {
        ipssScores.push({ source: 'followup', value: noteData.assessment.ipss, date: noteDate });
      }
      if (noteData?.assessment?.aua !== undefined) {
        auaScores.push({ source: 'followup', value: noteData.assessment.aua, date: noteDate });
      }
      if (noteData?.assessment?.shim !== undefined) {
        shimScores.push({ source: 'followup', value: noteData.assessment.shim, date: noteDate });
      }
      if (noteData?.assessment?.iief !== undefined) {
        iiefScores.push({ source: 'followup', value: noteData.assessment.iief, date: noteDate });
      }
    });

    // Extract from treatment summary notes
    treatmentSummaryNotes.forEach(note => {
      const noteData = note.noteAbstraction;
      const noteDate = note.creation || '';
      
      if (noteData?.assessment?.ipss !== undefined) {
        ipssScores.push({ source: 'treatment-summary', value: noteData.assessment.ipss, date: noteDate });
      }
      if (noteData?.assessment?.aua !== undefined) {
        auaScores.push({ source: 'treatment-summary', value: noteData.assessment.aua, date: noteDate });
      }
      if (noteData?.assessment?.shim !== undefined) {
        shimScores.push({ source: 'treatment-summary', value: noteData.assessment.shim, date: noteDate });
      }
      if (noteData?.assessment?.iief !== undefined) {
        iiefScores.push({ source: 'treatment-summary', value: noteData.assessment.iief, date: noteDate });
      }
    });

    // Remove duplicates from medical conditions
    const uniqueConditions = new Set(allMedicalConditions);
    allMedicalConditions = [];
    uniqueConditions.forEach(condition => allMedicalConditions.push(condition));

    return {
      patientId,
      age,
      hypertension,
      copd,
      diabetes,
      cad,
      smokingHistory,
      allMedicalConditions,
      ecogScores,
      kpsScores,
      painScores,
      ipssScores,
      auaScores,
      shimScores,
      iiefScores
    };
  }

  // Extract treatment modality from simulation and treatment notes
  extractTreatmentModality(patientId: string): TreatmentModality {
    const treatmentNotes = this.notes.filter(
      note => note.patient_id === patientId && 
      (note.noteType === 'SIMULATION' || note.noteType === 'TREATMENT SUMMARY')
    );

    let treatmentType = 'Unknown';
    let totalDose: number | undefined;
    let fractions: number | undefined;
    let technique: string | undefined;

    for (const note of treatmentNotes) {
      const noteData = note.noteAbstraction;
      
      // Extract treatment type from note description or content
      const description = note.description?.toLowerCase() || '';
      
      // Extract from treatment summary technique and modality fields
      if (noteData?.treatment?.technique) {
        technique = noteData.treatment.technique;
        treatmentType = technique; // Use technique as primary treatment type
      }
      
      if (noteData?.treatment?.modality) {
        const modality = noteData.treatment.modality.toLowerCase();
        if (modality.includes('sbrt') || modality.includes('stereotactic')) {
          treatmentType = 'SBRT';
        } else if (modality.includes('imrt') || modality.includes('intensity')) {
          treatmentType = 'IMRT';
        } else if (modality.includes('3d') || modality.includes('conformal')) {
          treatmentType = '3D-CRT';
        } else if (modality.includes('proton')) {
          treatmentType = 'Proton';
        } else if (modality.includes('hdr') || modality.includes('brachytherapy')) {
          treatmentType = 'HDR';
        } else {
          treatmentType = noteData.treatment.modality;
        }
      }
      
      // Fallback to description parsing if no structured data
      if (treatmentType === 'Unknown') {
        if (description.includes('sbrt') || description.includes('stereotactic')) {
          treatmentType = 'SBRT';
        } else if (description.includes('imrt') || description.includes('intensity')) {
          treatmentType = 'IMRT';
        } else if (description.includes('3d') || description.includes('conformal')) {
          treatmentType = '3D-CRT';
        } else if (description.includes('proton')) {
          treatmentType = 'Proton';
        } else if (description.includes('hdr') || description.includes('brachytherapy')) {
          treatmentType = 'HDR';
        }
      }

      // Extract dose information if available
      if (noteData?.treatment?.total_dose) {
        totalDose = parseFloat(String(noteData.treatment.total_dose));
      }
      if (noteData?.treatment?.fractions) {
        fractions = parseInt(String(noteData.treatment.fractions));
      }
    }

    return {
      patientId,
      treatmentType,
      totalDose,
      fractions,
      technique
    };
  }

  // Extract treatment tolerance from daily treatment, weekly, and follow-up notes
  extractTreatmentTolerance(patientId: string): TreatmentTolerance {
    const dailyNotes = this.notes.filter(
      note => note.patient_id === patientId && note.noteType === 'DAILY TREATMENT'
    );
    const weeklyNotes = this.notes.filter(
      note => note.patient_id === patientId && note.noteType === 'WEEKLY TREATMENT'
    );
    const followupNotes = this.notes.filter(
      note => note.patient_id === patientId && note.noteType === 'FOLLOWUP'
    );

    let interruptions = 0;
    let doseReductions = false;
    let toxicityGrade = 0;
    const fatigueReports: { source: string; severity: string; date: string }[] = [];
    const dermatitisReports: { source: string; severity: string; date: string }[] = [];

    // Extract from daily treatment notes
    for (const note of dailyNotes) {
      const noteData = note.noteAbstraction;
      const description = note.description?.toLowerCase() || '';
      
      // Look for interruption indicators
      if (description.includes('interrupt') || description.includes('delay') || 
          description.includes('break') || description.includes('hold')) {
        interruptions++;
      }

      // Look for dose reduction indicators
      if (description.includes('reduce') || description.includes('decreased') ||
          description.includes('modified')) {
        doseReductions = true;
      }

      // Extract toxicity information
      if (noteData?.toxicity?.grade) {
        const grade = parseInt(String(noteData.toxicity.grade));
        if (!isNaN(grade)) {
          toxicityGrade = Math.max(toxicityGrade, grade);
        }
      }
    }

    // Extract fatigue and dermatitis from weekly treatment notes
    weeklyNotes.forEach(note => {
      const noteData = note.noteAbstraction;
      const noteDate = note.creation || '';
      const sideEffects = typeof noteData?.side_effects === 'string' 
        ? noteData.side_effects.toLowerCase() 
        : '';
      const reviewOfSystems = noteData?.review_of_systems || {};
      
      // Check for fatigue
      if (sideEffects.includes('fatigue') || sideEffects.includes('tired') || sideEffects.includes('exhausted')) {
        let severity = 'mild';
        if (sideEffects.includes('severe') || sideEffects.includes('grade 3')) severity = 'severe';
        else if (sideEffects.includes('moderate') || sideEffects.includes('grade 2')) severity = 'moderate';
        fatigueReports.push({ source: 'weekly', severity, date: noteDate });
      }
      
      // Check for dermatitis/skin reactions
      if (sideEffects.includes('dermatitis') || sideEffects.includes('skin') || sideEffects.includes('rash')) {
        let severity = 'mild';
        if (sideEffects.includes('severe') || sideEffects.includes('grade 3')) severity = 'severe';
        else if (sideEffects.includes('moderate') || sideEffects.includes('grade 2')) severity = 'moderate';
        dermatitisReports.push({ source: 'weekly', severity, date: noteDate });
      }

      // Check review of systems for additional fatigue/skin issues
      Object.entries(reviewOfSystems).forEach(([system, value]) => {
        if (typeof value === 'string') {
          const systemValue = value.toLowerCase();
          if (system.toLowerCase() === 'energy' || systemValue.includes('fatigue') || systemValue.includes('tired')) {
            fatigueReports.push({ source: 'weekly', severity: 'mild', date: noteDate });
          }
          if (system.toLowerCase() === 'skin' || systemValue.includes('rash') || systemValue.includes('dermatitis')) {
            dermatitisReports.push({ source: 'weekly', severity: 'mild', date: noteDate });
          }
        }
      });
    });

    // Extract fatigue and dermatitis from follow-up notes
    followupNotes.forEach(note => {
      const noteData = note.noteAbstraction;
      const noteDate = note.creation || '';
      const sideEffects = typeof noteData?.side_effects === 'string' 
        ? noteData.side_effects.toLowerCase() 
        : '';
      
      // Check for fatigue
      if (sideEffects.includes('fatigue') || sideEffects.includes('tired') || sideEffects.includes('exhausted')) {
        let severity = 'mild';
        if (sideEffects.includes('severe') || sideEffects.includes('grade 3')) severity = 'severe';
        else if (sideEffects.includes('moderate') || sideEffects.includes('grade 2')) severity = 'moderate';
        fatigueReports.push({ source: 'followup', severity, date: noteDate });
      }
      
      // Check for dermatitis/skin reactions
      if (sideEffects.includes('dermatitis') || sideEffects.includes('skin') || sideEffects.includes('rash')) {
        let severity = 'mild';
        if (sideEffects.includes('severe') || sideEffects.includes('grade 3')) severity = 'severe';
        else if (sideEffects.includes('moderate') || sideEffects.includes('grade 2')) severity = 'moderate';
        dermatitisReports.push({ source: 'followup', severity, date: noteDate });
      }
    });

    return {
      patientId,
      interruptions,
      doseReductions,
      toxicityGrade: toxicityGrade > 0 ? toxicityGrade : undefined,
      completedTreatment: interruptions < 3, // Arbitrary threshold
      fatigueReports,
      dermatitisReports
    };
  }

  // Extract outcome data from follow-up notes
  extractOutcomeData(patientId: string): OutcomeData {
    const followupNotes = this.notes.filter(
      note => note.patient_id === patientId && note.noteType === 'FOLLOWUP'
    );

    if (followupNotes.length === 0) {
      return {
        patientId,
        localControl: false,
        recurrence: false,
        lateToxicity: false,
        grade3Toxicity: false
      };
    }

    const latestFollowup = followupNotes.sort((a, b) => 
      new Date(b.creation).getTime() - new Date(a.creation).getTime()
    )[0];

    const noteData = latestFollowup.noteAbstraction;
    const diseaseStatus = typeof noteData?.disease_status === 'string' 
      ? noteData.disease_status.toLowerCase() 
      : '';
    const sideEffects = typeof noteData?.side_effects === 'string' 
      ? noteData.side_effects.toLowerCase() 
      : '';

    // Calculate survival months from treatment to latest follow-up
    const treatmentNotes = this.notes.filter(
      note => note.patient_id === patientId && note.noteType === 'CONSULT'
    );
    let survivalMonths: number | undefined;
    
    if (treatmentNotes.length > 0) {
      const firstTreatment = treatmentNotes.sort((a, b) => 
        new Date(a.creation).getTime() - new Date(b.creation).getTime()
      )[0];
      
      const monthsDiff = (new Date(latestFollowup.creation).getTime() - 
                         new Date(firstTreatment.creation).getTime()) / (1000 * 60 * 60 * 24 * 30);
      survivalMonths = Math.round(monthsDiff);
    }

    return {
      patientId,
      localControl: diseaseStatus.includes('ned') || diseaseStatus.includes('no evidence'),
      recurrence: diseaseStatus.includes('recurrence') || diseaseStatus.includes('progression'),
      survivalMonths,
      lateToxicity: sideEffects.includes('chronic') || sideEffects.includes('persistent'),
      grade3Toxicity: sideEffects.includes('severe') || sideEffects.includes('grade 3')
    };
  }

  // Generate comprehensive patient analytics
  generatePatientAnalytics(): Array<{
    patientId: string;
    comorbidities: ComorbidityProfile;
    treatment: TreatmentModality;
    tolerance: TreatmentTolerance;
    outcomes: OutcomeData;
  }> {
    const patientIds = Array.from(new Set(this.notes.map(note => note.patient_id)));
    
    return patientIds.map(patientId => ({
      patientId,
      comorbidities: this.extractComorbidityProfile(patientId),
      treatment: this.extractTreatmentModality(patientId),
      tolerance: this.extractTreatmentTolerance(patientId),
      outcomes: this.extractOutcomeData(patientId)
    }));
  }

  // Filter patients based on cohort criteria
  filterPatientCohort(analytics: ReturnType<typeof this.generatePatientAnalytics>, filters: CohortFilters): string[] {
    return analytics.filter(patient => {
      // Age filter
      if (filters.ageRange && patient.comorbidities.age) {
        if (patient.comorbidities.age < filters.ageRange.min || 
            patient.comorbidities.age > filters.ageRange.max) {
          return false;
        }
      }

      // Treatment type filter
      if (filters.treatmentTypes && filters.treatmentTypes.length > 0) {
        if (!filters.treatmentTypes.includes(patient.treatment.treatmentType)) {
          return false;
        }
      }

      // Comorbidity filter
      if (filters.comorbidities && filters.comorbidities.length > 0) {
        const hasRequiredComorbidities = filters.comorbidities.every(comorbidity => {
          switch (comorbidity.toLowerCase()) {
            case 'copd': return patient.comorbidities.copd;
            case 'diabetes': return patient.comorbidities.diabetes;
            case 'hypertension': return patient.comorbidities.hypertension;
            case 'cad': return patient.comorbidities.cad;
            case 'smoking': return patient.comorbidities.smokingHistory;
            default: return false;
          }
        });
        if (!hasRequiredComorbidities) return false;
      }

      // ECOG filter
      if (filters.ecogRange && patient.comorbidities.ecogScores.length > 0) {
        const latestEcog = patient.comorbidities.ecogScores[patient.comorbidities.ecogScores.length - 1];
        if (latestEcog.value < filters.ecogRange.min || 
            latestEcog.value > filters.ecogRange.max) {
          return false;
        }
      }

      return true;
    }).map(patient => patient.patientId);
  }

  // Generate insights based on cohort comparison
  generateInsights(analytics: ReturnType<typeof this.generatePatientAnalytics>): string[] {
    const insights: string[] = [];
    
    // Group by treatment type and comorbidities
    const treatmentGroups = analytics.reduce((acc, patient) => {
      const key = `${patient.treatment.treatmentType}_${patient.comorbidities.copd ? 'COPD' : 'NoCOPD'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(patient);
      return acc;
    }, {} as Record<string, typeof analytics>);

    // Compare SBRT vs IMRT for COPD patients
    const sbrtCopd = treatmentGroups['SBRT_COPD'] || [];
    const imrtCopd = treatmentGroups['IMRT_COPD'] || [];
    
    if (sbrtCopd.length > 0 && imrtCopd.length > 0) {
      const sbrtInterruptions = sbrtCopd.reduce((sum, p) => sum + p.tolerance.interruptions, 0) / sbrtCopd.length;
      const imrtInterruptions = imrtCopd.reduce((sum, p) => sum + p.tolerance.interruptions, 0) / imrtCopd.length;
      
      if (Math.abs(sbrtInterruptions - imrtInterruptions) > 0.5) {
        const better = sbrtInterruptions < imrtInterruptions ? 'SBRT' : 'IMRT';
        const diff = Math.abs(sbrtInterruptions - imrtInterruptions).toFixed(1);
        insights.push(`Among patients with COPD, ${better} had ${diff} fewer treatment interruptions on average.`);
      }
    }

    // Diabetes and treatment tolerance
    const diabeticPatients = analytics.filter(p => p.comorbidities.diabetes);
    const nonDiabeticPatients = analytics.filter(p => !p.comorbidities.diabetes);
    
    if (diabeticPatients.length > 0 && nonDiabeticPatients.length > 0) {
      const diabeticGrade3 = diabeticPatients.filter(p => p.outcomes.grade3Toxicity).length / diabeticPatients.length;
      const nonDiabeticGrade3 = nonDiabeticPatients.filter(p => p.outcomes.grade3Toxicity).length / nonDiabeticPatients.length;
      
      if (Math.abs(diabeticGrade3 - nonDiabeticGrade3) > 0.1) {
        const higher = diabeticGrade3 > nonDiabeticGrade3 ? 'diabetic' : 'non-diabetic';
        const diff = (Math.abs(diabeticGrade3 - nonDiabeticGrade3) * 100).toFixed(0);
        insights.push(`${higher.charAt(0).toUpperCase() + higher.slice(1)} patients had ${diff}% higher rate of Grade 3+ toxicity.`);
      }
    }

    return insights;
  }
}