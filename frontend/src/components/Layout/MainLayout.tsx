import React, { useState, createContext, useContext, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  WarningOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  CreditCardOutlined,
  MonitorOutlined,
  TeamOutlined,
  MobileOutlined,
  SafetyOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined, // Import light mode icon
  MoonOutlined, // Import dark mode icon
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
// @ts-ignore
import authService from '../../services/auth.service'; // Restored authService

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// --- 1. Create Theme Context ---
type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});
export const useTheme = () => useContext(ThemeContext);

// --- 2. Merged Styles (NOW WITH ANTD DARK THEME) ---
const MergedStyles = () => (
  <style>{`
    /* --- DARK MODE (DEFAULT) --- */
    .ant-layout,
    .ant-layout-sider,
    .ant-layout-header,
    .ant-layout-content {
      background: #16181D !important;
    }
    .ant-layout-header {
      box-shadow: none !important;
      border-bottom: none !important;
    }
    .logo {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1E222D;
      margin: 16px;
      border-radius: 12px;
      border: 1px solid #333;
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }
    .logo:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 30px rgba(0, 0, 0, 0.4);
    }
    .ant-menu-dark, .ant-menu-dark .ant-menu-sub {
      background: transparent !important;
    }
    .ant-menu-dark .ant-menu-item {
      margin: 8px 12px;
      border-radius: 10px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      color: #a0a0a0;
    }
    .ant-menu-dark .ant-menu-item .anticon { color: #a0a0a0; }
    .ant-menu-dark .ant-menu-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #1abcfe 0%, #2ee5b5 100%);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    .ant-menu-dark .ant-menu-item:hover {
      background: #1E222D !important;
      color: #ffffff !important;
      transform: translateX(5px);
    }
    .ant-menu-dark .ant-menu-item:hover .anticon { color: #ffffff !important; }
    .ant-menu-dark .ant-menu-item:hover::before { transform: translateX(0); }
    .ant-menu-dark .ant-menu-item-selected {
      background: #1E222D !important;
      color: #ffffff !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    .ant-menu-dark .ant-menu-item-selected .anticon { color: #ffffff !important; }
    .ant-menu-dark .ant-menu-item-selected::before { transform: translateX(0); }
    .ant-menu-dark .ant-menu-item .anticon {
      font-size: 18px;
      transition: all 0.3s ease;
    }
    .ant-menu-dark .ant-menu-item:hover .anticon,
    .ant-menu-dark .ant-menu-item-selected .anticon {
      transform: scale(1.2);
      filter: drop-shadow(0 0 8px rgba(26, 188, 254, 0.8));
    }
    .trigger {
      font-size: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #a0a0a0;
      padding: 8px;
      border-radius: 8px;
      background: transparent;
    }
    .trigger:hover {
      color: #1abcfe;
      background: #1E222D;
      transform: rotate(0);
    }
    .ant-avatar {
      background: linear-gradient(135deg, #1abcfe 0%, #2ee5b5 100%);
      box-shadow: 0 4px 15px rgba(26, 188, 254, 0.4);
      transition: all 0.3s ease;
    }
    .ant-avatar:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(26, 188, 254, 0.6);
    }
    .ant-layout-content {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* --- NEW: ANTD DARK MODE COMPONENT STYLES --- */
    .ant-table-wrapper {
      background: #1E222D !important;
      border-radius: 8px;
    }
    .ant-table {
      background: transparent !important;
    }
    .ant-table-thead > tr > th {
      background: #16181D !important;
      color: #a0a0a0 !important;
      border-bottom: 1px solid #333 !important;
    }
    .ant-table-tbody > tr > td {
      background: transparent !important;
      color: #a0a0a0 !important;
      border-bottom: 1px solid #2a2a2a !important;
    }
    .ant-table-tbody > tr:hover > td {
      background: #2a2a2a !important;
    }
    .ant-table-pagination, .ant-table-pagination-item-link, .ant-table-pagination-item a {
      color: #a0a0a0 !important;
    }
    .ant-table-pagination-item-active {
      background: #16181D !important;
      border-color: #1abcfe !important;
    }
    .ant-table-pagination-item-active a {
      color: #1abcfe !important;
    }
    .ant-modal-content {
      background: #1E222D !important;
    }
    .ant-modal-header {
      background: #1E222D !important;
      border-bottom: 1px solid #333 !important;
    }
    .ant-modal-title, .ant-modal-close-x {
      color: #fff !important;
    }
    .ant-form-item-label > label {
      color: #a0a0a0 !important;
    }
    .ant-input, .ant-select-selector, .ant-picker, .ant-input-number {
      background: #16181D !important;
      border: 1px solid #333 !important;
      color: #fff !important;
    }
    .ant-input::placeholder, .ant-picker-input > input::placeholder {
      color: #555 !important;
    }
    .ant-input-number-addon {
      background: #16181D !important;
      border: 1px solid #333 !important;
      color: #a0a0a0 !important;
    }
    .ant-select-arrow, .ant-picker-suffix {
      color: #a0a0a0 !important;
    }
    .ant-typography, .ant-typography h1, .ant-typography h2 {
      color: #fff !important;
    }
    .ant-btn-default {
      background: #2a2a2a !important;
      border-color: #333 !important;
      color: #fff !important;
    }
    .ant-btn-default:hover {
      border-color: #1abcfe !important;
      color: #1abcfe !important;
    }

    /* --- LIGHT MODE OVERRIDES --- */
    .theme-light .ant-layout-sider {
      background: #FFFFFF !important;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.05);
      border-right: 1px solid #F0F0F0;
    }
    .theme-light .ant-layout .ant-layout {
      background: #F4F7FA !important;
    }
    .theme-light .ant-layout-header {
       background: #FFFFFF !important;
       box-shadow: 0 2px 8px #f0f1f2 !important;
       border-bottom: 1px solid #F0F0F0 !important;
    }
    .theme-light .ant-layout-content {
      background: #F4F7FA !important;
    }
    .theme-light .logo {
      background: #F4F7FA;
      border: 1px solid #EAEAEA;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    }
    .theme-light .logo .ant-typography {
      color: #333 !important;
    }
    .theme-light .ant-menu-light, .theme-light .ant-menu-light .ant-menu-sub {
      background: transparent !important;
    }
    .theme-light .ant-menu-light .ant-menu-item {
      margin: 8px 12px;
      border-radius: 10px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      color: #555555;
    }
    .theme-light .ant-menu-light .ant-menu-item .anticon {
      color: #555555;
    }
    .theme-light .ant-menu-light .ant-menu-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #1abcfe 0%, #2ee5b5 100%);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    .theme-light .ant-menu-light .ant-menu-item:hover {
      background: #F4F7FA !important;
      color: #1890ff !important;
      transform: translateX(5px);
    }
    .theme-light .ant-menu-light .ant-menu-item:hover .anticon {
      color: #1890ff !important;
    }
    .theme-light .ant-menu-light .ant-menu-item:hover::before {
      transform: translateX(0);
    }
    .theme-light .ant-menu-light .ant-menu-item-selected {
      background: #e6f7ff !important;
      color: #1890ff !important;
      box-shadow: 0 4px 15px rgba(26, 188, 254, 0.1);
    }
    .theme-light .ant-menu-light .ant-menu-item-selected .anticon {
      color: #1890ff !important;
    }
    .theme-light .ant-menu-light .ant-menu-item-selected::before {
      transform: translateX(0);
    }
    .theme-light .trigger {
      color: #555555;
      background: transparent;
    }
    .theme-light .trigger:hover {
      color: #1890ff;
      background: #F4F7FA;
    }
    .theme-light .ant-typography,
    .theme-light .ant-typography h1,
    .theme-light .ant-typography h2 {
      color: #333 !important;
    }
    .theme-light .ant-typography-strong {
      color: #333 !important;
    }

    /* --- NEW: LIGHT MODE ANTD OVERRIDES --- */
    .theme-light .ant-table-wrapper {
      background: #FFFFFF !important;
      border-radius: 8px;
    }
    .theme-light .ant-table {
      background: #FFFFFF !important;
    }
    .theme-light .ant-table-thead > tr > th {
      background: #F4F7FA !important;
      color: #555 !important;
      border-bottom: 1px solid #EAEAEA !important;
    }
    .theme-light .ant-table-tbody > tr > td {
      background: #FFFFFF !important;
      color: #333 !important;
      border-bottom: 1px solid #EAEAEA !important;
    }
    .theme-light .ant-table-tbody > tr:hover > td {
      background: #F4F7FA !important;
    }
    .theme-light .ant-table-pagination, .theme-light .ant-table-pagination-item-link, .theme-light .ant-table-pagination-item a {
      color: #555 !important;
    }
    .theme-light .ant-table-pagination-item-active {
      background: #e6f7ff !important;
      border-color: #1890ff !important;
    }
    .theme-light .ant-table-pagination-item-active a {
      color: #1890ff !important;
    }
    .theme-light .ant-modal-content {
      background: #FFFFFF !important;
    }
    .theme-light .ant-modal-header {
      background: #FFFFFF !important;
      border-bottom: 1px solid #EAEAEA !important;
    }
    .theme-light .ant-modal-title, .theme-light .ant-modal-close-x {
      color: #333 !important;
    }
    .theme-light .ant-form-item-label > label {
      color: #555 !important;
    }
    .theme-light .ant-input, .theme-light .ant-select-selector, .theme-light .ant-picker, .theme-light .ant-input-number {
      background: #FFFFFF !important;
      border: 1px solid #d9d9d9 !important;
      color: #333 !important;
    }
    .theme-light .ant-input::placeholder, .theme-light .ant-picker-input > input::placeholder {
      color: #aaa !important;
    }
    .theme-light .ant-input-number-addon {
      background: #FAFAFA !important;
      border: 1px solid #d9d9d9 !important;
      color: #555 !important;
    }
    .theme-light .ant-select-arrow, .theme-light .ant-picker-suffix {
      color: #555 !important;
    }
    .theme-light .ant-btn-default {
      background: #FFFFFF !important;
      border-color: #d9d9d9 !important;
      color: #333 !important;
    }
    .theme-light .ant-btn-default:hover {
      border-color: #1890ff !important;
      color: #1890ff !important;
    }

  `}</style>
);

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });

  const navigate = useNavigate();
  const location = useLocation();

  // @ts-ignore
  const user = authService.getCurrentUser();

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  const handleLogout = () => {
    // @ts-ignore
    authService.logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout },
    ],
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/assets', icon: <AppstoreOutlined />, label: 'Asset Management' },
    { key: '/incidents', icon: <WarningOutlined />, label: 'Incidents' },
    { key: '/helpdesk', icon: <CustomerServiceOutlined />, label: 'Helpdesk' },
    { key: '/change-requests', icon: <FileTextOutlined />, label: 'Change Requests' },
    { key: '/documents', icon: <FolderOpenOutlined />, label: 'Documents' },
    { key: '/hub', icon: <CreditCardOutlined />, label: 'EazyPay Hub' },
    { key: '/noc', icon: <MonitorOutlined />, label: 'NOC Monitoring' },
    { key: '/hr', icon: <TeamOutlined />, label: 'HR Management' },
    { key: '/sim', icon: <MobileOutlined />, label: 'SIM Management' },
    { key: '/policies', icon: <SafetyOutlined />, label: 'Policies' },
  ];

  const siderTheme = theme === 'dark' ? 'dark' : 'light';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Layout style={{ minHeight: '100vh' }} className={theme === 'light' ? 'theme-light' : ''}>
        <MergedStyles />

        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          theme={siderTheme}
        >
          <div className="logo">
            <Text strong style={{
                color: theme === 'dark' ? 'white' : '#333',
                fontSize: collapsed ? 16 : 18
              }}>
              {collapsed ? 'EP' : 'EazyPay ITSM'}
            </Text>
          </div>
          <Menu
            theme={siderTheme}
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>

        <Layout>
          <Header
            style={{
              padding: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ paddingLeft: 16 }}>
              {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: 'trigger',
                onClick: () => setCollapsed(!collapsed),
              })}
            </div>

            <div style={{ paddingRight: 24, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button
                shape="circle"
                onClick={toggleTheme}
                icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                className="trigger"
                style={{ background: 'transparent', border: 'none' }}
              />
              <Dropdown menu={userMenu} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                  <Text style={{ color: theme === 'dark' ? '#a0a0a0' : '#333' }}>
                    {user ? (user.firstName || user.username) : 'User'} {user?.lastName || ''}
                  </Text>
                </Space>
              </Dropdown>
            </div>
          </Header>

          <Content
            style={{
              margin: '0',
              padding: '0',
              minHeight: 280
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ThemeContext.Provider>
  );
};

export default MainLayout;
