import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@src/components/ui/card";
import { Button } from "@src/components/ui/button";
import { Badge } from "@src/components/ui/badge";
import { Checkbox } from "@src/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@src/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import type { Note } from "@intelligenthealthsolutions/hinge-qm-verification/esm";
import { ComorbidityAnalyzer, CohortFilters } from "@src/lib/analytics";
import { BarChart3, TrendingUp, Users, AlertTriangle } from "lucide-react";

interface ComorbidityAnalyzerProps {
  notes: Note[];
}

export default function ComorbidityAnalyzerComponent({ notes }: ComorbidityAnalyzerProps) {
  const [filters, setFilters] = useState<CohortFilters>({
    ageRange: { min: 50, max: 90 },
    treatmentTypes: [],
    comorbidities: [],
    ecogRange: { min: 0, max: 4 }
  });

  const [selectedComorbidities, setSelectedComorbidities] = useState<string[]>([]);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const analyzer = useMemo(() => new ComorbidityAnalyzer(notes), [notes]);
  const analytics = useMemo(() => analyzer.generatePatientAnalytics(), [analyzer]);
  const insights = useMemo(() => analyzer.generateInsights(analytics), [analyzer, analytics]);

  // Available filter options
  const availableComorbidities = ['COPD', 'Diabetes', 'Hypertension', 'CAD', 'Smoking'];
  const availableTreatments = Array.from(new Set(analytics.map(p => p.treatment.treatmentType))).filter(t => t !== 'Unknown');

  // Filter analytics based on current filters
  const filteredAnalytics = useMemo(() => {
    return analytics.filter(patient => {
      // Age filter
      if (filters.ageRange && patient.comorbidities.age) {
        if (patient.comorbidities.age < filters.ageRange.min ||
            patient.comorbidities.age > filters.ageRange.max) {
          return false;
        }
      }

      // Treatment type filter
      if (selectedTreatments.length > 0) {
        if (!selectedTreatments.includes(patient.treatment.treatmentType)) {
          return false;
        }
      }

      // Comorbidity filter
      if (selectedComorbidities.length > 0) {
        const hasRequiredComorbidities = selectedComorbidities.some(comorbidity => {
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

      return true;
    });
  }, [analytics, filters, selectedComorbidities, selectedTreatments]);

  // Generate chart data for comorbidity distribution by treatment
  const comorbidityDistributionData = useMemo(() => {
    const treatmentData: Record<string, Record<string, number>> = {};

    filteredAnalytics.forEach(patient => {
      const treatment = patient.treatment.treatmentType;
      if (!treatmentData[treatment]) {
        treatmentData[treatment] = {
          COPD: 0,
          Diabetes: 0,
          Hypertension: 0,
          CAD: 0,
          Total: 0
        };
      }

      treatmentData[treatment].Total++;
      if (patient.comorbidities.copd) treatmentData[treatment].COPD++;
      if (patient.comorbidities.diabetes) treatmentData[treatment].Diabetes++;
      if (patient.comorbidities.hypertension) treatmentData[treatment].Hypertension++;
      if (patient.comorbidities.cad) treatmentData[treatment].CAD++;
    });

    return Object.entries(treatmentData).map(([treatment, data]) => ({
      treatment,
      COPD: (data.COPD / data.Total * 100).toFixed(1),
      Diabetes: (data.Diabetes / data.Total * 100).toFixed(1),
      Hypertension: (data.Hypertension / data.Total * 100).toFixed(1),
      CAD: (data.CAD / data.Total * 100).toFixed(1),
      Total: data.Total
    }));
  }, [filteredAnalytics]);

  // Generate treatment interruption data
  const interruptionData = useMemo(() => {
    const groups = ['Non-Diabetic', 'Diabetic'];

    return groups.map(group => {
      const patients = filteredAnalytics.filter(p =>
        group === 'Diabetic' ? p.comorbidities.diabetes : !p.comorbidities.diabetes
      );

      const interruptions = patients.map(p => p.tolerance.interruptions);
      const avg = interruptions.length > 0 ?
        interruptions.reduce((sum, val) => sum + val, 0) / interruptions.length : 0;

      return {
        group,
        interruptions: avg.toFixed(1),
        count: patients.length
      };
    });
  }, [filteredAnalytics]);

  // Generate survival data for chart
  const survivalData = useMemo(() => {
    const treatmentGroups: Record<string, { months: number[]; copd: boolean[] }> = {};

    filteredAnalytics.forEach(patient => {
      if (patient.outcomes.survivalMonths !== undefined) {
        const key = patient.treatment.treatmentType;
        if (!treatmentGroups[key]) {
          treatmentGroups[key] = { months: [], copd: [] };
        }
        treatmentGroups[key].months.push(patient.outcomes.survivalMonths);
        treatmentGroups[key].copd.push(patient.comorbidities.copd);
      }
    });

    // Generate mock survival curves for visualization
    const timePoints = [0, 6, 12, 18, 24, 30, 36];
    const curves: Array<{ time: number; [key: string]: number }> = [];

    timePoints.forEach(time => {
      const point: { time: number; [key: string]: number } = { time };

      Object.entries(treatmentGroups).forEach(([treatment, data]) => {
        const copdPatients = data.months.filter((_, i) => data.copd[i]);
        const nonCopdPatients = data.months.filter((_, i) => !data.copd[i]);

        // Calculate survival probability (simplified)
        const calculateSurvival = (months: number[], timePoint: number) => {
          if (months.length === 0) return 0;
          const surviving = months.filter(m => m >= timePoint).length;
          return surviving / months.length;
        };

        if (copdPatients.length > 0) {
          point[`${treatment} (+COPD)`] = calculateSurvival(copdPatients, time);
        }
        if (nonCopdPatients.length > 0) {
          point[`${treatment} (-COPD)`] = calculateSurvival(nonCopdPatients, time);
        }
      });

      curves.push(point);
    });

    return curves;
  }, [filteredAnalytics]);

  const handleComorbidityChange = (comorbidity: string, checked: boolean) => {
    if (checked) {
      setSelectedComorbidities(prev => [...prev, comorbidity]);
    } else {
      setSelectedComorbidities(prev => prev.filter(c => c !== comorbidity));
    }
  };

  const handleTreatmentChange = (treatment: string, checked: boolean) => {
    if (checked) {
      setSelectedTreatments(prev => [...prev, treatment]);
    } else {
      setSelectedTreatments(prev => prev.filter(t => t !== treatment));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Comorbidity-Treatment Tradeoff Analyzer
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Age Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Age Range</label>
              <Select
                value={`${filters.ageRange?.min}-${filters.ageRange?.max}`}
                onValueChange={(value) => {
                  const [min, max] = value.split('-').map(Number);
                  setFilters(prev => ({ ...prev, ageRange: { min, max } }));
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50-90">50-90 years</SelectItem>
                  <SelectItem value="50-70">50-70 years</SelectItem>
                  <SelectItem value="70-90">70-90 years</SelectItem>
                  <SelectItem value="60-80">60-80 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Treatment Types */}
            <div>
              <label className="text-sm font-medium mb-2 block">Treatment Type</label>
              <div className="flex flex-wrap gap-2">
                {availableTreatments.map(treatment => (
                  <div key={treatment} className="flex items-center space-x-2">
                    <Checkbox
                      id={`treatment-${treatment}`}
                      checked={selectedTreatments.includes(treatment)}
                      onCheckedChange={(checked) =>
                        handleTreatmentChange(treatment, checked as boolean)
                      }
                    />
                    <label htmlFor={`treatment-${treatment}`} className="text-sm">
                      {treatment}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Comorbidities */}
            <div>
              <label className="text-sm font-medium mb-2 block">Comorbidities</label>
              <div className="flex flex-wrap gap-2">
                {availableComorbidities.map(comorbidity => (
                  <div key={comorbidity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`comorbidity-${comorbidity}`}
                      checked={selectedComorbidities.includes(comorbidity)}
                      onCheckedChange={(checked) =>
                        handleComorbidityChange(comorbidity, checked as boolean)
                      }
                    />
                    <label htmlFor={`comorbidity-${comorbidity}`} className="text-sm">
                      {comorbidity}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowComparison(!showComparison)}
                variant={showComparison ? "default" : "outline"}
              >
                Compare Cohorts
              </Button>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {filteredAnalytics.length} patients
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Survival Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Survival</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={survivalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Survival Probability', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {Object.keys(survivalData[0] || {}).filter(key => key !== 'time').map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={['#3b82f6', '#f59e0b', '#10b981', '#ef4444'][index % 4]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{insight}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Select filters to generate insights about treatment outcomes and comorbidities.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comorbidity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comorbidity Distribution by Treatment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comorbidityDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="treatment" />
                <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="COPD" fill="#3b82f6" />
                <Bar dataKey="Diabetes" fill="#f59e0b" />
                <Bar dataKey="Hypertension" fill="#10b981" />
                <Bar dataKey="CAD" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Treatment Interruptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Treatment Interruptions vs. Diabetes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={interruptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" />
                <YAxis label={{ value: 'Avg Interruptions', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="interruptions" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Sample sizes: {interruptionData.map(d => `${d.group}: ${d.count}`).join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cohort Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredAnalytics.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Patients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredAnalytics.filter(p => p.outcomes.localControl).length}
              </div>
              <div className="text-sm text-muted-foreground">Local Control</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredAnalytics.filter(p => p.tolerance.interruptions > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Had Interruptions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredAnalytics.filter(p => p.outcomes.grade3Toxicity).length}
              </div>
              <div className="text-sm text-muted-foreground">Grade 3+ Toxicity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Clinical Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comprehensive Clinical Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Medical Conditions */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-slate-800">Medical Conditions</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Hypertension:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.hypertension).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>COPD:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.copd).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diabetes:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.diabetes).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>CAD:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.cad).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Smoking History:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.smokingHistory).length}</span>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <span className="text-sm text-slate-600">
                    Total conditions documented: {filteredAnalytics.reduce((sum, p) => sum + p.comorbidities.allMedicalConditions.length, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Assessment Scores */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-slate-800">Assessment Scores Documented</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ECOG scores:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.ecogScores.length > 0).length} patients</span>
                </div>
                <div className="flex justify-between">
                  <span>KPS scores:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.kpsScores.length > 0).length} patients</span>
                </div>
                <div className="flex justify-between">
                  <span>Pain scores:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.painScores.length > 0).length} patients</span>
                </div>
                <div className="flex justify-between">
                  <span>IPSS scores:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.ipssScores.length > 0).length} patients</span>
                </div>
                <div className="flex justify-between">
                  <span>AUA scores:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.auaScores.length > 0).length} patients</span>
                </div>
                <div className="flex justify-between">
                  <span>SHIM scores:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.shimScores.length > 0).length} patients</span>
                </div>
                <div className="flex justify-between">
                  <span>IIEF scores:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.comorbidities.iiefScores.length > 0).length} patients</span>
                </div>
              </div>
            </div>

            {/* Side Effects & Tolerance */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-slate-800">Treatment Tolerance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Fatigue reported:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.tolerance.fatigueReports.length > 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dermatitis reported:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.tolerance.dermatitisReports.length > 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Treatment completed:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.tolerance.completedTreatment).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dose reductions:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.tolerance.doseReductions).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Had interruptions:</span>
                  <span className="font-medium">{filteredAnalytics.filter(p => p.tolerance.interruptions > 0).length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Treatment Techniques & Modalities */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3 text-slate-800">Treatment Techniques & Modalities</h4>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from(new Set(filteredAnalytics.map(p => p.treatment.treatmentType))).filter(t => t !== 'Unknown').map(treatmentType => (
                  <div key={treatmentType} className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {filteredAnalytics.filter(p => p.treatment.treatmentType === treatmentType).length}
                    </div>
                    <div className="text-sm text-slate-600">{treatmentType}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Disease Status Summary */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3 text-slate-800">Disease Status Summary</h4>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {filteredAnalytics.filter(p => p.outcomes.localControl).length}
                  </div>
                  <div className="text-sm text-slate-600">Local Control</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {filteredAnalytics.filter(p => p.outcomes.recurrence).length}
                  </div>
                  <div className="text-sm text-slate-600">Recurrence</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {filteredAnalytics.filter(p => p.outcomes.lateToxicity).length}
                  </div>
                  <div className="text-sm text-slate-600">Late Toxicity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {filteredAnalytics.filter(p => p.outcomes.grade3Toxicity).length}
                  </div>
                  <div className="text-sm text-slate-600">Grade 3+ Toxicity</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
