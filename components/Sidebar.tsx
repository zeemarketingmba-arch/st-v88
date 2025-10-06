import React from 'react';
import { ActivePage } from '../types';
import Icon from './Icon';

interface SidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

const navItems: { id: ActivePage; name: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { id: 'dashboard', name: 'لوحة التحكم', icon: 'dashboard' },
  { id: 'subjects', name: 'المواد الدراسية', icon: 'subjects' },
  { id: 'students', name: 'الطلاب والتقييم', icon: 'students' },
  { id: 'projects', name: 'المشاريع', icon: 'project' },
  { id: 'reports', name: 'التقارير', icon: 'print' },
  { id: 'statistics', name: 'الإحصائيات', icon: 'chart-bar' },
  { id: 'settings', name: 'الإعدادات', icon: 'settings' },
  { id: 'about', name: 'حول التطبيق', icon: 'info' },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  return (
    <aside className="no-print fixed top-0 right-0 h-screen w-64 bg-light-bg dark:bg-dark-bg shadow-neumorphism-light dark:shadow-neumorphism-dark flex flex-col items-center py-8 transition-all">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-12 h-12 bg-gradient-to-br from-light-primary to-blue-400 dark:from-dark-primary dark:to-blue-600 rounded-full flex items-center justify-center shadow-md">
            <Icon name="logo" className="w-8 h-8 text-white"/>
        </div>
        <h1 className="text-xl font-bold text-light-primary dark:text-dark-primary">تقييم</h1>
      </div>
      <nav className="w-full px-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 my-2 rounded-lg text-right transition-all text-lg font-semibold
                  ${
                    activePage === item.id
                      ? 'bg-light-bg dark:bg-dark-bg shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset text-light-primary dark:text-dark-primary'
                      : 'hover:shadow-neumorphism-light dark:hover:shadow-neumorphism-dark'
                  }`}
              >
                <Icon name={item.icon} className="w-7 h-7" />
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;