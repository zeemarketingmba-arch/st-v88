import React, { useState, useMemo, useEffect } from 'react';
import { Student, Subject, Class, AppSettings } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import { AmiriFont } from '../utils/AmiriFont';
import { getStudentLevel } from '../utils/grading';

declare global {
  interface Window {
    jspdf: any;
  }
}

interface ReportsProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  subjects: Subject[];
  classes: Class[];
  settings: AppSettings;
}

type ReportType = 'class_grades' | 'student_report_card';

const Reports: React.FC<ReportsProps> = ({ students, setStudents, subjects, classes, settings }) => {
  const [reportType, setReportType] = useState<ReportType>('class_grades');
  
  // State for Class Grades report
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // State for Student Report Card
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentComments, setStudentComments] = useState<{ [subjectId: string]: string }>({});

  const selectedSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);
  const filteredStudentsByClass = useMemo(() => students.filter(s => s.classId === selectedClassId).sort((a,b) => a.name.localeCompare(b.name)), [students, selectedClassId]);
  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  // Effect to load student comments when a student is selected for the report card
  useEffect(() => {
    if (reportType === 'student_report_card' && selectedStudent) {
      setStudentComments(selectedStudent.comments || {});
    }
  }, [selectedStudent, reportType]);
  
  // Reset selections when report type changes
  useEffect(() => {
    setSelectedClassId('');
    setSelectedSubjectId('');
    setSelectedStudentId('');
    setStudentComments({});
  }, [reportType]);

  // Calculations for Class Grades Report
  const subjectTotalMaxGrade = useMemo(() => {
    return selectedSubject?.assessments.reduce((sum, asm) => sum + asm.maxGrade, 0) ?? 0;
  }, [selectedSubject]);

  const getStudentTotalForSubject = (student: Student, subjectId: string) => {
    if (!subjectId || !student.grades[subjectId]) return { total: 0, maxGrade: 0 };
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return { total: 0, maxGrade: 0 };
    
    const total = Object.values(student.grades[subjectId]).reduce((sum, grade) => sum + (grade || 0), 0);
    const maxGrade = subject.assessments.reduce((sum, asm) => sum + asm.maxGrade, 0);
    return { total, maxGrade };
  };

  const handleSaveComments = () => {
    if (!selectedStudentId) return;
    setStudents(prev => prev.map(student => {
      if (student.id === selectedStudentId) {
        return { ...student, comments: studentComments };
      }
      return student;
    }));
    alert('تم حفظ التعليقات بنجاح!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (reportType === 'class_grades') {
      exportClassGradesPDF();
    } else if (reportType === 'student_report_card') {
      exportStudentReportCardPDF();
    }
  };

  const exportClassGradesPDF = () => {
    if (!selectedClassId || !selectedSubjectId || !selectedSubject) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.addFileToVFS('Amiri-Regular.ttf', AmiriFont);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setR2L(true);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    if (settings.schoolLogo) doc.addImage(settings.schoolLogo, 'PNG', pageWidth - margin - 20, margin, 20, 20);
    doc.setFontSize(18).text(settings.schoolName, pageWidth / 2, margin + 10, { align: 'center' });
    doc.setFontSize(14).text(`تقرير درجات مادة: ${selectedSubject.name}`, pageWidth / 2, margin + 20, { align: 'center' });
    const className = classes.find(c => c.id === selectedClassId)?.name || '';
    doc.setFontSize(12);
    doc.text(`للشعبة: ${className}`, pageWidth - margin, margin + 35, { align: 'right' });
    doc.text(`المعلم: ${settings.teacherName}`, margin, margin + 35, { align: 'left' });
    const head = ['المستوى', 'النسبة', `المجموع (${subjectTotalMaxGrade})`, 'اسم الطالب', 'م'];
    const body = filteredStudentsByClass.map((student, index) => {
      const { total, maxGrade } = getStudentTotalForSubject(student, selectedSubjectId);
      const percentage = maxGrade > 0 ? (total / maxGrade) * 100 : 0;
      const level = getStudentLevel(percentage, settings.gradingLevels);
      return [level, `${percentage.toFixed(1)}%`, total.toString(), student.name, (index + 1).toString()];
    });
    (doc as any).autoTable({
      startY: margin + 45, head: [head.reverse()], body: body.map(row => row.reverse()), theme: 'grid', styles: { font: 'Amiri', halign: 'center', cellPadding: 2, fontSize: 10 }, headStyles: { fillColor: [44, 62, 80], textColor: 255 }, columnStyles: { 1: { halign: 'right' } },
      didDrawPage: (data: any) => {
        doc.setFontSize(10).text(`صفحة ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, pageHeight - 10).text(`تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}`, pageWidth - data.settings.margin.right, pageHeight - 10, { align: 'right' });
      }
    });
    doc.save(`report-${selectedSubject.name.replace(' ', '_')}.pdf`);
  };

  const exportStudentReportCardPDF = () => {
    if (!selectedStudent) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.addFileToVFS('Amiri-Regular.ttf', AmiriFont);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setR2L(true);
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Header
    if (settings.schoolLogo) doc.addImage(settings.schoolLogo, 'PNG', margin, margin, 20, 20);
    doc.setFontSize(20).text(settings.schoolName, pageWidth / 2, margin + 8, { align: 'center' });
    doc.setFontSize(16).text('بطاقة تقرير أداء الطالب', pageWidth / 2, margin + 18, { align: 'center' });

    // Student Info
    doc.setFontSize(12);
    const studentClass = classes.find(c => c.id === selectedStudent.classId);
    doc.text(`اسم الطالب: ${selectedStudent.name}`, pageWidth - margin, margin + 35, { align: 'right' });
    doc.text(`الشعبة: ${studentClass?.name || 'غير محدد'}`, pageWidth - margin, margin + 42, { align: 'right' });
    doc.text(`العام الدراسي: ${studentClass?.year || new Date().getFullYear()}`, margin, margin + 35, { align: 'left' });

    // Performance Table
    const head = [['تعليق المعلم', 'المستوى', 'النسبة', 'الدرجة', 'المادة']];
    const body = subjects.map(subject => {
      const { total, maxGrade } = getStudentTotalForSubject(selectedStudent, subject.id);
      if (maxGrade === 0) return null; // Don't show subjects with no assessments
      const percentage = (total / maxGrade) * 100;
      const level = getStudentLevel(percentage, settings.gradingLevels);
      return [studentComments[subject.id] || '-', level, `${percentage.toFixed(1)}%`, `${total} / ${maxGrade}`, subject.name];
    }).filter(row => row !== null);
    
    (doc as any).autoTable({
      startY: margin + 50, head, body: body.map(row => (row as string[]).reverse()), theme: 'grid', styles: { font: 'Amiri', halign: 'center', fontSize: 10 }, headStyles: { fillColor: [44, 62, 80], textColor: 255 },
      columnStyles: { 0: { cellWidth: 60, halign: 'right' }, 4: { halign: 'right' } }
    });
    
    let finalY = (doc as any).lastAutoTable.finalY + 15;

    // Summary
    const overall = body.reduce((acc, row) => {
        if(row) {
            acc.totalPercentage += parseFloat(row[2]);
            acc.count++;
        }
        return acc;
    }, { totalPercentage: 0, count: 0});
    const overallAvg = overall.count > 0 ? overall.totalPercentage / overall.count : 0;
    doc.setFontSize(12);
    doc.text(`متوسط الأداء العام: ${overallAvg.toFixed(1)}%`, pageWidth-margin, finalY, {align: 'right'});
    doc.text(`المستوى العام: ${getStudentLevel(overallAvg, settings.gradingLevels)}`, pageWidth-margin, finalY+7, {align: 'right'});

    // Signatures
    finalY += 30;
    doc.text('توقيع المعلم', pageWidth - margin - 20, finalY, { align: 'center' });
    doc.text('توقيع المشرف', pageWidth / 2, finalY, { align: 'center' });
    doc.text('توقيع المدير', margin + 20, finalY, { align: 'center' });
    doc.text('___________________', pageWidth - margin - 20, finalY + 2, { align: 'center' });
    doc.text('___________________', pageWidth / 2, finalY + 2, { align: 'center' });
    doc.text('___________________', margin + 20, finalY + 2, { align: 'center' });


    doc.save(`report-card-${selectedStudent.name.replace(' ', '_')}.pdf`);
  };

  const renderClassGradesReport = () => (
    <>
    <Card className="no-print">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">اختر الشعبة</label>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none">
            <option value="">-- اختر شعبة --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">اختر المادة</label>
          <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none">
            <option value="">-- اختر مادة --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
    </Card>

    {selectedClassId && selectedSubjectId && (
      <Card className="printable-area">
        <div className="print-header">
           {settings.schoolLogo && <img src={settings.schoolLogo} alt="شعار المدرسة" className="h-20" />}
           <div className="text-center">
               <h1 className="text-2xl font-bold">{settings.schoolName}</h1>
               <h2 className="text-xl">تقرير درجات مادة: {selectedSubject?.name}</h2>
               <p>للشعبة: {classes.find(c => c.id === selectedClassId)?.name}</p>
           </div>
           <div className="text-sm text-left">
               <p>المعلم: {settings.teacherName}</p>
               <p>التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
           </div>
        </div>
        <h3 className="text-2xl font-bold text-center mb-6 no-print">تقرير شعبة: {classes.find(c => c.id === selectedClassId)?.name} - مادة: {selectedSubject?.name}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead className="border-b-2 border-gray-300 dark:border-gray-600">
              <tr>
                <th className="p-3">م</th>
                <th className="p-3 text-right">اسم الطالب</th>
                <th className="p-3">المجموع ({subjectTotalMaxGrade})</th>
                <th className="p-3">النسبة</th>
                <th className="p-3">المستوى</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudentsByClass.map((student, index) => {
                const { total, maxGrade } = getStudentTotalForSubject(student, selectedSubjectId);
                const percentage = maxGrade > 0 ? (total / maxGrade) * 100 : 0;
                const level = getStudentLevel(percentage, settings.gradingLevels);
                return (
                <tr key={student.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 font-semibold text-right">{student.name}</td>
                  <td className="p-2 font-bold">{total}</td>
                  <td className="p-2 font-semibold">{`${percentage.toFixed(1)}%`}</td>
                  <td className="p-2 font-semibold">{level}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </Card>
    )}
    </>
  );
  
  const renderStudentReportCard = () => (
    <>
      <Card className="no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">اختر الشعبة</label>
            <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedStudentId(''); }} className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none">
              <option value="">-- اختر شعبة --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">اختر الطالب</label>
            <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none" disabled={!selectedClassId}>
              <option value="">-- اختر طالبًا --</option>
              {filteredStudentsByClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </Card>
      
      {selectedStudent && (
        <Card className="printable-area">
          <div className="print-header flex-col items-center gap-2">
            <div className="flex justify-between items-center w-full">
              {settings.schoolLogo && <img src={settings.schoolLogo} alt="شعار المدرسة" className="h-20" />}
              <div className="text-center">
                  <h1 className="text-2xl font-bold">{settings.schoolName}</h1>
                  <h2 className="text-xl">بطاقة تقرير أداء الطالب</h2>
              </div>
              <div className="w-20"></div> {/* Spacer */}
            </div>
            <div className="flex justify-between w-full text-sm mt-2">
              <span>الطالب: {selectedStudent.name}</span>
              <span>الشعبة: {classes.find(c => c.id === selectedStudent.classId)?.name}</span>
              <span>التاريخ: {new Date().toLocaleDateString('ar-EG')}</span>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-center mb-6 no-print">بطاقة تقرير الطالب: {selectedStudent.name}</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-gray-300 dark:border-gray-600">
                <tr>
                  <th className="p-3 text-right">المادة</th>
                  <th className="p-3">الدرجة</th>
                  <th className="p-3">النسبة</th>
                  <th className="p-3">المستوى</th>
                  <th className="p-3 text-right">تعليق المعلم</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(subject => {
                  const { total, maxGrade } = getStudentTotalForSubject(selectedStudent, subject.id);
                  if (maxGrade === 0) return null; // Hide subjects with no grades
                  const percentage = (total / maxGrade) * 100;
                  const level = getStudentLevel(percentage, settings.gradingLevels);
                  return (
                    <tr key={subject.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-2 font-semibold text-right">{subject.name}</td>
                      <td className="p-2 text-center font-bold">{total} / {maxGrade}</td>
                      <td className="p-2 text-center font-semibold">{percentage.toFixed(1)}%</td>
                      <td className="p-2 text-center font-semibold">{level}</td>
                      <td className="p-2">
                        <textarea 
                          value={studentComments[subject.id] || ''}
                          onChange={e => setStudentComments(prev => ({...prev, [subject.id]: e.target.value}))}
                          className="no-print w-full bg-light-bg dark:bg-dark-bg rounded-md p-1 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none"
                          rows={2}
                          placeholder="أضف تعليقًا..."
                        />
                         <p className="hidden print:block">{studentComments[subject.id]}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end no-print">
            <Button onClick={handleSaveComments} icon="save">حفظ التعليقات</Button>
          </div>
        </Card>
      )}
    </>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600">
          التقارير
        </h2>
        <div className="flex gap-2">
            <Button onClick={handleExportPDF} icon="download" disabled={(reportType === 'class_grades' && (!selectedClassId || !selectedSubjectId)) || (reportType === 'student_report_card' && !selectedStudentId)}>تصدير PDF</Button>
            <Button onClick={handlePrint} icon="print" disabled={(reportType === 'class_grades' && (!selectedClassId || !selectedSubjectId)) || (reportType === 'student_report_card' && !selectedStudentId)}>طباعة التقرير</Button>
        </div>
      </div>

      <Card className="no-print">
        <div>
          <label className="block text-sm font-medium mb-2">اختر نوع التقرير</label>
          <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none">
            <option value="class_grades">كشف درجات الشعبة</option>
            <option value="student_report_card">بطاقة تقرير الطالب</option>
          </select>
        </div>
      </Card>
      
      {reportType === 'class_grades' ? renderClassGradesReport() : renderStudentReportCard()}

    </div>
  );
};

export default Reports;