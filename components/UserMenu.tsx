import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

interface UserMenuProps {
  user: any;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid #4a3820',
          borderRadius: 6,
          padding: '8px 12px',
          color: '#f0e6d0',
          fontFamily: 'Crimson Text, Georgia, serif',
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>{user.email}</span>
        <span style={{ fontSize: 10 }}>▼</span>
      </button>

      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: '#1a1208',
            border: '1px solid #4a3820',
            borderRadius: 6,
            padding: '8px 0',
            minWidth: 120,
            zIndex: 10,
            marginTop: 4,
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: '#f0e6d0',
              fontFamily: 'Crimson Text, Georgia, serif',
              fontSize: 12,
              padding: '8px 16px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2010')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;