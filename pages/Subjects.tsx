import React, { useState } from 'react';
import { Subject, AssessmentItem, ProjectCriterion } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Icon from '../components/Icon';

interface SubjectsProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
}

const Subjects: React.FC<SubjectsProps> = ({ subjects, setSubjects }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  
  // فتح المودال لإضافة مادة جديدة
  const handleAddSubject = () => {
    setCurrentSubject({ id: '', name: '', code: '', assessments: [] });
    setIsModalOpen(true);
  };
  
  // فتح المودال لتعديل مادة موجودة
  const handleEditSubject = (subject: Subject) => {
    setCurrentSubject(JSON.parse(JSON.stringify(subject))); // Deep copy to avoid mutation
    setIsModalOpen(true);
  };

  // حذف مادة
  const handleDeleteSubject = (subjectId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المادة؟ سيتم حذف جميع تقييماتها.')) {
      setSubjects(subjects.filter(s => s.id !== subjectId));
    }
  };

  // حفظ المادة (إضافة أو تعديل)
  const handleSaveSubject = () => {
    if (!currentSubject || !currentSubject.name) return;

    // Recalculate max grades for any projects before saving
    const finalSubject = {
      ...currentSubject,
      assessments: currentSubject.assessments.map(asm => {
        if (asm.isProject && asm.projectCriteria) {
          return {
            ...asm,
            maxGrade: asm.projectCriteria.reduce((sum, crit) => sum + Number(crit.maxGrade || 0), 0),
          };
        }
        return asm;
      }),
    };
    
    if (finalSubject.id) { // تعديل
      setSubjects(subjects.map(s => s.id === finalSubject.id ? finalSubject : s));
    } else { // إضافة
      setSubjects([...subjects, { ...finalSubject, id: `sub-${Date.now()}` }]);
    }
    setIsModalOpen(false);
    setCurrentSubject(null);
  };

  // تحديث بيانات المادة الحالية في المودال
  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentSubject) return;
    setCurrentSubject({ ...currentSubject, [e.target.name]: e.target.value });
  };
  
  // إضافة عنصر تقييم جديد
  const addAssessment = () => {
    if (!currentSubject) return;
    const newAssessment: AssessmentItem = { id: `asm-${Date.now()}`, name: '', maxGrade: 10 };
    setCurrentSubject({ ...currentSubject, assessments: [...currentSubject.assessments, newAssessment] });
  };
  
  // تحديث عنصر تقييم
  const handleAssessmentChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentSubject) return;
    const updatedAssessments = [...currentSubject.assessments];
    const field = e.target.name as keyof AssessmentItem;
    let value: string | number = e.target.value;
    if (field === 'maxGrade') {
        value = Number(value);
    }
    updatedAssessments[index] = { ...updatedAssessments[index], [field]: value };
    setCurrentSubject({ ...currentSubject, assessments: updatedAssessments });
  };
  
  // حذف عنصر تقييم
  const removeAssessment = (index: number) => {
    if (!currentSubject) return;
    const updatedAssessments = currentSubject.assessments.filter((_, i) => i !== index);
    setCurrentSubject({ ...currentSubject, assessments: updatedAssessments });
  };

  const handleToggleIsProject = (asmIndex: number, isProject: boolean) => {
    if (!currentSubject) return;
    const updatedAssessments = [...currentSubject.assessments];
    const asm = { ...updatedAssessments[asmIndex] };
    asm.isProject = isProject;
    if (isProject) {
      asm.projectCriteria = asm.projectCriteria || [{ id: `crit-${Date.now()}`, name: 'البند الأول', maxGrade: 10 }];
      asm.maxGrade = asm.projectCriteria.reduce((sum, crit) => sum + Number(crit.maxGrade), 0);
    } else {
      delete asm.projectCriteria;
    }
    updatedAssessments[asmIndex] = asm;
    setCurrentSubject({ ...currentSubject, assessments: updatedAssessments });
  };

  const addCriterion = (asmIndex: number) => {
    if (!currentSubject) return;
    const updatedAssessments = [...currentSubject.assessments];
    if (updatedAssessments[asmIndex].projectCriteria) {
      updatedAssessments[asmIndex].projectCriteria?.push({ id: `crit-${Date.now()}`, name: 'بند جديد', maxGrade: 10 });
    }
    setCurrentSubject({ ...currentSubject, assessments: updatedAssessments });
  };

  const removeCriterion = (asmIndex: number, critIndex: number) => {
    if (!currentSubject) return;
    const updatedAssessments = [...currentSubject.assessments];
    updatedAssessments[asmIndex].projectCriteria = updatedAssessments[asmIndex].projectCriteria?.filter((_, i) => i !== critIndex);
    setCurrentSubject({ ...currentSubject, assessments: updatedAssessments });
  };

  const handleCriterionChange = (asmIndex: number, critIndex: number, field: keyof ProjectCriterion, value: string) => {
    if (!currentSubject) return;
    const updatedAssessments = [...currentSubject.assessments];
    const criteria = updatedAssessments[asmIndex].projectCriteria;
    if (criteria) {
        let finalValue: string | number = value;
        if (field === 'maxGrade') finalValue = Number(value);
        criteria[critIndex] = { ...criteria[critIndex], [field]: finalValue };
        
        // Recalculate total max grade for the project
        updatedAssessments[asmIndex].maxGrade = criteria.reduce((sum, crit) => sum + Number(crit.maxGrade || 0), 0);
    }
    setCurrentSubject({ ...currentSubject, assessments: updatedAssessments });
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-light-primary to-blue-500 dark:from-dark-primary dark:to-blue-600">
          المواد الدراسية
        </h2>
        <Button onClick={handleAddSubject} icon="add">إضافة مادة</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjects.map(subject => (
          <Card key={subject.id}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-light-primary dark:text-dark-primary">{subject.name}</h3>
                <p className="text-gray-500">{subject.code}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditSubject(subject)} className="p-2 rounded-full hover:shadow-neumorphism-light dark:hover:shadow-neumorphism-dark"><Icon name="edit" className="w-5 h-5"/></button>
                <button onClick={() => handleDeleteSubject(subject.id)} className="p-2 rounded-full hover:shadow-neumorphism-light dark:hover:shadow-neumorphism-dark text-red-500"><Icon name="delete" className="w-5 h-5"/></button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
              <h4 className="font-semibold mb-2">عناصر التقييم:</h4>
              <ul className="list-disc pr-5 space-y-1">
                {subject.assessments.map(asm => (
                  <li key={asm.id}>{asm.name} ({asm.maxGrade} درجة) {asm.isProject && <span className="text-xs font-bold text-light-primary dark:text-dark-primary">(مشروع)</span>}</li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentSubject?.id ? 'تعديل مادة' : 'إضافة مادة'}>
        {currentSubject && (
          <div className="space-y-4">
            <Input label="اسم المادة" name="name" value={currentSubject.name} onChange={handleSubjectChange} />
            <Input label="كود المادة" name="code" value={currentSubject.code} onChange={handleSubjectChange} />
            
            <h4 className="font-semibold pt-4">عناصر التقييم</h4>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {currentSubject.assessments.map((asm, index) => (
                  <div key={asm.id || index} className="p-3 rounded-lg bg-light-bg dark:bg-dark-bg shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset">
                    <div className="flex items-center gap-2">
                      <input name="name" value={asm.name} onChange={(e) => handleAssessmentChange(index, e)} placeholder="اسم التقييم" className="flex-1 bg-light-bg dark:bg-dark-bg rounded-lg p-2 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none"/>
                      {!asm.isProject && <input name="maxGrade" type="number" value={asm.maxGrade} onChange={(e) => handleAssessmentChange(index, e)} placeholder="الدرجة" className="w-20 bg-light-bg dark:bg-dark-bg rounded-lg p-2 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none"/>}
                      {asm.isProject && <span className="w-20 text-center font-bold text-light-primary dark:text-dark-primary">({asm.maxGrade})</span>}
                      <button onClick={() => removeAssessment(index)} className="p-2 text-red-500"><Icon name="delete" className="w-5 h-5"/></button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" id={`is-project-${index}`} checked={asm.isProject || false} onChange={e => handleToggleIsProject(index, e.target.checked)} />
                      <label htmlFor={`is-project-${index}`} className="text-sm">تقييم مشروع</label>
                    </div>
                    {asm.isProject && (
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 space-y-2">
                        <h5 className="font-semibold text-sm mb-2">بنود المشروع:</h5>
                        {asm.projectCriteria?.map((crit, critIndex) => (
                          <div key={crit.id || critIndex} className="flex items-center gap-2">
                            <input value={crit.name} onChange={(e) => handleCriterionChange(index, critIndex, 'name', e.target.value)} placeholder="اسم البند" className="flex-1 bg-light-bg dark:bg-dark-bg rounded-lg p-2 text-sm shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none"/>
                            <input type="number" value={crit.maxGrade} onChange={(e) => handleCriterionChange(index, critIndex, 'maxGrade', e.target.value)} placeholder="الدرجة" className="w-20 bg-light-bg dark:bg-dark-bg rounded-lg p-2 text-sm shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none"/>
                            <button onClick={() => removeCriterion(index, critIndex)} className="p-1 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900"><Icon name="delete" className="w-4 h-4"/></button>
                          </div>
                        ))}
                        <Button onClick={() => addCriterion(index)} variant="secondary" className="px-3 py-1 text-sm">إضافة بند</Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            <Button onClick={addAssessment} variant="secondary">إضافة تقييم</Button>

            <div className="flex justify-end gap-4 pt-4">
              <Button onClick={() => setIsModalOpen(false)} variant="secondary">إلغاء</Button>
              <Button onClick={handleSaveSubject} icon="save">حفظ</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Subjects;