
import React from 'react';
import Card from '../components/Card';
import Icon from '../components/Icon';
import { Subject, Student, Class } from '../types';

interface DashboardProps {
  subjects: Subject[];
  students: Student[];
  classes: Class[];
}

const StatCard: React.FC<{ title: string; value: number; icon: 'subjects' | 'students' | 'dashboard' }> = ({ title, value, icon }) => (
    <Card className="flex items-center gap-6">
        <div className="p-4 bg-gradient-to-br from-light-primary to-blue-400 dark:from-dark-primary dark:to-blue-600 rounded-full shadow-md">
            <Icon name={icon} className="w-8 h-8 text-white" />
        </div>
        <div>
            <p className="text-lg text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-4xl font-bold">{value}</p>
        </div>
    </Card>
);

const Dashboard: React.FC<DashboardProps> = ({ subjects, students, classes }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600">
        لوحة التحكم
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard title="إجمالي المواد" value={subjects.length} icon="subjects" />
        <StatCard title="إجمالي الطلاب" value={students.length} icon="students" />
        <StatCard title="إجمالي الشعب" value={classes.length} icon="dashboard" />
      </div>

      <Card>
        <h3 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-primary">مرحباً بك في نظام تقييم</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          هذا النظام مصمم لمساعدتك في إدارة تقييمات الطلاب بسهولة ومرونة. يمكنك البدء بإضافة المواد الدراسية من قسم "المواد الدراسية"، ثم إضافة الطلاب والشعب وبدء رصد الدرجات من قسم "الطلاب والتقييم". لا تنسَ تخصيص معلومات المدرسة والمعلم من "الإعدادات".
        </p>
      </Card>
    </div>
  );
};

export default Dashboard;
