import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  onSearch: (filters: { location: string; dates: string; category: string }) => void;
  onDropdownToggle?: (isOpen: boolean) => void;
}

const LOCATIONS = [
  'All India', 'India', 'Delhi, NCR', 'Mumbai, Maharashtra', 'Bengaluru, Karnataka',
  'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Hyderabad, Telangana',
  'Pune, Maharashtra', 'Ahmedabad, Gujarat', 'Jaipur, Rajasthan',
  'Lucknow, Uttar Pradesh', 'Chandigarh, Punjab/Haryana', 'Bhopal, Madhya Pradesh',
  'Patna, Bihar', 'Bhubaneswar, Odisha', 'Guwahati, Assam',
  'Kochi, Kerala', 'Panaji, Goa', 'Srinagar, Jammu & Kashmir',
];

const CATEGORIES = [
  'All Categories', 'Real Estate', 'Vehicle',
  'Luxury Watches', 'Tools & Hardware', 'Electronics', 'Furniture',
];

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

type DropdownId = 'location' | 'date' | 'category' | null;

export default function SearchBar({ onSearch, onDropdownToggle }: SearchBarProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [locationSearch, setLocationSearch] = useState('');
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const filteredLocations = LOCATIONS.filter(l =>
    l.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const toggleDropdown = (id: DropdownId) => {
    const next = openDropdown === id ? null : id;
    setOpenDropdown(next);
    if (onDropdownToggle) onDropdownToggle(!!next);
    if (id === 'location' && next) {
      setTimeout(() => locationInputRef.current?.focus(), 50);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        if (onDropdownToggle) onDropdownToggle(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [onDropdownToggle]);

  const selectLocation = (loc: string) => {
    setSelectedLocation(loc);
    setOpenDropdown(null);
    setTimeout(() => {
      setOpenDropdown('date');
      if (onDropdownToggle) onDropdownToggle(true);
    }, 120);
  };

  const pickDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setOpenDropdown(null);
    setTimeout(() => {
      setOpenDropdown('category');
      if (onDropdownToggle) onDropdownToggle(true);
    }, 120);
  };

  const selectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setOpenDropdown(null);
    if (onDropdownToggle) onDropdownToggle(false);
  };

  const changeMonth = (dir: number) => {
    let m = calMonth + dir;
    let y = calYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setCalMonth(m);
    setCalYear(y);
  };

  const handleSearch = () => {
    if (!selectedLocation) { setOpenDropdown('location'); return; }
    if (!selectedDate)     { setOpenDropdown('date');     return; }
    onSearch({ location: selectedLocation, dates: selectedDate, category: selectedCategory });
  };

  // Build calendar
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calDays: { day: number | null; dateStr: string; isPast: boolean; isToday: boolean; isSelected: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) calDays.push({ day: null, dateStr: '', isPast: false, isToday: false, isSelected: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calYear, calMonth, d);
    const dateStr = `${String(d).padStart(2,'0')}-${String(calMonth+1).padStart(2,'0')}-${calYear}`;
    calDays.push({
      day: d,
      dateStr,
      isPast: date < today,
      isToday: date.getTime() === today.getTime(),
      isSelected: selectedDate === dateStr,
    });
  }

  const sbStyles: Record<string, React.CSSProperties> = {
    searchBar: {
      display: 'flex', alignItems: 'center',
      background: 'rgba(245, 244, 242, 0.96)',
      borderRadius: '60px', padding: '10px 10px 10px 28px',
      gap: 0, width: '100%', maxWidth: '860px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.18)', position: 'relative',
      fontFamily: "'DM Sans', sans-serif",
    },
    field: {
      flex: 1, padding: '10px 24px 10px 0', cursor: 'pointer',
      position: 'relative', minWidth: 0,
    },
    fieldBorder: {
      flex: 1, padding: '10px 24px 10px 24px', cursor: 'pointer',
      position: 'relative', minWidth: 0,
      borderLeft: '1.5px solid rgba(0,0,0,0.12)',
    },
    fieldInner: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
    fieldIcon: { marginTop: 2, flexShrink: 0, color: '#D4900A', width: 16, height: 16 },
    fieldLabel: {
      fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.1em',
      textTransform: 'uppercase' as const, color: '#888', marginBottom: 3, display: 'block',
    },
    fieldLabelActive: {
      fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.1em',
      textTransform: 'uppercase' as const, color: '#D4900A', marginBottom: 3, display: 'block',
    },
    dropdown: {
      position: 'absolute' as const, top: 'calc(100% + 12px)', left: 0,
      background: '#fff', borderRadius: '16px',
      boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
      zIndex: 9999, minWidth: '280px', overflow: 'hidden' as const,
    },
    submitBtn: {
      width: 52, height: 52, borderRadius: '50%', background: '#1a1a1a',
      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0, marginLeft: 8,
      transition: 'background 0.2s, transform 0.15s',
    },
  };

  return (
    <div style={sbStyles.searchBar} ref={containerRef}>

      {/* LOCATION */}
      <div
        style={{ ...sbStyles.field, position: 'relative' }}
        onClick={() => toggleDropdown('location')}
      >
        <div style={sbStyles.fieldInner}>
          <svg style={sbStyles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={openDropdown === 'location' ? sbStyles.fieldLabelActive : sbStyles.fieldLabel}>Location</span>
            <div style={{ fontSize: 15, fontWeight: 500, color: selectedLocation ? '#1a1a1a' : '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedLocation || 'Where are you going?'}
            </div>
          </div>
        </div>

        {openDropdown === 'location' && (
          <div style={sbStyles.dropdown} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px 10px', borderBottom: '1px solid #f0eeec' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={locationInputRef}
                type="text"
                placeholder="Search destinations…"
                value={locationSearch}
                onChange={e => setLocationSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', width: '100%', color: '#222', background: 'transparent' }}
              />
            </div>
            <div style={{ padding: '8px 0' }}>
              {filteredLocations.map(loc => (
                <div
                  key={loc}
                  onClick={() => selectLocation(loc)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', cursor: 'pointer', fontSize: 14, color: '#333' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f7f5f2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4900A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                  {loc}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DURATION / DATE */}
      <div
        style={{ ...sbStyles.fieldBorder, position: 'relative' }}
        onClick={() => toggleDropdown('date')}
      >
        <div style={sbStyles.fieldInner}>
          <svg style={sbStyles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={openDropdown === 'date' ? sbStyles.fieldLabelActive : sbStyles.fieldLabel}>Duration</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: selectedDate ? '#1a1a1a' : '#aaa' }}>
                {selectedDate || 'dd-mm-yyyy'}
              </div>
            </div>
          </div>
        </div>

        {openDropdown === 'date' && (
          <div style={{ ...sbStyles.dropdown, minWidth: 320 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#888', fontSize: 18 }}>&#8249;</button>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{MONTH_NAMES[calMonth]} {calYear}</span>
                <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#888', fontSize: 18 }}>&#8250;</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#aaa', padding: '4px 0 8px', textTransform: 'uppercase' }}>{d}</div>
                ))}
                {calDays.map((cell, i) => (
                  <div
                    key={i}
                    onClick={() => !cell.isPast && cell.day && pickDate(cell.dateStr)}
                    style={{
                      textAlign: 'center', padding: '7px 4px', fontSize: 13,
                      borderRadius: 8, cursor: cell.isPast || !cell.day ? 'default' : 'pointer',
                      color: cell.isSelected ? '#fff' : cell.isPast || !cell.day ? '#ddd' : cell.isToday ? '#D4900A' : '#333',
                      background: cell.isSelected ? '#1a1a1a' : 'transparent',
                      fontWeight: cell.isToday ? 700 : 400,
                    }}
                    onMouseEnter={e => { if (!cell.isPast && cell.day && !cell.isSelected) e.currentTarget.style.background = '#f0eeec'; }}
                    onMouseLeave={e => { if (!cell.isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {cell.day || ''}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CATEGORY */}
      <div
        style={{ ...sbStyles.fieldBorder, position: 'relative' }}
        onClick={() => toggleDropdown('category')}
      >
        <div style={sbStyles.fieldInner}>
          <svg style={sbStyles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={openDropdown === 'category' ? sbStyles.fieldLabelActive : sbStyles.fieldLabel}>Category</span>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>{selectedCategory}</div>
          </div>
        </div>

        {openDropdown === 'category' && (
          <div style={sbStyles.dropdown} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '8px 0' }}>
              {CATEGORIES.map(cat => (
                <div
                  key={cat}
                  onClick={() => selectCategory(cat)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', cursor: 'pointer', fontSize: 14, color: cat === selectedCategory ? '#D4900A' : '#333', fontWeight: cat === selectedCategory ? 600 : 400 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f7f5f2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat === selectedCategory ? '#D4900A' : '#ddd', flexShrink: 0 }}></div>
                  {cat}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SUBMIT */}
      <button
        style={sbStyles.submitBtn}
        onClick={handleSearch}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#D4900A'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a'; }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>
    </div>
  );
}
