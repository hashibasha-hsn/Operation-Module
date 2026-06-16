import { useState } from "react";
import ProcessHeader from "@/components/ProcessHeader";
import { Check, AlertCircle } from "lucide-react";

export default function ProcessSettings() {
  const [activeTab, setActiveTab] = useState("properties");
  const [selectedSection, setSelectedSection] = useState("process");
  const [addReminderOpen, setAddReminderOpen] = useState(false);
  const [addRecurringReminderOpen, setAddRecurringReminderOpen] = useState(false);
  const [processSettings, setProcessSettings] = useState({
    occurrence: "recurring",
    responsesAfterEndTime: "accept",
    numberOfResponses: "one-per-user",
    submissionBy: "anyone",
    dateRangeSelection: "restricted",
  });

  const sections = [
    { id: "process", label: "Process", status: "completed" },
    { id: "periodicity", label: "Periodicity", status: "warning" },
    { id: "reminders", label: "Reminders and Notifications", status: "completed" },
    { id: "submissionReport", label: "Submission Report", status: "completed" },
    { id: "advanceSettings", label: "Advance Settings", status: "completed" },
    { id: "language", label: "Language Settings", status: "completed" },
  ];

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

  const handleAddReminder = () => {
    setAddReminderOpen(true);
  };

  const handleAddRecurringReminder = () => {
    setAddRecurringReminderOpen(true);
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#fff', fontSize: '14px', color: '#374151', minHeight: '100vh' }}>
      <ProcessHeader 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      <div style={{ display: 'flex', height: 'calc(100vh - 48px)' }}>
        {/* Left Sidebar */}
        <div style={{ width: '256px', borderRight: '1px solid #e5e7eb', background: '#fff', padding: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px', margin: 0 }}>Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: 'none',
                  background: selectedSection === section.id ? '#fff5eb' : 'transparent',
                  color: selectedSection === section.id ? '#f97316' : '#374151',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { 
                  if (selectedSection !== section.id) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => { 
                  if (selectedSection !== section.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span>{section.label}</span>
                {section.status === 'completed' && (
                  <Check size={16} style={{ color: '#f97316' }} />
                )}
                {section.status === 'warning' && (
                  <AlertCircle size={16} style={{ color: '#ef4444' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, background: '#f9fafb', padding: '24px', overflowY: 'auto' }}>
          {selectedSection === 'process' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '24px', margin: 0 }}>Process Settings</h2>
              
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                    1. Occurrence
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="occurrence"
                        value="one-time"
                        checked={processSettings.occurrence === 'one-time'}
                        onChange={(e) => setProcessSettings({ ...processSettings, occurrence: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>One Time</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="occurrence"
                        value="recurring"
                        checked={processSettings.occurrence === 'recurring'}
                        onChange={(e) => setProcessSettings({ ...processSettings, occurrence: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Recurring</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="occurrence"
                        value="scheduled"
                        checked={processSettings.occurrence === 'scheduled'}
                        onChange={(e) => setProcessSettings({ ...processSettings, occurrence: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Scheduled</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                    2. Responses after End-time
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="responsesAfterEndTime"
                        value="accept"
                        checked={processSettings.responsesAfterEndTime === 'accept'}
                        onChange={(e) => setProcessSettings({ ...processSettings, responsesAfterEndTime: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Accept</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="responsesAfterEndTime"
                        value="reject"
                        checked={processSettings.responsesAfterEndTime === 'reject'}
                        onChange={(e) => setProcessSettings({ ...processSettings, responsesAfterEndTime: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Reject</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                    3. No. of responses
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="numberOfResponses"
                        value="one-per-user"
                        checked={processSettings.numberOfResponses === 'one-per-user'}
                        onChange={(e) => setProcessSettings({ ...processSettings, numberOfResponses: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>One Response per user</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="numberOfResponses"
                        value="multiple-per-user"
                        checked={processSettings.numberOfResponses === 'multiple-per-user'}
                        onChange={(e) => setProcessSettings({ ...processSettings, numberOfResponses: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Multiple Response per user</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                    4. Submission By
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="submissionBy"
                        value="anyone"
                        checked={processSettings.submissionBy === 'anyone'}
                        onChange={(e) => setProcessSettings({ ...processSettings, submissionBy: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Anyone</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="submissionBy"
                        value="view-only"
                        checked={processSettings.submissionBy === 'view-only'}
                        onChange={(e) => setProcessSettings({ ...processSettings, submissionBy: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>View Only (Draft)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="submissionBy"
                        value="everyone"
                        checked={processSettings.submissionBy === 'everyone'}
                        onChange={(e) => setProcessSettings({ ...processSettings, submissionBy: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Everyone</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '0' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                    5. Date Range Selection
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dateRangeSelection"
                        value="allowed"
                        checked={processSettings.dateRangeSelection === 'allowed'}
                        onChange={(e) => setProcessSettings({ ...processSettings, dateRangeSelection: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Allowed</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dateRangeSelection"
                        value="restricted"
                        checked={processSettings.dateRangeSelection === 'restricted'}
                        onChange={(e) => setProcessSettings({ ...processSettings, dateRangeSelection: e.target.value })}
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Restricted</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedSection === 'periodicity' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '24px', margin: 0 }}>Periodicity Settings</h2>
              
              {/* Alert Box */}
              <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#92400e' }}>Please set 'Starts At'</span>
              </div>

              {/* Periodicity Tabs */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '2px', background: '#f3f4f6', borderRadius: '6px', padding: '4px', marginBottom: '24px' }}>
                  {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((tab) => (
                    <button
                      key={tab}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: '500',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: 'none',
                        background: tab === 'Daily' ? '#fff' : 'transparent',
                        color: tab === 'Daily' ? '#f97316' : '#6b7280',
                        transition: 'all 0.15s',
                        boxShadow: tab === 'Daily' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Starts At Section */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                    Starts At
                  </label>
                  <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#6b7280' }}>
                    <div style={{ marginBottom: '4px' }}>Local:- At 05:30 AM, every day</div>
                    <div>UTC:- At 12:00 AM, every day</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>Everyday Starts At:</span>
                    <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', background: '#fff', minWidth: '70px' }}>
                      {[...Array(24)].map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '13px', color: '#374151' }}>Hrs :</span>
                    <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', background: '#fff', minWidth: '70px' }}>
                      {[...Array(60)].map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '13px', color: '#374151' }}>M</span>
                  </div>
                </div>

                {/* Ends At Section */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                    Ends At
                  </label>
                  <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#6b7280' }}>
                    <div style={{ marginBottom: '4px' }}>Local:- At 05:30 AM, every day</div>
                    <div>UTC:- At 12:00 AM, every day</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>Everyday Ends At:</span>
                    <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', background: '#fff', minWidth: '70px' }}>
                      {[...Array(24)].map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '13px', color: '#374151' }}>Hrs :</span>
                    <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', background: '#fff', minWidth: '70px' }}>
                      {[...Array(60)].map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '13px', color: '#374151' }}>M</span>
                  </div>
                </div>

                {/* Checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{ width: '16px', height: '16px', accentColor: '#f97316', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', color: '#374151' }}>Define a Business Day</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{ width: '16px', height: '16px', accentColor: '#f97316', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', color: '#374151' }}>Create your own cycle</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {selectedSection === 'reminders' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '24px', margin: 0 }}>Reminders and Notifications</h2>

              {/* Email Alerts */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Turn on Email alerts for the process</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ marginRight: '16px', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#374151' }}>
                      <input type="radio" name="emailAlerts" value="yes" style={{ marginRight: '6px', accentColor: '#f97316' }} /> Yes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#374151' }}>
                      <input type="radio" name="emailAlerts" value="no" defaultChecked style={{ marginRight: '6px', accentColor: '#f97316' }} /> No
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Enable Report URL Sharing</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
                    <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f97316', transition: '.4s', borderRadius: '20px' }}></span>
                    <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '20px', bottom: '2px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                  </label>
                </div>
              </div>

              {/* Mobile Notification Alerts */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Turn on Mobile Notification alerts for the process</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ marginRight: '16px', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#374151' }}>
                      <input type="radio" name="mobileAlerts" value="yes" style={{ marginRight: '6px', accentColor: '#f97316' }} /> Yes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#374151' }}>
                      <input type="radio" name="mobileAlerts" value="no" defaultChecked style={{ marginRight: '6px', accentColor: '#f97316' }} /> No
                    </label>
                  </div>
                </div>
              </div>

              {/* Reminder 1 */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>Reminder 1</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Edit</button>
                    <button style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#374151' }}>Hours:</span>
                  <input type="number" defaultValue="2" style={{ width: '60px', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} />
                  <span style={{ fontSize: '13px', color: '#374151' }}>Minutes:</span>
                  <input type="number" defaultValue="30" style={{ width: '60px', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} />
                  <span style={{ fontSize: '13px', color: '#374151' }}>Reminder Type:</span>
                  <select style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', background: '#fff' }}>
                    <option>Before Start Time</option>
                    <option>After Start Time</option>
                    <option>Before End Time</option>
                  </select>
                </div>
              </div>

              {/* Add Reminder Button */}
              <button 
                onClick={handleAddReminder}
                style={{ width: '100%', padding: '10px 16px', background: '#fff', border: '1px solid #f97316', color: '#f97316', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', marginBottom: '20px' }}
              >
                + Add Reminder
              </button>

              {/* Recurring Reminder 1 */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>Recurring Reminder 1</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Edit</button>
                    <button style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#374151' }}>Frequency:</span>
                  <input type="number" defaultValue="1" style={{ width: '60px', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} />
                  <select style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', background: '#fff' }}>
                    <option>Day(s)</option>
                    <option>Week(s)</option>
                    <option>Month(s)</option>
                  </select>
                </div>
              </div>

              {/* Add Recurring Reminder Button */}
              <button 
                onClick={handleAddRecurringReminder}
                style={{ width: '100%', padding: '10px 16px', background: '#fff', border: '1px solid #f97316', color: '#f97316', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', marginBottom: '12px' }}
              >
                + Add Recurring Reminder
              </button>

              {/* Reminder Setup Link */}
              <a href="#" style={{ fontSize: '13px', color: '#f97316', textDecoration: 'none' }}>Reminder Setup & Usage</a>
            </div>
          )}

          {selectedSection === 'submissionReport' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '24px', margin: 0 }}>Submission Report Settings</h2>
              
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                    Report Type
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="reportType"
                        value="hierarchical"
                        defaultChecked
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Hierarchical</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="reportType"
                        value="store-hierarchical"
                        style={{ accentColor: '#f97316', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Store Hierarchical</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                    Report Format
                  </label>
                  <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff' }}>
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                    <option>HTML</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{ width: '16px', height: '16px', accentColor: '#f97316' }}
                    />
                    <span style={{ fontSize: '13px', color: '#374151' }}>Include Charts in Report</span>
                  </label>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{ width: '16px', height: '16px', accentColor: '#f97316' }}
                    />
                    <span style={{ fontSize: '13px', color: '#374151' }}>Include Summary Statistics</span>
                  </label>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{ width: '16px', height: '16px', accentColor: '#f97316' }}
                    />
                    <span style={{ fontSize: '13px', color: '#374151' }}>Auto-generate Report on Submission</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {selectedSection === 'advanceSettings' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '24px', margin: 0 }}>Advance Settings</h2>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Advanced configuration options</p>
              </div>
            </div>
          )}

          {selectedSection === 'language' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '24px', margin: 0 }}>Language Settings</h2>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Language Support
                    </label>
                    <a href="#" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>Know More</a>
                  </div>
                  <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff' }}>
                    <option value="english">English</option>
                    <option value="arabic">Arabic</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Reminder Dialog */}
      {addReminderOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px', margin: 0 }}>Add Reminder</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Hours
              </label>
              <input 
                type="number" 
                placeholder="Enter hours"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Minutes
              </label>
              <input 
                type="number" 
                placeholder="Enter minutes"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Reminder Type
              </label>
              <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff' }}>
                <option>Before Start Time</option>
                <option>After Start Time</option>
                <option>Before End Time</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setAddReminderOpen(false)}
                style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', color: '#374151', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => setAddReminderOpen(false)}
                style={{ padding: '8px 16px', background: '#f97316', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
              >
                Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Recurring Reminder Dialog */}
      {addRecurringReminderOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px', margin: 0 }}>Add Recurring Reminder</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Frequency
              </label>
              <input 
                type="number" 
                placeholder="Enter frequency"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Time Unit
              </label>
              <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff' }}>
                <option>Day(s)</option>
                <option>Week(s)</option>
                <option>Month(s)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setAddRecurringReminderOpen(false)}
                style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', color: '#374151', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => setAddRecurringReminderOpen(false)}
                style={{ padding: '8px 16px', background: '#f97316', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
              >
                Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
