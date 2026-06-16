import { Search, Plus, Settings as SettingsIcon, Download, Check, Upload } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ProcessHeader from "@/components/ProcessHeader";

const ALL_USERS: string[] = [];
const ALL_STORES: string[] = [];

export default function ProcessCreation() {
  const [activeTab, setActiveTab] = useState("assign");
  const [assignBy, setAssignBy] = useState("store");
  const [profileAccordionOpen, setProfileAccordionOpen] = useState(true);
  const [qaTab, setQaTab] = useState("designation");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Navigation is handled by ProcessHeader component
  };

  const handleSave = () => {
    console.log('Save');
  };

  const handlePublish = () => {
    console.log('Publish');
  };

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

  const handleAssignByChange = (value: string) => {
    setAssignBy(value);
  };

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

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#fff', fontSize: '14px', color: '#374151', minHeight: '100vh' }}>
      <ProcessHeader 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      {/* ASSIGN BY BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: '13px', color: '#6b7280', marginRight: '4px' }}>Assign By</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            onClick={() => handleAssignByChange("store")}
            style={{ padding: '4px 16px', fontSize: '13px', border: 'none', borderRadius: '20px', cursor: 'pointer', background: assignBy === 'store' ? '#f97316' : 'transparent', color: assignBy === 'store' ? '#fff' : '#374151', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { if (assignBy !== 'store') e.currentTarget.style.background = '#e5e7eb'; }}
            onMouseLeave={(e) => { if (assignBy !== 'store') e.currentTarget.style.background = 'transparent'; }}
          >
            Store
          </button>
          <button
            onClick={() => handleAssignByChange("user")}
            style={{ padding: '4px 16px', fontSize: '13px', border: 'none', borderRadius: '20px', cursor: 'pointer', background: assignBy === 'user' ? '#f97316' : 'transparent', color: assignBy === 'user' ? '#fff' : '#374151', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { if (assignBy !== 'user') e.currentTarget.style.background = '#e5e7eb'; }}
            onMouseLeave={(e) => { if (assignBy !== 'user') e.currentTarget.style.background = 'transparent'; }}
          >
            User
          </button>
          <button
            onClick={() => handleAssignByChange("team")}
            style={{ padding: '4px 16px', fontSize: '13px', border: 'none', borderRadius: '20px', cursor: 'pointer', background: assignBy === 'team' ? '#f97316' : 'transparent', color: assignBy === 'team' ? '#fff' : '#374151', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { if (assignBy !== 'team') e.currentTarget.style.background = '#e5e7eb'; }}
            onMouseLeave={(e) => { if (assignBy !== 'team') e.currentTarget.style.background = 'transparent'; }}
          >
            Team
          </button>
          <button
            onClick={() => handleAssignByChange("upload")}
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#f0f0f0', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid #e5e7eb' }}
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
              <select style={{ minWidth: '220px', padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff', cursor: 'pointer', outline: 'none' }} onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'} onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}>
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
              <input type="text" placeholder="Enter Profile Name" style={{ minWidth: '200px', padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }} onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'} onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'} />
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 14px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #2563eb', background: '#2563eb', color: '#fff', fontWeight: '500' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.borderColor = '#1d4ed8'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.borderColor = '#2563eb'; }}>
                Save Profile
              </button>
            </div>
          </div>
        </div>

        {/* STORE PANEL */}
        {assignBy === 'store' && (
          <div style={{ padding: '16px', display: 'block' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0' }}>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 14px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #f97316', background: '#f97316', color: '#fff', fontWeight: '500' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#ea580c'; e.currentTarget.style.borderColor = '#ea580c'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.borderColor = '#f97316'; }}>
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
            <div style={{ textAlign: 'center', padding: '40px 0 20px', fontSize: '14px', color: '#9ca3af' }}>
              No stores selected
            </div>
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
                onFocus={(e) => { setUserDropdownOpen(true); e.currentTarget.style.borderColor = '#f97316'; }}
                onBlur={(e) => { setUserDropdownOpen(false); e.currentTarget.style.borderColor = '#d1d5db'; }}
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
                        onMouseEnter={(e) => e.currentTarget.style.background = '#ffedd5'}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
              <div
                onClick={() => setUploadStep(1)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', fontSize: '13px', color: uploadStep === 1 ? '#ea580c' : '#374151', cursor: 'pointer', borderRight: '1px solid #e5e7eb', background: uploadStep === 1 ? '#ffedd5' : '#fff', transition: 'background 0.15s', fontWeight: uploadStep === 1 ? '500' : 'normal' }}
                onMouseEnter={(e) => { if (uploadStep !== 1) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { if (uploadStep !== 1) e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: uploadStep === 1 ? '#f97316' : '#9ca3af', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                  1
                </div>
                Download CSV
              </div>
              <div
                onClick={() => setUploadStep(2)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', fontSize: '13px', color: uploadStep === 2 ? '#ea580c' : '#374151', cursor: 'pointer', background: uploadStep === 2 ? '#ffedd5' : '#fff', transition: 'background 0.15s', fontWeight: uploadStep === 2 ? '500' : 'normal' }}
                onMouseEnter={(e) => { if (uploadStep !== 2) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { if (uploadStep !== 2) e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: uploadStep === 2 ? '#f97316' : '#9ca3af', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                  2
                </div>
                Upload CSV
              </div>
            </div>

            {/* Step 1 content */}
            {uploadStep === 1 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Download current Task Store data from server.</p>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }} onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'} onMouseLeave={(e) => e.currentTarget.style.background = '#f97316'}>
                  <Download size={15} />
                  Download CSV
                </button>
              </div>
            )}

            {/* Step 2 content */}
            {uploadStep === 2 && (
              <div>
                {!uploadedFile ? (
                  <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', display: 'block' }}>
                    <Upload size={40} style={{ color: '#d1d5db', margin: '0 auto 10px', display: 'block' }} />
                    <p style={{ marginBottom: '12px' }}>Drag & drop your CSV file here, or click to upload</p>
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }} onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'} onMouseLeave={(e) => e.currentTarget.style.background = '#f97316'}>
                      <Upload size={15} />
                      Upload CSV
                    </button>
                    <p style={{ marginTop: '8px', fontSize: '12px' }}>Supported format: .csv — columns: Store Name, User Name, Email</p>
                  </div>
                ) : (
                  <div style={{ display: 'block', textAlign: 'center', padding: '30px', color: '#166534' }}>
                    <Check size={40} style={{ margin: '0 auto 10px', display: 'block' }} />
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>File uploaded successfully!</p>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{uploadedFile}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* NEXT STEP bar (only on upload tab) */}
      {assignBy === 'upload' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#fff', position: 'fixed', bottom: 0, left: 0, right: 0 }}>
          <button
            onClick={() => uploadStep === 1 ? setUploadStep(2) : console.log('Finish')}
            style={{ padding: '8px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f97316'}
          >
            {uploadStep === 1 ? 'Next Step →' : 'Finish'}
          </button>
        </div>
      )}
    </div>
  );
}