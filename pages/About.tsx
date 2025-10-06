import React from 'react';
import Card from '../components/Card';
import Icon from '../components/Icon';

const About: React.FC = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600">
        حول التطبيق
      </h2>
      <Card className="text-center">
        <div className="flex flex-col items-center gap-4 p-4">
            <div className="w-24 h-24 bg-gradient-to-br from-light-primary to-blue-400 dark:from-dark-primary dark:to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Icon name="logo" className="w-16 h-16 text-white"/>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-4">نظام تقييم الطلاب</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                تطبيق سطح مكتب مصمم لمساعدة المعلمين على إدارة وتقييم أداء الطلاب بكفاءة وسهولة، مع توفير تقارير وإحصائيات شاملة.
            </p>
            <div className="mt-8 border-t border-gray-300 dark:border-gray-600 w-full max-w-md pt-8">
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                    اعداد: م/ محمد بكري
                </p>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
                    لطلب البرنامج: <span dir="ltr" className="font-sans tracking-wider">+96892391215</span>
                </p>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default About;