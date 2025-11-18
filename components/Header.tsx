'use client';

function Header() {
  return (
    <div style={{
      height: '64px',
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      position: 'fixed',
      top: 0,
      left: '260px',
      right: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
    }}>
      <div>🔍 Поиск</div>
      <div>👤 Пользователь</div>
    </div>
  );
}

export default Header;