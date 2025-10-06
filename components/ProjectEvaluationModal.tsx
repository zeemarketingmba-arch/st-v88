import React, { useState, useEffect, useMemo } from 'react';
import { Student, AssessmentItem, AppSettings } from '../types';
import Modal from './Modal';
import Button from './Button';
import Icon from './Icon';
import { AmiriFont } from '../utils/AmiriFont';

declare global {
  interface Window {
    jspdf: any;
  }
}

interface ProjectEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  assessment: AssessmentItem;
  subjectId: string;
  settings: AppSettings;
  onSave: (
    studentIds: string[],
    subjectId: string,
    assessmentId: string,
    evaluations: { [criterionId: string]: { grade: number | null; comment: string; } },
    totalScore: number
  ) => void;
}

const ProjectEvaluationModal: React.FC<ProjectEvaluationModalProps> = ({ isOpen, onClose, students, assessment, subjectId, settings, onSave }) => {
  const [evaluations, setEvaluations] = useState<{ [criterionId: string]: { grade: number | null; comment: string; } }>({});
  
  useEffect(() => {
    if (students.length === 1) { // Load single student's data
        const student = students[0];
        const initialEvals = assessment.projectCriteria?.reduce((acc, criterion) => {
          const existingEval = student.projectEvaluations?.[subjectId]?.[assessment.id]?.[criterion.id];
          acc[criterion.id] = {
            grade: existingEval?.grade ?? null,
            comment: existingEval?.comment ?? '',
          };
          return acc;
        }, {} as typeof evaluations);
        setEvaluations(initialEvals || {});
    } else { // Reset for group evaluation
        const initialEvals = assessment.projectCriteria?.reduce((acc, criterion) => {
            acc[criterion.id] = { grade: null, comment: '' };
            return acc;
        }, {} as typeof evaluations);
        setEvaluations(initialEvals || {});
    }
  }, [students, assessment, subjectId, isOpen]);

  const totalScore = useMemo(() => {
    return Object.values(evaluations).reduce((sum: number, current: { grade: number | null; comment: string }) => {
      return sum + (Number(current.grade) || 0);
    }, 0);
  }, [evaluations]);

  const handleEvalChange = (criterionId: string, field: 'grade' | 'comment', value: string | number) => {
    setEvaluations(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        [field]: value
      }
    }));
  };

  const handleGradeBlur = (criterionId: string, maxGrade: number) => {
    const currentGrade = evaluations[criterionId].grade;
    if (currentGrade !== null && currentGrade > maxGrade) {
      alert(`الدرجة لا يمكن أن تتجاوز ${maxGrade}`);
      handleEvalChange(criterionId, 'grade', maxGrade);
    }
  };

  const handleSave = () => {
    onSave(students.map(s => s.id), subjectId, assessment.id, evaluations, totalScore);
    onClose();
  };

  const handleExportPDF = () => {
    const student = students[0]; // PDF is for single student view
    if (!student) return;
  
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    doc.addFileToVFS('Amiri-Regular.ttf', AmiriFont);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri');
    doc.setR2L(true);
  
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
  
    if (settings.schoolLogo) {
      doc.addImage(settings.schoolLogo, 'PNG', pageWidth - margin - 20, margin, 20, 20);
    }
    doc.setFontSize(18);
    doc.text(settings.schoolName, pageWidth / 2, margin + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`تقرير تقييم مشروع: ${assessment.name}`, pageWidth / 2, margin + 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`الطالب: ${student.name}`, pageWidth - margin, margin + 35, { align: 'right' });
    doc.text(`المعلم: ${settings.teacherName}`, margin, margin + 35, { align: 'left' });

    const head = ['وصف التقييم (تعليق المعلم)', 'الدرجة', 'البند'];
    const body = assessment.projectCriteria?.map(criterion => {
        const evaluation = evaluations[criterion.id];
        return [
            evaluation?.comment || '-',
            `${evaluation?.grade ?? '-'} / ${criterion.maxGrade}`,
            criterion.name,
        ]
    }) || [];

    (doc as any).autoTable({
        startY: margin + 45,
        head: [head],
        body: body,
        theme: 'grid',
        styles: { font: 'Amiri', halign: 'center', cellPadding: 2, fontSize: 11 },
        headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 
            [head.length - 1]: { halign: 'right' },
            0: { halign: 'right' },
         },
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(14);
    doc.setFont('Amiri', 'bold');
    doc.text(`المجموع النهائي: ${totalScore} / ${assessment.maxGrade}`, pageWidth - margin, finalY + 15, { align: 'right' });
  
    doc.save(`project-${student.name.replace(' ', '_')}.pdf`);
  };

  const modalTitle = students.length > 1 
    ? `تقييم جماعي لـ ${students.length} طلاب`
    : `تقييم مشروع: ${assessment.name} للطالب: ${students[0]?.name}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
        {assessment.projectCriteria?.map(criterion => (
          <div key={criterion.id} className="p-3 rounded-lg bg-light-bg dark:bg-dark-bg shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">{criterion.name}</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={evaluations[criterion.id]?.grade ?? ''}
                  onChange={e => handleEvalChange(criterion.id, 'grade', e.target.value === '' ? null : Number(e.target.value))}
                  onBlur={() => handleGradeBlur(criterion.id, criterion.maxGrade)}
                  max={criterion.maxGrade}
                  min={0}
                  className="w-24 text-center bg-light-bg dark:bg-dark-bg rounded-md p-1 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none"
                />
                <span className="font-semibold text-gray-600 dark:text-gray-400">/ {criterion.maxGrade}</span>
              </div>
            </div>
            <textarea
              value={evaluations[criterion.id]?.comment ?? ''}
              onChange={e => handleEvalChange(criterion.id, 'comment', e.target.value)}
              placeholder="اكتب وصفًا أو تعليقًا للتقييم هنا..."
              rows={2}
              className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-2 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none"
            />
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 rounded-lg bg-light-bg dark:bg-dark-bg shadow-neumorphism-light dark:shadow-neumorphism-dark flex justify-between items-center">
        <h3 className="text-xl font-bold">المجموع:</h3>
        <p className="text-2xl font-bold text-light-primary dark:text-dark-primary">{totalScore} / {assessment.maxGrade}</p>
      </div>
      <div className="flex justify-end gap-4 pt-6">
        {students.length === 1 && <Button onClick={handleExportPDF} icon="download" variant="secondary">تصدير PDF</Button>}
        <Button onClick={onClose} variant="secondary">إلغاء</Button>
        <Button onClick={handleSave} icon="save">حفظ التقييم</Button>
      </div>
    </Modal>
  );
};

export default ProjectEvaluationModal;