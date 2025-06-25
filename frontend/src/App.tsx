import { useState, useEffect } from 'react';
import Breadcrumbs, { BreadcrumbItem } from './components/Breadcrumbs';
import CategoryTable from './components/CategoryTable';
import InsightTable, { InsightType } from './components/InsightTable';
import QuestionView from './components/QuestionView';
import './App.css'; // For global styles if any

type View = 'categories' | 'insights' | 'question';



function App() {
  const [currentView, setCurrentView] = useState<View>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedInsightSubject, setSelectedInsightSubject] = useState<string | null>(null);
  const [selectedInsightType, setSelectedInsightType] = useState<InsightType | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  // const [selectedInsightTitle, setSelectedInsightTitle] = useState<string | null>(null); // To be used for breadcrumb

  // For Question View navigation - now tracks questions instead of inspiration insights
  const [currentQuestions, setCurrentQuestions] = useState<{ id: number; questionText: string }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // When in question view, ensure the currentQuestionIndex matches the actual question
  useEffect(() => {
    if (currentView === 'question' && selectedQuestionId) {
      const questionIndex = currentQuestions.findIndex(
        question => question.id === selectedQuestionId
      );
      if (questionIndex !== -1 && questionIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(questionIndex);
      }
    }
  }, [currentView, selectedQuestionId, currentQuestions, currentQuestionIndex]);

  // Fetch questions when a category is selected for question navigation
  useEffect(() => {
    if (selectedCategoryId) {
      const fetchQuestionsForNavigation = async () => {
        try {
          const response = await fetch(`/api/categories/${selectedCategoryId}/questions`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const questions = await response.json();
          // Extract questions for navigation
          const questionList: { id: number; questionText: string }[] = questions.map((question: any) => ({
            id: question.id,
            questionText: question.questionText,
          }));
          setCurrentQuestions(questionList);
        } catch (error) {
          console.error('Failed to fetch questions for navigation:', error);
          setCurrentQuestions([]); // Reset on error
        }
      };
      fetchQuestionsForNavigation();
    }
  }, [selectedCategoryId]); // Only depend on selectedCategoryId, not selectedInsightType

  const handleCategoryClick = async (categoryId: number, insightSubject: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedInsightSubject(insightSubject);
    // Default to answer insights, or let user choose via UI elements not yet defined
    setSelectedInsightType('answers'); 
    setCurrentView('insights');
    setCurrentQuestionIndex(0); // Reset index when category changes
  };

  const handleInsightTypeSelect = (type: InsightType) => {
    setSelectedInsightType(type);
    setCurrentView('insights'); 
    setCurrentQuestionIndex(0); // Reset index when type changes
  };

  const handleQuestionClick = (questionId: number) => {
    setSelectedQuestionId(questionId);
    
    // Find the correct question index for navigation
    const questionIndex = currentQuestions.findIndex(question => question.id === questionId);
    if (questionIndex !== -1) {
        setCurrentQuestionIndex(questionIndex);
    } else {
        // If not found, reset to 0
        setCurrentQuestionIndex(0);
    }
    setCurrentView('question');
  };

  const navigateToCategories = () => {
    setCurrentView('categories');
    setSelectedCategoryId(null);
    setSelectedInsightSubject(null);
    setSelectedInsightType(null);
    setSelectedQuestionId(null);
    setCurrentQuestions([]);
    setCurrentQuestionIndex(0);
  };

  const navigateToInsightsView = (type?: InsightType) => {
    if (!selectedCategoryId) return; // Should not happen if called from a state where category is selected
    setSelectedInsightType(type || selectedInsightType || 'answers');
    setCurrentView('insights');
    setSelectedQuestionId(null);
    // currentQuestionIndex is preserved if just switching between inspiration/answers for same category
  };
  
  const handleQuestionNavigation = (direction: 'next' | 'prev') => {
    let newIndex = currentQuestionIndex;
    if (direction === 'next') {
      newIndex = Math.min(currentQuestionIndex + 1, currentQuestions.length - 1);
    } else {
      newIndex = Math.max(currentQuestionIndex - 1, 0);
    }
    if (newIndex !== currentQuestionIndex && currentQuestions[newIndex]) {
              // Navigate to the selected question
        setSelectedQuestionId(currentQuestions[newIndex].id);
        setCurrentQuestionIndex(newIndex);
        // The QuestionView component will re-fetch based on the new questionId
    }
  };

  const handleSkipQuestion = () => {
    // Navigate to the next question, or wrap around / go back to insights list
    if (currentQuestionIndex < currentQuestions.length - 1) {
        handleQuestionNavigation('next');
    } else {
        // Last question skipped, go back to insights view of the current category/type
        navigateToInsightsView(); 
    }
  };


  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Categories', onClick: navigateToCategories, isCurrent: currentView === 'categories' },
  ];

  if (selectedCategoryId && selectedInsightSubject) {
    breadcrumbItems.push({
      label: '',
      onClick: () => navigateToInsightsView(), // Defaults to current or inspiration type
      isCurrent: currentView === 'insights' && !selectedQuestionId,
      insightSubject: selectedInsightSubject || undefined
    });
     // Add button group for Inspiration/Answers if in insights view or deeper
  }

  // This is a conceptual placement for Inspiration/Answers type selection within the breadcrumb area or nearby
  // Actual UI for this selection needs to be designed. For now, it's handled by direct state changes.

  if (selectedQuestionId && currentView === 'question') {
    const currentTitle = currentQuestions[currentQuestionIndex]?.questionText || "Question";
    breadcrumbItems.push({
      label: currentTitle ||  "Question", // Use question text if available, fallback to insight text
      onClick: () => { /* Clicking current question in breadcrumb might do nothing or reload */ },
      isCurrent: true
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        <Breadcrumbs items={breadcrumbItems} />
      </header>
      <main>
        {currentView === 'categories' && <CategoryTable onCategoryClick={handleCategoryClick} />}
        {currentView === 'insights' && selectedCategoryId && selectedInsightType && (
          <InsightTable 
            categoryId={selectedCategoryId} 
            insightType={selectedInsightType} 
            onInsightClick={handleQuestionClick}
            onInsightTypeChange={handleInsightTypeSelect}
          />
        )}
        {currentView === 'question' && selectedQuestionId && selectedCategoryId && (
          <QuestionView 
            questionId={selectedQuestionId} 
            totalQuestionsInCategory={currentQuestions.length}
            currentQuestionIndex={currentQuestionIndex}
            onNavigateQuestion={handleQuestionNavigation}
            onSkipQuestion={handleSkipQuestion}
          />
        )}
      </main>
    </div>
  );
}

export default App; 