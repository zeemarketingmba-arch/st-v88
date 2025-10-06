import React, { useState } from 'react';
import { AppSettings, Student, Subject, Class } from '../types';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Icon from '../components/Icon';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  classes: Class[];
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, setSettings, 
  students, setStudents, 
  subjects, setSubjects, 
  classes, setClasses 
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  // دالة لمعالجة التغييرات في حقول الإدخال
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: value }));
  };

  // دالة لمعالجة تحميل الشعار
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const logoDataUrl = event.target.result;
          setLocalSettings(prev => ({ ...prev, schoolLogo: logoDataUrl }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleGradingLevelChange = (id: string, field: 'name' | 'minPercentage', value: string) => {
    setLocalSettings(prev => ({
        ...prev,
        gradingLevels: prev.gradingLevels.map(level =>
            level.id === id ? { ...level, [field]: field === 'minPercentage' ? Number(value) : value } : level
        )
    }));
  };

  const addGradingLevel = () => {
      setLocalSettings(prev => ({
          ...prev,
          gradingLevels: [...prev.gradingLevels, { id: `gl-${Date.now()}`, name: 'مستوى جديد', minPercentage: 0 }]
      }));
  };

  const removeGradingLevel = (id: string) => {
      if (localSettings.gradingLevels.length <= 1) {
        alert('يجب أن يكون هناك مستوى تقييم واحد على الأقل.');
        return;
      }
      setLocalSettings(prev => ({
          ...prev,
          gradingLevels: prev.gradingLevels.filter(level => level.id !== id)
      }));
  };

  // دالة لحفظ الإعدادات
  const handleSave = () => {
    // فرز المستويات قبل الحفظ لضمان عمل منطق التقييم بشكل صحيح
    const sortedLevels = [...localSettings.gradingLevels].sort((a, b) => b.minPercentage - a.minPercentage);
    setSettings({ ...localSettings, gradingLevels: sortedLevels });
    alert('تم حفظ الإعدادات بنجاح!');
  };
  
  const handleExportData = () => {
    const backupData = {
      settings,
      students,
      subjects,
      classes,
      version: '1.0.0' // Good practice to version backups
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `student-assessment-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('هل أنت متأكد؟ سيؤدي استيراد نسخة احتياطية إلى الكتابة فوق جميع بياناتك الحالية.')) {
        event.target.value = ''; // Reset file input
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("الملف غير قابل للقراءة.");
        
        const data = JSON.parse(text);

        // Basic validation
        if (data.settings && data.students && data.subjects && data.classes) {
          setSettings(data.settings);
          setStudents(data.students);
          setSubjects(data.subjects);
          setClasses(data.classes);
          alert('تم استيراد البيانات بنجاح!');
        } else {
          throw new Error("ملف النسخ الاحتياطي غير صالح أو تالف.");
        }
      } catch (error) {
        const err = error as Error;
        console.error("Error importing data:", error);
        alert(`فشل استيراد البيانات: ${err.message}`);
      } finally {
        event.target.value = ''; // Reset file input for same-file re-upload
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600">
        الإعدادات
      </h2>
      <Card>
        <div className="space-y-6">
          <Input label="اسم المدرسة" name="schoolName" value={localSettings.schoolName} onChange={handleChange} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="اسم المعلم" name="teacherName" value={localSettings.teacherName} onChange={handleChange} />
            <Input label="اسم المشرف" name="supervisorName" value={localSettings.supervisorName} onChange={handleChange} />
            <Input label="اسم المدير" name="managerName" value={localSettings.managerName} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">شعار المدرسة</label>
            <div className="flex items-center gap-4">
              <input type="file" accept="image/*" onChange={handleLogoChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-light-primary dark:file:text-dark-primary hover:file:bg-blue-100 dark:hover:file:bg-blue-800"/>
              {localSettings.schoolLogo && <img src={localSettings.schoolLogo} alt="School Logo" className="w-16 h-16 rounded-full object-cover"/>}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-primary">إعدادات سلالم التقييم</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4 font-semibold text-gray-500 dark:text-gray-400 px-2">
            <span className="flex-1">اسم المستوى</span>
            <span className="w-40">الحد الأدنى للنسبة (%)</span>
            <span className="w-10"></span>
          </div>
          {localSettings.gradingLevels.sort((a,b) => b.minPercentage - a.minPercentage).map(level => (
              <div key={level.id} className="flex items-center gap-4">
                  <input 
                    value={level.name} 
                    onChange={(e) => handleGradingLevelChange(level.id, 'name', e.target.value)}
                    className="flex-1 bg-light-bg dark:bg-dark-bg rounded-lg p-2 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none"
                  />
                  <input 
                    type="number"
                    value={level.minPercentage} 
                    onChange={(e) => handleGradingLevelChange(level.id, 'minPercentage', e.target.value)}
                    className="w-40 bg-light-bg dark:bg-dark-bg rounded-lg p-2 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none"
                  />
                  <button onClick={() => removeGradingLevel(level.id)} className="p-2 text-red-500 hover:shadow-neumorphism-light dark:hover:shadow-neumorphism-dark rounded-full">
                    <Icon name="delete" className="w-5 h-5"/>
                  </button>
              </div>
          ))}
        </div>
        <div className="mt-6">
            <Button onClick={addGradingLevel} variant="secondary">إضافة مستوى جديد</Button>
        </div>
      </Card>
      
      <Card>
        <h3 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-primary">النسخ الاحتياطي والاستعادة</h3>
        <div className="flex flex-col md:flex-row gap-4">
            <Button onClick={handleExportData} icon="download" variant="secondary">تصدير نسخة احتياطية</Button>
            <label className="cursor-pointer px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all bg-light-bg dark:bg-dark-bg shadow-neumorphism-light dark:shadow-neumorphism-dark hover:shadow-neumorphism-light-inset dark:hover:shadow-neumorphism-dark-inset">
                <Icon name="upload" className="w-5 h-5" />
                <span>استيراد نسخة احتياطية</span>
                <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
            </label>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            احتفظ بنسخة من جميع بياناتك (الطلاب، المواد، الدرجات، الإعدادات) أو استعدها من ملف.
            <br/>
            <span className="font-bold text-red-500">تحذير:</span> سيؤدي الاستيراد إلى حذف جميع البيانات الحالية.
        </p>
      </Card>

      <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} icon="save">حفظ جميع التغييرات</Button>
      </div>
    </div>
  );
};

export default Settings;