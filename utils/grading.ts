import { GradingLevel } from '../types';

/**
 * يحدد مستوى الطالب بناءً على النسبة المئوية ومستويات التقييم المخصصة.
 * @param percentage - النسبة المئوية للطالب.
 * @param gradingLevels - مصفوفة من مستويات التقييم.
 * @returns اسم مستوى التقييم.
 */
export const getStudentLevel = (percentage: number, gradingLevels: GradingLevel[]): string => {
  if (isNaN(percentage) || !gradingLevels || gradingLevels.length === 0) return 'غير محدد';

  // فرز المستويات تنازليًا حسب الحد الأدنى للنسبة لضمان التقييم الصحيح
  const sortedLevels = [...gradingLevels].sort((a, b) => b.minPercentage - a.minPercentage);

  // البحث عن أول مستوى مطابق
  const level = sortedLevels.find(l => percentage >= l.minPercentage);

  return level ? level.name : 'غير محدد';
};
