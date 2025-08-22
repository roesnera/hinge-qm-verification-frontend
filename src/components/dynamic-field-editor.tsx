import { useState } from 'react';
import { Button } from '@src/components/ui/button';
import { Input } from '@src/components/ui/input';
import { Textarea } from '@src/components/ui/textarea';
import { Card, CardContent } from '@src/components/ui/card';
import { Plus, X, Edit3 } from 'lucide-react';
import { Badge } from '@src/components/ui/badge';

interface DynamicFieldEditorProps {
  title: string;
  data: any;
  fieldPath: string;
  onEdit: (fieldPath: string, value: any) => void;
  isEditMode: boolean;
}

export default function DynamicFieldEditor({ 
  title, 
  data, 
  fieldPath, 
  onEdit, 
  isEditMode 
}: DynamicFieldEditorProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Handle different data types
  const getDataEntries = () => {
    if (!data) return [];
    
    if (Array.isArray(data)) {
      return data.map((item, index) => [index.toString(), item]);
    }
    
    if (typeof data === 'object') {
      return Object.entries(data);
    }
    
    return [['value', data]];
  };

  const handleAddItem = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    
    const entries = getDataEntries();
    const updatedData = Array.isArray(data) 
      ? [...(data || []), newValue]
      : { ...(data || {}), [newKey]: newValue };
    
    onEdit(fieldPath, updatedData);
    setNewKey('');
    setNewValue('');
    setShowAddForm(false);
  };

  const handleUpdateItem = (key: string, value: any) => {
    if (Array.isArray(data)) {
      const updatedArray = [...data];
      updatedArray[parseInt(key)] = value;
      onEdit(fieldPath, updatedArray);
    } else {
      onEdit(fieldPath, { ...data, [key]: value });
    }
  };

  const handleRemoveItem = (key: string) => {
    if (Array.isArray(data)) {
      const updatedArray = data.filter((_, index) => index.toString() !== key);
      onEdit(fieldPath, updatedArray);
    } else {
      const updatedData = { ...data };
      delete updatedData[key];
      onEdit(fieldPath, updatedData);
    }
  };

  const renderValue = (value: any, key: string) => {
    if (isEditMode) {
      if (typeof value === 'string' && value.length > 100) {
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleUpdateItem(key, e.target.value)}
            className="min-h-[80px]"
          />
        );
      }
      
      // Handle complex objects in edit mode by converting to JSON string for editing
      if (typeof value === 'object' && value !== null) {
        return (
          <Textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsedValue = JSON.parse(e.target.value);
                handleUpdateItem(key, parsedValue);
              } catch {
                // If not valid JSON, treat as string
                handleUpdateItem(key, e.target.value);
              }
            }}
            className="min-h-[60px] font-mono text-xs"
          />
        );
      }
      
      return (
        <Input
          value={String(value) || ''}
          onChange={(e) => handleUpdateItem(key, e.target.value)}
        />
      );
    }
    
    // Handle complex objects by showing them in a more readable format
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return (
          <div className="space-y-1">
            {value.map((item, index) => (
              <span key={index} className="block text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                {typeof item === 'string' ? item : JSON.stringify(item)}
              </span>
            ))}
          </div>
        );
      }
      
      // For objects, show key-value pairs in a readable format
      return (
        <div className="space-y-1">
          {Object.entries(value).map(([objKey, objValue]) => (
            <div key={objKey} className="text-sm">
              <span className="font-medium text-gray-600">{objKey.replace(/_/g, ' ')}: </span>
              <span className="text-gray-800">{String(objValue) || 'Not specified'}</span>
            </div>
          ))}
        </div>
      );
    }
    
    // Handle boolean values
    if (typeof value === 'boolean') {
      return <span className="text-gray-800">{value ? 'Yes' : 'No'}</span>;
    }
    
    return <span className="text-gray-800">{String(value) || 'Not specified'}</span>;
  };

  const entries = getDataEntries();

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 flex items-center">
            <Edit3 className="h-4 w-4 mr-2" />
            {title}
          </h4>
          {isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          )}
        </div>

        {entries.length === 0 && !isEditMode && (
          <p className="text-gray-500 italic">No data available</p>
        )}

        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start space-x-2 mb-3 p-2 bg-gray-50 rounded">
            <div className="flex-1">
              {!Array.isArray(data) && (
                <div className="mb-1">
                  {isEditMode ? (
                    <Input
                      value={key}
                      onChange={(e) => {
                        const newData = { ...data };
                        delete newData[key];
                        newData[e.target.value] = value;
                        onEdit(fieldPath, newData);
                      }}
                      className="font-medium text-sm mb-2"
                      placeholder="Field name"
                    />
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {key}
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex-1">
                {renderValue(value, key)}
              </div>
            </div>
            {isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveItem(key)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {showAddForm && isEditMode && (
          <Card className="mt-3 p-3 bg-blue-50 border-blue-200">
            <div className="space-y-2">
              {!Array.isArray(data) && (
                <Input
                  placeholder="Field name (e.g., 'new_condition')"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              )}
              <Textarea
                placeholder="Field value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={2}
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleAddItem}>
                  Add
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewKey('');
                    setNewValue('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}