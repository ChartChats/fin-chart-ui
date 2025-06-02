import React from 'react';
import { Avatar, Dropdown, Menu } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { auth } from '@/config/firebase';

const ProfileIcon: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { email, displayName, photoURL } = user;

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const menu = (
    <Menu
      items={[
        {
          key: 'profile-info',
          label: (
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                {displayName || email}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                {email}
              </div>
            </div>
          ),
          disabled: true,
        },
        {
          type: 'divider',
        },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: 'Logout',
          onClick: handleLogout,
        },
      ]}
    />
  );
  return (
    <Dropdown menu={{ items: menu.props.items }} placement="bottomRight" trigger={['click']}>
      <Avatar
        size={32}
        src={photoURL}
        icon={!photoURL && <UserOutlined />}
        style={{
          backgroundColor: photoURL ? 'transparent' : '#595959',
          cursor: 'pointer',
          border: '2px solid #d9d9d9',
        }}
      />
    </Dropdown>
  );
};

export default ProfileIcon;