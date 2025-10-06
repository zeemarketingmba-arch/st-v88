import React, { useState, useMemo } from 'react';
import { Student, Subject, Class, AppSettings } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Icon from '../components/Icon';
import { GoogleGenAI } from "@google/genai";
import { AmiriFont } from '../utils/AmiriFont';
import { getStudentLevel } from '../utils/grading';

// It's recommended to move the API key to environment variables for security
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY is not set in environment variables. AI features will not work.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Extend the window interface for jsPDF
declare global {
  interface Window {
    jspdf: any;
  }
}

interface StudentsProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  subjects: Subject[];
  classes: Class[];
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  settings: AppSettings;
}

const Students: React.FC<StudentsProps> = ({ students, setStudents, subjects, classes, setClasses, settings }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  const [isClassModalOpen, setClassModalOpen] = useState(false);
  const [isStudentModalOpen, setStudentModalOpen] = useState(false);
  const [isAIModalOpen, setAIModalOpen] = useState(false);
  const [isEditStudentModalOpen, setEditStudentModalOpen] = useState(false);

  const [newClassName, setNewClassName] = useState('');
  const [newStudentNames, setNewStudentNames] = useState('');
  
  const [aiReport, setAiReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const selectedSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);
  const filteredStudents = useMemo(() => students.filter(s => s.classId === selectedClassId).sort((a,b) => a.name.localeCompare(b.name)), [students, selectedClassId]);

  const handleGradeChange = (studentId: string, assessmentId: string, value: string) => {
    const grade = value === '' ? null : Number(value);
    const maxGrade = selectedSubject?.assessments.find(a => a.id === assessmentId)?.maxGrade ?? 0;
    
    if (grade !== null && grade > maxGrade) {
        alert(`الدرجة لا يمكن أن تتجاوز ${maxGrade}`);
        return;
    }

    setStudents(prevStudents => prevStudents.map(student => {
      if (student.id === studentId) {
        const newGrades = { ...student.grades };
        if (!newGrades[selectedSubjectId]) {
          newGrades[selectedSubjectId] = {};
        }
        newGrades[selectedSubjectId][assessmentId] = grade;
        return { ...student, grades: newGrades };
      }
      return student;
    }));
  };
  
  const handleAddClass = () => {
    if (!newClassName) return;
    const newClass: Class = { id: `cls-${Date.now()}`, name: newClassName, stage: 'المرحلة الافتراضية', year: new Date().getFullYear().toString() };
    setClasses([...classes, newClass]);
    setNewClassName('');
    setClassModalOpen(false);
  };
  
  const handleAddStudents = () => {
    if (!newStudentNames.trim() || !selectedClassId) return;

    const names = newStudentNames.split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) return;

    const newStudents: Student[] = names.map((name, index) => ({
      id: `std-${Date.now()}-${index}`,
      name,
      classId: selectedClassId,
      grades: {}
    }));

    setStudents(prevStudents => [...prevStudents, ...newStudents]);
    setNewStudentNames('');
    setStudentModalOpen(false);
  };
  
  const handleStudentImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClassId) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("الملف غير قابل للقراءة.");

            const names = text.split('\n')
                .map(name => name.trim().replace(/,/g, '')) // Remove commas to be safe with csv
                .filter(name => name.length > 0);

            if (names.length === 0) {
                alert("لم يتم العثور على أسماء في الملف.");
                return;
            }

            const newStudents: Student[] = names.map((name, index) => ({
                id: `std-${Date.now()}-${index}`,
                name,
                classId: selectedClassId,
                grades: {}
            }));

            setStudents(prevStudents => [...prevStudents, ...newStudents]);
            alert(`تم استيراد ${newStudents.length} طالبًا بنجاح إلى الشعبة الحالية.`);

        } catch (error) {
            const err = error as Error;
            console.error("Error importing students:", err);
            alert(`فشل استيراد الطلاب: ${err.message}`);
        } finally {
            event.target.value = ''; // Reset file input
        }
    };
    reader.readAsText(file);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditStudentModalOpen(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع درجاته وبياناته بشكل نهائي.')) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
    }
  };

  const handleUpdateStudent = () => {
    if (!editingStudent) return;
    setStudents(prev => prev.map(s => s.id === editingStudent.id ? editingStudent : s));
    setEditStudentModalOpen(false);
    setEditingStudent(null);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleGenerateReport = async (student: Student) => {
    if (!selectedSubject || !API_KEY) {
        alert('يرجى التأكد من اختيار المادة وتوفر مفتاح API.');
        return;
    }

    setSelectedStudentForReport(student);
    setAIModalOpen(true);
    setIsGenerating(true);
    setAiReport('');

    const studentGrades = student.grades[selectedSubject.id] || {};
    const assessmentsText = selectedSubject.assessments.map(asm => {
        const grade = studentGrades[asm.id];
        return `- ${asm.name} (الدرجة: ${grade === null || grade === undefined ? 'لم ترصد' : grade}/${asm.maxGrade})`;
    }).join('\n');

    const prompt = `
      أنت معلم خبير ومستشار تربوي. مهمتك هي كتابة تقييم شامل وبنّاء للطالب بناءً على درجاته لتحسين مستواه.

      معلومات الطالب:
      - الاسم: ${student.name}
      - المادة: ${selectedSubject.name}

      درجات الطالب في تقييمات المادة:
      ${assessmentsText}

      المطلوب:
      1. ابدأ التقييم بمقدمة ودية ومحفزة.
      2. حلل أداء الطالب، مع ذكر نقاط القوة بناءً على الدرجات المرتفعة.
      3. حدد نقاط الضعف أو الجوانب التي تحتاج إلى تحسين بناءً على الدرجات المنخفضة.
      4. قدم نصائح عملية ومحددة للطالب لمساعدته على تحسين أدائه في الجوانب المذكورة.
      5. اختتم التقييم بعبارة تشجيعية.

      اكتب التقييم باللغة العربية، بأسلوب إيجابي وبنّاء ومناسب لوضعه في شهادة الطالب.
    `;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      setAiReport(response.text);
    } catch (error) {
      console.error("Error generating AI report:", error);
      setAiReport('عذراً، حدث خطأ أثناء إنشاء التقرير. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(aiReport);
    alert('تم نسخ التقرير إلى الحافظة!');
  };

  const getStudentTotal = (student: Student) => {
    if (!selectedSubjectId || !student.grades[selectedSubjectId]) return 0;
    return Object.values(student.grades[selectedSubjectId]).reduce((sum, grade) => sum + (grade || 0), 0);
  };

  const subjectTotalMaxGrade = useMemo(() => {
    return selectedSubject?.assessments.reduce((sum, asm) => sum + asm.maxGrade, 0) ?? 0;
  }, [selectedSubject]);

  const getStudentPercentage = (student: Student): number => {
    const total = getStudentTotal(student);
    if (subjectTotalMaxGrade === 0) return 0;
    return (total / subjectTotalMaxGrade) * 100;
  };

  const handleExportPDF = () => {
    if (!selectedClassId || !selectedSubjectId || !selectedSubject) {
      alert('الرجاء اختيار الشعبة والمادة أولاً.');
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
    doc.text(`كشف درجات مادة: ${selectedSubject.name}`, pageWidth / 2, margin + 20, { align: 'center' });
  
    const className = classes.find(c => c.id === selectedClassId)?.name || '';
    doc.setFontSize(12);
    doc.text(`للشعبة: ${className}`, pageWidth - margin, margin + 35, { align: 'right' });
    doc.text(`المعلم: ${settings.teacherName}`, margin, margin + 35, { align: 'left' });
    
    const head = [
      'المستوى',
      'النسبة',
      `المجموع\n(${subjectTotalMaxGrade})`,
      ...selectedSubject.assessments.map(asm => `${asm.name}\n(${asm.maxGrade})`).reverse(),
      'اسم الطالب'
    ];
  
    const body = filteredStudents.map(student => {
      const studentGrades = selectedSubject.assessments.map(asm => {
        const grade = student.grades[selectedSubjectId]?.[asm.id];
        return grade === null || grade === undefined ? '-' : grade.toString();
      }).reverse();
      
      const total = getStudentTotal(student);
      const percentage = getStudentPercentage(student);
      const level = getStudentLevel(percentage, settings.gradingLevels);

      return [
        level,
        subjectTotalMaxGrade > 0 ? `${percentage.toFixed(1)}%` : '-',
        total.toString(),
        ...studentGrades,
        student.name
      ];
    });
  
    (doc as any).autoTable({
      startY: margin + 45,
      head: [head],
      body: body,
      theme: 'grid',
      styles: {
        font: 'Amiri',
        halign: 'center',
        cellPadding: 2,
        fontSize: 10,
      },
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        [head.length - 1]: { halign: 'right' },
      },
      didDrawPage: (data: any) => {
        const pageCount = doc.internal.pages.length;
        doc.setFontSize(10);
        doc.text(`صفحة ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, pageHeight - 10);
        doc.text(`تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}`, pageWidth - data.settings.margin.right, pageHeight - 10, { align: 'right' });
      }
    });
  
    doc.save(`grades-${selectedSubject.name.replace(' ', '_')}-${className.replace(' ', '_')}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="print-header">
         {settings.schoolLogo && <img src={settings.schoolLogo} alt="شعار المدرسة" className="h-20" />}
         <div className="text-center">
             <h1 className="text-2xl font-bold">{settings.schoolName}</h1>
             <h2 className="text-xl">كشف درجات مادة: {selectedSubject?.name}</h2>
             <p>للشعبة: {classes.find(c => c.id === selectedClassId)?.name}</p>
         </div>
         <div className="text-sm text-left">
             <p>المعلم: {settings.teacherName}</p>
             <p>التاريخ: {new Date().toLocaleString('ar-EG')}</p>
         </div>
      </div>

      <div className="flex justify-between items-center no-print">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600">
          الطلاب والتقييم
        </h2>
        <div className="flex gap-2">
            <Button onClick={handleExportPDF} icon="download" disabled={!selectedClassId || !selectedSubjectId}>تصدير PDF</Button>
            <Button onClick={handlePrint} icon="print" disabled={!selectedClassId || !selectedSubjectId}>طباعة الكشف</Button>
        </div>
      </div>

      <Card className="no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
          <div>
            <Button onClick={() => setClassModalOpen(true)} variant="secondary" className="w-full">إدارة الشعب</Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStudentModalOpen(true)} icon="add" disabled={!selectedClassId} className="flex-1">إضافة طالب</Button>
            <label className="cursor-pointer" title="استيراد طلاب من ملف نصي">
                <div 
                    className={`h-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${!selectedClassId ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' : 'bg-light-bg dark:bg-dark-bg shadow-neumorphism-light dark:shadow-neumorphism-dark hover:shadow-neumorphism-light-inset dark:hover:shadow-neumorphism-dark-inset'}`}
                >
                    <Icon name="upload" className="w-5 h-5" />
                </div>
                <input 
                    type="file" 
                    className="hidden" 
                    accept=".txt,.csv" 
                    onChange={handleStudentImport}
                    disabled={!selectedClassId}
                />
            </label>
          </div>
        </div>
      </Card>

      {selectedClassId && selectedSubjectId && (
        <Card className="printable-area">
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="border-b-2 border-gray-300 dark:border-gray-600">
                <tr>
                  <th className="p-3">اسم الطالب</th>
                  {selectedSubject?.assessments.map(asm => (
                    <th key={asm.id} className="p-3">{asm.name} ({asm.maxGrade})</th>
                  ))}
                  <th className="p-3">المجموع ({subjectTotalMaxGrade})</th>
                  <th className="p-3">النسبة</th>
                  <th className="p-3">المستوى</th>
                  <th className="p-3 no-print">تقييم AI</th>
                  <th className="p-3 no-print">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const total = getStudentTotal(student);
                  const percentage = getStudentPercentage(student);
                  const level = getStudentLevel(percentage, settings.gradingLevels);
                  return (
                  <tr key={student.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <td className="p-2 font-semibold text-right">{student.name}</td>
                    {selectedSubject?.assessments.map(asm => (
                      <td key={asm.id} className="p-2">
                        <input
                          type="number"
                          step="0.5"
                          value={student.grades[selectedSubjectId]?.[asm.id] ?? ''}
                          onChange={e => handleGradeChange(student.id, asm.id, e.target.value)}
                          max={asm.maxGrade}
                          min={0}
                          className="w-20 text-center bg-light-bg dark:bg-dark-bg rounded-md p-1 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2 font-bold">{total}</td>
                    <td className="p-2 font-semibold">{subjectTotalMaxGrade > 0 ? `${percentage.toFixed(1)}%` : '-'}</td>
                    <td className="p-2 font-semibold">{level}</td>
                    <td className="p-2 no-print">
                      <button onClick={() => handleGenerateReport(student)} className="p-2 rounded-full hover:shadow-neumorphism-light dark:hover:shadow-neumorphism-dark text-light-primary dark:text-dark-primary" title="إنشاء تقرير بالذكاء الاصطناعي">
                        <Icon name="sparkles" className="w-5 h-5"/>
                      </button>
                    </td>
                    <td className="p-2 no-print">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEditStudent(student)} className="p-2 rounded-full hover:shadow-neumorphism-light dark:hover:shadow-neumorphism-dark text-blue-500" title="تعديل الطالب">
                            <Icon name="edit" className="w-5 h-5"/>
                        </button>
                        <button onClick={() => handleDeleteStudent(student.id)} className="p-2 rounded-full hover:shadow-neumorphism-light dark:hover:shadow-neumorphism-dark text-red-500" title="حذف الطالب">
                            <Icon name="delete" className="w-5 h-5"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={isClassModalOpen} onClose={() => setClassModalOpen(false)} title="إدارة الشعب">
        <div className="space-y-4">
          <ul className="space-y-2">
            {classes.map(c => <li key={c.id} className="p-2 bg-light-bg dark:bg-dark-bg rounded-lg shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset">{c.name}</li>)}
          </ul>
          <Input label="اسم الشعبة الجديدة" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setClassModalOpen(false)} variant="secondary">إغلاق</Button>
            <Button onClick={handleAddClass}>إضافة شعبة</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isStudentModalOpen} onClose={() => setStudentModalOpen(false)} title="إضافة طلاب جدد">
        <div className="space-y-4">
          <div>
            <label htmlFor="student-names" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              أسماء الطلاب (كل اسم في سطر)
            </label>
            <textarea
                id="student-names"
                rows={10}
                value={newStudentNames}
                onChange={e => setNewStudentNames(e.target.value)}
                placeholder={"أحمد محمد\nفاطمة علي\nيوسف خالد"}
                className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary transition-all"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setStudentModalOpen(false)} variant="secondary">إلغاء</Button>
            <Button onClick={handleAddStudents}>إضافة الطلاب</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAIModalOpen} onClose={() => setAIModalOpen(false)} title={`تقرير الذكاء الاصطناعي للطالب: ${selectedStudentForReport?.name}`}>
        <div className="space-y-4">
          {isGenerating ? (
            <div className="flex items-center justify-center h-40">
              <p>جارٍ إنشاء التقرير...</p>
            </div>
          ) : (
            <textarea
              value={aiReport}
              onChange={(e) => setAiReport(e.target.value)}
              rows={10}
              className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary transition-all"
            />
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setAIModalOpen(false)} variant="secondary">إغلاق</Button>
            <Button onClick={handleCopyReport} disabled={isGenerating || !aiReport}>نسخ التقرير</Button>
          </div>
        </div>
      </Modal>
      
      <Modal isOpen={isEditStudentModalOpen} onClose={() => setEditStudentModalOpen(false)} title="تعديل بيانات الطالب">
        {editingStudent && (
          <div className="space-y-4">
            <Input 
              label="اسم الطالب" 
              value={editingStudent.name} 
              onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} 
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={() => setEditStudentModalOpen(false)} variant="secondary">إلغاء</Button>
              <Button onClick={handleUpdateStudent}>حفظ التعديلات</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Students;