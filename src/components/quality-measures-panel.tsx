import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@src/components/ui/card';
import { Button } from '@src/components/ui/button';
import { Badge } from '@src/components/ui/badge';
import { ScrollArea } from '@src/components/ui/scroll-area';
import { Separator } from '@src/components/ui/separator';
import { ChevronRight, ChevronDown, Award, X, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@src/components/ui/collapsible';

interface QualityMeasure {
  _id: string;
  patient_id: string;
  data: Record<string, {
    name: string;
    id: string;
    final_outcome: string;
    evaluation_steps: any[];
  }>;
}

// Quality measure calculation steps are embedded in the measure data
// No need for separate QMCalculation interface since steps are part of evaluation_steps

interface QualityMeasuresPanelProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QualityMeasuresPanel({ patientId, isOpen, onClose }: QualityMeasuresPanelProps) {
  const [selectedMeasure, setSelectedMeasure] = useState<QualityMeasure | null>(null);
  const [expandedMeasures, setExpandedMeasures] = useState<Set<string>>(new Set());

  // Fetch quality measures for the patient
  const { data: qualityMeasuresData, isLoading: isLoadingMeasures } = useQuery({
    queryKey: ['/api/patients', patientId, 'quality-measures'],
    queryFn: () =>
      fetch(`${process.env.API_URL||'http://localhost:5000'}/api/patients/${patientId}/quality-measures`)
        .then(res => res.json())
        .then(data => data.qualityMeasures),
    enabled: !!patientId && isOpen
  });

  // Note: Calculation steps are embedded in the measure data itself
  // so we don't need a separate API call for the qm_calc collection

  const getOutcomeIcon = (outcome: string | undefined | null) => {
    if (!outcome) return <Activity className="h-4 w-4 text-gray-400" />;
    const normalizedOutcome = outcome.toLowerCase();
    switch (normalizedOutcome) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <X className="h-4 w-4 text-red-600" />;
      case 'exclusion':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'missing data':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getOutcomeBadge = (outcome: string | undefined | null) => {
    if (!outcome) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 capitalize">
          {getOutcomeIcon(outcome)}
          <span className="ml-1">Unknown</span>
        </Badge>
      );
    }

    const normalizedOutcome = outcome.toLowerCase();
    const variants = {
      pass: 'bg-green-100 text-green-800 border-green-200',
      fail: 'bg-red-100 text-red-800 border-red-200',
      exclusion: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'missing data': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <Badge
        variant="outline"
        className={`${variants[normalizedOutcome as keyof typeof variants] || 'bg-gray-100 text-gray-800'} capitalize`}
      >
        {getOutcomeIcon(normalizedOutcome)}
        <span className="ml-1">{outcome}</span>
      </Badge>
    );
  };

  const toggleMeasureExpansion = (measureId: string) => {
    const newExpanded = new Set(expandedMeasures);
    if (newExpanded.has(measureId)) {
      newExpanded.delete(measureId);
    } else {
      newExpanded.add(measureId);
    }
    setExpandedMeasures(newExpanded);
  };

  // Decision tree rendering is now handled inline in the component
  // since evaluation steps are embedded directly in the measure data

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-lg">Quality Measures</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Patient ID */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-900">Patient: {patientId}</div>
            </div>

            {/* Loading State */}
            {isLoadingMeasures && (
              <div className="text-center text-gray-500 py-8">
                Loading quality measures...
              </div>
            )}

            {/* Quality Measures List */}
            {qualityMeasuresData && qualityMeasuresData.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  // Extract all individual measures from the data structure
                  const allMeasures: Array<{
                    id: string;
                    name: string;
                    final_outcome: string;
                    evaluation_steps: any[];
                    parentId: string;
                  }> = [];

                  qualityMeasuresData.forEach((measureDoc: QualityMeasure) => {
                    if (measureDoc.data) {
                      Object.entries(measureDoc.data).forEach(([_key, measure]) => {
                        allMeasures.push({
                          id: measure.id,
                          name: measure.name,
                          final_outcome: measure.final_outcome,
                          evaluation_steps: measure.evaluation_steps,
                          parentId: measureDoc._id
                        });
                      });
                    }
                  });

                  return (
                    <>
                      <h4 className="font-medium text-slate-700">Quality Measures ({allMeasures.length})</h4>

                      {allMeasures.map((measure) => (
                        <Card key={`${measure.parentId}-${measure.id}`} className="hover:shadow-md transition-shadow">
                          <Collapsible
                            open={expandedMeasures.has(measure.id)}
                            onOpenChange={() => toggleMeasureExpansion(measure.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm font-medium line-clamp-2">
                                      {measure.name}
                                    </CardTitle>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      QM ID: {measure.id}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 ml-2">
                                    {getOutcomeBadge(measure.final_outcome)}
                                    {expandedMeasures.has(measure.id) ?
                                      <ChevronDown className="h-4 w-4" /> :
                                      <ChevronRight className="h-4 w-4" />
                                    }
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <div className="space-y-3">
                                  {/* Evaluation Steps Summary */}
                                  {measure.evaluation_steps && measure.evaluation_steps.length > 0 && (
                                    <div>
                                      <div className="text-xs font-medium text-slate-600 mb-2">
                                        Evaluation Steps ({measure.evaluation_steps.length})
                                      </div>
                                      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded max-h-20 overflow-y-auto">
                                        {JSON.stringify(measure.evaluation_steps, null, 2)}
                                      </div>
                                    </div>
                                  )}

                                  <Separator />

                                  {/* View Decision Tree Button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMeasure({
                                        _id: measure.parentId,
                                        patient_id: patientId,
                                        data: {
                                          [measure.id]: {
                                            name: measure.name,
                                            id: measure.id,
                                            final_outcome: measure.final_outcome,
                                            evaluation_steps: measure.evaluation_steps
                                          }
                                        }
                                      });
                                    }}
                                    className="w-full"
                                  >
                                    <Activity className="h-4 w-4 mr-2" />
                                    View Decision Tree
                                  </Button>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      ))}
                    </>
                  );
                })()}
              </div>
            ) : qualityMeasuresData && qualityMeasuresData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Award className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <div className="text-sm">No quality measures found for this patient</div>
              </div>
            ) : null}



            {/* Decision Tree - Always render when state exists */}
            {selectedMeasure !== null && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Decision Tree Visualization</h2>
                    <Button
                      onClick={() => setSelectedMeasure(null)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="p-6">
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
                      <div className="font-semibold text-green-900">🎯 Decision Tree Successfully Loaded!</div>
                      <div className="text-green-800 text-sm mt-1">
                        Measure ID: {selectedMeasure._id}
                      </div>
                      <div className="text-green-800 text-sm">
                        Available data: {Object.keys(selectedMeasure.data || {}).join(', ')}
                      </div>
                    </div>

                    {Object.entries(selectedMeasure.data || {}).map(([measureKey, measureData]: [string, any]) => (
                      <div key={measureKey} className="mb-8">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{measureData.name}</h3>
                          <p className="text-sm text-gray-600">Quality Measure ID: {measureData.id}</p>
                        </div>

                        {/* Decision Tree Visualization */}
                        <div className="relative bg-gray-50 p-6 rounded-lg border border-gray-200">
                          <div className="text-center mb-6">
                            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                              Start: Quality Measure Evaluation
                            </div>
                          </div>

                          {/* Tree Structure */}
                          <div className="flex flex-col items-center space-y-8">
                            {(measureData.evaluation_steps || []).map((step: any, stepIndex: number) => (
                              <div key={stepIndex} className="flex flex-col items-center w-full max-w-4xl">
                                {/* Connection line from previous step */}
                                {stepIndex > 0 && (
                                  <div className="w-1 h-8 bg-gray-400 mb-4"></div>
                                )}

                                {/* Decision Node */}
                                <div className="relative flex items-center justify-center w-full">
                                  <div className="flex flex-col items-center bg-white border-2 border-gray-300 rounded-xl p-4 shadow-lg min-w-80">
                                    {/* Node Header */}
                                    <div className="flex items-center space-x-3 mb-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                                        step.result === 'True' ? 'bg-green-500' :
                                        step.result === 'False' ? 'bg-red-500' :
                                        'bg-gray-500'
                                      }`}>
                                        {stepIndex + 1}
                                      </div>
                                      <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded font-bold">
                                        {step.id}
                                      </code>
                                    </div>

                                    {/* Node Content */}
                                    <div className="text-center space-y-2 w-full">
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium">Evaluation Question:</span>
                                        <div className="mt-1 text-gray-800 font-medium">
                                          {step.id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                        </div>
                                      </div>

                                      <div className="text-sm">
                                        <span className="font-medium text-gray-600">Patient Value: </span>
                                        <span className="bg-blue-50 px-3 py-1 rounded-lg text-blue-800 font-mono font-bold">
                                          {step.patient_value !== null && step.patient_value !== undefined
                                            ? String(step.patient_value)
                                            : 'Not Available'}
                                        </span>
                                      </div>

                                      <div className={`inline-block px-4 py-2 rounded-lg font-bold text-sm ${
                                        step.result === 'True' ? 'bg-green-100 text-green-800 border border-green-300' :
                                        step.result === 'False' ? 'bg-red-100 text-red-800 border border-red-300' :
                                        'bg-gray-100 text-gray-800 border border-gray-300'
                                      }`}>
                                        Result: {step.result}
                                      </div>

                                      {step.outcome && (
                                        <div className="mt-2">
                                          <span className={`px-3 py-1 rounded-lg font-medium text-sm ${
                                            step.outcome === 'Fail' ? 'bg-red-50 text-red-700 border border-red-200' :
                                            step.outcome === 'Pass' ? 'bg-green-50 text-green-700 border border-green-200' :
                                            'bg-purple-50 text-purple-700 border border-purple-200'
                                          }`}>
                                            Outcome: {step.outcome}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Branch indicators */}
                                  {stepIndex < (measureData.evaluation_steps || []).length - 1 && (
                                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <div className="text-xs text-gray-500 font-medium">Next Step</div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Add decision path visualization for failed steps */}
                                {step.result === 'False' && step.outcome === 'Fail' && (
                                  <div className="mt-4 flex items-center justify-center">
                                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center space-x-2">
                                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                      <span className="text-red-800 font-medium text-sm">
                                        Evaluation stops here - Quality measure fails
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Final Outcome with Tree Termination */}
                        <div className="mt-8 flex flex-col items-center">
                          <div className="w-1 h-8 bg-gray-400 mb-4"></div>
                          <div className={`p-6 rounded-xl border-2 shadow-lg text-center ${
                            measureData.final_outcome === 'Pass' ? 'bg-green-50 border-green-300' :
                            measureData.final_outcome === 'Fail' ? 'bg-red-50 border-red-300' :
                            'bg-gray-50 border-gray-300'
                          }`}>
                            <div className="text-sm font-medium text-gray-600 mb-2">Final Quality Measure Result</div>
                            <div className={`text-2xl font-bold mb-2 ${
                              measureData.final_outcome === 'Pass' ? 'text-green-800' :
                              measureData.final_outcome === 'Fail' ? 'text-red-800' :
                              'text-gray-800'
                            }`}>
                              {measureData.final_outcome}
                            </div>
                            <div className="text-sm text-gray-600">
                              Evaluated through {(measureData.evaluation_steps || []).length} decision steps
                            </div>

                            {/* Summary of path taken */}
                            <div className="mt-4 text-xs text-gray-500 max-w-md">
                              <div className="font-medium mb-1">Decision Path Summary:</div>
                              <div className="space-y-1">
                                {(measureData.evaluation_steps || []).map((step: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span>{step.id}</span>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      step.result === 'True' ? 'bg-green-100 text-green-700' :
                                      step.result === 'False' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {step.result}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
