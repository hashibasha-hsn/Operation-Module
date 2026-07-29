import { useState, useRef, useEffect } from "react";
import { Search, Plus, Settings as SettingsIcon, Download, Upload, Check, X } from "lucide-react";
import AddEntityModal from "./AddEntityModal";

interface Entity {
  storeName: string;
  area: string;
  entityId: string;
  storeStatus: string;
  createdAt: string;
  city: string;
  staff: string;
}

const ALL_USERS = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'Tom Brown', 'Emily Davis'];
const ALL_STORES = ['Store A', 'Store B – Mall', 'Store C – Airport', 'Store D – Central', 'Store E – North', 'Store F – South'];

export default function AssignTabContent() {
  const [assignBy, setAssignBy] = useState("store");
  const [profileAccordionOpen, setProfileAccordionOpen] = useState(false);
  const [quickAssignAccordionOpen, setQuickAssignAccordionOpen] = useState(false);
  const [qaTab, setQaTab] = useState("designation");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>(['Store A']);
  const [userInput, setUserInput] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
        setStoreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addUserChip = (name: string) => {
    if (!selectedUsers.includes(name)) {
      setSelectedUsers([...selectedUsers, name]);
    }
    setUserInput("");
    setUserDropdownOpen(false);
  };

  const removeUserChip = (name: string) => {
    setSelectedUsers(selectedUsers.filter(u => u !== name));
  };

  const removeStoreChip = (val: string) => {
    setSelectedStores(selectedStores.filter(s => s !== val));
  };

  const toggleStoreSelection = (store: string) => {
    if (selectedStores.includes(store)) {
      setSelectedStores(selectedStores.filter(s => s !== store));
    } else {
      setSelectedStores([...selectedStores, store]);
    }
  };

  const filteredUsers = ALL_USERS.filter(u =>
    u.toLowerCase().includes(userInput.toLowerCase()) && !selectedUsers.includes(u)
  );

  const handleFileUpload = (file: File) => {
    setUploadedFile(file.name);
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleAddEntity = (entity: Entity) => {
    if (!selectedEntities.find(e => e.entityId === entity.entityId)) {
      setSelectedEntities([...selectedEntities, entity]);
    }
  };

  const handleRemoveEntity = (entityId: string) => {
    setSelectedEntities(selectedEntities.filter(e => e.entityId !== entityId));
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#fff', fontSize: '14px', color: '#374151', minHeight: 'calc(100vh - 73px)' }}>
      {/* ASSIGN BY BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: '13px', color: '#6b7280', marginRight: '4px' }}>Assign By</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            onClick={() => setAssignBy("store")}
            style={{ padding: '4px 16px', fontSize: '13px', border: 'none', borderRadius: '20px', cursor: 'pointer', background: assignBy === 'store' ? '#f97316' : 'transparent', color: assignBy === 'store' ? '#fff' : '#374151', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { if (assignBy !== 'store') e.currentTarget.style.background = '#e5e7eb'; }}
            onMouseLeave={(e) => { if (assignBy !== 'store') e.currentTarget.style.background = 'transparent'; }}
          >
            Store
          </button>
          <button
            onClick={() => setAssignBy("user")}
            style={{ padding: '4px 16px', fontSize: '13px', border: 'none', borderRadius: '20px', cursor: 'pointer', background: assignBy === 'user' ? '#f97316' : 'transparent', color: assignBy === 'user' ? '#fff' : '#374151', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { if (assignBy !== 'user') e.currentTarget.style.background = '#e5e7eb'; }}
            onMouseLeave={(e) => { if (assignBy !== 'user') e.currentTarget.style.background = 'transparent'; }}
          >
            User
          </button>
          <button
            onClick={() => setAssignBy("team")}
            style={{ padding: '4px 16px', fontSize: '13px', border: 'none', borderRadius: '20px', cursor: 'pointer', background: assignBy === 'team' ? '#f97316' : 'transparent', color: assignBy === 'team' ? '#fff' : '#374151', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { if (assignBy !== 'team') e.currentTarget.style.background = '#e5e7eb'; }}
            onMouseLeave={(e) => { if (assignBy !== 'team') e.currentTarget.style.background = 'transparent'; }}
          >
            Team
          </button>
          <button
            onClick={() => setAssignBy("upload")}
            style={{ padding: '4px 16px', fontSize: '13px', border: 'none', borderRadius: '20px', cursor: 'pointer', background: assignBy === 'upload' ? '#f97316' : 'transparent', color: assignBy === 'upload' ? '#fff' : '#374151', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { if (assignBy !== 'upload') e.currentTarget.style.background = '#e5e7eb'; }}
            onMouseLeave={(e) => { if (assignBy !== 'upload') e.currentTarget.style.background = 'transparent'; }}
          >
            Upload
          </button>
        </div>
      </div>

      {/* PAGE BODY */}
      <div style={{ background: '#fff', minHeight: 'calc(100vh - 90px)' }}>

        {/* ASSIGNEE PROFILE ACCORDION */}
        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div
            onClick={() => setProfileAccordionOpen(!profileAccordionOpen)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f0f0f0', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid #e5e7eb' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8e8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
          >
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Assignee Profile</span>
            <span style={{ fontSize: '11px', color: '#6b7280', transition: 'transform 0.2s' }}>
              {profileAccordionOpen ? '▲' : '▼'}
            </span>
          </div>
          <div style={{ padding: '12px 16px', background: '#fff', display: profileAccordionOpen ? 'block' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#374151', whiteSpace: 'nowrap' }}>Use Existing Profiles</span>
              <select style={{ minWidth: '220px', padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff', cursor: 'pointer', outline: 'none' }} onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'} onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}>
                <option value="" disabled>Select Profile</option>
                <option>Manager Profile</option>
                <option>Staff Profile</option>
                <option>Admin Profile</option>
                <option>Supervisor Profile</option>
                <option>Trainee Profile</option>
                <option>Executive Profile</option>
              </select>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 14px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #d1d5db', background: '#fff', color: '#374151' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
                Apply
              </button>
              <span style={{ color: '#d1d5db', fontSize: '18px', margin: '0 2px' }}>|</span>
              <input type="text" placeholder="Enter Profile Name" style={{ minWidth: '200px', padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }} onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'} onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'} />
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 14px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #f97316', background: '#f97316', color: '#fff', fontWeight: '500' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#ea580c'; e.currentTarget.style.borderColor = '#ea580c'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.borderColor = '#f97316'; }}>
                Save Profile
              </button>
            </div>
          </div>
        </div>

        {/* STORE PANEL */}
        {assignBy === 'store' && (
          <div style={{ display: 'block' }}>
            {/* QUICK ASSIGN ACCORDION */}
            <div style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div
                onClick={() => setQuickAssignAccordionOpen(!quickAssignAccordionOpen)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f0f0f0', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid #e5e7eb' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8e8'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
              >
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Quick Assign</span>
                <span style={{ fontSize: '11px', color: '#6b7280', transition: 'transform 0.2s' }}>
                  {quickAssignAccordionOpen ? '▲' : '▼'}
                </span>
              </div>
              <div style={{ padding: '12px 16px', background: '#fff', display: quickAssignAccordionOpen ? 'block' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setQaTab("designation")}
                    style={{ padding: '5px 14px', fontSize: '13px', borderRadius: '5px', cursor: 'pointer', border: '1px solid #d1d5db', background: qaTab === 'designation' ? '#f97316' : '#fff', color: qaTab === 'designation' ? '#fff' : '#374151', whiteSpace: 'nowrap', transition: 'all 0.15s', borderColor: qaTab === 'designation' ? '#f97316' : '#d1d5db' }}
                    onMouseEnter={(e) => { if (qaTab !== 'designation') e.currentTarget.style.background = '#f3f4f6'; }}
                    onMouseLeave={(e) => { if (qaTab !== 'designation') e.currentTarget.style.background = '#fff'; }}
                  >
                    Quick-Assign By Designation
                  </button>
                  <button
                    onClick={() => setQaTab("outside")}
                    style={{ padding: '5px 14px', fontSize: '13px', borderRadius: '5px', cursor: 'pointer', border: '1px solid #d1d5db', background: qaTab === 'outside' ? '#f97316' : '#fff', color: qaTab === 'outside' ? '#fff' : '#374151', whiteSpace: 'nowrap', transition: 'all 0.15s', borderColor: qaTab === 'outside' ? '#f97316' : '#d1d5db' }}
                    onMouseEnter={(e) => { if (qaTab !== 'outside') e.currentTarget.style.background = '#f3f4f6'; }}
                    onMouseLeave={(e) => { if (qaTab !== 'outside') e.currentTarget.style.background = '#fff'; }}
                  >
                    Quick-Assign to Users Outside Entity
                  </button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" style={{ width: '14px', height: '14px', accentColor: '#f97316', cursor: 'pointer' }} />
                    Remove assignees on clearing designation
                  </label>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button style={{ fontSize: '13px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                      Clear All Selected
                    </button>
                    <button style={{ fontSize: '13px', color: '#374151', background: '#fff', border: '1px solid #d1d5db', borderRadius: '5px', padding: '4px 12px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
                      Select All
                    </button>
                  </div>
                </div>

                <select style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', color: '#9ca3af', background: '#fff', outline: 'none', marginBottom: '14px', cursor: 'pointer' }} onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'} onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}>
                  <option value="" disabled>Select Designation</option>
                  <option>Manager</option>
                  <option>Staff</option>
                  <option>Supervisor</option>
                  <option>Trainee</option>
                  <option>Executive</option>
                </select>
              </div>
            </div>

            {/* ENTITY MANAGEMENT SECTION */}
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setIsModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 14px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #f97316', background: '#f97316', color: '#fff', fontWeight: '500' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#ea580c'; e.currentTarget.style.borderColor = '#ea580c'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.borderColor = '#f97316'; }}>
                <Plus size={15} />
                Add Entity
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={15} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                  <input
                    type="search"
                    placeholder="Search stores"
                    style={{ padding: '6px 10px 6px 28px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', width: '220px', outline: 'none' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}>
                  <SettingsIcon size={17} />
                </button>
              </div>
            </div>
            {selectedEntities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0 20px', fontSize: '14px', color: '#9ca3af' }}>
                No stores selected
              </div>
            ) : (
              <div style={{ padding: '0 16px 16px', display: 'grid', gap: '16px' }}>
                {selectedEntities.map((entity) => (
                  <div key={entity.entityId} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>{entity.storeName}</h3>
                      <button
                        onClick={() => handleRemoveEntity(entity.entityId)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Designation</label>
                        <select
                          style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none', cursor: 'pointer' }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                        >
                          <option value="" disabled>Select Designation</option>
                          <option>Manager</option>
                          <option>Staff</option>
                          <option>Supervisor</option>
                          <option>Trainee</option>
                          <option>Executive</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Users outside entity</label>
                        <input
                          type="text"
                          placeholder="Add users"
                          style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USER PANEL */}
        {assignBy === 'user' && (
          <div style={{ padding: '16px', display: 'block' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f97316', marginBottom: '6px' }}>Add Users</div>
            <div
              ref={userDropdownRef}
              onClick={() => document.getElementById('user-input')?.focus()}
              style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 8px', minHeight: '38px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', background: '#fff', cursor: 'text', marginBottom: '16px', position: 'relative' }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
            >
              {selectedUsers.map(u => (
                <span key={u} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ffedd5', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: '4px', padding: '2px 8px', fontSize: '12px' }}>
                  {u}
                  <button onClick={(e) => { e.stopPropagation(); removeUserChip(u); }} style={{ cursor: 'pointer', color: '#6b7280', fontSize: '14px', lineHeight: '1', background: 'none', border: 'none', padding: '0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                    ×
                  </button>
                </span>
              ))}
              <input
                id="user-input"
                type="text"
                value={userInput}
                onChange={(e) => { setUserInput(e.target.value); setUserDropdownOpen(true); }}
                onFocus={() => setUserDropdownOpen(true)}
                placeholder=""
                style={{ border: 'none', outline: 'none', fontSize: '13px', minWidth: '120px', flex: 1, background: 'transparent', padding: '2px 0' }}
              />
              {userDropdownOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: '0', right: '0', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredUsers.length === 0 ? (
                    <div style={{ padding: '8px 12px', fontSize: '13px', color: '#9ca3af' }}>No results</div>
                  ) : (
                    filteredUsers.map(u => (
                      <div
                        key={u}
                        onClick={(e) => { e.stopPropagation(); addUserChip(u); }}
                        style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {u}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f97316', marginBottom: '6px' }}>Quick Assign Stores</div>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '6px', padding: '5px 10px', fontSize: '13px', marginBottom: '10px', gap: '6px', minHeight: '38px', flexWrap: 'wrap' }}>
              {selectedStores.map(s => (
                <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ffedd5', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', margin: '2px' }}>
                  {s}
                  <button onClick={() => removeStoreChip(s)} style={{ cursor: 'pointer', color: '#6b7280', fontSize: '14px', lineHeight: '1', background: 'none', border: 'none', padding: '0' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                    ×
                  </button>
                </span>
              ))}
              <span style={{ marginLeft: 'auto', color: '#9ca3af', cursor: 'pointer' }} onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}>
                ✓
              </span>
            </div>
            {storeDropdownOpen && (
              <div ref={storeDropdownRef} style={{ position: 'static', display: 'block', marginTop: '-10px', marginBottom: '10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                {ALL_STORES.map(s => (
                  <div key={s} style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#ffedd5'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <input
                      type="checkbox"
                      checked={selectedStores.includes(s)}
                      onChange={() => toggleStoreSelection(s)}
                      style={{ width: '14px', height: '14px', accentColor: '#f97316', cursor: 'pointer' }}
                    />
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEAM PANEL */}
        {assignBy === 'team' && (
          <div style={{ padding: '16px', display: 'block' }}>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 18px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', fontWeight: '500', letterSpacing: '0.02em' }} onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'} onMouseLeave={(e) => e.currentTarget.style.background = '#f97316'}>
              <Plus size={15} />
              ADD TEAM
            </button>
          </div>
        )}

        {/* UPLOAD PANEL */}
        {assignBy === 'upload' && (
          <div style={{ padding: '16px', display: 'block' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Store Assignment Upload / Download</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Bulk assign users to stores using a CSV file. Download the current assignment, update store–user mappings, and upload to apply changes.</div>

            {/* ✅ FIX: Wrapped Step 1's two sibling divs in a Fragment <> */}
            {uploadStep === 1 && (
              <>
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Download current Task Store data from server.</p>
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }} onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'} onMouseLeave={(e) => e.currentTarget.style.background = '#f97316'}>
                    <Download size={15} />
                    {" Download CSV"}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
                  <button
                    onClick={() => setUploadStep(2)}
                    style={{ padding: '8px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f97316'}
                  >
                    Next Step →
                  </button>
                </div>
              </>
            )}

            {/* ✅ FIX: Wrapped Step 2's three sibling divs in a Fragment <> */}
            {uploadStep === 2 && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <button onClick={handleUploadButtonClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
                    <Upload size={15} />
                    Upload Updated CSV
                  </button>
                </div>

                <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px 30px', background: '#f8f8f8', margin: '0 auto 20px', width: 'fit-content', maxWidth: '600px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>CSV Upload Requirements</h3>
                  <ul style={{ fontSize: '14px', color: '#555', paddingLeft: '0', margin: '0 0 0 20px', lineHeight: '1.5', listStyleType: 'disc' }}>
                    <li style={{ marginBottom: '8px', paddingLeft: '1em', textIndent: '-1em' }}>CSV must include the following columns: <strong>EntityId, Store Name, Emails</strong></li>
                    <li style={{ marginBottom: '8px', paddingLeft: '1em', textIndent: '-1em' }}>Email addresses should be separated using commas</li>
                    <li style={{ marginBottom: '8px', paddingLeft: '1em', textIndent: '-1em' }}>Ensure there are no empty required fields</li>
                    <li style={{ marginBottom: '8px', paddingLeft: '1em', textIndent: '-1em' }}>File format must be <strong>.csv</strong></li>
                    <li style={{ marginBottom: '0', paddingLeft: '1em', textIndent: '-1em' }}>After successful upload, please click the publish button to finalize</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
                  <button
                    onClick={() => setUploadStep(1)}
                    style={{ padding: '8px 20px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => console.log('Finish')}
                    style={{ padding: '8px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f97316'}
                  >
                    Finish
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* ADD ENTITY MODAL */}
      <AddEntityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddEntity={handleAddEntity} />
    </div>
  );
}
