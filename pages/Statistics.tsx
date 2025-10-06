
import React, { useMemo } from 'react';
import { Student, Subject, Class, AppSettings } from '../types';
import Card from '../components/Card';
import { getStudentLevel } from '../utils/grading';

interface StatisticsProps {
  students: Student[];
  subjects: Subject[];
  classes: Class[];
  settings: AppSettings;
}

const Statistics: React.FC<StatisticsProps> = ({ students, subjects, classes, settings }) => {

  const performanceDistribution = useMemo(() => {
    const initialDistribution = settings.gradingLevels.reduce((acc, level) => {
        acc[level.name] = 0;
        return acc;
    }, {} as Record<string, number>);
    initialDistribution['غير محدد'] = 0;

    students.forEach(student => {
        subjects.forEach(subject => {
            const subjectTotalMaxGrade = subject.assessments.reduce((sum, asm) => sum + asm.maxGrade, 0);
            if (subjectTotalMaxGrade > 0) {
                const studentGrades = student.grades[subject.id];
                let level = 'غير محدد';
            if (studentGrades) {
              // Explicitly type the reduce accumulator and grade values
              const total = Object.values(studentGrades).reduce((sum: number, grade: number | null) => sum + (grade || 0), 0);
              const percentage = (Number(total) / Number(subjectTotalMaxGrade)) * 100;
              level = getStudentLevel(percentage, settings.gradingLevels);
            }
                if (initialDistribution.hasOwnProperty(level)) {
                    initialDistribution[level]++;
                }
            }
        });
    });
    
    return initialDistribution;
  }, [students, subjects, settings.gradingLevels]);

  // FIX: Explicitly typed the accumulator and value in the `reduce` function to prevent type inference errors.
  const totalEvaluations = Object.values(performanceDistribution).reduce((a: number, b: number) => a + b, 0);

  const classAverages = useMemo(() => {
    const averages: { className: string, average: number, studentCount: number }[] = [];
    
    classes.forEach(c => {
      const classStudents = students.filter(s => s.classId === c.id);
      let totalPercentage = 0;
      let evaluatedStudents = 0;

      if (classStudents.length > 0 && subjects.length > 0) {
         classStudents.forEach(student => {
            let studentTotalPercentage = 0;
            let subjectsEvaluated = 0;
            subjects.forEach(subject => {
                const subjectTotalMaxGrade = subject.assessments.reduce((sum, asm) => sum + asm.maxGrade, 0);
         if (subjectTotalMaxGrade > 0 && student.grades[subject.id]) {
           const total = Object.values(student.grades[subject.id]).reduce((sum: number, grade: number | null) => sum + (grade || 0), 0);
           studentTotalPercentage += (Number(total) / Number(subjectTotalMaxGrade)) * 100;
           subjectsEvaluated++;
         }
            });

            if (subjectsEvaluated > 0) {
                totalPercentage += (studentTotalPercentage / subjectsEvaluated);
                evaluatedStudents++;
            }
         });
      }
      
      averages.push({
        className: c.name,
        average: evaluatedStudents > 0 ? totalPercentage / evaluatedStudents : 0,
        studentCount: classStudents.length,
      });
    });
    return averages;
  }, [students, subjects, classes]);

  // FIX: Handled the edge case of an empty array for `Math.max` by providing a default value of 0, ensuring `maxAverage` is always a valid number.
  const maxAverage = Number(Math.max(0, ...classAverages.map(c => c.average)));

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600">
        الإحصائيات
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-2xl font-semibold mb-4 text-light-primary dark:text-dark-primary">توزيع مستويات الأداء (لكل التقييمات)</h3>
          <div className="space-y-4">
            {settings.gradingLevels.map(level => {
              const count = performanceDistribution[level.name] || 0;
              return (
                <div key={level.id}>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{level.name}</span>
                    <span>{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset">
                    <div 
                      className="bg-gradient-to-r from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600 h-4 rounded-full" 
                      style={{ width: Number(totalEvaluations) > 0 ? `${(Number(count) / Number(totalEvaluations)) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              )
            })}
             {performanceDistribution['غير محدد'] > 0 && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">غير محدد</span>
                    <span>{performanceDistribution['غير محدد']}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset">
                    <div 
                      className="bg-gray-400 dark:bg-gray-500 h-4 rounded-full" 
                      style={{ width: Number(totalEvaluations) > 0 ? `${(Number(performanceDistribution['غير محدد']) / Number(totalEvaluations)) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              )}
          </div>
        </Card>

        <Card>
          <h3 className="text-2xl font-semibold mb-6 text-light-primary dark:text-dark-primary">متوسط الأداء العام حسب الشعبة</h3>
          <div className="w-full h-80 flex items-end justify-around gap-4 px-4 border-b-2 border-l-2 border-gray-300 dark:border-gray-600 pb-2 relative">
             <span className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-gray-500">متوسط النسبة المئوية</span>
            {classAverages.map(({ className, average }) => (
              <div key={className} className="h-full flex flex-col items-center justify-end flex-1" title={`${average.toFixed(1)}%`}>
                 <p className="text-sm font-bold">{average > 0 ? `${average.toFixed(1)}%` : ''}</p>
                 <div 
                    className="w-3/4 bg-gradient-to-b from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600 rounded-t-md shadow-lg transition-all duration-700"
                    style={{ height: maxAverage > 0 ? `${(average / maxAverage) * 90}%` : '0%' }}
                 ></div>
                 <p className="mt-2 text-xs text-center font-semibold">{className}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
