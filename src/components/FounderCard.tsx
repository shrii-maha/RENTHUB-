import { useState, useRef } from "react";

export default function FounderCard() {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!divRef.current) return;
    const bounds = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
  };

  return (
    <section style={{
      padding: '96px 24px',
      background: '#111',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Section Header */}
      <span style={{
        fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase',
        letterSpacing: '0.5em', color: 'rgba(255,255,255,0.3)', marginBottom: 16, display: 'block',
      }}>
        The Founder
      </span>
      <h2 style={{
        fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: 'white',
        textAlign: 'center', marginBottom: 48, fontStyle: 'italic', lineHeight: 1.1,
      }}>
        Meet the <span style={{ color: '#D4900A' }}>Mind</span> Behind RentHub
      </h2>

      {/* Glowing Card */}
      <div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{
          position: 'relative',
          width: 320, height: 420,
          borderRadius: 16, padding: 1,
          background: '#1a1a1a',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          cursor: 'pointer',
        }}
      >
        {/* Mouse-follow glow */}
        <div
          style={{
            pointerEvents: 'none',
            filter: 'blur(48px)',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4900A, #f5c842, #D4900A)',
            width: 240, height: 240,
            position: 'absolute',
            zIndex: 0,
            transition: 'opacity 0.5s',
            opacity: visible ? 1 : 0,
            top: position.y - 120,
            left: position.x - 120,
          }}
        />

        {/* Card Inner */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            background: 'rgba(17, 17, 17, 0.8)',
            backdropFilter: 'blur(12px)',
            padding: 32,
            height: '100%',
            width: '100%',
            borderRadius: 15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          {/* Profile Image */}
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            border: '3px solid #D4900A', padding: 3,
            marginBottom: 16,
          }}>
            <img
              src="/srimanta.jpg"
              alt="Srimanta Maharana"
              style={{
                width: '100%', height: '100%', borderRadius: '50%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.style.display = 'flex';
                  parent.style.alignItems = 'center';
                  parent.style.justifyContent = 'center';
                  parent.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                  parent.innerHTML = '<span style="color:white;font-size:1.5rem;font-weight:800">SM</span>';
                }
              }}
            />
          </div>

          {/* Name & Title */}
          <h3 style={{
            fontSize: 22, fontWeight: 800, color: 'white',
            marginBottom: 4, letterSpacing: '0.02em',
          }}>
            Srimanta Maharana
          </h3>
          <p style={{
            fontSize: 13, color: '#D4900A', fontWeight: 600,
            marginBottom: 16, letterSpacing: '0.15em', textTransform: 'uppercase',
          }}>
            Founder
          </p>

          {/* Bio */}
          <p style={{
            fontSize: 13, color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.7, marginBottom: 20, padding: '0 8px',
          }}>
            Passionate about building platforms that connect people and create value through shared resources.
          </p>

          {/* Social Links */}
          <div style={{ display: 'flex', gap: 20 }}>
            {/* GitHub */}
            <a
              href="https://github.com/shrii-maha"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.393 6.17 10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418c.504.095.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621.317.044.62.163.885.346.266.183.487.426.647.71.135.253.318.476.538.655a2.079 2.079 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37-2.219-.259-4.554-1.138-4.554-5.07a4.022 4.022 0 0 1 1.031-2.75 3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05.37.858.406 1.828.101 2.713a4.017 4.017 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.471 2.471 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814 0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421 10.473 10.473 0 0 0 1.313-6.948 10.32 10.32 0 0 0-3.39-6.165A9.847 9.847 0 0 0 12.007 2Z" clipRule="evenodd" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/srimanta-maharana-853aa62a4/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0A66C2'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12.51 8.796v1.697a3.738 3.738 0 0 1 3.288-1.684c3.455 0 4.202 2.16 4.202 4.97V19.5h-3.2v-5.072c0-1.21-.244-2.766-2.128-2.766-1.827 0-2.139 1.317-2.139 2.676V19.5h-3.19V8.796h3.168ZM7.2 6.106a1.61 1.61 0 0 1-.988 1.483 1.595 1.595 0 0 1-1.743-.348A1.607 1.607 0 0 1 5.6 4.5a1.601 1.601 0 0 1 1.6 1.606Z" clipRule="evenodd" />
                <path d="M7.2 8.809H4V19.5h3.2V8.809Z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/srimantmaharana?igsh=YzdjeGwyNnNrNHNv"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#E4405F'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
