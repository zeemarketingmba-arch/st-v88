import React, { useState, useEffect, useCallback } from 'react';
import { ActivePage, AppSettings, Subject, Student, Class as ClassType, GradingLevel } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Students from './pages/Students';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Statistics from './pages/Statistics';
import About from './pages/About';

// مستويات التقييم الافتراضية
const initialGradingLevels: GradingLevel[] = [
  { id: 'gl-1', name: 'ممتاز', minPercentage: 90 },
  { id: 'gl-2', name: 'جيد جدًا', minPercentage: 80 },
  { id: 'gl-3', name: 'جيد', minPercentage: 70 },
  { id: 'gl-4', name: 'مقبول', minPercentage: 60 },
  { id: 'gl-5', name: 'ضعيف', minPercentage: 0 },
];

// بيانات أولية للتطبيق
const initialSettings: AppSettings = {
  schoolName: 'المدرسة الافتراضية',
  teacherName: 'اسم المعلم',
  supervisorName: 'اسم المشرف',
  managerName: 'اسم المدير',
  schoolLogo: null,
  gradingLevels: initialGradingLevels,
};

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  
  const [subjects, setSubjects] = useLocalStorage<Subject[]>('subjects', []);
  const [students, setStudents] = useLocalStorage<Student[]>('students', []);
  const [classes, setClasses] = useLocalStorage<ClassType[]>('classes', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('settings', initialSettings);

  // تأثير لتطبيق الثيم على عنصر html
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  // دالة لعرض الصفحة المناسبة بناءً على الحالة
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard subjects={subjects} students={students} classes={classes} />;
      case 'subjects':
        return <Subjects subjects={subjects} setSubjects={setSubjects} />;
      case 'students':
        return <Students students={students} setStudents={setStudents} subjects={subjects} classes={classes} setClasses={setClasses} settings={settings} />;
      case 'projects':
        return <Projects students={students} setStudents={setStudents} subjects={subjects} classes={classes} settings={settings} />;
      case 'reports':
        return <Reports students={students} subjects={subjects} classes={classes} settings={settings} setStudents={setStudents} />;
      case 'statistics':
        return <Statistics students={students} subjects={subjects} classes={classes} settings={settings} />;
      case 'settings':
        return <Settings 
                  settings={settings} setSettings={setSettings} 
                  students={students} setStudents={setStudents}
                  subjects={subjects} setSubjects={setSubjects}
                  classes={classes} setClasses={setClasses}
                />;
      case 'about':
        return <About />;
      default:
        return <Dashboard subjects={subjects} students={students} classes={classes}/>;
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-gray-800 dark:text-gray-200 transition-all">
      <div className="flex">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <main className="flex-1 transition-all mr-64"> {/* إضافة هامش أيمن لإفساح المجال للشريط الجانبي */}
          <Header toggleTheme={toggleTheme} theme={theme} settings={settings} />
          <div className="p-8">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;