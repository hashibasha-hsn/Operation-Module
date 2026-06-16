import { useState } from "react";
import ProcessHeader from "@/components/ProcessHeader";

export default function TitleSetup() {
  const [activeTab, setActiveTab] = useState("title");
  const [processTitle, setProcessTitle] = useState("");
  const [processDescription, setProcessDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const availableTags = [
    "Quality Control",
    "Safety",
    "Operations",
    "Compliance",
    "Training",
    "Maintenance",
    "Inventory",
    "Customer Service"
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#fff', fontSize: '14px', color: '#374151', minHeight: '100vh' }}>
      {/* TOP NAV */}
      <ProcessHeader 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      {/* PAGE BODY */}
      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Click to edit sections */}
        <div style={{ marginBottom: '24px' }}>
          <div 
            onClick={() => document.getElementById('title-input')?.focus()}
            style={{ 
              padding: '20px', 
              border: '2px dashed #e5e7eb', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              background: processTitle ? '#fff' : '#f9fafb'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.background = '#fff5eb'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = processTitle ? '#fff' : '#f9fafb'; }}
          >
            {processTitle ? (
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>{processTitle}</h1>
            ) : (
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>Click to edit process title</div>
            )}
            <input
              id="title-input"
              type="text"
              value={processTitle}
              onChange={(e) => setProcessTitle(e.target.value)}
              placeholder="Enter process title"
              style={{ 
                position: 'absolute', 
                opacity: 0, 
                pointerEvents: 'none' 
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div 
            onClick={() => document.getElementById('description-input')?.focus()}
            style={{ 
              padding: '20px', 
              border: '2px dashed #e5e7eb', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              minHeight: '80px',
              background: processDescription ? '#fff' : '#f9fafb'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.background = '#fff5eb'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = processDescription ? '#fff' : '#f9fafb'; }}
          >
            {processDescription ? (
              <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.6' }}>{processDescription}</p>
            ) : (
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>Click to edit process description</div>
            )}
            <textarea
              id="description-input"
              value={processDescription}
              onChange={(e) => setProcessDescription(e.target.value)}
              placeholder="Enter process description"
              style={{ 
                position: 'absolute', 
                opacity: 0, 
                pointerEvents: 'none' 
              }}
            />
          </div>
        </div>

        {/* Assign Process Tags Card */}
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px', margin: 0 }}>Assign Process Tags</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Select Process Tags
            </label>
            <div style={{ 
              border: '1px solid #d1d5db', 
              borderRadius: '6px', 
              padding: '8px', 
              minHeight: '42px',
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px',
              background: '#fff',
              cursor: 'pointer'
            }}>
              {selectedTags.length === 0 ? (
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>Select tags to assign...</span>
              ) : (
                selectedTags.map(tag => (
                  <span 
                    key={tag}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      background: '#ffedd5', 
                      color: '#ea580c', 
                      border: '1px solid #fed7aa', 
                      borderRadius: '4px', 
                      padding: '4px 10px', 
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {tag}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleTag(tag); }}
                      style={{ 
                        cursor: 'pointer', 
                        color: '#ea580c', 
                        fontSize: '16px', 
                        lineHeight: '1', 
                        background: 'none', 
                        border: 'none', 
                        padding: '0',
                        marginLeft: '4px'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Available Tags */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Available Tags
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: selectedTags.includes(tag) ? '1px solid #f97316' : '1px solid #d1d5db',
                    background: selectedTags.includes(tag) ? '#f97316' : '#fff',
                    color: selectedTags.includes(tag) ? '#fff' : '#374151',
                    transition: 'all 0.15s',
                    fontWeight: selectedTags.includes(tag) ? '500' : 'normal'
                  }}
                  onMouseEnter={(e) => { 
                    if (!selectedTags.includes(tag)) {
                      e.currentTarget.style.background = '#f3f4f6'; 
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseLeave={(e) => { 
                    if (!selectedTags.includes(tag)) {
                      e.currentTarget.style.background = '#fff'; 
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
