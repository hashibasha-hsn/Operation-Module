import { ArrowLeft, Type, Hammer, Settings, User, Save, Upload } from "lucide-react";
import { useLocation } from "wouter";

interface ProcessHeaderProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
  onSave?: () => void;
  onPublish?: () => void;
}

export default function ProcessHeader({ activeTab, onTabChange, onSave, onPublish }: ProcessHeaderProps) {
  const [, navigate] = useLocation();

  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
    
    // Navigate to corresponding pages
    if (value === "title") {
      navigate("/title-setup");
    } else if (value === "build") {
      navigate("/create-form");
    } else if (value === "properties") {
      navigate("/process-settings");
    } else if (value === "assign") {
      navigate("/process-creation");
    }
  };

  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '48px', background: 'linear-gradient(to right, #f97316, #ea580c)', borderBottom: '1px solid rgba(234, 88, 12, 0.3)', gap: '12px' }}>
      <button
        onClick={() => navigate("/process")}
        style={{ color: '#fff', fontSize: '13px', background: 'none', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '5px', whiteSpace: 'nowrap' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'none'; }}
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '3px' }}>
        <button
          onClick={() => handleTabChange("title")}
          style={{ padding: '5px 18px', fontSize: '13px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'title' ? '#fff' : 'transparent', color: activeTab === 'title' ? '#f97316' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s', fontWeight: activeTab === 'title' ? '500' : 'normal' }}
        >
          <Type size={15} />
          Title
        </button>
        <button
          onClick={() => handleTabChange("build")}
          style={{ padding: '5px 18px', fontSize: '13px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'build' ? '#fff' : 'transparent', color: activeTab === 'build' ? '#f97316' : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s' }}
          onMouseEnter={(e) => { if (activeTab !== 'build') { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; } }}
          onMouseLeave={(e) => { if (activeTab !== 'build') { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent'; } }}
        >
          <Hammer size={15} />
          Build
        </button>
        <button
          onClick={() => handleTabChange("properties")}
          style={{ padding: '5px 18px', fontSize: '13px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'properties' ? '#fff' : 'transparent', color: activeTab === 'properties' ? '#f97316' : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s' }}
          onMouseEnter={(e) => { if (activeTab !== 'properties') { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; } }}
          onMouseLeave={(e) => { if (activeTab !== 'properties') { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent'; } }}
        >
          <Settings size={15} />
          Properties
        </button>
        <button
          onClick={() => handleTabChange("assign")}
          style={{ padding: '5px 18px', fontSize: '13px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'assign' ? '#fff' : 'transparent', color: activeTab === 'assign' ? '#f97316' : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s' }}
          onMouseEnter={(e) => { if (activeTab !== 'assign') { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; } }}
          onMouseLeave={(e) => { if (activeTab !== 'assign') { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent'; } }}
        >
          <User size={15} />
          Assign
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button 
          onClick={onSave}
          style={{ padding: '5px 14px', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }} 
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} 
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <Save size={15} />
          SAVE
        </button>
        <button 
          onClick={onPublish}
          style={{ padding: '5px 16px', background: '#fff', color: '#f97316', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }} 
          onMouseEnter={(e) => e.currentTarget.style.background = '#fff5eb'} 
          onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
        >
          <Upload size={15} />
          Publish
        </button>
      </div>
    </nav>
  );
}
