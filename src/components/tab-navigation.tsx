import { Separator } from "@src/components/ui/separator";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  availableTabs: string[];
}

export default function TabNavigation({ activeTab, onTabChange, availableTabs }: TabNavigationProps) {
  // Map tab keys to display names
  const tabNames: Record<string, string> = {
    'consult': 'Consult',
    'ct-simulation': 'CT Simulation',
    'daily-treatment': 'Daily Treatment',
    'weekly-treatment': 'Weekly Treatment',
    'nurse': 'Nurse',
    'treatment-summary': 'Treatment Summary',
    'followup': 'Follow-up',
    'other': 'Other'
  };

  // Get all available tabs in a specific order
  const orderedTabs = [
    'consult',
    'ct-simulation',
    'daily-treatment',
    'weekly-treatment',
    'nurse',
    'treatment-summary',
    'followup',
    'other'
  ].filter(tab => availableTabs.includes(tab));

  return (
    <div className="border-b border-slate-200 mb-6">
      <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {orderedTabs.map(tab => (
          <button
            key={tab}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => onTabChange(tab)}
          >
            {tabNames[tab] || tab}
          </button>
        ))}
      </nav>
    </div>
  );
}
