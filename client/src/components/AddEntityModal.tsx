import { useState } from "react";
import { Search, Plus, X, ChevronDown, ChevronUp } from "lucide-react";

interface Entity {
  storeName: string;
  area: string;
  entityId: string;
  storeStatus: string;
  createdAt: string;
  city: string;
  staff: string;
}

interface AddEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntity: (entity: Entity) => void;
}

export default function AddEntityModal({ isOpen, onClose, onAddEntity }: AddEntityModalProps) {
  const [activeTab, setActiveTab] = useState<"csv" | "text">("csv");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [additionalOptionsOpen, setAdditionalOptionsOpen] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [textInput, setTextInput] = useState("");
  const [allSelected, setAllSelected] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file.name);
    }
  };

  const handleAddEntity = (entity: Entity) => {
    onAddEntity(entity);
  };

  const handleAddEntityByText = () => {
    // Parse text input to create entity
    // Expected format: Store Name, Area, Entity Id, Status, City, Staff
    const lines = textInput.trim().split('\n');
    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const newEntity: Entity = {
          storeName: parts[0] || "New Entity",
          area: parts[1] || "Unknown",
          entityId: parts[2] || `HB${Math.floor(Math.random() * 1000)}`,
          storeStatus: parts[3] || "Active",
          createdAt: new Date().toISOString().split('T')[0],
          city: parts[4] || "Unknown",
          staff: parts[5] || "0",
        };
        setEntities(prev => [...prev, newEntity]);
        setTextInput("");
      }
    });
  };

  const handleSelectAll = () => {
    entities.forEach(entity => onAddEntity(entity));
    setAllSelected(true);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: '8px', width: '95%', maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleSelectAll} style={{ padding: '6px 16px', fontSize: '12px', border: allSelected ? '1px solid #1d4ed8' : '1px solid #d1d5db', borderRadius: '20px', cursor: 'pointer', background: allSelected ? '#1d4ed8' : '#fff', color: allSelected ? '#fff' : '#374151', fontWeight: '500' }}>
              ALL
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Add Entity</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleSelectAll} style={{ padding: '6px 16px', fontSize: '12px', border: allSelected ? '1px solid #1d4ed8' : '1px solid #d1d5db', borderRadius: '20px', cursor: 'pointer', background: allSelected ? '#1d4ed8' : '#fff', color: allSelected ? '#fff' : '#374151', fontWeight: '500' }}>
              ALL
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '24px', padding: '0', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setActiveTab("csv")}
              style={{ padding: '12px 20px', fontSize: '14px', border: 'none', cursor: 'pointer', background: activeTab === 'csv' ? '#fff' : 'transparent', color: activeTab === 'csv' ? '#1d4ed8' : '#6b7280', fontWeight: activeTab === 'csv' ? '600' : '400', borderBottom: activeTab === 'csv' ? '2px solid #1d4ed8' : '2px solid transparent' }}
            >
              By CSV
            </button>
            <button
              onClick={() => setActiveTab("text")}
              style={{ padding: '12px 20px', fontSize: '14px', border: 'none', cursor: 'pointer', background: activeTab === 'text' ? '#fff' : 'transparent', color: activeTab === 'text' ? '#1d4ed8' : '#6b7280', fontWeight: activeTab === 'text' ? '600' : '400', borderBottom: activeTab === 'text' ? '2px solid #1d4ed8' : '2px solid transparent' }}
            >
              By Text
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {activeTab === "csv" && (
            <div>
              {/* CSV Upload Section */}
              <div style={{ marginBottom: '24px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="csv-file-input"
                  />
                  <label
                    htmlFor="csv-file-input"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Choose File
                  </label>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>{selectedFile || "No file chosen"}</span>
                </div>
                <button style={{ padding: '10px 24px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
                  ADD ENTITY BY CSV
                </button>
              </div>

              {/* Additional Options */}
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => setAdditionalOptionsOpen(!additionalOptionsOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#374151', width: '100%' }}
                >
                  {additionalOptionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  Additional Options
                </button>
                {additionalOptionsOpen && (
                  <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 6px 6px', background: '#fff', marginTop: '-1px' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Additional configuration options can be added here.
                    </div>
                  </div>
                )}
              </div>

              {/* Entity Table */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      {["Store Name", "Area", "Entity Id", "Store-Status", "Created At", "City", "Staff", "Action"].map((header) => (
                        <th key={header} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {header}
                            <Search size={14} style={{ color: '#9ca3af', cursor: 'pointer' }} />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((entity, index) => (
                      <tr key={index} style={{ borderBottom: index < entities.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.storeName}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.area}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.entityId}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: entity.storeStatus === 'Active' ? '#dcfce7' : '#fee2e2', color: entity.storeStatus === 'Active' ? '#166534' : '#991b1b' }}>
                            {entity.storeStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.createdAt}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.city}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.staff}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => handleAddEntity(entity)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#1d4ed8', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "text" && (
            <div>
              {/* Text Input Section */}
              <div style={{ marginBottom: '24px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Enter Entity Details (comma-separated)
                  </label>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    Format: Store Name, Area, Entity Id, Status, City, Staff
                  </div>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Example: My Store, Central, HB500, Active, Riyadh, 10"
                    rows={6}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                </div>
                <button
                  onClick={handleAddEntityByText}
                  disabled={!textInput.trim()}
                  style={{ padding: '10px 24px', background: textInput.trim() ? '#1d4ed8' : '#9ca3af', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: textInput.trim() ? 'pointer' : 'not-allowed', fontWeight: '500' }}
                >
                  ADD ENTITY BY TEXT
                </button>
              </div>

              {/* Additional Options */}
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => setAdditionalOptionsOpen(!additionalOptionsOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#374151', width: '100%' }}
                >
                  {additionalOptionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  Additional Options
                </button>
                {additionalOptionsOpen && (
                  <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 6px 6px', background: '#fff', marginTop: '-1px' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Additional configuration options can be added here.
                    </div>
                  </div>
                )}
              </div>

              {/* Entity Table */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      {["Store Name", "Area", "Entity Id", "Store-Status", "Created At", "City", "Staff", "Action"].map((header) => (
                        <th key={header} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {header}
                            <Search size={14} style={{ color: '#9ca3af', cursor: 'pointer' }} />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((entity, index) => (
                      <tr key={index} style={{ borderBottom: index < entities.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.storeName}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.area}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.entityId}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: entity.storeStatus === 'Active' ? '#dcfce7' : '#fee2e2', color: entity.storeStatus === 'Active' ? '#166534' : '#991b1b' }}>
                            {entity.storeStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.createdAt}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.city}</td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{entity.staff}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => handleAddEntity(entity)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#1d4ed8', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
