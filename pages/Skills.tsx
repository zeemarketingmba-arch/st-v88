import React, { useState, useMemo } from 'react';
import { Student, Subject, AppSettings } from '../types';
import Card from '../components/Card';

interface SkillsProps {
  students: Student[];
  subjects: Subject[];
  settings: AppSettings;
}

interface SkillPerformance {
  skillId: string;
  skillName: string;
  average: number;
  assessmentCount: number;
}

const Skills: React.FC<SkillsProps> = ({ students, subjects, settings }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const studentPerformance = useMemo((): SkillPerformance[] => {
    if (!selectedStudentId || !settings.skills) return [];

    const selectedStudent = students.find(s => s.id === selectedStudentId);
    if (!selectedStudent) return [];

    return settings.skills.map(skill => {
      let totalPercentage = 0;
      let assessmentCount = 0;

      subjects.forEach(subject => {
        subject.assessments.forEach(assessment => {
          if (assessment.skillIds?.includes(skill.id)) {
            const grade = selectedStudent.grades[subject.id]?.[assessment.id];
            if (grade !== null && grade !== undefined && assessment.maxGrade > 0) {
              totalPercentage += (grade / assessment.maxGrade) * 100;
              assessmentCount++;
            }
          }
        });
      });

      return {
        skillId: skill.id,
        skillName: skill.name,
        average: assessmentCount > 0 ? totalPercentage / assessmentCount : 0,
        assessmentCount: assessmentCount,
      };
    });
  }, [selectedStudentId, students, subjects, settings.skills]);

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600">
        المهارات والكفاءات
      </h2>
      
      <Card>
        <div className="max-w-md">
            <label htmlFor="student-select" className="block text-sm font-medium mb-2">اختر طالبًا لعرض تقرير المهارات</label>
            <select 
                id="student-select"
                value={selectedStudentId} 
                onChange={e => setSelectedStudentId(e.target.value)} 
                className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none"
            >
              <option value="">-- اختر طالبًا --</option>
              {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
        </div>
      </Card>

      {selectedStudentId && (
        <Card>
          <h3 className="text-2xl font-semibold mb-6 text-light-primary dark:text-dark-primary">
            تقرير أداء المهارات للطالب: {students.find(s => s.id === selectedStudentId)?.name}
          </h3>
          <div className="space-y-6">
            {studentPerformance.length > 0 ? studentPerformance.map(perf => (
              <div key={perf.skillId}>
                <div className="flex justify-between items-end mb-1">
                  <div>
                    <span className="font-bold text-lg">{perf.skillName}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {perf.assessmentCount > 0 ? `مبني على ${perf.assessmentCount} تقييمات` : 'لا توجد تقييمات مرتبطة'}
                    </p>
                  </div>
                  <span className="font-bold text-xl">{perf.assessmentCount > 0 ? `${perf.average.toFixed(1)}%` : '-'}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset">
                  <div 
                    className="bg-gradient-to-r from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600 h-5 rounded-full transition-all duration-700" 
                    style={{ width: `${perf.average}%` }}
                  ></div>
                </div>
              </div>
            )) : (
                <p>لم يتم تعريف أي مهارات في الإعدادات. يرجى إضافتها أولاً من شاشة الإعدادات.</p>
            )}
          </div>
        </Card>
      )}

    </div>
  );
};

export default Skills;