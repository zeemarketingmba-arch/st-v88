// FIX: Added Skill interface for use in AppSettings.
// تعريف المهارة
export interface Skill {
  id: string;
  name: string;
}

// تعريف أنواع التقييمات
export interface AssessmentItem {
  id: string;
  name: string; // مثال: نشاط 1, اختبار قصير
  maxGrade: number;
  isProject?: boolean;
  projectCriteria?: ProjectCriterion[];
  // FIX: Added optional skillIds to link assessments with skills.
  skillIds?: string[];
}

// تعريف بنود تقييم المشروع
export interface ProjectCriterion {
  id: string;
  name: string;
  maxGrade: number;
}

// تعريف المادة الدراسية
export interface Subject {
  id: string;
  name: string;
  code: string;
  assessments: AssessmentItem[];
}

// تعريف درجات الطالب لمادة معينة
export interface StudentGrade {
  [assessmentId: string]: number | null; // e.g., { 'assessment-1': 10, 'assessment-2': 8 }
}

// تعريف الطالب
export interface Student {
  id: string;
  name: string;
  classId: string; // معرف الشعبة
  grades: {
    [subjectId: string]: StudentGrade;
  };
  projectEvaluations?: {
    [subjectId: string]: {
      [assessmentId: string]: {
        [criterionId: string]: {
          grade: number | null;
          comment: string;
        }
      }
    }
  };
  comments?: {
    [subjectId: string]: string;
  }
}

// تعريف الشعبة الدراسية
export interface Class {
  id:string;
  name: string;
  stage: string; // المرحلة الدراسية
  year: string; // العام الدراسي
}

// تعريف مستوى التقييم
export interface GradingLevel {
  id: string;
  name: string;
  minPercentage: number;
}


// تعريف إعدادات التطبيق
export interface AppSettings {
  schoolName: string;
  teacherName: string;
  supervisorName: string;
  managerName: string;
  schoolLogo: string | null; // base64 encoded image
  gradingLevels: GradingLevel[];
  // FIX: Added optional skills property to app settings.
  skills?: Skill[];
}

// تعريف نوع الصفحة النشطة
export type ActivePage = 'dashboard' | 'subjects' | 'students' | 'projects' | 'settings' | 'reports' | 'statistics' | 'about';