import { useState } from 'react';
import { 
  ShieldAlert, LayoutDashboard, Map, Settings, 
  Clock, MapPin, AlertTriangle, 
  CheckCircle2, RadioReceiver 
} from 'lucide-react';

type IncidentStatus = 'Reported' | 'En Route' | 'Resolved';

interface Incident {
  id: string;
  type: string;
  locationText: string;
  taggedDepartments: string[];
  description: string;
  timestamp: string;
  status: IncidentStatus;
}

const initialIncidents: Incident[] = [
  {
    id: 'INC-2026-452',
    type: 'Fire Incidence Report',
    locationText: 'Faculty of Science, Block B, University of Lagos',
    taggedDepartments: ['Fire Station', 'Medical Center'],
    description: 'Thick smoke coming from the chemistry lab on the second floor.',
    timestamp: '14:32',
    status: 'Reported',
  },
  {
    id: 'INC-2026-451',
    type: 'Medical Emergency Report',
    locationText: 'Moremi Hall, University of Lagos',
    taggedDepartments: ['Medical Center'],
    description: 'Student fainted in the hallway.',
    timestamp: '14:15',
    status: 'En Route',
  },
  {
    id: 'INC-2026-440',
    type: 'Security & Protocol Report',
    locationText: 'Main Gate, University of Lagos',
    taggedDepartments: ['Alpha Base'],
    description: 'Crowd control required at the visitor entrance.',
    timestamp: '13:05',
    status: 'Resolved',
  }
];

export default function ResponderDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [selectedId, setSelectedId] = useState<string | null>(initialIncidents[0].id);
  const [activeTab, setActiveTab] = useState<'All' | 'Reported' | 'En Route'>('All');

  const selectedIncident = incidents.find(i => i.id === selectedId);
  const filteredIncidents = activeTab === 'All' 
    ? incidents 
    : incidents.filter(i => i.status === activeTab);

  const updateStatus = (id: string, newStatus: IncidentStatus) => {
    setIncidents(prev => 
      prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc)
    );
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'Reported': return 'bg-status-danger text-white';
      case 'En Route': return 'bg-status-warning text-white';
      case 'Resolved': return 'bg-status-success text-white';
      default: return 'bg-surface-gray text-ink-main';
    }
  };

  return (
    <div className="flex h-screen w-full bg-surface-gray overflow-hidden font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-surface-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <ShieldAlert className="text-unilag-maroon mr-3" size={28} />
          <h1 className="text-xl font-bold text-unilag-maroon tracking-wider">UER DISPATCH</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button className="w-full flex items-center px-4 py-3 bg-unilag-maroon/10 text-unilag-maroon rounded-xl font-semibold">
            <LayoutDashboard className="mr-3" size={20} /> Active Queue
          </button>
          <button className="w-full flex items-center px-4 py-3 text-ink-muted hover:bg-surface-gray rounded-xl font-medium transition-colors">
            <Map className="mr-3" size={20} /> Live Map
          </button>
          <button className="w-full flex items-center px-4 py-3 text-ink-muted hover:bg-surface-gray rounded-xl font-medium transition-colors">
            <Settings className="mr-3" size={20} /> Settings
          </button>
        </nav>
        <div className="p-6 border-t border-gray-200">
          <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Active Unit</div>
          <div className="font-semibold text-ink-main truncate">Alpha Base Command</div>
        </div>
      </aside>

      {/* INCIDENT QUEUE (MIDDLE COLUMN) */}
      <main className="flex-1 flex flex-col min-w-[350px] border-r border-gray-200 bg-surface-gray">
        <header className="h-16 bg-surface-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-bold text-ink-main">Incoming Reports</h2>
          <div className="flex bg-surface-gray rounded-lg p-1">
            {(['All', 'Reported', 'En Route'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                  activeTab === tab 
                    ? 'bg-surface-white shadow-sm text-unilag-maroon' 
                    : 'text-ink-muted hover:text-ink-main'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="text-center text-ink-muted mt-10 text-sm font-medium">
              No incidents match this filter.
            </div>
          ) : (
            filteredIncidents.map(incident => (
              <div 
                key={incident.id}
                onClick={() => setSelectedId(incident.id)}
                className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${
                  selectedId === incident.id 
                    ? 'border-unilag-maroon bg-surface-white shadow-md' 
                    : 'border-transparent bg-surface-white hover:border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                  <span className="text-xs font-bold text-ink-muted flex items-center gap-1">
                    <Clock size={12} /> {incident.timestamp}
                  </span>
                </div>
                <h3 className="font-bold text-ink-main mb-1 truncate">{incident.type}</h3>
                <p className="text-sm text-ink-muted truncate mb-3">{incident.locationText}</p>
                <div className="flex flex-wrap gap-2">
                  {incident.taggedDepartments.map(dept => (
                    <span key={dept} className="text-xs font-semibold px-2 py-1 bg-surface-gray text-ink-muted rounded-md border border-gray-200">
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* INCIDENT DETAIL & ACTION PANEL (RIGHT COLUMN) */}
      <aside className="w-[450px] bg-surface-white flex flex-col shrink-0">
        {selectedIncident ? (
          <>
            <header className="h-16 border-b border-gray-200 flex items-center px-6 bg-surface-white shrink-0">
              <h2 className="text-lg font-bold text-ink-main">Dispatch Command</h2>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-extrabold text-ink-main mb-2">{selectedIncident.type}</h3>
                <span className="text-sm font-mono text-ink-muted">{selectedIncident.id}</span>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MapPin size={16} /> Location
                  </h4>
                  <p className="text-base font-medium text-ink-main bg-surface-gray p-3 rounded-lg border border-gray-200">
                    {selectedIncident.locationText}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} /> Original Report
                  </h4>
                  <p className="text-base text-ink-main bg-red-50 p-4 rounded-lg border border-red-100 italic">
                    "{selectedIncident.description}"
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Requested Units</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedIncident.taggedDepartments.map(dept => (
                      <span key={dept} className="px-3 py-1.5 bg-unilag-maroon/10 text-unilag-maroon font-bold text-sm rounded-lg border border-unilag-maroon/20">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="p-6 border-t border-gray-200 bg-surface-gray shrink-0">
              <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Mutate Status</h4>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => updateStatus(selectedIncident.id, 'En Route')}
                  disabled={selectedIncident.status !== 'Reported'}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all bg-status-warning text-white disabled:opacity-50 hover:opacity-90 shadow-md"
                >
                  <RadioReceiver size={18} /> Dispatch Unit
                </button>
                <button 
                  onClick={() => updateStatus(selectedIncident.id, 'Resolved')}
                  disabled={selectedIncident.status === 'Resolved'}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all bg-status-success text-white disabled:opacity-50 hover:opacity-90 shadow-md"
                >
                  <CheckCircle2 size={18} /> Resolve
                </button>
              </div>
              <p className="text-[10px] text-ink-muted text-center mt-3">
                Status changes instantly update the student's live tracking view.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-ink-muted p-6 text-center">
            <ShieldAlert size={48} className="text-gray-300 mb-4" />
            <p className="font-medium">Select an incident from the queue to view details and take action.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
