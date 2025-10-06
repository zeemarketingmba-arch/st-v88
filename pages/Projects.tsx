import React, { useState, useMemo } from 'react';
import { Student, Subject, Class, AppSettings, AssessmentItem } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import ProjectEvaluationModal from '../components/ProjectEvaluationModal';
import Icon from '../components/Icon';
import { getStudentLevel } from '../utils/grading';
import { AmiriFont } from '../utils/AmiriFont';

interface ProjectsProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  subjects: Subject[];
  classes: Class[];
  settings: AppSettings;
}

const Projects: React.FC<ProjectsProps> = ({ students, setStudents, subjects, classes, settings }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  const [evalModalState, setEvalModalState] = useState<{
    isOpen: boolean;
    studentsToEvaluate: Student[];
    assessment: AssessmentItem | null;
  }>({ isOpen: false, studentsToEvaluate: [], assessment: null });

  const projectAssessments = useMemo(() => {
    if (!selectedSubjectId) return [];
    const subject = subjects.find(s => s.id === selectedSubjectId);
    return subject?.assessments.filter(asm => asm.isProject) || [];
  }, [subjects, selectedSubjectId]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClassId).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClassId]);

  const selectedAssessment = useMemo(() => {
    return projectAssessments.find(a => a.id === selectedAssessmentId);
  }, [projectAssessments, selectedAssessmentId]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const openEvaluationModal = (studentsToEvaluate: Student[]) => {
    if (studentsToEvaluate.length === 0 || !selectedAssessmentId) {
      alert('الرجاء اختيار طالب ومشروع للتقييم.');
      return;
    }
    const assessment = projectAssessments.find(a => a.id === selectedAssessmentId);
    if (assessment) {
      setEvalModalState({ isOpen: true, studentsToEvaluate, assessment });
    }
  };

  const handleSaveProjectEvaluation = (
    studentIds: string[],
    subjectId: string,
    assessmentId: string,
    evaluations: { [criterionId: string]: { grade: number | null; comment: string; } },
    totalScore: number
  ) => {
    setStudents(prevStudents => prevStudents.map(student => {
      if (studentIds.includes(student.id)) {
        const updatedStudent = { ...student };
        
        if (!updatedStudent.projectEvaluations) updatedStudent.projectEvaluations = {};
        if (!updatedStudent.projectEvaluations[subjectId]) updatedStudent.projectEvaluations[subjectId] = {};
        updatedStudent.projectEvaluations[subjectId][assessmentId] = evaluations;

        if (!updatedStudent.grades[subjectId]) updatedStudent.grades[subjectId] = {};
        updatedStudent.grades[subjectId][assessmentId] = totalScore;

        return updatedStudent;
      }
      return student;
    }));
  };
  
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!selectedClassId || !selectedSubjectId || !selectedAssessment) {
      alert('الرجاء اختيار الشعبة والمادة والمشروع أولاً.');
      return;
    }
  
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    doc.addFileToVFS('Amiri-Regular.ttf', AmiriFont);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri');
    doc.setR2L(true);
  
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
  
    if (settings.schoolLogo) {
      doc.addImage(settings.schoolLogo, 'PNG', pageWidth - margin - 20, margin, 20, 20);
    }
    doc.setFontSize(18);
    doc.text(settings.schoolName, pageWidth / 2, margin + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`تقرير تقييم مشروع: ${selectedAssessment.name}`, pageWidth / 2, margin + 20, { align: 'center' });
  
    const className = classes.find(c => c.id === selectedClassId)?.name || '';
    const subjectName = subjects.find(s => s.id === selectedSubjectId)?.name || '';
    doc.setFontSize(12);
    doc.text(`للشعبة: ${className}`, pageWidth - margin, margin + 35, { align: 'right' });
    doc.text(`المادة: ${subjectName}`, pageWidth - margin, margin + 42, { align: 'right' });
    doc.text(`المعلم: ${settings.teacherName}`, margin, margin + 35, { align: 'left' });
    
    const head = ['م', 'اسم الطالب', `الدرجة (${selectedAssessment.maxGrade})`, 'النسبة', 'المستوى'];
  
    const body = filteredStudents.map((student, index) => {
      const grade = student.grades[selectedSubjectId]?.[selectedAssessmentId] ?? null;
      const percentage = (grade !== null && selectedAssessment.maxGrade > 0) ? (grade / selectedAssessment.maxGrade) * 100 : 0;
      const level = getStudentLevel(percentage, settings.gradingLevels);

      return [
        (index + 1).toString(),
        student.name,
        grade !== null ? grade.toString() : '-',
        `${percentage.toFixed(1)}%`,
        level,
      ];
    });
  
    (doc as any).autoTable({
      startY: margin + 50,
      head: [head.reverse()],
      body: body.map(row => row.reverse()),
      theme: 'grid',
      styles: { font: 'Amiri', halign: 'center', cellPadding: 2, fontSize: 10 },
      headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } }, // Student name column
      didDrawPage: (data: any) => {
        doc.setFontSize(10);
        doc.text(`صفحة ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, pageHeight - 10);
        doc.text(`تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}`, pageWidth - data.settings.margin.right, pageHeight - 10, { align: 'right' });
      }
    });
  
    doc.save(`project-report-${selectedAssessment.name.replace(/ /g, '_')}-${className.replace(/ /g, '_')}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="print-header">
         {settings.schoolLogo && <img src={settings.schoolLogo} alt="شعار المدرسة" className="h-20" />}
         <div className="text-center">
             <h1 className="text-2xl font-bold">{settings.schoolName}</h1>
             <h2 className="text-xl">تقرير تقييم مشروع: {selectedAssessment?.name}</h2>
             <p>للشعبة: {classes.find(c => c.id === selectedClassId)?.name} - المادة: {subjects.find(s => s.id === selectedSubjectId)?.name}</p>
         </div>
         <div className="text-sm text-left">
             <p>المعلم: {settings.teacherName}</p>
             <p>التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
         </div>
      </div>

      <div className="flex justify-between items-center no-print">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600">
          تقييم المشاريع
        </h2>
        <div className="flex gap-2">
            <Button onClick={handleExportPDF} icon="download" disabled={!selectedClassId || !selectedSubjectId || !selectedAssessmentId}>تصدير PDF</Button>
            <Button onClick={handlePrint} icon="print" disabled={!selectedClassId || !selectedSubjectId || !selectedAssessmentId}>طباعة التقرير</Button>
        </div>
      </div>

      <Card className="no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">اختر الشعبة</label>
            <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedStudentIds([]); }} className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none">
              <option value="">-- اختر شعبة --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">اختر المادة</label>
            <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none" disabled={!selectedClassId}>
              <option value="">-- اختر مادة --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">اختر المشروع</label>
            <select value={selectedAssessmentId} onChange={e => setSelectedAssessmentId(e.target.value)} className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none" disabled={!selectedSubjectId || projectAssessments.length === 0}>
              <option value="">{projectAssessments.length > 0 ? '-- اختر مشروع --' : 'لا توجد مشاريع'}</option>
              {projectAssessments.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {selectedClassId && selectedSubjectId && selectedAssessmentId && (
        <Card className="printable-area">
          <div className="flex justify-between items-center mb-4 no-print">
            <h3 className="text-2xl font-semibold">قائمة الطلاب</h3>
            <Button 
              onClick={() => openEvaluationModal(students.filter(s => selectedStudentIds.includes(s.id)))}
              disabled={selectedStudentIds.length === 0}
            >
              تقييم الطلاب المحددين ({selectedStudentIds.length})
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="border-b-2 border-gray-300 dark:border-gray-600">
                <tr>
                  <th className="p-3 w-10 no-print">
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}/>
                  </th>
                  <th className="p-3 text-right">اسم الطالب</th>
                  <th className="p-3">درجة المشروع</th>
                  <th className="p-3 no-print">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <td className="p-2 no-print">
                      <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => handleStudentSelect(student.id)} />
                    </td>
                    <td className="p-2 font-semibold text-right">{student.name}</td>
                    <td className="p-2 font-bold text-lg text-light-primary dark:text-dark-primary">
                      {student.grades[selectedSubjectId]?.[selectedAssessmentId] ?? '-'}
                      <span className="text-sm text-gray-500"> / {selectedAssessment?.maxGrade}</span>
                    </td>
                    <td className="p-2 no-print">
                      <Button onClick={() => openEvaluationModal([student])} variant="secondary" className="px-4 py-2 text-sm">
                        <Icon name="edit" className="w-4 h-4 mr-1"/> تقييم
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {evalModalState.isOpen && evalModalState.assessment && (
        <ProjectEvaluationModal
          isOpen={evalModalState.isOpen}
          onClose={() => setEvalModalState({ isOpen: false, studentsToEvaluate: [], assessment: null })}
          students={evalModalState.studentsToEvaluate}
          assessment={evalModalState.assessment}
          subjectId={selectedSubjectId}
          settings={settings}
          onSave={handleSaveProjectEvaluation}
        />
      )}
    </div>
  );
};

export default Projects;